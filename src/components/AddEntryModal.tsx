import { useEffect, useMemo, useState } from 'react';
import { Bike, CarFront, Droplets, Trash2, X } from 'lucide-react';
import {
  FUEL_TYPES,
  VEHICLE_TYPES,
  type Refuel,
  type RefuelInput,
  type Vehicle,
  type VehicleInput,
  type VehicleType,
} from '../types/domain';
import { getReadableDataError } from '../lib/data';

type VehicleModalProps = {
  entryType: 'vehicle';
  uid: string;
  mode: 'create' | 'edit';
  vehicle?: Vehicle | null;
  onClose: () => void;
  onDelete?: () => Promise<void> | void;
  onSubmit: (input: VehicleInput) => Promise<void>;
};

type RefuelModalProps = {
  entryType: 'refuel';
  uid: string;
  mode: 'create' | 'edit';
  refuel?: Refuel | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onDelete?: () => Promise<void> | void;
  onSubmit: (input: RefuelInput) => Promise<void>;
};

type AddEntryModalProps = VehicleModalProps | RefuelModalProps;

interface VehicleFormState {
  brand: string;
  model: string;
  nickname: string;
  vehicle_type: VehicleType;
  plate: string;
  year: string;
  color: string;
  tank_capacity_liters: string;
  fuel_type: VehicleInput['fuel_type'];
  is_active: boolean;
}

interface RefuelFormState {
  vehicle_id: string;
  liters: string;
  price_per_liter: string;
  total_cost: string;
  odometer_km: string;
  date: string;
  is_full_tank: boolean;
  station: string;
  notes: string;
}

const INPUT_CLASS_NAME =
  'mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20';

const LABEL_CLASS_NAME = 'block text-sm font-medium text-slate-200';

