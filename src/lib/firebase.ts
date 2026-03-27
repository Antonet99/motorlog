import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import {
  authEmulatorUrl,
  firebaseConfig,
  firestoreEmulatorHost,
  firestoreEmulatorPort,
  isUsingFirebaseEmulators,
  localAuthEmail,
  localAuthPassword,
} from './env';

export const ALLOWED_EMAILS = [
  'antoniobaio90@gmail.com',
  'matteomoretti927@gmail.com',
  'maopacmare@gmail.com',
] as const;
export const ACCESS_DENIED_MESSAGE =
  'Accesso consentito solo agli account autorizzati.';

const allowedEmailSet = new Set<string>(ALLOWED_EMAILS);

export function isAllowedEmail(email: string | null | undefined) {
  return typeof email === 'string' && allowedEmailSet.has(email);
}

function mapAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Errore durante l'accesso. Riprova.";
  }

  if (error.message === ACCESS_DENIED_MESSAGE) {
    return error.message;
  }

  const authError = error as Error & { code?: string };

  if (!authError.code) {
    return error.message || "Errore durante l'accesso. Riprova.";
  }

  if (authError.code === 'auth/operation-not-allowed') {
    return 'Google Sign-In non ancora abilitato nel progetto Firebase.';
  }

  if (authError.code === 'auth/unauthorized-domain') {
    return 'Dominio non autorizzato per il login Firebase.';
  }

  if (authError.code === 'auth/popup-blocked') {
    return 'Il browser ha bloccato la finestra Google. Consenti i popup e riprova.';
  }

  if (authError.code === 'auth/popup-closed-by-user') {
    return 'Accesso interrotto prima del completamento.';
  }

  if (
    isUsingFirebaseEmulators &&
    authError.code === 'auth/network-request-failed'
  ) {
    return 'Emulator Firebase non raggiungibile. Avvia auth e firestore in locale.';
  }

  if (
    isUsingFirebaseEmulators &&
    authError.code === 'auth/invalid-credential'
  ) {
    return 'Utente demo locale non pronto. Esegui il seed demo e riprova.';
  }

  return "Errore durante l'accesso. Riprova.";
}

declare global {
  interface Window {
    __motorlogEmulatorsConnected__?: boolean;
  }
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

if (isUsingFirebaseEmulators && !window.__motorlogEmulatorsConnected__) {
  connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
  connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
  window.__motorlogEmulatorsConnected__ = true;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  if (isUsingFirebaseEmulators) {
    await ensureLocalSession();
    return;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);

    if (!isAllowedEmail(result.user.email)) {
      await signOut(auth);
      throw new Error(ACCESS_DENIED_MESSAGE);
    }
  } catch (error) {
    const authError = error as Error & { code?: string };

    if (authError.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    throw error;
  }
}

export async function consumeRedirectResult() {
  if (isUsingFirebaseEmulators) {
    return null;
  }

  try {
    const result = await getRedirectResult(auth);

    if (!result) {
      return null;
    }

    if (!isAllowedEmail(result.user.email)) {
      await signOut(auth);
      throw new Error(ACCESS_DENIED_MESSAGE);
    }

    return null;
  } catch (error) {
    throw new Error(mapAuthErrorMessage(error));
  }
}

export async function ensureLocalSession() {
  if (!isUsingFirebaseEmulators) {
    return null;
  }

  if (!localAuthPassword) {
    throw new Error(
      'Password locale mancante. Configura VITE_LOCAL_AUTH_PASSWORD per l’emulator mode.',
    );
  }

  if (isAllowedEmail(auth.currentUser?.email) && auth.currentUser?.email === localAuthEmail) {
    return auth.currentUser;
  }

  try {
    const result = await signInWithEmailAndPassword(
      auth,
      localAuthEmail,
      localAuthPassword,
    );

    if (!isAllowedEmail(result.user.email)) {
      await signOut(auth);
      throw new Error(ACCESS_DENIED_MESSAGE);
    }

    return result.user;
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
