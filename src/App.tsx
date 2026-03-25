import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  CarFront,
  CircleDollarSign,
  Fuel,
  Home,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { AddEntryModal } from './components/AddEntryModal';
import { AuthScreen } from './components/AuthScreen';
import { isUsingFirebaseEmulators, localAuthEmail } from './lib/env';
import {
  ACCESS_DENIED_MESSAGE,
  ALLOWED_EMAIL,
  auth,
  consumeRedirectResult,
  ensureLocalSession,
  getReadableAuthError,
  logOut,
  signInWithGoogle,
} from './lib/firebase';
import {
  createVehicle,
  deleteVehicle,
  subscribeToVehicles,
  updateVehicle,
} from './lib/data';
import { ExpensesSection } from './sections/ExpensesSection';
import { OverviewSection } from './sections/OverviewSection';
import { RefuelsSection } from './sections/RefuelsSection';
import { VehiclesSection } from './sections/VehiclesSection';
import type {
  AppTab,
  QuickAddType,
  Vehicle,
  VehicleInput,
} from './types/domain';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  tone: ToastTone;
}

interface PendingDeletion {
  vehicle: Vehicle;
  timeoutId: number;
}

const NAV_ITEMS: Array<{
  tab: AppTab;
  label: string;
  icon: typeof Home;
  activeClassName: string;
}> = [
  {
    tab: 'overview',
    label: 'Riepilogo',
    icon: Home,
    activeClassName: 'bg-sky-500/14 text-sky-200',
  },
  {
    tab: 'vehicles',
    label: 'Veicoli',
    icon: CarFront,
    activeClassName: 'bg-sky-500/14 text-sky-200',
  },
  {
    tab: 'refuels',
    label: 'Rifornimenti',
    icon: Fuel,
    activeClassName: 'bg-emerald-500/14 text-emerald-200',
  },
  {
    tab: 'expenses',
    label: 'Spese',
    icon: CircleDollarSign,
    activeClassName: 'bg-amber-500/14 text-amber-200',
  },
];

const QUICK_ADD_OPTIONS: Array<{
  type: QuickAddType;
  label: string;
  accentClassName: string;
}> = [
  {
    type: 'vehicle',
    label: 'Veicolo',
    accentClassName:
      'border-sky-400/20 bg-sky-500/12 text-sky-100 shadow-[0_12px_30px_rgba(14,165,233,0.14)]',
  },
  {
    type: 'refuel',
    label: 'Rifornimento',
    accentClassName:
      'border-emerald-400/20 bg-emerald-500/12 text-emerald-100 shadow-[0_12px_30px_rgba(16,185,129,0.14)]',
  },
  {
    type: 'expense',
    label: 'Spesa',
    accentClassName:
      'border-amber-400/20 bg-amber-500/12 text-amber-100 shadow-[0_12px_30px_rgba(245,158,11,0.14)]',
  },
];

function getSectionCopy(activeTab: AppTab) {
  if (activeTab === 'vehicles') {
    return {
      eyebrow: 'Garage',
      title: 'Veicoli',
      description: 'Ancore principali dell’app e base del primo slice utile.',
    };
  }

  if (activeTab === 'refuels') {
    return {
      eyebrow: 'Cronologia',
      title: 'Rifornimenti',
      description: 'Shell pronta per il prossimo step di tracking carburante.',
    };
  }

  if (activeTab === 'expenses') {
    return {
      eyebrow: 'Costi',
      title: 'Spese',
      description: 'Placeholder già integrato nella shell mobile-first.',
    };
  }

  return {
    eyebrow: 'Dashboard',
    title: 'Riepilogo',
    description: 'Base del progetto pronta, con Firebase e CRUD veicoli.',
  };
}

function getToastClassName(tone: ToastTone) {
  if (tone === 'error') {
    return 'bg-rose-500 text-white';
  }

  if (tone === 'info') {
    return 'bg-slate-100 text-slate-950';
  }

  return 'bg-emerald-500 text-slate-950';
}

