import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const ALLOWED_EMAIL = 'antoniobaio90@gmail.com';
export const ACCESS_DENIED_MESSAGE =
  'Accesso consentito solo a antoniobaio90@gmail.com.';

function getRequiredEnv(key: keyof ImportMetaEnv) {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${key}`);
  }

  return value;
}

function mapAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Errore durante l'accesso. Riprova.";
  }

  if (error.message === ACCESS_DENIED_MESSAGE) {
    return error.message;
  }

  const authError = error as Error & { code?: string };

  if (authError.code === 'auth/operation-not-allowed') {
    return 'Google Sign-In non ancora abilitato nel progetto Firebase.';
  }

  if (authError.code === 'auth/unauthorized-domain') {
    return 'Dominio non autorizzato per il login Firebase.';
  }

  return "Errore durante l'accesso. Riprova.";
}

const firebaseConfig = {
  apiKey: getRequiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getRequiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: getRequiredEnv('VITE_FIREBASE_APP_ID'),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  await signInWithRedirect(auth, googleProvider);
}

export async function consumeRedirectResult() {
  try {
    const result = await getRedirectResult(auth);

    if (!result) {
      return null;
    }

    if (result.user.email !== ALLOWED_EMAIL) {
      await signOut(auth);
      throw new Error(ACCESS_DENIED_MESSAGE);
    }

    return null;
  } catch (error) {
    throw new Error(mapAuthErrorMessage(error));
  }
}

export async function logOut() {
  await signOut(auth);
}

export function getReadableAuthError(error: unknown) {
  return mapAuthErrorMessage(error);
}
