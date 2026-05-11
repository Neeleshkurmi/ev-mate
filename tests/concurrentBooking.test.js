const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

/**
 * Heavy concurrency checks belong in integration tests with a real Postgres URL.
 * Set RUN_BOOKING_INTEGRATION=1 to extend this suite later.
 */
describe("concurrent booking integration", { skip: process.env.RUN_BOOKING_INTEGRATION !== "1" }, () => {
  test("skipped unless RUN_BOOKING_INTEGRATION=1", () => {
    assert.ok(true);
  });
});
