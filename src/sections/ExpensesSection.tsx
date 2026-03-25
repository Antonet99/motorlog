import { CircleDollarSign, Pencil, Plus } from 'lucide-react';
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
  const vehicleNameById = new Map(vehicles.map(vehicle => [vehicle.id, vehicle.name]));
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);

  if (isLoading) {
    return (
      <section className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-5 text-sm text-slate-300">
        Caricamento spese...
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-amber-400/15 bg-amber-500/8 p-5">
        <div className="flex items-center gap-2 text-amber-200">
          <CircleDollarSign className="h-4 w-4" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">Spese</p>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
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
      <section className="rounded-[1.6rem] border border-amber-400/15 bg-amber-500/8 p-5">
        <div className="flex items-center gap-2 text-amber-200">
          <CircleDollarSign className="h-4 w-4" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">Spese</p>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Nessuna spesa registrata.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Salva assicurazione, manutenzione o altre uscite per avere la cronologia completa del veicolo.
        </p>
        <button
          type="button"
          onClick={onAddExpense}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" />
          Aggiungi spesa
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Costi veicolo
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">
            {expenses.length} spes{expenses.length === 1 ? 'a' : 'e'}
          </h2>
          <p className="text-sm font-medium text-amber-200">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>

      {expenses.map(expense => (
        <article
          key={expense.id}
          className="rounded-[1.6rem] border border-white/8 bg-slate-900/85 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.28)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-200 ring-1 ring-amber-400/20">
                  <CircleDollarSign className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-white">
                    {expense.category}
                  </h3>
                  <p className="truncate text-sm text-slate-400">
                    {vehicleNameById.get(expense.vehicle_id) || 'Veicolo'}
                  </p>
                </div>
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

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
              {expense.category}
            </span>
            <span className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-xs font-medium text-white">
              {formatDate(expense.date)}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Importo</dt>
              <dd className="mt-1 font-medium text-white">{formatCurrency(expense.amount)}</dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Veicolo</dt>
              <dd className="mt-1 font-medium text-white truncate">
                {vehicleNameById.get(expense.vehicle_id) || 'Veicolo'}
              </dd>
            </div>
          </dl>

          {expense.notes ? (
            <p className="mt-3 text-sm leading-6 text-slate-300">{expense.notes}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
