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
import type { WriteBatch } from 'firebase/firestore';
import { db } from './firebase';
import type {
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ExpenseRecurrenceIntervalMonths,
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
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Rata',
  'Assicurazione',
  'Bollo',
  'Revisione',
  'Tagliando',
  'Meccanico',
  'Pedaggio',
  'Parcheggio',
  'Multa',
  'Accessori',
  'Altro',
];
const EXPENSE_RECURRENCE_INTERVALS: ExpenseRecurrenceIntervalMonths[] = [
  1,
  2,
  3,
  6,
  12,
];

function getVehiclesCollection(uid: string) {
  return collection(db, `users/${uid}/vehicles`);
}

function getRefuelsCollection(uid: string) {
  return collection(db, `users/${uid}/refuels`);
}

function getExpensesCollection(uid: string) {
  return collection(db, `users/${uid}/expenses`);
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

function isOptionalFuelType(value: unknown): value is FuelType | null {
  return value === null || isFuelType(value);
}

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return (
    typeof value === 'string' &&
    EXPENSE_CATEGORIES.includes(value as ExpenseCategory)
  );
}

function isExpenseRecurrenceIntervalMonths(
  value: unknown,
): value is ExpenseRecurrenceIntervalMonths {
  return (
    typeof value === 'number' &&
    EXPENSE_RECURRENCE_INTERVALS.includes(
      value as ExpenseRecurrenceIntervalMonths,
    )
  );
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

function buildVehicleDisplayName(input: {
  nickname: string | null;
  vehicle_type: VehicleType;
  brand: string | null;
  model: string | null;
  plate: string | null;
}) {
  const primaryLabel = buildVehicleName(input.brand ?? '', input.model ?? '');
  return (input.nickname ?? primaryLabel) || input.plate || input.vehicle_type;
}

function normalizePlate(value: string | null) {
  return value ? value.trim().toUpperCase() : null;
}

function sanitizeVehicleInput(input: VehicleInput) {
  const brand = asOptionalString(input.brand);
  const model = asOptionalString(input.model);
  const nickname = asOptionalString(input.nickname);
  const plate = normalizePlate(input.plate);
  const color = asOptionalString(input.color);
  const tankCapacity =
    input.tank_capacity_liters === null
      ? null
      : Number(input.tank_capacity_liters.toFixed(2));

  return {
    uid: input.uid,
    nickname,
    vehicle_type: input.vehicle_type,
    brand,
    model,
    plate,
    year: input.year,
    color,
    tank_capacity_liters: tankCapacity,
    fuel_type: input.fuel_type,
    is_active: input.is_active,
    name: buildVehicleDisplayName({
      nickname,
      vehicle_type: input.vehicle_type,
      brand,
      model,
      plate,
    }),
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

function sanitizeExpenseInput(input: ExpenseInput) {
  const baseExpense = {
    uid: input.uid,
    vehicle_id: input.vehicle_id,
    category: input.category,
    amount: Number(input.amount.toFixed(2)),
    date: input.date,
    notes: asOptionalString(input.notes),
  };

  if (!input.is_recurring || input.recurrence_interval_months === null) {
    return baseExpense;
  }

  return {
    ...baseExpense,
    is_recurring: true,
    recurrence_interval_months: input.recurrence_interval_months,
  };
}

function parseVehicle(id: string, value: unknown): Vehicle | null {
  if (!isRecord(value)) {
    return null;
  }

  const nickname = asOptionalString(value.nickname);
  const brand = asOptionalString(value.brand);
  const model = asOptionalString(value.model);
  const plate = asOptionalString(value.plate);
  const color = asOptionalString(value.color);
  const year = value.year === null ? null : asOptionalInteger(value.year);
  const tankCapacity =
    value.tank_capacity_liters === null
      ? null
      : asPositiveNumber(value.tank_capacity_liters);

  if (
    typeof value.uid !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.is_active !== 'boolean' ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string' ||
    !isVehicleType(value.vehicle_type) ||
    !isOptionalFuelType(value.fuel_type)
  ) {
    return null;
  }

  return {
    id,
    uid: value.uid,
    name: value.name,
    nickname,
    vehicle_type: value.vehicle_type,
    brand,
    model,
    plate,
    year,
    color,
    tank_capacity_liters: tankCapacity,
    fuel_type: value.fuel_type ?? null,
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

function parseExpense(id: string, value: unknown): Expense | null {
  if (!isRecord(value)) {
    return null;
  }

  const amount = asPositiveNumber(value.amount);
  const date = asDayString(value.date);

  if (
    typeof value.uid !== 'string' ||
    typeof value.vehicle_id !== 'string' ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string' ||
    (value.is_recurring !== undefined && typeof value.is_recurring !== 'boolean') ||
    (value.recurrence_interval_months !== undefined &&
      value.recurrence_interval_months !== null &&
      !isExpenseRecurrenceIntervalMonths(value.recurrence_interval_months)) ||
    !isExpenseCategory(value.category) ||
    amount === null ||
    date === null
  ) {
    return null;
  }

  return {
    id,
    uid: value.uid,
    vehicle_id: value.vehicle_id,
    category: value.category,
    amount,
    date,
    is_recurring: value.is_recurring === true,
    recurrence_interval_months: isExpenseRecurrenceIntervalMonths(
      value.recurrence_interval_months,
    )
      ? value.recurrence_interval_months
      : null,
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

export function subscribeToExpenses(
  uid: string,
  onData: (expenses: Expense[]) => void,
  onError?: (error: Error) => void,
) {
  const expensesQuery = query(getExpensesCollection(uid), orderBy('date', 'desc'));

  return onSnapshot(
    expensesQuery,
    snapshot => {
      const nextExpenses = snapshot.docs
        .map(document => parseExpense(document.id, document.data()))
        .filter((expense): expense is Expense => expense !== null);

      onData(nextExpenses);
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
    name: buildVehicleDisplayName(normalizedInput),
    created_at: currentVehicle.created_at,
    updated_at: now,
  });

  await batch.commit();
}

export async function setActiveVehicle(uid: string, vehicleId: string) {
  const vehiclesSnapshot = await getDocs(
    query(getVehiclesCollection(uid), orderBy('updated_at', 'desc')),
  );

  if (vehiclesSnapshot.empty) {
    return;
  }

  let hasTarget = false;
  let hasChanges = false;
  const now = new Date().toISOString();
  const batch = writeBatch(db);

  vehiclesSnapshot.docs.forEach(document => {
    const isTarget = document.id === vehicleId;
    const isCurrentlyActive = document.data().is_active === true;

    if (isTarget) {
      hasTarget = true;
    }

    if (isCurrentlyActive !== isTarget) {
      hasChanges = true;
      batch.update(document.ref, {
        is_active: isTarget,
        updated_at: now,
      });
    }
  });

  if (!hasTarget) {
    throw new Error('Veicolo non trovato.');
  }

  if (!hasChanges) {
    return;
  }

  await batch.commit();
}

export async function deleteVehicle(uid: string, vehicleId: string) {
  const vehicleRef = doc(getVehiclesCollection(uid), vehicleId);
  const [
    vehicleSnapshot,
    vehiclesSnapshot,
    linkedRefuelsSnapshot,
    linkedExpensesSnapshot,
  ] = await Promise.all([
    getDoc(vehicleRef),
    getDocs(query(getVehiclesCollection(uid), orderBy('updated_at', 'desc'))),
    getDocs(query(getRefuelsCollection(uid), where('vehicle_id', '==', vehicleId))),
    getDocs(query(getExpensesCollection(uid), where('vehicle_id', '==', vehicleId))),
  ]);

  const operations: Array<(batch: WriteBatch) => void> = [];
  const deletedRefuelsCount = linkedRefuelsSnapshot.size;
  const deletedExpensesCount = linkedExpensesSnapshot.size;

  linkedRefuelsSnapshot.docs.forEach(documentSnapshot => {
    operations.push(batch => {
      batch.delete(documentSnapshot.ref);
    });
  });

  linkedExpensesSnapshot.docs.forEach(documentSnapshot => {
    operations.push(batch => {
      batch.delete(documentSnapshot.ref);
    });
  });

  if (vehicleSnapshot.exists()) {
    const currentVehicle = parseVehicle(vehicleSnapshot.id, vehicleSnapshot.data());

    if (currentVehicle) {
      const allVehicles = vehiclesSnapshot.docs
        .map(document => parseVehicle(document.id, document.data()))
        .filter((vehicle): vehicle is Vehicle => vehicle !== null);
      const fallbackVehicle = chooseFallbackVehicle(allVehicles, vehicleId);
      const now = new Date().toISOString();

      if (currentVehicle.is_active && fallbackVehicle) {
        operations.push(batch => {
          batch.update(doc(getVehiclesCollection(uid), fallbackVehicle.id), {
            is_active: true,
            updated_at: now,
          });
        });
      }
    }

    operations.push(batch => {
      batch.delete(vehicleRef);
    });
  }

  if (operations.length === 0) {
    return {
      deletedRefuelsCount,
      deletedExpensesCount,
    };
  }

  for (let index = 0; index < operations.length; index += 450) {
    const batch = writeBatch(db);
    operations.slice(index, index + 450).forEach(operation => {
      operation(batch);
    });
    await batch.commit();
  }

  return {
    deletedRefuelsCount,
    deletedExpensesCount,
  };
}

export async function createRefuel(input: RefuelInput) {
  await ensureVehicleExists(input.uid, input.vehicle_id);

  const now = new Date().toISOString();
  const refuelRef = doc(getRefuelsCollection(input.uid));
  const normalizedInput = sanitizeRefuelInput(input);
  const batch = writeBatch(db);

  batch.set(refuelRef, {
    ...normalizedInput,
    created_at: now,
    updated_at: now,
  });

  await batch.commit();
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

  const batch = writeBatch(db);

  batch.update(refuelRef, {
    ...sanitizeRefuelInput(input),
    uid: currentRefuel.uid,
    created_at: currentRefuel.created_at,
    updated_at: new Date().toISOString(),
  });

  await batch.commit();
}

export async function deleteRefuel(uid: string, refuelId: string) {
  await deleteDoc(doc(getRefuelsCollection(uid), refuelId));
}

export async function createExpense(input: ExpenseInput) {
  await ensureVehicleExists(input.uid, input.vehicle_id);

  const now = new Date().toISOString();
  const expenseRef = doc(getExpensesCollection(input.uid));
  const batch = writeBatch(db);

  batch.set(expenseRef, {
    ...sanitizeExpenseInput(input),
    created_at: now,
    updated_at: now,
  });

  await batch.commit();
}

export async function updateExpense(expenseId: string, input: ExpenseInput) {
  await ensureVehicleExists(input.uid, input.vehicle_id);

  const expenseRef = doc(getExpensesCollection(input.uid), expenseId);
  const expenseSnapshot = await getDoc(expenseRef);

  if (!expenseSnapshot.exists()) {
    throw new Error('Spesa non trovata.');
  }

  const currentExpense = parseExpense(expenseSnapshot.id, expenseSnapshot.data());

  if (!currentExpense) {
    throw new Error('Dati spesa non validi.');
  }

  const batch = writeBatch(db);

  batch.update(expenseRef, {
    ...sanitizeExpenseInput(input),
    uid: currentExpense.uid,
    created_at: currentExpense.created_at,
    updated_at: new Date().toISOString(),
  });

  await batch.commit();
}

export async function deleteExpense(uid: string, expenseId: string) {
  await deleteDoc(doc(getExpensesCollection(uid), expenseId));
}