export default function App() {
  const hasAttemptedLocalSession = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isPreparingLocalMode, setIsPreparingLocalMode] = useState(
    isUsingFirebaseEmulators,
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isVehiclesReady, setIsVehiclesReady] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(
    null,
  );

  useEffect(() => {
    void consumeRedirectResult().catch(error => {
      setAuthError(getReadableAuthError(error));
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      if (currentUser && currentUser.email !== ALLOWED_EMAIL) {
        setUser(null);
        setAuthError(ACCESS_DENIED_MESSAGE);
        setIsAuthReady(true);
        void logOut();
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        setAuthError(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isUsingFirebaseEmulators || !isAuthReady) {
      return;
    }

    if (user) {
      setIsPreparingLocalMode(false);
      return;
    }

    if (hasAttemptedLocalSession.current) {
      setIsPreparingLocalMode(false);
      return;
    }

    hasAttemptedLocalSession.current = true;
    setIsPreparingLocalMode(true);

    void ensureLocalSession()
      .catch(error => {
        console.error('Failed to bootstrap local session', error);
        setAuthError(getReadableAuthError(error));
      })
      .finally(() => {
        setIsPreparingLocalMode(false);
      });
  }, [isAuthReady, user]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setVehicles([]);
      setIsVehiclesReady(false);
      return;
    }

    const unsubscribe = subscribeToVehicles(
      user.uid,
      nextVehicles => {
        setVehicles(nextVehicles);
        setIsVehiclesReady(true);
      },
      error => {
        console.error('Error fetching vehicles', error);
        setToast({
          message: 'Errore durante il caricamento dei veicoli.',
          tone: 'error',
        });
      },
    );

    return () => unsubscribe();
  }, [isAuthReady, user]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (pendingDeletion) {
        window.clearTimeout(pendingDeletion.timeoutId);
      }
    };
  }, [pendingDeletion]);

  useEffect(() => {
    const shouldLockScroll =
      isQuickAddOpen || isVehicleModalOpen || editingVehicle !== null;

    if (!shouldLockScroll) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingVehicle, isQuickAddOpen, isVehicleModalOpen]);

  const visibleVehicles =
    pendingDeletion === null
      ? vehicles
      : vehicles.filter(vehicle => vehicle.id !== pendingDeletion.vehicle.id);
  const activeVehicle = visibleVehicles.find(vehicle => vehicle.is_active) ?? null;
  const sectionCopy = useMemo(() => getSectionCopy(activeTab), [activeTab]);

  const closeVehicleModal = () => {
    setEditingVehicle(null);
    setIsVehicleModalOpen(false);
  };

  const handleSignIn = async () => {
    setAuthError(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in', error);
      setAuthError(getReadableAuthError(error));
    }
  };

  const handleLogOut = async () => {
    setAuthError(null);
    await logOut();
  };

  const handleRetryLocalMode = async () => {
    setAuthError(null);
    setIsPreparingLocalMode(true);

    try {
      await ensureLocalSession();
    } catch (error) {
      console.error('Failed to reconnect local mode', error);
      setAuthError(getReadableAuthError(error));
    } finally {
      setIsPreparingLocalMode(false);
    }
  };

  const handleCreateVehicle = async (input: VehicleInput) => {
    await createVehicle(input);
    setIsVehicleModalOpen(false);
    setActiveTab('vehicles');
    setToast({ message: 'Veicolo salvato.', tone: 'success' });
  };

  const handleUpdateVehicle = async (input: VehicleInput) => {
    if (!editingVehicle) {
      return;
    }

    await updateVehicle(editingVehicle.id, input);
    setEditingVehicle(null);
    setToast({ message: 'Veicolo aggiornato.', tone: 'success' });
  };

  const commitDeletion = async (vehicle: Vehicle) => {
    try {
      await deleteVehicle(vehicle.uid, vehicle.id);
      setToast({ message: 'Veicolo eliminato.', tone: 'info' });
    } catch (error) {
      console.error('Failed to delete vehicle', error);
      setToast({ message: 'Errore durante la cancellazione.', tone: 'error' });
    } finally {
      setPendingDeletion(current =>
        current?.vehicle.id === vehicle.id ? null : current,
      );
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (pendingDeletion) {
      window.clearTimeout(pendingDeletion.timeoutId);
      await commitDeletion(pendingDeletion.vehicle);
    }

    const timeoutId = window.setTimeout(() => {
      void commitDeletion(vehicle);
    }, 4200);

    setEditingVehicle(null);
    setToast(null);
    setPendingDeletion({ vehicle, timeoutId });
  };

  const handleUndoDelete = () => {
    if (!pendingDeletion) {
      return;
    }

    window.clearTimeout(pendingDeletion.timeoutId);
    setPendingDeletion(null);
    setToast({ message: 'Cancellazione annullata.', tone: 'success' });
  };

  const handleQuickAddSelection = (type: QuickAddType) => {
    setIsQuickAddOpen(false);

    if (type === 'vehicle') {
      setEditingVehicle(null);
      setIsVehicleModalOpen(true);
      setActiveTab('vehicles');
      return;
    }

    setToast({
      message:
        type === 'refuel'
          ? 'Rifornimenti in arrivo nel prossimo slice.'
          : 'Spese in arrivo nel prossimo slice.',
      tone: 'info',
    });
  };

  if (!isAuthReady || (isUsingFirebaseEmulators && !user && isPreparingLocalMode)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-800 border-t-sky-400" />
          {isUsingFirebaseEmulators ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
                Demo locale
              </p>
              <p className="text-sm text-slate-400">
                Connessione agli emulatori Firebase in corso.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!user) {
    if (isUsingFirebaseEmulators) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.1),_transparent_36%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] px-6 py-10 text-slate-50">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/8 bg-slate-950/78 p-6 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Demo locale
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Motorlog in locale
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Modalita rapida con Firebase Emulator Suite. Nessun login Google:
              viene usato l&apos;account demo autorizzato{' '}
              <span className="font-medium text-slate-100">{localAuthEmail}</span>.
            </p>
            <p className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-400">
              {authError ||
                'Avvia auth e firestore in locale, poi lancia il seed demo per entrare direttamente nell’app.'}
            </p>
            <button
              type="button"
              onClick={() => {
                void handleRetryLocalMode();
              }}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Riprova connessione locale
            </button>
          </div>
        </div>
      );
    }

    return <AuthScreen onSignIn={handleSignIn} errorMessage={authError} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] pb-[calc(7.75rem+env(safe-area-inset-bottom))] text-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/6 bg-slate-950/88 backdrop-blur">
        <div className="h-[env(safe-area-inset-top)]" />
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {sectionCopy.eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              {sectionCopy.title}
            </h1>
            <p className="mt-1 truncate text-sm text-slate-400">
              {sectionCopy.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isUsingFirebaseEmulators ? (
              <div className="rounded-full border border-sky-400/20 bg-sky-500/12 px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                  Demo locale
                </p>
                <p className="max-w-[7.5rem] truncate text-sm font-medium text-sky-100">
                  Emulator
                </p>
              </div>
            ) : null}
            {activeVehicle ? (
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-right sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Attivo
                </p>
                <p className="max-w-[7.5rem] truncate text-sm font-medium text-white">
                  {activeVehicle.name}
                </p>
              </div>
            ) : null}
            {isUsingFirebaseEmulators ? null : (
              <button
                type="button"
                onClick={handleLogOut}
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10"
                title="Esci"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-4">
        <div key={activeTab} className="section-enter">
          {activeTab === 'overview' ? (
            <OverviewSection vehicles={visibleVehicles} />
          ) : activeTab === 'vehicles' ? (
            <VehiclesSection
              vehicles={visibleVehicles}
              isLoading={!isVehiclesReady}
              onAddVehicle={() => {
                setEditingVehicle(null);
                setIsVehicleModalOpen(true);
              }}
              onEditVehicle={vehicle => setEditingVehicle(vehicle)}
            />
          ) : activeTab === 'refuels' ? (
            <RefuelsSection />
          ) : (
            <ExpensesSection />
          )}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-slate-950/92 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 px-3 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = item.tab === activeTab;

            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? item.activeClassName
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setIsQuickAddOpen(current => !current)}
        className="fixed bottom-[calc(5.85rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-slate-950 shadow-[0_18px_40px_rgba(14,165,233,0.35)] transition hover:bg-sky-400 active:scale-[0.97]"
      >
        {isQuickAddOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {isQuickAddOpen ? (
        <>
          <button
            type="button"
            aria-label="Chiudi inserimento rapido"
            onClick={() => setIsQuickAddOpen(false)}
            className="quick-add-overlay z-20"
          />
          <div className="quick-add-enter fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end gap-2">
            {QUICK_ADD_OPTIONS.map(option => (
              <button
                key={option.type}
                type="button"
                onClick={() => handleQuickAddSelection(option.type)}
                className={`rounded-full border px-5 py-3 text-base font-semibold transition hover:scale-[1.02] ${option.accentClassName}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {isVehicleModalOpen ? (
        <AddEntryModal
          uid={user.uid}
          mode="create"
          onClose={closeVehicleModal}
          onSubmit={handleCreateVehicle}
        />
      ) : null}

      {editingVehicle ? (
        <AddEntryModal
          uid={user.uid}
          mode="edit"
          vehicle={editingVehicle}
          onClose={closeVehicleModal}
          onDelete={() => handleDeleteVehicle(editingVehicle)}
          onSubmit={handleUpdateVehicle}
        />
      ) : null}

      {pendingDeletion ? (
        <div className="fixed inset-x-4 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md">
          <div className="toast-enter flex items-center justify-between gap-3 rounded-3xl border border-white/8 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
            <span className="min-w-0 truncate">Veicolo rimosso.</span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md">
          <div
            className={`toast-enter rounded-3xl px-4 py-3 text-sm font-semibold shadow-2xl ${getToastClassName(
              toast.tone,
            )}`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
