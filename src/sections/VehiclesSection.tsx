import { Pencil, Plus } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import type { Vehicle } from '../types/domain';

interface VehiclesSectionProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

function formatTankCapacity(value: number) {
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${normalized} L`;
}

function getVehicleCountLabel(count: number) {
  return `${count} veicol${count === 1 ? 'o salvato' : 'i salvati'}`;
}

export function VehiclesSection({
  vehicles,
  isLoading,
  onAddVehicle,
  onEditVehicle,
}: VehiclesSectionProps) {
  if (isLoading) {
    return (
      <section className="rounded-[1.4rem] border border-white/8 bg-slate-900/80 p-4 text-sm text-slate-300">
        Caricamento veicoli...
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section className="rounded-[1.55rem] border border-dashed border-sky-400/25 bg-sky-500/8 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
          Nessun veicolo
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Aggiungi il primo mezzo del garage.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Salva auto e moto con targa, motorizzazione e serbatoio per averli sempre pronti nei movimenti futuri.
        </p>
        <button
          type="button"
          onClick={onAddVehicle}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" />
          Aggiungi veicolo
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.4rem] border border-white/8 bg-slate-900/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Veicoli
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {getVehicleCountLabel(vehicles.length)}
        </h2>
      </div>

      {vehicles.map(vehicle => (
        <article
          key={vehicle.id}
          className="rounded-[1.5rem] border border-white/8 bg-slate-900/85 p-3.5 shadow-[0_14px_32px_rgba(2,6,23,0.24)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <BrandLogo
                brand={vehicle.brand}
                vehicleType={vehicle.vehicle_type}
                size="md"
              />
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-white">
                  {vehicle.name}
                </h3>
                <p className="truncate text-sm text-slate-400">
                  {vehicle.nickname || vehicle.plate}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEditVehicle(vehicle)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
              title="Modifica veicolo"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-100">
              {vehicle.vehicle_type}
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-100">
              {vehicle.fuel_type}
            </span>
            {vehicle.is_active ? (
              <span className="rounded-full border border-white/12 bg-white/7 px-3 py-1 text-[11px] font-medium text-white">
                Attivo
              </span>
            ) : null}
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2.5 text-sm text-slate-300">
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                Targa
              </dt>
              <dd className="mt-1 font-medium text-white">{vehicle.plate}</dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                Serbatoio
              </dt>
              <dd className="mt-1 font-medium text-white">
                {formatTankCapacity(vehicle.tank_capacity_liters)}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                Anno
              </dt>
              <dd className="mt-1 font-medium text-white">{vehicle.year ?? '--'}</dd>
            </div>
            <div className="rounded-2xl bg-slate-950/65 px-3 py-2.5">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                Colore
              </dt>
              <dd className="mt-1 font-medium text-white">{vehicle.color ?? '--'}</dd>
            </div>
          </dl>
        </article>
      ))}
    </section>
  );
}
