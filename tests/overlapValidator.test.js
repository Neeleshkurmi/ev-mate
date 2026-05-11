const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  intervalsOverlap,
  maxConcurrentBookings,
  wouldExceedCapacity,
} = require("../utils/overlapValidator");

describe("intervalsOverlap", () => {
  test("detects partial overlap", () => {
    const a0 = new Date("2026-05-11T10:00:00.000Z");
    const a1 = new Date("2026-05-11T11:00:00.000Z");
    const b0 = new Date("2026-05-11T10:30:00.000Z");
    const b1 = new Date("2026-05-11T12:00:00.000Z");
    assert.equal(intervalsOverlap(a0, a1, b0, b1), true);
  });

  test("no overlap when back-to-back", () => {
    const a0 = new Date("2026-05-11T10:00:00.000Z");
    const a1 = new Date("2026-05-11T11:00:00.000Z");
    const b0 = new Date("2026-05-11T11:00:00.000Z");
    const b1 = new Date("2026-05-11T12:00:00.000Z");
    assert.equal(intervalsOverlap(a0, a1, b0, b1), false);
  });
});

describe("maxConcurrentBookings", () => {
  test("two overlapping intervals peak at 2", () => {
    const peak = maxConcurrentBookings([
      { start: new Date("2026-05-11T10:00:00.000Z"), end: new Date("2026-05-11T12:00:00.000Z") },
      { start: new Date("2026-05-11T11:00:00.000Z"), end: new Date("2026-05-11T13:00:00.000Z") },
    ]);
    assert.equal(peak, 2);
  });

  test("sequential intervals peak at 1", () => {
    const peak = maxConcurrentBookings([
      { start: new Date("2026-05-11T10:00:00.000Z"), end: new Date("2026-05-11T11:00:00.000Z") },
      { start: new Date("2026-05-11T11:00:00.000Z"), end: new Date("2026-05-11T12:00:00.000Z") },
    ]);
    assert.equal(peak, 1);
  });
});

describe("wouldExceedCapacity", () => {
  test("rejects when peak exceeds totalSlots", () => {
    const booked = [
      { start: new Date("2026-05-11T10:00:00.000Z"), end: new Date("2026-05-11T12:00:00.000Z") },
      { start: new Date("2026-05-11T11:00:00.000Z"), end: new Date("2026-05-11T13:00:00.000Z") },
    ];
    const reqStart = new Date("2026-05-11T10:30:00.000Z");
    const reqEnd = new Date("2026-05-11T11:30:00.000Z");
    assert.equal(wouldExceedCapacity(booked, reqStart, reqEnd, 2), true);
    assert.equal(wouldExceedCapacity(booked, reqStart, reqEnd, 3), false);
  });
});
