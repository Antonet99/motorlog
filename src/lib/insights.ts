import type { Expense, Refuel } from '../types/domain';

export interface RefuelInsight {
  previous_refuel_id: string | null;
  distance_km: number | null;
  liters_per_100km: number | null;
  cost_per_km: number | null;
  has_valid_full_to_full: boolean;
}

function compareByNewestDate(leftDate: string, leftUpdatedAt: string, rightDate: string, rightUpdatedAt: string) {
  const dateCompare = rightDate.localeCompare(leftDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return rightUpdatedAt.localeCompare(leftUpdatedAt);
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
          liters_per_100km: null,
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
        liters_per_100km: hasValidFullToFull
          ? Number(((refuel.liters / distanceKm) * 100).toFixed(2))
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

export function getCurrentMonthKey(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function isInMonth(date: string, monthKey: string) {
  return date.startsWith(monthKey);
}
