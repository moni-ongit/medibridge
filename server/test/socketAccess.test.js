/**
 * Integration test for the real Socket.IO layer (socket/index.js).
 * MongoDB is replaced by in-memory fakes so this runs anywhere.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");

// The socket layer logs connections; keep the test output clean
console.log = () => {};

process.env.JWT_SECRET = "test-secret";
process.env.APPOINTMENT_UTC_OFFSET_MINUTES = "330";
delete process.env.JOIN_EARLY_MINUTES;
delete process.env.JOIN_CLOSE_AFTER_MINUTES;

// ---- in-memory fakes for the Mongoose models ---------------------------
const users = {
  patient1: { _id: "patient1", name: "Arun", role: "patient", isActive: true },
  patient2: { _id: "patient2", name: "Other Patient", role: "patient", isActive: true },
  doctor1: { _id: "doctor1", name: "Dr. Priya", role: "doctor", isActive: true },
  interp1: { _id: "interp1", name: "Lakshmi", role: "interpreter", isActive: true },
  interp2: { _id: "interp2", name: "Rohit", role: "interpreter", isActive: true },
};
// Build a clinic-local date/time that is `minutes` away from now
const slot = (minutes) => {
  const iso = new Date(Date.now() + minutes * 60000 + 330 * 60000).toISOString();
  return { appointmentDate: iso.slice(0, 10), appointmentTime: iso.slice(11, 16) };
};
const appts = {
  open: { _id: "a-open", patient: "patient1", doctor: "doctor1", status: "confirmed", videoRoomId: "room-open", ...slot(-10) },
  early: { _id: "a-early", patient: "patient1", doctor: "doctor1", status: "confirmed", videoRoomId: "room-early", ...slot(120) },
  late: { _id: "a-late", patient: "patient1", doctor: "doctor1", status: "confirmed", videoRoomId: "room-late", ...slot(-180) },
  cancelled: { _id: "a-cancelled", patient: "patient1", doctor: "doctor1", status: "cancelled", videoRoomId: "room-cancelled", ...slot(-10) },
};
const accepted = [{ appointment: "a-open", interpreter: "interp1", status: "accepted" }];

const mock = (rel, exports) => {
  const p = require.resolve(rel);
  require.cache[p] = { id: p, filename: p, loaded: true, exports };
};
mock("../models/User", { findById: async (id) => users[id] || null });
mock("../models/Appointment", { findOne: async ({ videoRoomId }) => Object.values(appts).find((a) => a.videoRoomId === videoRoomId) || null });
mock("../models/InterpreterRequest", {
  exists: async (q) => accepted.find((r) => r.appointment === String(q.appointment) && r.interpreter === q.interpreter && r.status === q.status) || null,
});
mock("../models/Consultation", { findOneAndUpdate: () => Promise.resolve() });

const { Server } = require("socket.io");
const { io: connect } = require("socket.io-client");
const initSocket = require("../socket");

let httpServer, io, port;
const open = [];

test.before(async () => {
  httpServer = http.createServer();
  io = new Server(httpServer);
  initSocket(io);
  await new Promise((r) => httpServer.listen(0, r));
  port = httpServer.address().port;
});
test.after(async () => {
  open.forEach((s) => s.close());
  io.close();
  await new Promise((r) => httpServer.close(r));
});

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);
const client = (userId) =>
  new Promise((resolve, reject) => {
    const s = connect(`http://localhost:${port}`, { auth: userId ? { token: tokenFor(userId) } : {}, reconnection: false, transports: ["websocket"] });
    open.push(s);
    s.on("connect", () => resolve(s));
    s.on("connect_error", (e) => reject(e));
  });
const join = (s, roomId) => new Promise((resolve) => s.emit("room:join", { roomId }, resolve));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("a socket without a valid token cannot connect", async () => {
  await assert.rejects(client(null), /AUTH_REQUIRED/);
  const bad = new Promise((resolve, reject) => {
    const s = connect(`http://localhost:${port}`, { auth: { token: "garbage" }, reconnection: false, transports: ["websocket"] });
    open.push(s);
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });
  await assert.rejects(bad, /AUTH_INVALID/);
});

test("patient and doctor are admitted inside the join window", async () => {
  const doctor = await client("doctor1");
  const patient = await client("patient1");
  assert.deepEqual(await join(doctor, "room-open"), { ok: true });
  const seen = new Promise((r) => doctor.once("room:user-joined", r));
  assert.deepEqual(await join(patient, "room-open"), { ok: true });
  assert.equal((await seen).user.name, "Arun");
});

test("joining before the window opens is refused with the schedule", async () => {
  const patient = await client("patient1");
  const res = await join(patient, "room-early");
  assert.equal(res.ok, false);
  assert.equal(res.reason, "too_early");
  assert.ok(res.schedule.opensAt, "schedule is returned so the UI can show a countdown");
});

test("joining after the window has closed is refused", async () => {
  const doctor = await client("doctor1");
  const res = await join(doctor, "room-late");
  assert.equal(res.ok, false);
  assert.equal(res.reason, "ended");
});

test("a cancelled appointment cannot be joined at its booked time", async () => {
  const patient = await client("patient1");
  assert.equal((await join(patient, "room-cancelled")).reason, "cancelled");
});

test("someone who is not part of the appointment is refused", async () => {
  const stranger = await client("patient2");
  assert.equal((await join(stranger, "room-open")).reason, "not_participant");
  const strangerInterp = await client("interp2");
  assert.equal((await join(strangerInterp, "room-open")).reason, "not_participant");
});

test("an interpreter who accepted the request is admitted", async () => {
  const interp = await client("interp1");
  assert.deepEqual(await join(interp, "room-open"), { ok: true });
});

test("an unknown room is refused", async () => {
  const patient = await client("patient1");
  assert.equal((await join(patient, "no-such-room")).reason, "not_found");
});

test("a refused socket cannot inject chat into the room", async () => {
  const doctor = await client("doctor1");
  await join(doctor, "room-open");
  const received = [];
  doctor.on("chat:message", (m) => received.push(m));

  const early = await client("patient1");
  await join(early, "room-early"); // refused
  early.emit("chat:message", { roomId: "room-open", sender: "x", text: "sneaky" });
  await wait(200);
  assert.equal(received.length, 0);

  const patient = await client("patient1");
  await join(patient, "room-open");
  patient.emit("chat:message", { roomId: "room-open", sender: "Arun", text: "hello" });
  await wait(200);
  assert.equal(received.length, 1);
});
