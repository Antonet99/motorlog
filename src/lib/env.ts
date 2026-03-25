const DEFAULT_FIRESTORE_EMULATOR_HOST = '127.0.0.1';
const DEFAULT_FIRESTORE_EMULATOR_PORT = 8080;
const DEFAULT_AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const DEFAULT_LOCAL_AUTH_EMAIL = 'antoniobaio90@gmail.com';

function getRequiredEnv(key: keyof ImportMetaEnv) {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${key}`);
  }

  return value;
}

function getOptionalEnv(key: keyof ImportMetaEnv) {
  return import.meta.env[key] || undefined;
}

function getNumberEnv(key: keyof ImportMetaEnv, fallback: number) {
  const value = import.meta.env[key];

  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const firebaseConfig = {
  apiKey: getRequiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getRequiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: getRequiredEnv('VITE_FIREBASE_APP_ID'),
  storageBucket: getOptionalEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getOptionalEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
};

export const isUsingFirebaseEmulators =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

export const firestoreEmulatorHost =
  import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST ||
  DEFAULT_FIRESTORE_EMULATOR_HOST;

export const firestoreEmulatorPort = getNumberEnv(
  'VITE_FIREBASE_FIRESTORE_EMULATOR_PORT',
  DEFAULT_FIRESTORE_EMULATOR_PORT,
);

export const authEmulatorUrl =
  import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || DEFAULT_AUTH_EMULATOR_URL;

export const localAuthEmail =
  import.meta.env.VITE_LOCAL_AUTH_EMAIL || DEFAULT_LOCAL_AUTH_EMAIL;

export const localAuthPassword =
  import.meta.env.VITE_LOCAL_AUTH_PASSWORD || '';
