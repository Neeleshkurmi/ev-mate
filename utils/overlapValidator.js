/**
 * Overlap (same rule as persistence queries):
 * existing.start < requested.end && existing.end > requested.start
 */
const intervalsOverlap = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && aEnd > bStart;

/**
 * Sweep-line peak concurrency for closed-form intervals [start, end).
 * Same-time: process end (-1) before start (+1) so back-to-back reservations do not count as overlapping.
 * @param {{ start: Date, end: Date }[]} intervals
 */
const maxConcurrentBookings = (intervals) => {
  const events = [];
  for (const iv of intervals) {
    events.push({ t: iv.start.getTime(), d: 1 });
    events.push({ t: iv.end.getTime(), d: -1 });
  }
  events.sort((a, b) => {
    if (a.t !== b.t) return a.t - b.t;
    return a.d - b.d;
  });
  let cur = 0;
  let max = 0;
  for (const ev of events) {
    cur += ev.d;
    max = Math.max(max, cur);
  }
  return max;
};

/**
 * @param {{ start: Date, end: Date }[]} bookedOverlapping active BOOKED intervals overlapping requested window
 * @param {Date} requestedStart
 * @param {Date} requestedEnd
 * @param {number} totalSlots max parallel reservations for the station
 */
const wouldExceedCapacity = (bookedOverlapping, requestedStart, requestedEnd, totalSlots) => {
  const combined = [
    ...bookedOverlapping.map((b) => ({ start: b.start, end: b.end })),
    { start: requestedStart, end: requestedEnd },
  ];
  return maxConcurrentBookings(combined) > totalSlots;
};

module.exports = {
  intervalsOverlap,
  maxConcurrentBookings,
  wouldExceedCapacity,
};
