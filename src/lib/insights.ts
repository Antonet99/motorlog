import type { Expense, Refuel } from '../types/domain';

export interface RefuelInsight {
  previous_refuel_id: string | null;
  distance_km: number | null;
  km_per_liter: number | null;
  cost_per_km: number | null;
  has_valid_full_to_full: boolean;
}

export interface MonthlySpendPoint {
  month_key: string;
  label: string;
  fuel_spend: number;
  expense_spend: number;
  total_spend: number;
}

export interface CostPerKmPoint {
  refuel_id: string;
  date: string;
  short_label: string;
  cost_per_km: number;
  distance_km: number;
  liters: number;
  total_cost: number;
}

const monthLabelFormatter = new Intl.DateTimeFormat('it-IT', {
  month: 'short',
});

const shortDateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
});

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

function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return [year, month].join('-');
}

function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function formatMonthLabel(monthKey: string) {
  const label = monthLabelFormatter.format(parseMonthKey(monthKey)).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildTrailingMonthKeys(count: number, referenceDate = new Date()) {
  const keys: string[] = [];
  const anchor = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);

  for (let index = count - 1; index >= 0; index -= 1) {
    keys.push(toMonthKey(new Date(anchor.getFullYear(), anchor.getMonth() - index, 1)));
  }

  return keys;
}

function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(value + 'T12:00:00')).replace('.', '');
}

export function sortRefuelsNewestFirst(refuels: Refuel[]) {
  return [...refuels].sort((left, right) =>
    compareByNewestDate(left.date, left.updated_at, right.date, right.updated_at),
  );
}

export function sortExpensesNewestFirst(expenses: Expense[]) {
  return [...expenses].sort((left, right) =>
    compareByNewestDate(left.date, left.updated_at, right.date, right.updated_at),
  );
}

export function buildRefuelInsights(refuels: Refuel[]) {
  const insights = new Map<string, RefuelInsight>();
  const groupedByVehicle = new Map<string, Refuel[]>();

  refuels.forEach(refuel => {
    const currentVehicleRefuels = groupedByVehicle.get(refuel.vehicle_id) ?? [];
    currentVehicleRefuels.push(refuel);
    groupedByVehicle.set(refuel.vehicle_id, currentVehicleRefuels);
  });

  groupedByVehicle.forEach(vehicleRefuels => {
    const sortedRefuels = sortRefuelsNewestFirst(vehicleRefuels);

    sortedRefuels.forEach((refuel, index) => {
      const previousRefuel = sortedRefuels[index + 1] ?? null;

      if (!previousRefuel) {
        insights.set(refuel.id, {
          previous_refuel_id: null,
          distance_km: null,
          km_per_liter: null,
          cost_per_km: null,
          has_valid_full_to_full: false,
        });
        return;
      }

      const rawDistance = refuel.odometer_km - previousRefuel.odometer_km;
      const distanceKm = rawDistance > 0 ? rawDistance : null;
      const hasValidFullToFull =
        distanceKm !== null && refuel.is_full_tank && previousRefuel.is_full_tank;

      insights.set(refuel.id, {
        previous_refuel_id: previousRefuel.id,
        distance_km: distanceKm,
        km_per_liter: hasValidFullToFull
          ? Number((distanceKm / refuel.liters).toFixed(2))
          : null,
        cost_per_km: hasValidFullToFull
          ? Number((refuel.total_cost / distanceKm).toFixed(3))
          : null,
        has_valid_full_to_full: hasValidFullToFull,
      });
    });
  });

  return insights;
}

export function buildMonthlySpendSeries(
  refuels: Refuel[],
  expenses: Expense[],
  monthCount = 6,
  referenceDate = new Date(),
) {
  const points = buildTrailingMonthKeys(monthCount, referenceDate).map(monthKey => ({
    month_key: monthKey,
    label: formatMonthLabel(monthKey),
    fuel_spend: 0,
    expense_spend: 0,
    total_spend: 0,
  } satisfies MonthlySpendPoint));

  const pointsByMonth = new Map(points.map(point => [point.month_key, point]));

  refuels.forEach(refuel => {
    const monthKey = refuel.date.slice(0, 7);
    const point = pointsByMonth.get(monthKey);

    if (!point) {
      return;
    }

    point.fuel_spend += refuel.total_cost;
    point.total_spend += refuel.total_cost;
  });

  expenses.forEach(expense => {
    const monthKey = expense.date.slice(0, 7);
    const point = pointsByMonth.get(monthKey);

    if (!point) {
      return;
    }

    point.expense_spend += expense.amount;
    point.total_spend += expense.amount;
  });

  return points.map(point => ({
    ...point,
    fuel_spend: Number(point.fuel_spend.toFixed(2)),
    expense_spend: Number(point.expense_spend.toFixed(2)),
    total_spend: Number(point.total_spend.toFixed(2)),
  }));
}

export function buildCostPerKmSeries(refuels: Refuel[], limit = 8) {
  const insights = buildRefuelInsights(refuels);

  return sortRefuelsNewestFirst(refuels)
    .filter(refuel => insights.get(refuel.id)?.has_valid_full_to_full)
    .slice(0, limit)
    .reverse()
    .map(refuel => {
      const insight = insights.get(refuel.id);

      return {
        refuel_id: refuel.id,
        date: refuel.date,
        short_label: formatShortDate(refuel.date),
        cost_per_km: insight?.cost_per_km ?? 0,
        distance_km: insight?.distance_km ?? 0,
        liters: refuel.liters,
        total_cost: refuel.total_cost,
      } satisfies CostPerKmPoint;
    });
}

export function getCurrentMonthKey(referenceDate = new Date()) {
  return toMonthKey(referenceDate);
}

export function isInMonth(date: string, monthKey: string) {
  return date.startsWith(monthKey);
}
