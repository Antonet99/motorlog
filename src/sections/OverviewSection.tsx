import { Fuel, Gauge, ReceiptText, Route } from 'lucide-react';
import {
  buildRefuelInsights,
  getCurrentMonthKey,
  isInMonth,
  sortExpensesNewestFirst,
  sortRefuelsNewestFirst,
} from '../lib/insights';
import type { Expense, Refuel, Vehicle } from '../types/domain';

interface OverviewSectionProps {
  vehicles: Vehicle[];
  refuels: Refuel[];
  expenses: Expense[];
}

const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
});

const ratioCurrencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const decimalFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatRatioCurrency(value: number) {
  return `${ratioCurrencyFormatter.format(value)}/km`;
}

function formatDecimal(value: number) {
  return decimalFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

export function OverviewSection({ vehicles, refuels, expenses }: OverviewSectionProps) {
  const sortedRefuels = sortRefuelsNewestFirst(refuels);
  const sortedExpenses = sortExpensesNewestFirst(expenses);
  const refuelInsights = buildRefuelInsights(sortedRefuels);
  const vehiclesById = new Map(vehicles.map(vehicle => [vehicle.id, vehicle]));
  const monthKey = getCurrentMonthKey();
  const refuelsThisMonth = sortedRefuels.filter(refuel => isInMonth(refuel.date, monthKey));
  const expensesThisMonth = sortedExpenses.filter(expense => isInMonth(expense.date, monthKey));
  const latestRefuel = sortedRefuels[0] ?? null;
  const latestExpense = sortedExpenses[0] ?? null;
  const latestComparableRefuel =
    sortedRefuels.find(refuel => refuelInsights.get(refuel.id)?.has_valid_full_to_full) ?? null;
  const latestComparableInsight = latestComparableRefuel
    ? refuelInsights.get(latestComparableRefuel.id) ?? null
    : null;
  const monthlyFuelSpend = refuelsThisMonth.reduce(
    (total, refuel) => total + refuel.total_cost,
    0,
  );
  const monthlyExpenses = expensesThisMonth.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const monthlyMovements = refuelsThisMonth.length + expensesThisMonth.length;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Movimenti mensili</span>
            <Gauge className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-2.5 text-lg font-semibold text-white">{monthlyMovements}</p>
        </div>

        <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Carburante mensile</span>
            <Fuel className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-2.5 text-sm font-semibold text-white">
            {monthlyFuelSpend > 0 ? formatCurrency(monthlyFuelSpend) : '--'}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Spese mensili</span>
            <ReceiptText className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-2.5 text-sm font-semibold text-white">
            {monthlyExpenses > 0 ? formatCurrency(monthlyExpenses) : '--'}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Consumo effettivo</span>
            <Route className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-2.5 text-sm font-semibold text-white">
            {latestComparableInsight
              ? `${formatDecimal(latestComparableInsight.km_per_liter ?? 0)} km/L`
              : '--'}
          </p>
        </div>
      </div>

      <article className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ultimo rifornimento
            </p>
            <h3 className="mt-1.5 text-base font-semibold text-white">
              {latestRefuel
                ? vehiclesById.get(latestRefuel.vehicle_id)?.name || 'Veicolo'
                : 'Ancora nessun rifornimento'}
            </h3>
          </div>
          {latestRefuel ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-100">
              {latestRefuel.is_full_tank ? 'Pieno' : 'Parziale'}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {latestRefuel
            ? `${formatDate(latestRefuel.date)} • ${formatCurrency(latestRefuel.total_cost)} • ${formatDecimal(latestRefuel.liters)} L`
            : 'Registra un rifornimento per vedere qui litri, costo e andamento reale.'}
        </p>

        {latestRefuel && refuelInsights.get(latestRefuel.id)?.has_valid_full_to_full ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-slate-300">
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Km</dt>
              <dd className="mt-1 font-medium text-white">
                {refuelInsights.get(latestRefuel.id)?.distance_km?.toLocaleString('it-IT')} km
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Consumo</dt>
              <dd className="mt-1 font-medium text-white">
                {formatDecimal(refuelInsights.get(latestRefuel.id)?.km_per_liter ?? 0)} km/L
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">€/km</dt>
              <dd className="mt-1 font-medium text-white">
                {formatRatioCurrency(refuelInsights.get(latestRefuel.id)?.cost_per_km ?? 0)}
              </dd>
            </div>
          </div>
        ) : null}
      </article>

      <article className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ultima spesa
            </p>
            <h3 className="mt-1.5 text-base font-semibold text-white">
              {latestExpense ? latestExpense.category : 'Ancora nessuna spesa'}
            </h3>
          </div>
          {latestExpense ? (
            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-100">
              {vehiclesById.get(latestExpense.vehicle_id)?.name || 'Veicolo'}
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {latestExpense
            ? `${formatDate(latestExpense.date)} • ${formatCurrency(latestExpense.amount)}${latestExpense.notes ? ` • ${latestExpense.notes}` : ''}`
            : 'Registra una spesa per vedere subito categoria, importo e veicolo collegato.'}
        </p>
      </article>

      {latestComparableRefuel && latestComparableInsight ? (
        <div className="rounded-[1.25rem] border border-sky-400/15 bg-sky-500/8 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200">
            Ultimo pieno compatibile
          </p>
          <h3 className="mt-1.5 text-base font-semibold text-white">
            {vehiclesById.get(latestComparableRefuel.vehicle_id)?.name || 'Veicolo'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {formatDate(latestComparableRefuel.date)} • {latestComparableInsight.distance_km?.toLocaleString('it-IT')} km • {formatDecimal(latestComparableInsight.km_per_liter ?? 0)} km/L • {formatRatioCurrency(latestComparableInsight.cost_per_km ?? 0)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
