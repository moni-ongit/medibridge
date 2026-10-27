const test = require("node:test");
const assert = require("node:assert/strict");
const { getScheduleWindow } = require("../utils/schedule");

// Defaults: IST (+330 min), opens 5 min early, closes 45 min after start.
process.env.APPOINTMENT_UTC_OFFSET_MINUTES = "330";
delete process.env.JOIN_EARLY_MINUTES;
delete process.env.JOIN_CLOSE_AFTER_MINUTES;

// 09:30 IST on 2026-10-12 == 04:00:00Z
const appt = { appointmentDate: "2026-10-12", appointmentTime: "09:30", status: "confirmed" };
const at = (iso) => new Date(iso);

test("opens exactly 5 minutes before the start time", () => {
  assert.equal(getScheduleWindow(appt, at("2026-10-12T03:54:59Z")).state, "too_early");
  assert.equal(getScheduleWindow(appt, at("2026-10-12T03:55:00Z")).state, "open");
});

test("stays open until 45 minutes after the start, then ends", () => {
  assert.equal(getScheduleWindow(appt, at("2026-10-12T04:45:00Z")).state, "open");
  assert.equal(getScheduleWindow(appt, at("2026-10-12T04:45:01Z")).state, "ended");
});

test("canJoin is true only in the open state", () => {
  assert.equal(getScheduleWindow(appt, at("2026-10-12T04:00:00Z")).canJoin, true);
  assert.equal(getScheduleWindow(appt, at("2026-10-12T03:00:00Z")).canJoin, false);
  assert.equal(getScheduleWindow(appt, at("2026-10-12T06:00:00Z")).canJoin, false);
});

test("a cancelled appointment is never joinable, even at the booked time", () => {
  const w = getScheduleWindow({ ...appt, status: "cancelled" }, at("2026-10-12T04:00:00Z"));
  assert.equal(w.state, "cancelled");
  assert.equal(w.canJoin, false);
});

test("a completed appointment can be rejoined inside its window", () => {
  assert.equal(getScheduleWindow({ ...appt, status: "completed" }, at("2026-10-12T04:10:00Z")).canJoin, true);
});

test("reports clinic-local labels", () => {
  const w = getScheduleWindow(appt, at("2026-10-12T00:00:00Z"));
  assert.equal(w.startsAtDate, "2026-10-12");
  assert.equal(w.startsAtTime, "09:30");
  assert.equal(w.opensAtTime, "09:25");
  assert.equal(w.closesAtTime, "10:15");
  assert.equal(w.startsAt, "2026-10-12T04:00:00.000Z");
});

test("handles a booking just after midnight local time", () => {
  // 00:10 IST on 13 Oct == 18:40Z on 12 Oct
  const w = getScheduleWindow({ appointmentDate: "2026-10-13", appointmentTime: "00:10", status: "pending" }, at("2026-10-12T18:36:00Z"));
  assert.equal(w.state, "open");
  assert.equal(w.startsAtDate, "2026-10-13");
});

test("rejects invalid dates and times", () => {
  for (const [d, t] of [["2026-02-31", "09:30"], ["2026-10-12", "25:00"], ["2026-10-12", "09:75"], ["", "09:30"], ["2026-10-12", undefined], ["12/10/2026", "09:30"]]) {
    const w = getScheduleWindow({ appointmentDate: d, appointmentTime: t }, at("2026-10-12T04:00:00Z"));
    assert.equal(w.state, "invalid", `${d} ${t}`);
    assert.equal(w.canJoin, false);
  }
});

test("window sizes and timezone offset come from the environment", () => {
  process.env.JOIN_EARLY_MINUTES = "15";
  process.env.JOIN_CLOSE_AFTER_MINUTES = "10";
  process.env.APPOINTMENT_UTC_OFFSET_MINUTES = "0";
  try {
    // 09:30 UTC; opens 09:15, closes 09:40
    assert.equal(getScheduleWindow(appt, at("2026-10-12T09:14:59Z")).state, "too_early");
    assert.equal(getScheduleWindow(appt, at("2026-10-12T09:15:00Z")).state, "open");
    assert.equal(getScheduleWindow(appt, at("2026-10-12T09:40:01Z")).state, "ended");
  } finally {
    delete process.env.JOIN_EARLY_MINUTES;
    delete process.env.JOIN_CLOSE_AFTER_MINUTES;
    process.env.APPOINTMENT_UTC_OFFSET_MINUTES = "330";
  }
});
