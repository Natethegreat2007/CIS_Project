function toIsoDateString(date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultSlots(date, maxCapacity) {
  const day = date.getUTCDay();

  if (day === 0) {
    return 0;
  }

  if (day === 6) {
    return Math.max(maxCapacity - 2, 1);
  }

  if (day === 3) {
    return Math.max(maxCapacity - 1, 1);
  }

  return maxCapacity;
}

async function ensureAvailabilityForRange(connection, { tourId, maxCapacity, startDate, endDate }) {
  const rows = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= end) {
    rows.push([
      tourId,
      toIsoDateString(current),
      getDefaultSlots(current, maxCapacity),
    ]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (!rows.length) {
    return;
  }

  await connection.query(
    `
      INSERT IGNORE INTO Availability (tourID, date, slots)
      VALUES ?
    `,
    [rows]
  );
}

async function ensureAvailabilityForMonth(connection, { tourId, maxCapacity, year, month }) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  await ensureAvailabilityForRange(connection, {
    tourId,
    maxCapacity,
    startDate: toIsoDateString(start),
    endDate: toIsoDateString(end),
  });
}

async function ensureAvailabilityForDate(connection, { tourId, maxCapacity, date }) {
  await ensureAvailabilityForRange(connection, {
    tourId,
    maxCapacity,
    startDate: date,
    endDate: date,
  });
}

module.exports = {
  ensureAvailabilityForDate,
  ensureAvailabilityForMonth,
  ensureAvailabilityForRange,
  getDefaultSlots,
  toIsoDateString,
};
