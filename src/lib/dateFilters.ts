export type EntryDateFilter =
  | 'all'
  | 'month'
  | '3months'
  | '6months'
  | 'year'
  | 'custom';

export interface CustomDateRange {
  start: string;
  end: string;
}

export const ENTRY_DATE_FILTER_OPTIONS: Array<{
  value: EntryDateFilter;
  label: string;
}> = [
  { value: 'all', label: 'Tutte' },
  { value: 'month', label: 'Questo mese' },
  { value: '3months', label: 'Ultimi 3 mesi' },
  { value: '6months', label: 'Ultimi 6 mesi' },
  { value: 'year', label: 'Anno' },
  { value: 'custom', label: 'Periodo' },
];

function parseDayValue(dayValue: string) {
  const [year, month, day] = dayValue.split('-').map(part => Number.parseInt(part, 10));

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function startOfMonth(referenceDate: Date) {
  return new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
}

function startOfYear(referenceDate: Date) {
  return new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1));
}

function subtractMonths(referenceDate: Date, months: number) {
  return new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth() - months,
      referenceDate.getUTCDate(),
    ),
  );
}

export function isWithinDateFilter(
  dayValue: string,
  dateFilter: EntryDateFilter,
  customRange: CustomDateRange,
  referenceDate = new Date(),
) {
  const currentDate = new Date(
    Date.UTC(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    ),
  );
  const targetDate = parseDayValue(dayValue);

  if (!targetDate) {
    return false;
  }

  if (dateFilter === 'all') {
    return true;
  }

  if (dateFilter === 'month') {
    return targetDate >= startOfMonth(currentDate) && targetDate <= currentDate;
  }

  if (dateFilter === '3months') {
    return targetDate >= subtractMonths(currentDate, 3) && targetDate <= currentDate;
  }

  if (dateFilter === '6months') {
    return targetDate >= subtractMonths(currentDate, 6) && targetDate <= currentDate;
  }

  if (dateFilter === 'year') {
    return targetDate >= startOfYear(currentDate) && targetDate <= currentDate;
  }

  const startDate = customRange.start ? parseDayValue(customRange.start) : null;
  const endDate = customRange.end ? parseDayValue(customRange.end) : null;

  if (startDate && targetDate < startDate) {
    return false;
  }

  if (endDate && targetDate > endDate) {
    return false;
  }

  return true;
}
