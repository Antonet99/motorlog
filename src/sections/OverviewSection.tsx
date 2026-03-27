import { Fuel, Gauge, ReceiptText, Route, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildCostPerKmSeries,
  buildMonthlySpendSeries,
  buildRefuelInsights,
  getCurrentMonthKey,
  isInMonth,
  sortExpensesNewestFirst,
  sortRefuelsNewestFirst,
  type CostPerKmPoint,
  type MonthlySpendPoint,
} from '../lib/insights';
import type { Expense, Refuel, Vehicle } from '../types/domain';

interface OverviewSectionProps {
  vehicles: Vehicle[];
  refuels: Refuel[];
  expenses: Expense[];
}

interface TooltipPayload<T> {
  color?: string;
  dataKey?: string;
  payload: T;
  value?: number;
}

interface ChartTooltipProps<T> {
  active?: boolean;
  label?: string;
  payload?: Array<TooltipPayload<T>>;
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

const compactNumberFormatter = new Intl.NumberFormat('it-IT', {
  notation: 'compact',
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
  return ratioCurrencyFormatter.format(value) + '/km';
}

function formatDecimal(value: number) {
  return decimalFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value + 'T12:00:00'));
}

function formatCurrencyAxisTick(value: number) {
  if (value <= 0) {
    return '0';
  }

  return compactNumberFormatter.format(value) + ' €';
}

function formatCostPerKmAxisTick(value: number) {
  if (value <= 0) {
    return '0';
  }

  return value.toFixed(2) + ' €';
}

function getFuelBarRadius(point: MonthlySpendPoint): [number, number, number, number] {
  if (point.fuel_spend <= 0) {
    return [0, 0, 0, 0];
  }

  if (point.expense_spend > 0) {
    return [0, 0, 8, 8];
  }

  return [8, 8, 8, 8];
}

function getExpenseBarRadius(point: MonthlySpendPoint): [number, number, number, number] {
  if (point.expense_spend <= 0) {
    return [0, 0, 0, 0];
  }

  if (point.fuel_spend > 0) {
    return [8, 8, 0, 0];
  }

  return [8, 8, 8, 8];
}

function EmptyChartState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-start justify-center rounded-[1.15rem] border border-dashed border-white/10 bg-slate-950/45 px-4 py-5 text-left">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function MonthlySpendTooltip({
  active,
  label,
  payload,
}: ChartTooltipProps<MonthlySpendPoint>) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="min-w-44 rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-3 shadow-[0_16px_40px_rgba(2,6,23,0.42)] backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-2 space-y-1.5 text-sm text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span>Carburante</span>
          <span className="font-medium text-emerald-200">
            {formatCurrency(point.fuel_spend)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Spese</span>
          <span className="font-medium text-amber-200">
            {formatCurrency(point.expense_spend)}
          </span>
        </div>
      </div>
      <div className="mt-2 border-t border-white/8 pt-2 text-sm font-semibold text-white">
        Totale {formatCurrency(point.total_spend)}
      </div>
    </div>
  );
}

