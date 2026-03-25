import { useMemo, useState } from 'react';
import { CircleDollarSign, Pencil, Plus } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { getCurrentMonthKey } from '../lib/insights';
import type { Expense, Vehicle } from '../types/domain';

interface ExpensesSectionProps {
  vehicles: Vehicle[];
  expenses: Expense[];
  isLoading: boolean;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
}

type ExpenseDateFilter = 'all' | 'month' | 'year';

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

export function ExpensesSection({
  vehicles,
  expenses,
  isLoading,
  onAddExpense,
  onEditExpense,
}: ExpensesSectionProps) {
  const [dateFilter, setDateFilter] = useState<ExpenseDateFilter>('all');
  const vehiclesById = useMemo(
    () => new Map(vehicles.map(vehicle => [vehicle.id, vehicle])),
    [vehicles],
  );
  const currentMonthKey = getCurrentMonthKey();
  const currentYearKey = currentMonthKey.slice(0, 4);

  const filteredExpenses = useMemo(() => {
    if (dateFilter === 'month') {
      return expenses.filter(expense => expense.date.startsWith(currentMonthKey));
    }

    if (dateFilter === 'year') {
      return expenses.filter(expense => expense.date.startsWith(currentYearKey));
    }

    return expenses;
  }, [currentMonthKey, currentYearKey, dateFilter, expenses]);

  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );

  if (isLoading) {
    return (
      <section className="rounded-[1.4rem] border border-white/8 bg-slate-900/80 p-4 text-sm text-slate-300">
        Caricamento spese...
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section className="rounded-[1.55rem] border border-amber-400/15 bg-amber-500/8 p-4">
        <div className="flex items-center gap-2 text-amber-200">
          <CircleDollarSign className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Spese</p>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Aggiungi prima un veicolo.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Ogni spesa viene collegata a un mezzo del garage.
        </p>
      </section>
    );
  }

  if (expenses.length === 0) {
    return (
      <section className="rounded-[1.55rem] border border-amber-400/15 bg-amber-500/8 p-4">
        <div className="flex items-center gap-2 text-amber-200">
          <CircleDollarSign className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Spese</p>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Nessuna spesa registrata.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Salva assicurazione, manutenzione o altre uscite per avere la cronologia completa del veicolo.
        </p>
        <button
          type="button"
          onClick={onAddExpense}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" />
          Aggiungi spesa
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.4rem] border border-white/8 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Costi veicolo
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">
            {filteredExpenses.length} spes{filteredExpenses.length === 1 ? 'a' : 'e'}
          </h2>
          <p className="text-sm font-medium text-amber-200">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-medium transition ${
              dateFilter === 'all'
                ? 'border-amber-400/20 bg-amber-500/12 text-amber-100'
                : 'border-white/10 bg-slate-950/60 text-slate-300'
            }`}
          >
            Tutte
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('month')}
            className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-medium transition ${
              dateFilter === 'month'
                ? 'border-amber-400/20 bg-amber-500/12 text-amber-100'
                : 'border-white/10 bg-slate-950/60 text-slate-300'
            }`}
          >
            Questo mese
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('year')}
            className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-medium transition ${
              dateFilter === 'year'
                ? 'border-amber-400/20 bg-amber-500/12 text-amber-100'
                : 'border-white/10 bg-slate-950/60 text-slate-300'
            }`}
          >
            Quest'anno
          </button>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <section className="rounded-[1.4rem] border border-white/8 bg-slate-900/80 p-4 text-sm text-slate-300">
          Nessuna spesa per il filtro selezionato.
        </section>
      ) : null}

      {filteredExpenses.map(expense => {
        const vehicle = vehiclesById.get(expense.vehicle_id) ?? null;

        return (
          <article
            key={expense.id}
            className="rounded-[1.5rem] border border-white/8 bg-slate-900/85 p-3.5 shadow-[0_14px_32px_rgba(2,6,23,0.24)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                {vehicle ? (
                  <BrandLogo
                    brand={vehicle.brand}
                    vehicleType={vehicle.vehicle_type}
                    size="md"
                  />
                ) : (
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/70 text-amber-200">
                    <CircleDollarSign className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-white">
                    {expense.category}
                  </h3>
                  <p className="truncate text-sm text-slate-400">
                    {vehicle?.name || 'Veicolo'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditExpense(expense)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                title="Modifica spesa"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-100">
                {expense.category}
              </span>
              <span className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-[11px] font-medium text-white">
                {formatDate(expense.date)}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2.5 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Importo</dt>
                <dd className="mt-1 font-medium text-white">{formatCurrency(expense.amount)}</dd>
              </div>
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Veicolo</dt>
                <dd className="mt-1 truncate font-medium text-white">
                  {vehicle?.name || 'Veicolo'}
                </dd>
              </div>
            </dl>

            {expense.notes ? (
              <p className="mt-3 text-sm leading-6 text-slate-300">{expense.notes}</p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
