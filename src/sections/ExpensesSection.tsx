import { useMemo, useState } from 'react';
import { CircleDollarSign, Pencil, Plus } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import {
  ENTRY_DATE_FILTER_OPTIONS,
  type CustomDateRange,
  type EntryDateFilter,
  isWithinDateFilter,
} from '../lib/dateFilters';
import {
  expandExpensesForDisplay,
  getRecurrenceLabel,
} from '../lib/recurringExpenses';
import type { Expense, Vehicle } from '../types/domain';

interface ExpensesSectionProps {
  vehicles: Vehicle[];
  expenses: Expense[];
  isLoading: boolean;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
}

const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
});

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
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
  const [dateFilter, setDateFilter] = useState<EntryDateFilter>('all');
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    start: '',
    end: '',
  });
  const vehiclesById = useMemo(
    () => new Map(vehicles.map(vehicle => [vehicle.id, vehicle])),
    [vehicles],
  );
  const displayExpenses = useMemo(() => expandExpensesForDisplay(expenses), [expenses]);
  const filteredExpenses = useMemo(
    () =>
      displayExpenses.filter(expense =>
        isWithinDateFilter(expense.date, dateFilter, customRange),
      ),
    [customRange, dateFilter, displayExpenses],
  );
  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + (expense.is_projected ? 0 : expense.amount),
    0,
  );

  if (isLoading) {
    return (
      <section className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3.5 text-sm text-slate-300">
        Caricamento spese...
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section className="rounded-[1.3rem] border border-amber-400/15 bg-amber-500/8 p-3.5">
        <div className="flex items-center gap-2 text-amber-200">
          <CircleDollarSign className="h-4 w-4" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Spese</p>
        </div>
        <h2 className="mt-2 text-lg font-semibold text-white">
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
      <section className="rounded-[1.3rem] border border-amber-400/15 bg-amber-500/8 p-3.5">
        <div className="flex items-center gap-2 text-amber-200">
          <CircleDollarSign className="h-4 w-4" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">Spese</p>
        </div>
        <h2 className="mt-2 text-lg font-semibold text-white">
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
      <div className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Costi veicolo
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            {filteredExpenses.length} spes{filteredExpenses.length === 1 ? 'a' : 'e'}
          </h2>
          <p className="text-sm font-medium text-amber-200">
            {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {ENTRY_DATE_FILTER_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDateFilter(option.value)}
              className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-medium transition ${
                dateFilter === option.value
                  ? 'border-amber-400/20 bg-amber-500/12 text-amber-100'
                  : 'border-white/10 bg-slate-950/60 text-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="block min-w-0 text-xs text-slate-400">
              Da
              <input
                type="date"
                lang="it-IT"
                value={customRange.start}
                onChange={event =>
                  setCustomRange(current => ({ ...current, start: event.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40"
              />
            </label>
            <label className="block min-w-0 text-xs text-slate-400">
              A
              <input
                type="date"
                lang="it-IT"
                value={customRange.end}
                onChange={event =>
                  setCustomRange(current => ({ ...current, end: event.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/40"
              />
            </label>
          </div>
        ) : null}
      </div>

      {filteredExpenses.length === 0 ? (
        <section className="rounded-[1.25rem] border border-white/8 bg-slate-900/80 p-3.5 text-sm text-slate-300">
          Nessuna spesa per il periodo selezionato.
        </section>
      ) : null}

      {filteredExpenses.map(expense => {
        const vehicle = vehiclesById.get(expense.vehicle_id) ?? null;

        return (
          <article
            key={expense.occurrence_key}
            className="relative overflow-hidden rounded-[1.35rem] border border-white/8 bg-slate-900/85 px-3.5 py-3.5 shadow-[0_14px_32px_rgba(2,6,23,0.24)]"
          >
            <span className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-amber-400/85" />

            <div className="flex items-start justify-between gap-3 pl-1">
              <div className="min-w-0 flex items-center gap-3">
                {vehicle ? (
                  <BrandLogo
                    brand={vehicle.brand}
                    vehicleType={vehicle.vehicle_type}
                    size="sm"
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-slate-950/70 text-amber-200">
                    <CircleDollarSign className="h-4 w-4" />
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
                onClick={() => onEditExpense(expense.source_expense)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                title="Modifica spesa"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 pl-1">
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-100">
                {expense.category}
              </span>
              {expense.is_recurring ? (
                <span className="rounded-full border border-sky-400/18 bg-sky-500/10 px-2.5 py-1 text-[10px] font-medium text-sky-100">
                  {getRecurrenceLabel(expense.recurrence_interval_months) || 'Ricorrente'}
                </span>
              ) : null}
              {expense.is_projected ? (
                <span className="rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[10px] font-medium text-slate-200">
                  Prevista
                </span>
              ) : null}
              <span className="rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[10px] font-medium text-white">
                {formatDate(expense.date)}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300 pl-1">
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Importo</dt>
                <dd className="mt-1 font-medium text-white">{formatCurrency(expense.amount)}</dd>
              </div>
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Veicolo</dt>
                <dd className="mt-1 truncate font-medium text-white">
                  {vehicle?.name || 'Veicolo'}
                </dd>
              </div>
            </dl>

            {expense.notes ? (
              <p className="mt-3 pl-1 text-sm leading-6 text-slate-300">{expense.notes}</p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
