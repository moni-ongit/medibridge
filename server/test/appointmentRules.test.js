/**
 * Tests for the booking / update rules that protect the scheduled join window.
 * Models are replaced by in-memory fakes.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.APPOINTMENT_UTC_OFFSET_MINUTES = "330";
delete process.env.JOIN_EARLY_MINUTES;
delete process.env.JOIN_CLOSE_AFTER_MINUTES;

class Id {
  constructor(v) { this.v = String(v); }
  equals(o) { return String(o) === this.v; }
  toString() { return this.v; }
}
const slot = (minutes) => {
  const iso = new Date(Date.now() + minutes * 60000 + 330 * 60000).toISOString();
  return { appointmentDate: iso.slice(0, 10), appointmentTime: iso.slice(11, 16) };
};
const makeAppt = (extra = {}) => {
  const a = {
    _id: "a1", patient: new Id("p1"), doctor: new Id("d1"), status: "pending", reason: "", videoRoomId: "room-1", ...slot(120), ...extra,
    saved: 0, async save() { this.saved += 1; }, toObject() { const { save, toObject, ...rest } = this; return rest; },
  };
  return a;
};

let stored;
const mock = (rel, exports) => { const p = require.resolve(rel); require.cache[p] = { id: p, filename: p, loaded: true, exports }; };
mock("../models/Appointment", {
  create: async (data) => ({ ...data, _id: "new", populate: async function () { return this; }, toObject() { return { ...this }; } }),
  findById: async () => stored,
  find: () => ({ populate() { return this; }, sort: async () => [makeAppt(), makeAppt(slot(-300))] }),
});
mock("../models/Consultation", { create: async () => ({}) });

const c = require("../controllers/appointmentController");
const run = async (handler, req) => {
  const res = { code: 200, body: null, status(code) { this.code = code; return this; }, json(b) { this.body = b; return this; } };
  await handler(req, res, (e) => { throw e; });
  return res;
};
const as = (id, role) => ({ _id: id, role, preferredLanguage: "en" });

test("booking a time that has already passed is rejected", async () => {
  const res = await run(c.createAppointment, { user: as("p1", "patient"), body: { doctor: "d1", ...slot(-24 * 60) } });
  assert.equal(res.code, 400);
  assert.match(res.body.message, /already passed/);
});

test("booking an invalid date or time is rejected", async () => {
  const res = await run(c.createAppointment, { user: as("p1", "patient"), body: { doctor: "d1", appointmentDate: "2026-02-31", appointmentTime: "09:00" } });
  assert.equal(res.code, 400);
});

test("a new booking is returned with its join window", async () => {
  const res = await run(c.createAppointment, { user: as("p1", "patient"), body: { doctor: "d1", ...slot(120) } });
  assert.equal(res.code, 201);
  assert.equal(res.body.appointment.schedule.state, "too_early");
  assert.equal(res.body.appointment.schedule.canJoin, false);
});

test("the appointment list includes the join window for each item", async () => {
  const res = await run(c.getAppointments, { user: as("p1", "patient"), query: {} });
  assert.deepEqual(res.body.appointments.map((a) => a.schedule.state), ["too_early", "ended"]);
});

test("a patient cannot move the appointment to 'now'", async () => {
  stored = makeAppt();
  const res = await run(c.updateAppointment, { user: as("p1", "patient"), params: { id: "a1" }, body: slot(0) });
  assert.equal(res.code, 403);
  assert.equal(stored.saved, 0);
});

test("a patient cannot confirm their own appointment", async () => {
  stored = makeAppt();
  const res = await run(c.updateAppointment, { user: as("p1", "patient"), params: { id: "a1" }, body: { status: "confirmed" } });
  assert.equal(res.code, 403);
});

test("nobody can mark a consultation completed before it is due", async () => {
  stored = makeAppt();
  assert.equal((await run(c.updateAppointment, { user: as("p1", "patient"), params: { id: "a1" }, body: { status: "completed" } })).code, 400);
  assert.equal((await run(c.updateAppointment, { user: as("d1", "doctor"), params: { id: "a1" }, body: { status: "completed" } })).code, 400);
});

test("a patient can mark a consultation completed once its window has opened", async () => {
  stored = makeAppt(slot(-5));
  const res = await run(c.updateAppointment, { user: as("p1", "patient"), params: { id: "a1" }, body: { status: "completed" } });
  assert.equal(res.code, 200);
  assert.equal(stored.status, "completed");
});

test("the doctor can confirm and reschedule", async () => {
  stored = makeAppt();
  assert.equal((await run(c.updateAppointment, { user: as("d1", "doctor"), params: { id: "a1" }, body: { status: "confirmed" } })).code, 200);
  const later = slot(300);
  const res = await run(c.updateAppointment, { user: as("d1", "doctor"), params: { id: "a1" }, body: later });
  assert.equal(res.code, 200);
  assert.equal(res.body.appointment.appointmentTime, later.appointmentTime);
  assert.equal(res.body.appointment.schedule.state, "too_early");
});

test("the doctor cannot reschedule into the past", async () => {
  stored = makeAppt();
  const before = stored.appointmentTime;
  const res = await run(c.updateAppointment, { user: as("d1", "doctor"), params: { id: "a1" }, body: slot(-24 * 60) });
  assert.equal(res.code, 400);
  assert.equal(stored.saved, 0);
});

test("a stranger cannot touch the appointment", async () => {
  stored = makeAppt();
  assert.equal((await run(c.updateAppointment, { user: as("x9", "patient"), params: { id: "a1" }, body: { reason: "hi" } })).code, 403);
});