function CostPerKmTooltip({
  active,
  payload,
}: ChartTooltipProps<CostPerKmPoint>) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="min-w-48 rounded-2xl border border-amber-400/15 bg-slate-950/96 px-3 py-3 shadow-[0_18px_42px_rgba(2,6,23,0.44)] backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
        {formatDate(point.date)}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">
        {formatRatioCurrency(point.cost_per_km)}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
        <div className="rounded-xl bg-white/4 px-2 py-2">
          <p>Km</p>
          <p className="mt-1 font-medium text-slate-100">
            {point.distance_km.toLocaleString('it-IT')}
          </p>
        </div>
        <div className="rounded-xl bg-white/4 px-2 py-2">
          <p>Litri</p>
          <p className="mt-1 font-medium text-slate-100">
            {formatDecimal(point.liters)}
          </p>
        </div>
        <div className="rounded-xl bg-white/4 px-2 py-2">
          <p>Costo</p>
          <p className="mt-1 font-medium text-slate-100">
            {formatCurrency(point.total_cost)}
          </p>
        </div>
      </div>
    </div>
  );
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
  const monthlySpendSeries = buildMonthlySpendSeries(sortedRefuels, sortedExpenses, 6);
  const costPerKmSeries = buildCostPerKmSeries(sortedRefuels, 8);
  const hasMonthlySpendData = monthlySpendSeries.some(point => point.total_spend > 0);
  const monthlySpendTotal = monthlySpendSeries.reduce(
    (total, point) => total + point.total_spend,
    0,
  );
  const monthlyFuelTotal = monthlySpendSeries.reduce(
    (total, point) => total + point.fuel_spend,
    0,
  );
  const monthlyExpenseTotal = monthlySpendSeries.reduce(
    (total, point) => total + point.expense_spend,
    0,
  );
  const averageCostPerKm =
    costPerKmSeries.length > 0
      ? Number(
          (
            costPerKmSeries.reduce((total, point) => total + point.cost_per_km, 0) /
            costPerKmSeries.length
          ).toFixed(3),
        )
      : null;
  const latestCostPerKmPoint = costPerKmSeries[costPerKmSeries.length - 1] ?? null;
  const bestCostPerKmPoint =
    costPerKmSeries.length > 0
      ? costPerKmSeries.reduce((best, point) =>
          point.cost_per_km < best.cost_per_km ? point : best,
        )
      : null;

  return (
    <section className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.3rem] border border-white/8 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Movimenti mensili</span>
            <Gauge className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-xl font-semibold text-white">{monthlyMovements}</p>
        </div>

        <div className="rounded-[1.3rem] border border-white/8 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Carburante mensile</span>
            <Fuel className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-base font-semibold text-white">
            {monthlyFuelSpend > 0 ? formatCurrency(monthlyFuelSpend) : '--'}
          </p>
        </div>

        <div className="rounded-[1.3rem] border border-white/8 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Spese mensili</span>
            <ReceiptText className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 text-base font-semibold text-white">
            {monthlyExpenses > 0 ? formatCurrency(monthlyExpenses) : '--'}
          </p>
        </div>

        <div className="rounded-[1.3rem] border border-white/8 bg-slate-900/80 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Consumo effettivo</span>
            <Route className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-base font-semibold text-white">
            {latestComparableInsight
              ? formatDecimal(latestComparableInsight.km_per_liter ?? 0) + ' km/L'
              : '--'}
          </p>
        </div>
      </div>

      <article className="overflow-hidden rounded-[1.3rem] border border-white/8 bg-slate-900/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Costo mensile
            </p>
            <h3 className="mt-1.5 text-[1.05rem] font-semibold text-white">
              Carburante vs spese
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Ultimi 6 mesi sul veicolo attivo, con lettura immediata del peso reale dei costi.
            </p>
          </div>
          <div className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Totale
            </p>
            <p className="text-sm font-semibold text-white">
              {hasMonthlySpendData ? formatCurrency(monthlySpendTotal) : '--'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-1 text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Carburante {hasMonthlySpendData ? formatCurrency(monthlyFuelTotal) : '--'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-500/10 px-2.5 py-1 text-amber-100">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            Spese {hasMonthlySpendData ? formatCurrency(monthlyExpenseTotal) : '--'}
          </span>
        </div>

        <div className="mt-4">
          {hasMonthlySpendData ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlySpendSeries}
                  margin={{ top: 10, right: 0, left: -22, bottom: 0 }}
                  barCategoryGap={14}
                >
                  <defs>
                    <linearGradient id="monthlyFuelFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                    </linearGradient>
                    <linearGradient id="monthlyExpenseFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.98} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.76} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.08)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={42}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={formatCurrencyAxisTick}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={<MonthlySpendTooltip />}
                  />
                  <Bar
                    dataKey="fuel_spend"
                    stackId="spend"
                    fill="url(#monthlyFuelFill)"
                  >
                    {monthlySpendSeries.map(point => (
                      <Cell
                        key={`fuel-${point.month_key}`}
                        radius={getFuelBarRadius(point)}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="expense_spend"
                    stackId="spend"
                    fill="url(#monthlyExpenseFill)"
                  >
                    {monthlySpendSeries.map(point => (
                      <Cell
                        key={`expense-${point.month_key}`}
                        radius={getExpenseBarRadius(point)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState
              title="Ancora nessun trend mensile"
              description="Quando inizi a registrare rifornimenti e spese, qui vedrai la composizione dei costi mese per mese."
            />
          )}
        </div>
      </article>

      <article className="overflow-hidden rounded-[1.3rem] border border-amber-400/14 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.12),transparent_38%),rgba(15,23,42,0.88)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
              Costo d'uso
            </p>
            <h3 className="mt-1.5 text-[1.05rem] font-semibold text-white">
              Timeline costo per km
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Solo intervalli affidabili full-to-full, per capire quanto ti costa davvero usare il mezzo.
            </p>
          </div>
          <div className="rounded-full border border-amber-400/18 bg-amber-500/10 px-3 py-1.5 text-right text-amber-50">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
              Serie
            </p>
            <p className="text-sm font-semibold">
              {costPerKmSeries.length > 0 ? String(costPerKmSeries.length) + ' tratti' : '--'}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5 text-sm">
          <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2.5">
            <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Ultimo</dt>
            <dd className="mt-1 font-medium text-white">
              {latestCostPerKmPoint
                ? formatRatioCurrency(latestCostPerKmPoint.cost_per_km)
                : '--'}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2.5">
            <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Media</dt>
            <dd className="mt-1 font-medium text-white">
              {averageCostPerKm !== null ? formatRatioCurrency(averageCostPerKm) : '--'}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2.5">
            <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Migliore</dt>
            <dd className="mt-1 font-medium text-white">
              {bestCostPerKmPoint ? formatRatioCurrency(bestCostPerKmPoint.cost_per_km) : '--'}
            </dd>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
          <span className="h-0 w-5 border-t border-dashed border-sky-300/80" />
          <span>Linea tratteggiata: media della serie</span>
        </div>

        <div className="mt-4">
          {costPerKmSeries.length > 0 ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={costPerKmSeries}
                  margin={{ top: 12, right: 2, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="costPerKmFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.48} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="costPerKmStroke" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.08)" />
                  <XAxis
                    dataKey="short_label"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={18}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={formatCostPerKmAxisTick}
                  />
                  {averageCostPerKm !== null ? (
                    <ReferenceLine
                      y={averageCostPerKm}
                      stroke="#7dd3fc"
                      strokeDasharray="4 4"
                      ifOverflow="extendDomain"
                    />
                  ) : null}
                  <Tooltip
                    cursor={{ stroke: 'rgba(251,146,60,0.25)', strokeWidth: 1.5 }}
                    content={<CostPerKmTooltip />}
                  />
                  <Area
                    type="linear"
                    dataKey="cost_per_km"
                    stroke="url(#costPerKmStroke)"
                    fill="url(#costPerKmFill)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#fdba74',
                      stroke: '#0f172a',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState
              title="Servono due pieni compatibili"
              description="Appena registri un intervallo full-to-full valido, qui apparira la curva del costo per km con confronto tra gli ultimi tratti affidabili."
            />
          )}
        </div>
      </article>

      <article className="rounded-[1.3rem] border border-white/8 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ultimo rifornimento
            </p>
            <h3 className="mt-1.5 text-[1.05rem] font-semibold text-white">
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
            ? formatDate(latestRefuel.date) + ' • ' + formatCurrency(latestRefuel.total_cost) + ' • ' + formatDecimal(latestRefuel.liters) + ' L'
            : 'Registra un rifornimento per vedere qui litri, costo e andamento reale.'}
        </p>

        {latestRefuel && refuelInsights.get(latestRefuel.id)?.has_valid_full_to_full ? (
          <div className="mt-3 grid grid-cols-3 gap-2.5 text-sm text-slate-300">
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

      <article className="rounded-[1.3rem] border border-white/8 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Ultima spesa
            </p>
            <h3 className="mt-1.5 text-[1.05rem] font-semibold text-white">
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
            ? formatDate(latestExpense.date) +
              ' • ' +
              formatCurrency(latestExpense.amount) +
              (latestExpense.notes ? ' • ' + latestExpense.notes : '')
            : 'Registra una spesa per vedere subito categoria, importo e veicolo collegato.'}
        </p>
      </article>

      {latestComparableRefuel && latestComparableInsight ? (
        <div className="rounded-[1.3rem] border border-sky-400/15 bg-sky-500/8 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                Ultimo pieno compatibile
              </p>
              <h3 className="mt-1.5 text-[1.05rem] font-semibold text-white">
                {vehiclesById.get(latestComparableRefuel.vehicle_id)?.name || 'Veicolo'}
              </h3>
            </div>
            <TrendingUp className="mt-0.5 h-4 w-4 text-sky-200" />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {formatDate(latestComparableRefuel.date)} •{' '}
            {latestComparableInsight.distance_km?.toLocaleString('it-IT')} km •{' '}
            {formatDecimal(latestComparableInsight.km_per_liter ?? 0)} km/L •{' '}
            {formatRatioCurrency(latestComparableInsight.cost_per_km ?? 0)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
