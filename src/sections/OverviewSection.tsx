import { CarFront, CircleDollarSign, Fuel, Gauge, ReceiptText } from 'lucide-react';
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

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

type LatestMovement =
  | { kind: 'refuel'; item: Refuel }
  | { kind: 'expense'; item: Expense }
  | null;

function getLatestMovement(refuels: Refuel[], expenses: Expense[]): LatestMovement {
  const latestRefuel = refuels[0] ?? null;
  const latestExpense = expenses[0] ?? null;

  if (!latestRefuel && !latestExpense) {
    return null;
  }

  if (!latestExpense) {
    return { kind: 'refuel', item: latestRefuel as Refuel };
  }

  if (!latestRefuel) {
    return { kind: 'expense', item: latestExpense };
  }

  const refuelKey = `${latestRefuel.date}-${latestRefuel.updated_at}`;
  const expenseKey = `${latestExpense.date}-${latestExpense.updated_at}`;

  return refuelKey >= expenseKey
    ? { kind: 'refuel', item: latestRefuel }
    : { kind: 'expense', item: latestExpense };
}

export function OverviewSection({ vehicles, refuels, expenses }: OverviewSectionProps) {
  const activeVehicle = vehicles.find(vehicle => vehicle.is_active) ?? null;
  const fuelSpend = refuels.reduce((total, refuel) => total + refuel.total_cost, 0);
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
  const latestMovement = getLatestMovement(refuels, expenses);

  return (
    <section className="space-y-4">
      <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(145deg,_rgba(14,165,233,0.12),_rgba(15,23,42,0.92))] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
          <Gauge className="h-3.5 w-3.5" />
          Garage
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">
          {activeVehicle ? activeVehicle.name : 'Nessun veicolo attivo'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {latestMovement
            ? `Ultimo movimento il ${formatDate(latestMovement.item.date)}.`
            : 'Quando registri i primi movimenti, qui trovi il colpo d’occhio del garage.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Veicoli</span>
            <CarFront className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{vehicles.length}</p>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Rifornimenti</span>
            <Fuel className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{refuels.length}</p>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Spesa carburante</span>
            <CircleDollarSign className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {fuelSpend > 0 ? formatCurrency(fuelSpend) : '--'}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Altre spese</span>
            <ReceiptText className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 text-lg font-semibold text-white">
            {totalExpenses > 0 ? formatCurrency(totalExpenses) : '--'}
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ultimo movimento
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {latestMovement?.kind === 'expense'
                ? latestMovement.item.category
                : latestMovement?.kind === 'refuel'
                  ? 'Rifornimento registrato'
                  : 'Ancora nessun movimento'}
            </h3>
          </div>
          {latestMovement?.kind === 'refuel' ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
              {latestMovement.item.is_full_tank ? 'Pieno' : 'Parziale'}
            </span>
          ) : latestMovement?.kind === 'expense' ? (
            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
              Spesa
            </span>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {latestMovement?.kind === 'refuel'
            ? `${formatDate(latestMovement.item.date)} • ${formatCurrency(latestMovement.item.total_cost)} • ${latestMovement.item.liters.toFixed(1)} L`
            : latestMovement?.kind === 'expense'
              ? `${formatDate(latestMovement.item.date)} • ${formatCurrency(latestMovement.item.amount)} • ${latestMovement.item.category}`
              : 'Aggiungi un veicolo e registra i primi movimenti per iniziare la cronologia.'}
        </p>
      </div>
    </section>
  );
}
