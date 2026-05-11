const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseUtcDayBounds,
  computeFreeCapacitySegments,
  nextAvailableSlot,
} = require("../services/availabilityService");

describe("parseUtcDayBounds", () => {
  test("parses UTC calendar day", () => {
    const b = parseUtcDayBounds("2026-05-11");
    assert.ok(b);
    assert.equal(b.dayStart.toISOString(), "2026-05-11T00:00:00.000Z");
    assert.equal(b.dayEnd.toISOString(), "2026-05-12T00:00:00.000Z");
  });

  test("returns null for invalid input", () => {
    assert.equal(parseUtcDayBounds("05-11-2026"), null);
  });
});

describe("computeFreeCapacitySegments", () => {
  test("single booking leaves free segments on both sides", () => {
    const dayStart = new Date("2026-05-11T00:00:00.000Z");
    const dayEnd = new Date("2026-05-12T00:00:00.000Z");
    const booked = [
      {
        startTime: new Date("2026-05-11T10:00:00.000Z"),
        endTime: new Date("2026-05-11T11:00:00.000Z"),
      },
    ];
    const segments = computeFreeCapacitySegments(dayStart, dayEnd, booked, 1);
    assert.ok(segments.length >= 2);
    assert.ok(segments.some((s) => s.freeConnectors === 1));
  });

  test("fully saturated windows are omitted from free segments", () => {
    const dayStart = new Date("2026-05-11T09:00:00.000Z");
    const dayEnd = new Date("2026-05-11T13:00:00.000Z");
    const booked = [
      {
        startTime: new Date("2026-05-11T10:00:00.000Z"),
        endTime: new Date("2026-05-11T12:00:00.000Z"),
      },
      {
        startTime: new Date("2026-05-11T10:00:00.000Z"),
        endTime: new Date("2026-05-11T12:00:00.000Z"),
      },
    ];
    const segments = computeFreeCapacitySegments(dayStart, dayEnd, booked, 2);
    const t1030 = new Date("2026-05-11T10:30:00.000Z").getTime();
    const openAt1030 = segments.some(
      (s) => s.start.getTime() < t1030 && s.end.getTime() > t1030 && s.freeConnectors > 0
    );
    assert.equal(openAt1030, false);
  });
});

describe("nextAvailableSlot", () => {
  test("finds first segment that fits duration", () => {
    const segments = [
      {
        start: new Date("2026-05-11T08:00:00.000Z"),
        end: new Date("2026-05-11T09:00:00.000Z"),
        usedSlots: 0,
        freeConnectors: 1,
      },
    ];
    const slot = nextAvailableSlot(segments, 30 * 60 * 1000, new Date("2026-05-11T07:00:00.000Z"));
    assert.ok(slot);
    assert.equal(slot.start.toISOString(), "2026-05-11T08:00:00.000Z");
  });
});
