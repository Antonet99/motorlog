import { useEffect, useMemo, useState } from 'react';
import { Droplets, Fuel, Pencil, Plus, Route } from 'lucide-react';
import { buildRefuelInsights } from '../lib/insights';
import type { Refuel, Vehicle } from '../types/domain';

interface RefuelsSectionProps {
  vehicles: Vehicle[];
  refuels: Refuel[];
  isLoading: boolean;
  onAddRefuel: () => void;
  onEditRefuel: (refuel: Refuel) => void;
}

type VehicleFilter = 'all' | 'active' | string;

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
  return ratioCurrencyFormatter.format(value);
}

function formatDecimal(value: number) {
  return decimalFormatter.format(value);
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

export function RefuelsSection({
  vehicles,
  refuels,
  isLoading,
  onAddRefuel,
  onEditRefuel,
}: RefuelsSectionProps) {
  const [selectedFilter, setSelectedFilter] = useState<VehicleFilter>('all');
  const activeVehicle = vehicles.find(vehicle => vehicle.is_active) ?? null;
  const vehicleNameById = useMemo(
    () => new Map(vehicles.map(vehicle => [vehicle.id, vehicle.name])),
    [vehicles],
  );
  const refuelInsights = useMemo(() => buildRefuelInsights(refuels), [refuels]);

  useEffect(() => {
    if (selectedFilter === 'all') {
      return;
    }

    if (selectedFilter === 'active') {
      if (!activeVehicle) {
        setSelectedFilter('all');
      }
      return;
    }

    const filterStillExists = vehicles.some(vehicle => vehicle.id === selectedFilter);

    if (!filterStillExists) {
      setSelectedFilter('all');
    }
  }, [activeVehicle, selectedFilter, vehicles]);

  const filteredRefuels = useMemo(() => {
    if (selectedFilter === 'all') {
      return refuels;
    }

    const targetVehicleId =
      selectedFilter === 'active' ? activeVehicle?.id ?? null : selectedFilter;

    if (!targetVehicleId) {
      return refuels;
    }

    return refuels.filter(refuel => refuel.vehicle_id === targetVehicleId);
  }, [activeVehicle, refuels, selectedFilter]);

  const totalFuelSpend = filteredRefuels.reduce(
    (total, refuel) => total + refuel.total_cost,
    0,
  );
  const totalLiters = filteredRefuels.reduce((total, refuel) => total + refuel.liters, 0);
  const averagePricePerLiter =
    totalLiters > 0 ? Number((totalFuelSpend / totalLiters).toFixed(3)) : null;
  const latestComparableRefuel =
    filteredRefuels.find(refuel => refuelInsights.get(refuel.id)?.has_valid_full_to_full) ??
    null;
  const latestComparableInsight = latestComparableRefuel
    ? refuelInsights.get(latestComparableRefuel.id) ?? null
    : null;

  if (isLoading) {
    return (
      <section className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-5 text-sm text-slate-300">
        Caricamento rifornimenti...
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/8 p-5">
        <div className="flex items-center gap-2 text-emerald-200">
          <Fuel className="h-4 w-4" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Rifornimenti
          </p>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Aggiungi prima un veicolo.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Il rifornimento viene sempre collegato a un mezzo del garage.
        </p>
      </section>
    );
  }

  if (refuels.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/8 p-5">
        <div className="flex items-center gap-2 text-emerald-200">
          <Fuel className="h-4 w-4" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            Rifornimenti
          </p>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Nessun rifornimento registrato.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Salva litri, costo e contachilometri del prossimo pieno per iniziare la cronologia.
        </p>
        <button
          type="button"
          onClick={onAddRefuel}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          <Plus className="h-4 w-4" />
          Aggiungi rifornimento
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Cronologia carburante
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">
            {filteredRefuels.length} riforniment{filteredRefuels.length === 1 ? 'o' : 'i'}
          </h2>
          <p className="text-sm font-medium text-emerald-200">
            {formatCurrency(totalFuelSpend)}
          </p>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition ${
              selectedFilter === 'all'
                ? 'border-emerald-400/20 bg-emerald-500/12 text-emerald-100'
                : 'border-white/10 bg-slate-950/60 text-slate-300'
            }`}
          >
            Tutti
          </button>
          {activeVehicle ? (
            <button
              type="button"
              onClick={() => setSelectedFilter('active')}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition ${
                selectedFilter === 'active'
                  ? 'border-emerald-400/20 bg-emerald-500/12 text-emerald-100'
                  : 'border-white/10 bg-slate-950/60 text-slate-300'
              }`}
            >
              Attivo
            </button>
          ) : null}
          {vehicles.map(vehicle => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => setSelectedFilter(vehicle.id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition ${
                selectedFilter === vehicle.id
                  ? 'border-emerald-400/20 bg-emerald-500/12 text-emerald-100'
                  : 'border-white/10 bg-slate-950/60 text-slate-300'
              }`}
            >
              {vehicle.nickname || vehicle.name}
            </button>
          ))}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Spesa</dt>
            <dd className="mt-1 font-medium text-white">{formatCurrency(totalFuelSpend)}</dd>
          </div>
          <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Media €/L</dt>
            <dd className="mt-1 font-medium text-white">
              {averagePricePerLiter ? formatCurrency(averagePricePerLiter) : '--'}
            </dd>
          </div>
        </dl>
      </div>

      {latestComparableRefuel && latestComparableInsight ? (
        <div className="rounded-[1.5rem] border border-emerald-400/15 bg-emerald-500/8 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Ultimo pieno compatibile
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {vehicleNameById.get(latestComparableRefuel.vehicle_id) || 'Veicolo'}
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                {formatDate(latestComparableRefuel.date)}
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/12 px-3 py-1 text-xs font-medium text-emerald-100">
              Stima valida
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-300">
            <div className="rounded-2xl bg-slate-950/60 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Km</dt>
              <dd className="mt-1 font-medium text-white">
                {latestComparableInsight.distance_km?.toLocaleString('it-IT')} km
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-950/60 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Resa</dt>
              <dd className="mt-1 font-medium text-white">
                {formatDecimal(latestComparableInsight.km_per_liter ?? 0)} km/L
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-950/60 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">€/km</dt>
              <dd className="mt-1 font-medium text-white">
                {formatRatioCurrency(latestComparableInsight.cost_per_km ?? 0)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {filteredRefuels.length === 0 ? (
        <section className="rounded-[1.5rem] border border-white/8 bg-slate-900/80 p-5 text-sm text-slate-300">
          Nessun rifornimento per il filtro selezionato.
        </section>
      ) : null}

      {filteredRefuels.map(refuel => {
        const refuelInsight = refuelInsights.get(refuel.id) ?? null;
        const hasDistance = refuelInsight?.distance_km !== null;
        const hasValidEstimate = refuelInsight?.has_valid_full_to_full === true;

        return (
          <article
            key={refuel.id}
            className="rounded-[1.6rem] border border-white/8 bg-slate-900/85 p-4 shadow-[0_16px_40px_rgba(2,6,23,0.28)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/20">
                    <Droplets className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-white">
                      {vehicleNameById.get(refuel.vehicle_id) || 'Veicolo'}
                    </h3>
                    <p className="truncate text-sm text-slate-400">
                      {formatDate(refuel.date)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEditRefuel(refuel)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                title="Modifica rifornimento"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                {refuel.is_full_tank ? 'Pieno' : 'Parziale'}
              </span>
              {hasValidEstimate ? (
                <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-100">
                  Stima valida
                </span>
              ) : null}
              {refuel.station ? (
                <span className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-xs font-medium text-white">
                  {refuel.station}
                </span>
              ) : null}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Totale</dt>
                <dd className="mt-1 font-medium text-white">{formatCurrency(refuel.total_cost)}</dd>
              </div>
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Litri</dt>
                <dd className="mt-1 font-medium text-white">{formatDecimal(refuel.liters)} L</dd>
              </div>
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Costo/L</dt>
                <dd className="mt-1 font-medium text-white">{formatCurrency(refuel.price_per_liter)}</dd>
              </div>
              <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
                <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Contachilometri</dt>
                <dd className="mt-1 font-medium text-white">{refuel.odometer_km.toLocaleString('it-IT')} km</dd>
              </div>
            </dl>

            {hasDistance && refuelInsight ? (
              <div className="mt-4 rounded-[1.35rem] border border-white/8 bg-slate-950/45 p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Route className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Dall'ultimo rifornimento utile
                  </p>
                </div>
                <dl
                  className={`mt-3 grid gap-3 text-sm text-slate-300 ${
                    hasValidEstimate ? 'grid-cols-3' : 'grid-cols-1'
                  }`}
                >
                  <div className="rounded-2xl bg-slate-900/70 px-3 py-2.5">
                    <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Km percorsi</dt>
                    <dd className="mt-1 font-medium text-white">
                      {refuelInsight.distance_km?.toLocaleString('it-IT')} km
                    </dd>
                  </div>
                  {hasValidEstimate ? (
                    <>
                      <div className="rounded-2xl bg-slate-900/70 px-3 py-2.5">
                        <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">Resa</dt>
                        <dd className="mt-1 font-medium text-white">
                          {formatDecimal(refuelInsight.km_per_liter ?? 0)} km/L
                        </dd>
                      </div>
                      <div className="rounded-2xl bg-slate-900/70 px-3 py-2.5">
                        <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">€/km</dt>
                        <dd className="mt-1 font-medium text-white">
                          {formatRatioCurrency(refuelInsight.cost_per_km ?? 0)}
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>
                {!hasValidEstimate ? (
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Per stimare resa e costo/km servono due pieni consecutivi con contachilometri crescente.
                  </p>
                ) : null}
              </div>
            ) : null}

            {refuel.notes ? (
              <p className="mt-3 text-sm leading-6 text-slate-300">{refuel.notes}</p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
