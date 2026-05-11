const MS_PER_MINUTE = 60 * 1000;

const parseUtcDayBounds = (dateStr) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mon = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dayStart = new Date(Date.UTC(y, mon, d, 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(y, mon, d + 1, 0, 0, 0, 0));
  return { dayStart, dayEnd };
};

const clip = (t, lo, hi) => Math.min(Math.max(t, lo), hi);

/**
 * Segments where at least one connector is free (respects totalSlots concurrency).
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @param {{ startTime: Date, endTime: Date }[]} booked BOOKED only
 * @param {number} totalSlots
 */
const computeFreeCapacitySegments = (rangeStart, rangeEnd, booked, totalSlots) => {
  const rs = rangeStart.getTime();
  const re = rangeEnd.getTime();
  const boundaries = new Set([rs, re]);
  for (const b of booked) {
    boundaries.add(clip(b.startTime.getTime(), rs, re));
    boundaries.add(clip(b.endTime.getTime(), rs, re));
  }
  const sorted = [...boundaries].sort((a, b) => a - b);
  const segments = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a === b) continue;
    const mid = a + 1;
    let used = 0;
    for (const bk of booked) {
      if (bk.startTime.getTime() < mid && bk.endTime.getTime() > mid) used += 1;
    }
    const freeConnectors = totalSlots - used;
    if (freeConnectors > 0) {
      segments.push({
        start: new Date(a),
        end: new Date(b),
        usedSlots: used,
        freeConnectors,
      });
    }
  }
  return segments;
};

/**
 * @param {{ start: Date, end: Date }[]} segments from computeFreeCapacitySegments
 * @param {number} durationMs
 * @param {Date} notBefore
 */
const nextAvailableSlot = (segments, durationMs, notBefore) => {
  const threshold = notBefore.getTime();
  for (const seg of segments) {
    let t = Math.max(seg.start.getTime(), threshold);
    if (t + durationMs <= seg.end.getTime()) {
      return { start: new Date(t), end: new Date(t + durationMs) };
    }
  }
  return null;
};

module.exports = {
  parseUtcDayBounds,
  computeFreeCapacitySegments,
  nextAvailableSlot,
  MS_PER_MINUTE,
};
