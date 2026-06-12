const logs = [
  { startDate: '2026-06-05' },
  { startDate: '2026-06-04' },
  { startDate: '2026-06-02' },
  { startDate: '2026-06-01' },
  { startDate: '2026-05-28' },
];
const profile = { lastPeriodDate: '2026-06-05', cycleLength: 30, periodDuration: 4 };
const today = new Date('2026-06-08');
const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const latestLogIso = logs.reduce((acc, l) => {
  if (!l?.startDate) return acc;
  if (!acc) return l.startDate;
  return new Date(l.startDate).getTime() > new Date(acc).getTime() ? l.startDate : acc;
}, null);
const latestLogDateObj = latestLogIso ? parseLocalDate(latestLogIso) : null;
const currentPeriodStart = (() => {
  const lastPeriod = parseLocalDate(profile.lastPeriodDate);
  const daysSinceLast = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = (daysSinceLast % profile.cycleLength) + 1;
  if (cycleDay != null && cycleDay <= profile.periodDuration) {
    const d = new Date(today);
    d.setDate(d.getDate() - (cycleDay - 1));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return null;
})();
const currentPeriodEnd = currentPeriodStart ? (() => {
  const d = parseLocalDate(currentPeriodStart);
  d.setDate(d.getDate() + profile.periodDuration - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})() : null;
const periodStart = currentPeriodStart ?? '2026-07-05';
const periodEnd = currentPeriodEnd ?? (() => {
  const d = parseLocalDate('2026-07-05');
  d.setDate(d.getDate() + profile.periodDuration - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();
const calViewMonth = 5;
const calViewYear = 2026;
const loggedDates = new Set(
  logs
    .map((l) => {
      const d = parseLocalDate(l.startDate);
      if (d.getMonth() === calViewMonth && d.getFullYear() === calViewYear) return d.getDate();
      return null;
    })
    .filter((x) => x !== null)
);
const isInRange = (year, month, day, startStr, endStr) => {
  if (!startStr || !endStr) return false;
  const date = new Date(year, month, day).getTime();
  return date >= parseLocalDate(startStr).getTime() && date <= parseLocalDate(endStr).getTime();
};
console.log({ latestLogIso, currentPeriodStart, currentPeriodEnd, periodStart, periodEnd });
for (let d = 1; d <= 30; d += 1) {
  const isLogged = loggedDates.has(d);
  const isLastPeriodDay =
    latestLogDateObj !== null &&
    d === latestLogDateObj.getDate() &&
    calViewMonth === latestLogDateObj.getMonth() &&
    calViewYear === latestLogDateObj.getFullYear();
  const isNextPeriod = isInRange(calViewYear, calViewMonth, d, periodStart, periodEnd);
  const isFertile = isInRange(calViewYear, calViewMonth, d, '2026-06-15', '2026-06-18');
  console.log(d, { isLogged, isLastPeriodDay, isNextPeriod, isFertile });
}
