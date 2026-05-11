const { test, describe, mock } = require("node:test");
const assert = require("node:assert/strict");

describe("buildExpiryJob", () => {
  test("marks rows expired and emits when io provided", async () => {
    const { buildExpiryJob } = require("../schedulers/bookingScheduler");
    const bookingRepository = require("../repositories/bookingRepository");
    const eventBus = require("../aggregation/eventBus");

    const expiredRow = {
      id: "b1",
      stationId: "s1",
      userId: "u1",
      startTime: new Date("2026-05-10T10:00:00.000Z"),
      endTime: new Date("2026-05-10T11:00:00.000Z"),
    };

    const findMock = mock.fn(async () => [expiredRow]);
    const markMock = mock.fn(async () => ({ count: 1 }));
    mock.method(bookingRepository, "findBookingsToExpire", findMock);
    mock.method(bookingRepository, "markBookingsExpired", markMock);

    const tx = {};
    const prismaClient = {
      $transaction: async (fn) => fn(tx),
    };

    const emitted = [];
    const onExpired = ({ stationId }) => emitted.push(stationId);
    eventBus.on("booking-expired", onExpired);

    await buildExpiryJob({ prisma: prismaClient })();

    assert.equal(findMock.mock.calls.length, 1);
    assert.equal(markMock.mock.calls.length, 1);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0], "s1");

    mock.restoreAll();
    eventBus.off("booking-expired", onExpired);
  });
});
