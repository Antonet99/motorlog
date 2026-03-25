import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  FuelType,
  Refuel,
  RefuelInput,
  Vehicle,
  VehicleInput,
  VehicleType,
} from '../types/domain';

const VEHICLE_TYPES: VehicleType[] = ['Auto', 'Moto'];
const FUEL_TYPES: FuelType[] = [
  'Benzina',
  'Diesel',
  'GPL',
  'Metano',
  'Ibrido benzina',
  'Ibrido diesel',
  'Elettrico',
];

function getVehiclesCollection(uid: string) {
  return collection(db, `users/${uid}/vehicles`);
}

function getRefuelsCollection(uid: string) {
  return collection(db, `users/${uid}/refuels`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isVehicleType(value: unknown): value is VehicleType {
  return typeof value === 'string' && VEHICLE_TYPES.includes(value as VehicleType);
}

function isFuelType(value: unknown): value is FuelType {
  return typeof value === 'string' && FUEL_TYPES.includes(value as FuelType);
}

function asOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asOptionalInteger(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  return null;
}

function asPositiveInteger(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

function asPositiveNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Number(value.toFixed(3));
}

function asDayString(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;
}

function buildVehicleName(brand: string, model: string) {
  return `${brand.trim()} ${model.trim()}`.trim();
}

function normalizePlate(value: string) {
  return value.trim().toUpperCase();
}

function sanitizeVehicleInput(input: VehicleInput) {
  const brand = input.brand.trim();
  const model = input.model.trim();

  return {
    uid: input.uid,
    nickname: asOptionalString(input.nickname),
    vehicle_type: input.vehicle_type,
    brand,
    model,
    plate: normalizePlate(input.plate),
    year: input.year,
    color: asOptionalString(input.color),
    tank_capacity_liters: Number(input.tank_capacity_liters.toFixed(2)),
    fuel_type: input.fuel_type,
    is_active: input.is_active,
    name: buildVehicleName(brand, model),
  };
}

function sanitizeRefuelInput(input: RefuelInput) {
  const liters = Number(input.liters.toFixed(3));
  const pricePerLiter = Number(input.price_per_liter.toFixed(3));
  const totalCost =
    input.total_cost === null
      ? Number((liters * pricePerLiter).toFixed(2))
      : Number(input.total_cost.toFixed(2));

  return {
    uid: input.uid,
    vehicle_id: input.vehicle_id,
    liters,
    total_cost: totalCost,
    price_per_liter: pricePerLiter,
    odometer_km: input.odometer_km,
    date: input.date,
    is_full_tank: input.is_full_tank,
    station: asOptionalString(input.station),
    notes: asOptionalString(input.notes),
  };
}

function parseVehicle(id: string, value: unknown): Vehicle | null {
  if (!isRecord(value)) {
    return null;
  }

  const nickname = asOptionalString(value.nickname);
  const color = asOptionalString(value.color);
  const year = value.year === null ? null : asOptionalInteger(value.year);
  const tankCapacity = asPositiveNumber(value.tank_capacity_liters);

  if (
    typeof value.uid !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.brand !== 'string' ||
    typeof value.model !== 'string' ||
    typeof value.plate !== 'string' ||
    typeof value.is_active !== 'boolean' ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string' ||
    !isVehicleType(value.vehicle_type) ||
    !isFuelType(value.fuel_type) ||
    tankCapacity === null
  ) {
    return null;
  }

  return {
    id,
    uid: value.uid,
    name: value.name,
    nickname,
    vehicle_type: value.vehicle_type,
    brand: value.brand,
    model: value.model,
    plate: value.plate,
    year,
    color,
    tank_capacity_liters: tankCapacity,
    fuel_type: value.fuel_type,
    is_active: value.is_active,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function parseRefuel(id: string, value: unknown): Refuel | null {
  if (!isRecord(value)) {
    return null;
  }

  const liters = asPositiveNumber(value.liters);
  const totalCost = asPositiveNumber(value.total_cost);
  const pricePerLiter = asPositiveNumber(value.price_per_liter);
  const odometerKm = asPositiveInteger(value.odometer_km);
  const date = asDayString(value.date);

  if (
    typeof value.uid !== 'string' ||
    typeof value.vehicle_id !== 'string' ||
    typeof value.is_full_tank !== 'boolean' ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string' ||
    liters === null ||
    totalCost === null ||
    pricePerLiter === null ||
    odometerKm === null ||
    date === null
  ) {
    return null;
  }

  return {
    id,
    uid: value.uid,
    vehicle_id: value.vehicle_id,
    liters,
    total_cost: totalCost,
    price_per_liter: pricePerLiter,
    odometer_km: odometerKm,
    date,
    is_full_tank: value.is_full_tank,
    station: asOptionalString(value.station),
    notes: asOptionalString(value.notes),
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function chooseFallbackVehicle(vehicles: Vehicle[], excludeId: string) {
  return vehicles
    .filter(vehicle => vehicle.id !== excludeId)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0] ?? null;
}

async function ensureVehicleExists(uid: string, vehicleId: string) {
  const vehicleSnapshot = await getDoc(doc(getVehiclesCollection(uid), vehicleId));

  if (!vehicleSnapshot.exists()) {
    throw new Error('Veicolo collegato non trovato.');
  }
}

export function getReadableDataError(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Operazione non riuscita. Riprova.';
  }

  const firestoreError = error as Error & { code?: string };

  if (!firestoreError.code) {
    return error.message || 'Operazione non riuscita. Riprova.';
  }

  if (firestoreError.code === 'permission-denied') {
    return 'Permessi Firestore insufficienti per questa operazione.';
  }

  if (firestoreError.code === 'failed-precondition') {
    return 'Configurazione Firestore incompleta o indice mancante.';
  }

  if (firestoreError.code === 'unavailable') {
    return 'Firestore non raggiungibile. Controlla la connessione e riprova.';
  }

  return 'Operazione non riuscita. Riprova.';
}

export function subscribeToVehicles(
  uid: string,
  onData: (vehicles: Vehicle[]) => void,
  onError?: (error: Error) => void,
) {
  const vehiclesQuery = query(getVehiclesCollection(uid), orderBy('updated_at', 'desc'));

  return onSnapshot(
    vehiclesQuery,
    snapshot => {
      const nextVehicles = snapshot.docs
        .map(document => parseVehicle(document.id, document.data()))
        .filter((vehicle): vehicle is Vehicle => vehicle !== null);

      onData(nextVehicles);
    },
    error => {
      onError?.(error);
    },
  );
}

export function subscribeToRefuels(
  uid: string,
  onData: (refuels: Refuel[]) => void,
  onError?: (error: Error) => void,
) {
  const refuelsQuery = query(getRefuelsCollection(uid), orderBy('date', 'desc'));

  return onSnapshot(
    refuelsQuery,
    snapshot => {
      const nextRefuels = snapshot.docs
        .map(document => parseRefuel(document.id, document.data()))
        .filter((refuel): refuel is Refuel => refuel !== null);

      onData(nextRefuels);
    },
    error => {
      onError?.(error);
    },
  );
}

export async function createVehicle(input: VehicleInput) {
  const vehiclesCollection = getVehiclesCollection(input.uid);
  const snapshot = await getDocs(query(vehiclesCollection, orderBy('updated_at', 'desc')));
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const nextRef = doc(vehiclesCollection);
  const normalizedInput = sanitizeVehicleInput(input);
  const shouldBeActive = snapshot.empty || normalizedInput.is_active;

  if (shouldBeActive) {
    snapshot.docs.forEach(document => {
      if (document.data().is_active === true) {
        batch.update(document.ref, { is_active: false, updated_at: now });
      }
    });
  }

  batch.set(nextRef, {
    ...normalizedInput,
    is_active: shouldBeActive,
    created_at: now,
    updated_at: now,
  });

  await batch.commit();
}

export async function updateVehicle(vehicleId: string, input: VehicleInput) {
  const vehicleRef = doc(getVehiclesCollection(input.uid), vehicleId);
  const [vehicleSnapshot, vehiclesSnapshot] = await Promise.all([
    getDoc(vehicleRef),
    getDocs(query(getVehiclesCollection(input.uid), orderBy('updated_at', 'desc'))),
  ]);

  if (!vehicleSnapshot.exists()) {
    throw new Error('Veicolo non trovato.');
  }

  const currentVehicle = parseVehicle(vehicleSnapshot.id, vehicleSnapshot.data());

  if (!currentVehicle) {
    throw new Error('Dati veicolo non validi.');
  }

  const allVehicles = vehiclesSnapshot.docs
    .map(document => parseVehicle(document.id, document.data()))
    .filter((vehicle): vehicle is Vehicle => vehicle !== null);
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const normalizedInput = sanitizeVehicleInput(input);
  const otherVehicles = allVehicles.filter(vehicle => vehicle.id !== vehicleId);
  const fallbackVehicle = chooseFallbackVehicle(allVehicles, vehicleId);
  const shouldBeActive =
    otherVehicles.length === 0
      ? true
      : normalizedInput.is_active || (!fallbackVehicle && currentVehicle.is_active);

  if (shouldBeActive) {
    otherVehicles.forEach(vehicle => {
      if (vehicle.is_active) {
        batch.update(doc(getVehiclesCollection(input.uid), vehicle.id), {
          is_active: false,
          updated_at: now,
        });
      }
    });
  } else if (currentVehicle.is_active && fallbackVehicle) {
    batch.update(doc(getVehiclesCollection(input.uid), fallbackVehicle.id), {
      is_active: true,
      updated_at: now,
    });
  }

  batch.update(vehicleRef, {
    ...normalizedInput,
    is_active: shouldBeActive,
    uid: currentVehicle.uid,
    name: buildVehicleName(normalizedInput.brand, normalizedInput.model),
    created_at: currentVehicle.created_at,
    updated_at: now,
  });

  await batch.commit();
}

export async function deleteVehicle(uid: string, vehicleId: string) {
  const vehicleRef = doc(getVehiclesCollection(uid), vehicleId);
  const [vehicleSnapshot, vehiclesSnapshot, linkedRefuelsSnapshot] = await Promise.all([
    getDoc(vehicleRef),
    getDocs(query(getVehiclesCollection(uid), orderBy('updated_at', 'desc'))),
    getDocs(query(getRefuelsCollection(uid), where('vehicle_id', '==', vehicleId))),
  ]);

  if (!linkedRefuelsSnapshot.empty) {
    throw new Error('Elimina prima i rifornimenti collegati al veicolo.');
  }

  if (!vehicleSnapshot.exists()) {
    return;
  }

  const currentVehicle = parseVehicle(vehicleSnapshot.id, vehicleSnapshot.data());

  if (!currentVehicle) {
    await deleteDoc(vehicleRef);
    return;
  }

  const allVehicles = vehiclesSnapshot.docs
    .map(document => parseVehicle(document.id, document.data()))
    .filter((vehicle): vehicle is Vehicle => vehicle !== null);
  const fallbackVehicle = chooseFallbackVehicle(allVehicles, vehicleId);
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  batch.delete(vehicleRef);

  if (currentVehicle.is_active && fallbackVehicle) {
    batch.update(doc(getVehiclesCollection(uid), fallbackVehicle.id), {
      is_active: true,
      updated_at: now,
    });
  }

  await batch.commit();
}

export async function createRefuel(input: RefuelInput) {
  await ensureVehicleExists(input.uid, input.vehicle_id);

  const now = new Date().toISOString();
  const refuelRef = doc(getRefuelsCollection(input.uid));
  const normalizedInput = sanitizeRefuelInput(input);

  await writeBatch(db)
    .set(refuelRef, {
      ...normalizedInput,
      created_at: now,
      updated_at: now,
    })
    .commit();
}

export async function updateRefuel(refuelId: string, input: RefuelInput) {
  await ensureVehicleExists(input.uid, input.vehicle_id);

  const refuelRef = doc(getRefuelsCollection(input.uid), refuelId);
  const refuelSnapshot = await getDoc(refuelRef);

  if (!refuelSnapshot.exists()) {
    throw new Error('Rifornimento non trovato.');
  }

  const currentRefuel = parseRefuel(refuelSnapshot.id, refuelSnapshot.data());

  if (!currentRefuel) {
    throw new Error('Dati rifornimento non validi.');
  }

  await writeBatch(db)
    .update(refuelRef, {
      ...sanitizeRefuelInput(input),
      uid: currentRefuel.uid,
      created_at: currentRefuel.created_at,
      updated_at: new Date().toISOString(),
    })
    .commit();
}

export async function deleteRefuel(uid: string, refuelId: string) {
  await deleteDoc(doc(getRefuelsCollection(uid), refuelId));
}
