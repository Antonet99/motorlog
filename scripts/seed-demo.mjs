import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const firebasercPath = path.join(repoRoot, '.firebaserc');

const DEFAULT_UID = 'local-demo-user';
const DEFAULT_EMAIL = 'antoniobaio90@gmail.com';
const DEFAULT_PASSWORD = 'motorlog-local-demo';

function readProjectId() {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }

  const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));

  if (typeof firebaserc.projects?.default === 'string') {
    return firebaserc.projects.default;
  }

  throw new Error('Impossibile determinare il project id Firebase.');
}

function getRequiredPassword() {
  const password = process.env.VITE_LOCAL_AUTH_PASSWORD || DEFAULT_PASSWORD;

  if (password.length < 6) {
    throw new Error('La password demo locale deve avere almeno 6 caratteri.');
  }

  return password;
}

function getDemoEmail() {
  return process.env.VITE_LOCAL_AUTH_EMAIL || DEFAULT_EMAIL;
}

function getNow(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

function getDay(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60_000)
    .toISOString()
    .slice(0, 10);
}

async function replaceCollection(collectionRef, documents) {
  const existingSnapshot = await collectionRef.get();

  if (!existingSnapshot.empty) {
    const deleteBatch = db.batch();

    existingSnapshot.docs.forEach(document => {
      deleteBatch.delete(document.ref);
    });

    await deleteBatch.commit();
  }

  if (documents.length === 0) {
    return;
  }

  const writeBatch = db.batch();

  documents.forEach(document => {
    writeBatch.set(collectionRef.doc(document.id), document.data);
  });

  await writeBatch.commit();
}

process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';

const projectId = readProjectId();
const demoEmail = getDemoEmail();
const demoPassword = getRequiredPassword();

const app =
  getApps()[0] ||
  initializeApp({
    projectId,
  });

const auth = getAuth(app);
const db = getFirestore(app);

async function ensureDemoUser() {
  const createRequest = {
    uid: DEFAULT_UID,
    email: demoEmail,
    password: demoPassword,
    displayName: 'Motorlog Demo',
    emailVerified: true,
    disabled: false,
  };
  const updateRequest = {
    email: demoEmail,
    password: demoPassword,
    displayName: 'Motorlog Demo',
    emailVerified: true,
    disabled: false,
  };

  try {
    await auth.getUser(DEFAULT_UID);
    await auth.updateUser(DEFAULT_UID, updateRequest);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/user-not-found'
    ) {
      await auth.createUser(createRequest);
      return;
    }

    throw error;
  }
}

async function seedDemoVehicles() {
  const vehiclesCollection = db.collection(`users/${DEFAULT_UID}/vehicles`);

  await replaceCollection(vehiclesCollection, [
    {
      id: 'fiat-panda',
      data: {
        uid: DEFAULT_UID,
        name: 'Fiat Panda',
        nickname: 'Daily',
        vehicle_type: 'Auto',
        brand: 'Fiat',
        model: 'Panda',
        plate: 'GB123CD',
        year: 2019,
        color: 'Bianco',
        tank_capacity_liters: 35,
        fuel_type: 'Benzina',
        is_active: true,
        created_at: getNow(-180),
        updated_at: getNow(-30),
      },
    },
    {
      id: 'volkswagen-golf',
      data: {
        uid: DEFAULT_UID,
        name: 'Volkswagen Golf',
        nickname: null,
        vehicle_type: 'Auto',
        brand: 'Volkswagen',
        model: 'Golf',
        plate: 'FK456LM',
        year: 2017,
        color: 'Grigio',
        tank_capacity_liters: 50,
        fuel_type: 'Diesel',
        is_active: false,
        created_at: getNow(-120),
        updated_at: getNow(-60),
      },
    },
    {
      id: 'yamaha-xmax-300',
      data: {
        uid: DEFAULT_UID,
        name: 'Yamaha XMAX 300',
        nickname: 'Scooter citta',
        vehicle_type: 'Moto',
        brand: 'Yamaha',
        model: 'XMAX 300',
        plate: 'EA789FG',
        year: 2022,
        color: 'Blu',
        tank_capacity_liters: 13,
        fuel_type: 'Benzina',
        is_active: false,
        created_at: getNow(-90),
        updated_at: getNow(-90),
      },
    },
  ]);
}

async function seedDemoRefuels(userRef) {
  await replaceCollection(userRef.collection('refuels'), [
    {
      id: 'refuel-fiesta-daily',
      data: {
        uid: DEFAULT_UID,
        vehicle_id: 'fiat-panda',
        liters: 28.4,
        total_cost: 51.69,
        price_per_liter: 1.82,
        odometer_km: 48210,
        date: getDay(-3),
        is_full_tank: true,
        station: 'Eni',
        notes: 'Pieno prima del weekend',
        created_at: getNow(-72),
        updated_at: getNow(-72),
      },
    },
    {
      id: 'refuel-golf-diesel',
      data: {
        uid: DEFAULT_UID,
        vehicle_id: 'volkswagen-golf',
        liters: 36.1,
        total_cost: 63.72,
        price_per_liter: 1.765,
        odometer_km: 123540,
        date: getDay(-11),
        is_full_tank: false,
        station: 'Q8',
        notes: null,
        created_at: getNow(-180),
        updated_at: getNow(-180),
      },
    },
  ]);
}

async function seedDemoExpenses(userRef) {
  await replaceCollection(userRef.collection('expenses'), [
    {
      id: 'expense-insurance-panda',
      data: {
        uid: DEFAULT_UID,
        vehicle_id: 'fiat-panda',
        category: 'Assicurazione',
        amount: 418.5,
        date: getDay(-20),
        notes: 'Rinnovo annuale',
        created_at: getNow(-320),
        updated_at: getNow(-320),
      },
    },
    {
      id: 'expense-service-xmax',
      data: {
        uid: DEFAULT_UID,
        vehicle_id: 'yamaha-xmax-300',
        category: 'Tagliando',
        amount: 126,
        date: getDay(-6),
        notes: 'Cambio olio e filtro',
        created_at: getNow(-140),
        updated_at: getNow(-140),
      },
    },
    {
      id: 'expense-parking-panda',
      data: {
        uid: DEFAULT_UID,
        vehicle_id: 'fiat-panda',
        category: 'Parcheggio',
        amount: 14,
        date: getDay(-1),
        notes: 'Centro citta',
        created_at: getNow(-18),
        updated_at: getNow(-18),
      },
    },
  ]);
}

async function seedSupportingCollections() {
  const userRef = db.collection('users').doc(DEFAULT_UID);

  await userRef.set(
    {
      email: demoEmail,
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );

  await seedDemoRefuels(userRef);
  await seedDemoExpenses(userRef);
}

async function main() {
  await ensureDemoUser();
  await seedDemoVehicles();
  await seedSupportingCollections();

  console.log(
    `Demo locale pronta per ${demoEmail} su progetto ${projectId} con emulatori Auth (${process.env.FIREBASE_AUTH_EMULATOR_HOST}) e Firestore (${process.env.FIRESTORE_EMULATOR_HOST}).`,
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
