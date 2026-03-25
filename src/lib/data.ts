import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  FuelType,
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

function asPositiveNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Number(value.toFixed(2));
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

function chooseFallbackVehicle(vehicles: Vehicle[], excludeId: string) {
  return vehicles
    .filter(vehicle => vehicle.id !== excludeId)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0] ?? null;
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
  const [vehicleSnapshot, vehiclesSnapshot] = await Promise.all([
    getDoc(vehicleRef),
    getDocs(query(getVehiclesCollection(uid), orderBy('updated_at', 'desc'))),
  ]);

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
