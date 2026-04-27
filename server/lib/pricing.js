function getSeasonMultiplier(dateInput) {
  const date = new Date(dateInput);
  const month = date.getUTCMonth() + 1;

  if ([12, 1].includes(month)) {
    return { label: 'Peak', mult: 1.25 };
  }

  if ([6, 7, 8].includes(month)) {
    return { label: 'Off-Peak', mult: 0.85 };
  }

  return { label: 'Standard', mult: 1 };
}

module.exports = {
  getSeasonMultiplier,
};