function getInitialVehicleState(vehicle?: Vehicle | null): VehicleFormState {
  if (!vehicle) {
    return {
      brand: '',
      model: '',
      nickname: '',
      vehicle_type: 'Auto',
      plate: '',
      year: '',
      color: '',
      tank_capacity_liters: '',
      fuel_type: 'Benzina',
      is_active: true,
    };
  }

  return {
    brand: vehicle.brand,
    model: vehicle.model,
    nickname: vehicle.nickname ?? '',
    vehicle_type: vehicle.vehicle_type,
    plate: vehicle.plate,
    year: vehicle.year === null ? '' : String(vehicle.year),
    color: vehicle.color ?? '',
    tank_capacity_liters: String(vehicle.tank_capacity_liters),
    fuel_type: vehicle.fuel_type,
    is_active: vehicle.is_active,
  };
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialRefuelState(
  refuel: Refuel | null | undefined,
  vehicles: Vehicle[],
): RefuelFormState {
  const fallbackVehicleId =
    vehicles.find(vehicle => vehicle.is_active)?.id ?? vehicles[0]?.id ?? '';

  if (!refuel) {
    return {
      vehicle_id: fallbackVehicleId,
      liters: '',
      price_per_liter: '',
      total_cost: '',
      odometer_km: '',
      date: getTodayValue(),
      is_full_tank: true,
      station: '',
      notes: '',
    };
  }

  return {
    vehicle_id: refuel.vehicle_id,
    liters: String(refuel.liters),
    price_per_liter: String(refuel.price_per_liter),
    total_cost: String(refuel.total_cost),
    odometer_km: String(refuel.odometer_km),
    date: refuel.date,
    is_full_tank: refuel.is_full_tank,
    station: refuel.station ?? '',
    notes: refuel.notes ?? '',
  };
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parsePositiveDecimal(value: string) {
  const normalized = value.replace(',', '.').trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOdometer(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function VehicleForm({
  uid,
  mode,
  vehicle,
  onDelete,
  onSubmit,
}: Omit<VehicleModalProps, 'entryType' | 'onClose'>) {
  const [formState, setFormState] = useState<VehicleFormState>(() =>
    getInitialVehicleState(vehicle),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormState(getInitialVehicleState(vehicle));
  }, [vehicle]);

  const updateField = <K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K],
  ) => {
    setFormState(current => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    const brand = formState.brand.trim();
    const model = formState.model.trim();
    const plate = formState.plate.trim();
    const tankCapacity = parsePositiveDecimal(formState.tank_capacity_liters);
    const year = parseOptionalInteger(formState.year);

    if (!brand || !model || !plate) {
      setErrorMessage('Marca, modello e targa sono obbligatori.');
      return;
    }

    if (tankCapacity === null || tankCapacity <= 0) {
      setErrorMessage('Inserisci una capacita serbatoio valida.');
      return;
    }

    if (formState.year.trim() && year === null) {
      setErrorMessage('Anno non valido.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        uid,
        brand,
        model,
        nickname: formState.nickname.trim() || null,
        vehicle_type: formState.vehicle_type,
        plate,
        year,
        color: formState.color.trim() || null,
        tank_capacity_liters: tankCapacity,
        fuel_type: formState.fuel_type,
        is_active: formState.is_active,
      });
    } catch (error) {
      console.error('Failed to save vehicle', error);
      setErrorMessage(getReadableDataError(error));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-5">
          <div>
            <span className={LABEL_CLASS_NAME}>Tipo veicolo</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {VEHICLE_TYPES.map(option => {
                const isActive = formState.vehicle_type === option;
                const Icon = option === 'Auto' ? CarFront : Bike;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField('vehicle_type', option)}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'border-sky-400/50 bg-sky-500/15 text-sky-100'
                        : 'border-white/10 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <label className={LABEL_CLASS_NAME}>
            Marca
            <input
              type="text"
              value={formState.brand}
              onChange={event => updateField('brand', event.target.value)}
              className={INPUT_CLASS_NAME}
              placeholder="Es. BMW"
            />
          </label>

          <label className={LABEL_CLASS_NAME}>
            Modello
            <input
              type="text"
              value={formState.model}
              onChange={event => updateField('model', event.target.value)}
              className={INPUT_CLASS_NAME}
              placeholder="Es. X1"
            />
          </label>

          <label className={LABEL_CLASS_NAME}>
            Nickname
            <input
              type="text"
              value={formState.nickname}
              onChange={event => updateField('nickname', event.target.value)}
              className={INPUT_CLASS_NAME}
              placeholder="Opzionale"
            />
          </label>

          <label className={LABEL_CLASS_NAME}>
            Targa
            <input
              type="text"
              value={formState.plate}
              onChange={event => updateField('plate', event.target.value)}
              className={INPUT_CLASS_NAME}
              placeholder="Es. AB123CD"
              autoCapitalize="characters"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={LABEL_CLASS_NAME}>
              Anno
              <input
                type="number"
                inputMode="numeric"
                value={formState.year}
                onChange={event => updateField('year', event.target.value)}
                className={INPUT_CLASS_NAME}
                placeholder="Opzionale"
              />
            </label>
            <label className={LABEL_CLASS_NAME}>
              Colore
              <input
                type="text"
                value={formState.color}
                onChange={event => updateField('color', event.target.value)}
                className={INPUT_CLASS_NAME}
                placeholder="Opzionale"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className={LABEL_CLASS_NAME}>
              Serbatoio (L)
              <input
                type="text"
                inputMode="decimal"
                value={formState.tank_capacity_liters}
                onChange={event =>
                  updateField('tank_capacity_liters', event.target.value)
                }
                className={INPUT_CLASS_NAME}
                placeholder="Es. 51"
              />
            </label>
            <label className={LABEL_CLASS_NAME}>
              Carburante
              <select
                value={formState.fuel_type}
                onChange={event =>
                  updateField(
                    'fuel_type',
                    event.target.value as VehicleInput['fuel_type'],
                  )
                }
                className={INPUT_CLASS_NAME}
              >
                {FUEL_TYPES.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => updateField('is_active', !formState.is_active)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
              formState.is_active
                ? 'border-sky-400/40 bg-sky-500/12 text-sky-100'
                : 'border-white/10 bg-slate-900 text-slate-300'
            }`}
          >
            <span>
              <span className="block font-medium">Veicolo attivo</span>
              <span className="mt-1 block text-xs text-slate-400">
                Usato come riferimento principale nel garage.
              </span>
            </span>
            <span
              className={`h-6 w-11 rounded-full p-1 transition ${
                formState.is_active ? 'bg-sky-400/80' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition ${
                  formState.is_active ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/8 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-center gap-3">
          {mode === 'edit' && onDelete ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20"
              title="Elimina veicolo"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Salvataggio...'
              : mode === 'create'
                ? 'Salva veicolo'
                : 'Aggiorna veicolo'}
          </button>
        </div>
      </div>
    </>
  );
}

function RefuelForm({
  uid,
  mode,
  refuel,
  vehicles,
  onDelete,
  onSubmit,
}: Omit<RefuelModalProps, 'entryType' | 'onClose'>) {
  const [formState, setFormState] = useState<RefuelFormState>(() =>
    getInitialRefuelState(refuel, vehicles),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormState(getInitialRefuelState(refuel, vehicles));
  }, [refuel, vehicles]);

  const calculatedTotalCost = useMemo(() => {
    const liters = parsePositiveDecimal(formState.liters);
    const pricePerLiter = parsePositiveDecimal(formState.price_per_liter);

    if (
      liters === null ||
      pricePerLiter === null ||
      liters <= 0 ||
      pricePerLiter <= 0
    ) {
      return null;
    }

    return (liters * pricePerLiter).toFixed(2);
  }, [formState.liters, formState.price_per_liter]);

  const updateField = <K extends keyof RefuelFormState>(
    key: K,
    value: RefuelFormState[K],
  ) => {
    setFormState(current => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    const liters = parsePositiveDecimal(formState.liters);
    const pricePerLiter = parsePositiveDecimal(formState.price_per_liter);
    const totalCostRaw = formState.total_cost.trim();
    const totalCost = totalCostRaw ? parsePositiveDecimal(totalCostRaw) : null;
    const odometerKm = parseOdometer(formState.odometer_km);

    if (!formState.vehicle_id) {
      setErrorMessage('Seleziona un veicolo.');
      return;
    }

    if (liters === null || liters <= 0) {
      setErrorMessage('Inserisci i litri del rifornimento.');
      return;
    }

    if (pricePerLiter === null || pricePerLiter <= 0) {
      setErrorMessage('Inserisci un costo al litro valido.');
      return;
    }

    if (totalCostRaw && (totalCost === null || totalCost <= 0)) {
      setErrorMessage('Inserisci un totale valido oppure lascialo vuoto.');
      return;
    }

    if (odometerKm === null) {
      setErrorMessage('Inserisci un contachilometri valido.');
      return;
    }

    if (!formState.date) {
      setErrorMessage('Inserisci la data del rifornimento.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        uid,
        vehicle_id: formState.vehicle_id,
        liters,
        price_per_liter: pricePerLiter,
        total_cost: totalCost,
        odometer_km: odometerKm,
        date: formState.date,
        is_full_tank: formState.is_full_tank,
        station: formState.station.trim() || null,
        notes: formState.notes.trim() || null,
      });
    } catch (error) {
      console.error('Failed to save refuel', error);
      setErrorMessage(getReadableDataError(error));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-5">
          <label className={LABEL_CLASS_NAME}>
            Veicolo
            <select
              value={formState.vehicle_id}
              onChange={event => updateField('vehicle_id', event.target.value)}
              className={INPUT_CLASS_NAME}
              disabled={vehicles.length === 0}
            >
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={LABEL_CLASS_NAME}>
              Litri
              <input
                type="text"
                inputMode="decimal"
                value={formState.liters}
                onChange={event => updateField('liters', event.target.value)}
                className={INPUT_CLASS_NAME}
                placeholder="Es. 42.5"
              />
            </label>
            <label className={LABEL_CLASS_NAME}>
              Costo al litro
              <input
                type="text"
                inputMode="decimal"
                value={formState.price_per_liter}
                onChange={event =>
                  updateField('price_per_liter', event.target.value)
                }
                className={INPUT_CLASS_NAME}
                placeholder="Es. 1.859"
              />
            </label>
          </div>

          <label className={LABEL_CLASS_NAME}>
            Totale speso
            <input
              type="text"
              inputMode="decimal"
              value={formState.total_cost}
              onChange={event => updateField('total_cost', event.target.value)}
              className={INPUT_CLASS_NAME}
              placeholder="Opzionale"
            />
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Se lo lasci vuoto, viene calcolato automaticamente da litri x costo al litro.
              {calculatedTotalCost ? ` Totale calcolato: ${calculatedTotalCost} EUR.` : ''}
            </p>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={LABEL_CLASS_NAME}>
              Contachilometri
              <input
                type="number"
                inputMode="numeric"
                value={formState.odometer_km}
                onChange={event => updateField('odometer_km', event.target.value)}
                className={INPUT_CLASS_NAME}
                placeholder="Es. 48210"
              />
            </label>
            <label className={LABEL_CLASS_NAME}>
              Data
              <input
                type="date"
                value={formState.date}
                onChange={event => updateField('date', event.target.value)}
                className={INPUT_CLASS_NAME}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => updateField('is_full_tank', !formState.is_full_tank)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
              formState.is_full_tank
                ? 'border-emerald-400/40 bg-emerald-500/12 text-emerald-100'
                : 'border-white/10 bg-slate-900 text-slate-300'
            }`}
          >
            <span>
              <span className="block font-medium">Pieno</span>
              <span className="mt-1 block text-xs text-slate-400">
                Segna se il serbatoio e stato riempito completamente.
              </span>
            </span>
            <span
              className={`h-6 w-11 rounded-full p-1 transition ${
                formState.is_full_tank ? 'bg-emerald-400/80' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition ${
                  formState.is_full_tank ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>

          <label className={LABEL_CLASS_NAME}>
            Stazione di servizio
            <input
              type="text"
              value={formState.station}
              onChange={event => updateField('station', event.target.value)}
              className={INPUT_CLASS_NAME}
              placeholder="Opzionale"
            />
          </label>

          <label className={LABEL_CLASS_NAME}>
            Note
            <textarea
              value={formState.notes}
              onChange={event => updateField('notes', event.target.value)}
              className={`${INPUT_CLASS_NAME} min-h-28 resize-none`}
              placeholder="Opzionale"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/8 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-center gap-3">
          {mode === 'edit' && onDelete ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20"
              title="Elimina rifornimento"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || vehicles.length === 0}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Salvataggio...'
              : mode === 'create'
                ? 'Salva rifornimento'
                : 'Aggiorna rifornimento'}
          </button>
        </div>
      </div>
    </>
  );
}

export function AddEntryModal(props: AddEntryModalProps) {
  const modalLabel = props.entryType === 'vehicle' ? 'Veicolo' : 'Rifornimento';
  const modalTitle =
    props.entryType === 'vehicle'
      ? props.mode === 'create'
        ? 'Nuovo veicolo'
        : 'Modifica veicolo'
      : props.mode === 'create'
        ? 'Nuovo rifornimento'
        : 'Modifica rifornimento';

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label={`Chiudi modale ${modalLabel.toLowerCase()}`}
        onClick={props.onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <div className="absolute inset-x-0 bottom-0 top-0 mx-auto flex max-w-md flex-col overflow-hidden bg-slate-950 shadow-2xl">
        <div className="border-b border-white/8 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {modalLabel}
              </p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold text-white">
                {props.entryType === 'vehicle' ? (
                  <CarFront className="h-5 w-5 text-sky-300" />
                ) : (
                  <Droplets className="h-5 w-5 text-emerald-300" />
                )}
                {modalTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={props.onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {props.entryType === 'vehicle' ? (
          <VehicleForm
            uid={props.uid}
            mode={props.mode}
            vehicle={props.vehicle}
            onDelete={props.onDelete}
            onSubmit={props.onSubmit}
          />
        ) : (
          <RefuelForm
            uid={props.uid}
            mode={props.mode}
            refuel={props.refuel}
            vehicles={props.vehicles}
            onDelete={props.onDelete}
            onSubmit={props.onSubmit}
          />
        )}
      </div>
    </div>
  );
}
