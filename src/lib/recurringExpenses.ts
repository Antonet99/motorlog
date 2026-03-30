import type {
  Expense,
  ExpenseRecurrenceIntervalMonths,
} from '../types/domain';

export interface DisplayExpense extends Expense {
  occurrence_key: string;
  source_expense: Expense;
  is_projected: boolean;
}

function parseDayString(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function formatDayString(year: number, month: number, day: number) {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function addMonthsToDayString(value: string, monthsToAdd: number) {
  const { year, month, day } = parseDayString(value);
  const zeroBasedMonth = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(zeroBasedMonth / 12);
  const targetMonth = ((zeroBasedMonth % 12) + 12) % 12 + 1;
  const targetDay = Math.min(day, getDaysInMonth(targetYear, targetMonth));
  return formatDayString(targetYear, targetMonth, targetDay);
}

function compareByNewestDate(
  leftDate: string,
  leftUpdatedAt: string,
  rightDate: string,
  rightUpdatedAt: string,
) {
  const dateCompare = rightDate.localeCompare(leftDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return rightUpdatedAt.localeCompare(leftUpdatedAt);
}

function buildSingleDisplayExpense(expense: Expense, date: string): DisplayExpense {
  return {
    ...expense,
    date,
    occurrence_key: `${expense.id}:${date}`,
    source_expense: expense,
    is_projected: date > new Date().toISOString().slice(0, 10),
  };
}

function expandRecurringExpense(
  expense: Expense,
  intervalMonths: ExpenseRecurrenceIntervalMonths,
  today: string,
) {
  if (expense.date > today) {
    return [buildSingleDisplayExpense(expense, expense.date)];
  }

  const occurrences: DisplayExpense[] = [];
  let occurrenceDate = expense.date;
  let safetyCounter = 0;

  while (occurrenceDate <= today && safetyCounter < 240) {
    occurrences.push(buildSingleDisplayExpense(expense, occurrenceDate));
    occurrenceDate = addMonthsToDayString(occurrenceDate, intervalMonths);
    safetyCounter += 1;
  }

  return occurrences;
}

export function expandExpensesForDisplay(
  expenses: Expense[],
  referenceDate = new Date().toISOString().slice(0, 10),
) {
  return expenses
    .flatMap(expense => {
      if (!expense.is_recurring || expense.recurrence_interval_months === null) {
        return [buildSingleDisplayExpense(expense, expense.date)];
      }

      return expandRecurringExpense(
        expense,
        expense.recurrence_interval_months,
        referenceDate,
      );
    })
    .sort((left, right) =>
      compareByNewestDate(left.date, left.updated_at, right.date, right.updated_at),
    );
}

export function getRecurrenceLabel(
  intervalMonths: ExpenseRecurrenceIntervalMonths | null,
) {
  if (intervalMonths === 1) {
    return 'Ogni mese';
  }

  if (intervalMonths === 2) {
    return 'Ogni 2 mesi';
  }

  if (intervalMonths === 3) {
    return 'Ogni 3 mesi';
  }

  if (intervalMonths === 6) {
    return 'Ogni 6 mesi';
  }

  if (intervalMonths === 12) {
    return 'Ogni anno';
  }

  return null;
}
