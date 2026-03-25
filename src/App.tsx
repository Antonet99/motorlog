import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  CarFront,
  ChevronDown,
  CircleDollarSign,
  Fuel,
  Home,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { AddEntryModal } from './components/AddEntryModal';
import { AuthScreen } from './components/AuthScreen';
import { BrandLogo } from './components/BrandLogo';
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
  createExpense,
  createRefuel,
  createVehicle,
  deleteExpense,
  deleteRefuel,
  deleteVehicle,
  getReadableDataError,
  setActiveVehicle,
  subscribeToExpenses,
  subscribeToRefuels,
  subscribeToVehicles,
  updateExpense,
  updateRefuel,
  updateVehicle,
} from './lib/data';
import { ExpensesSection } from './sections/ExpensesSection';
import { OverviewSection } from './sections/OverviewSection';
import { RefuelsSection } from './sections/RefuelsSection';
import { VehiclesSection } from './sections/VehiclesSection';
import type {
  AppTab,
  Expense,
  ExpenseInput,
  QuickAddType,
  Refuel,
  RefuelInput,
  Vehicle,
  VehicleInput,
} from './types/domain';

type ToastTone = 'success' | 'error' | 'info';

type ModalState =
  | { kind: 'vehicle'; mode: 'create' | 'edit'; vehicle?: Vehicle | null }
  | { kind: 'refuel'; mode: 'create' | 'edit'; refuel?: Refuel | null }
  | { kind: 'expense'; mode: 'create' | 'edit'; expense?: Expense | null }
  | null;

type PendingDeletion =
  | { kind: 'vehicle'; vehicle: Vehicle; timeoutId: number }
  | { kind: 'refuel'; refuel: Refuel; timeoutId: number }
  | { kind: 'expense'; expense: Expense; timeoutId: number };

interface ToastState {
  message: string;
  tone: ToastTone;
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

const SECTION_COPY: Record<AppTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Riepilogo',
    subtitle: "Garage, carburante e costi in un colpo d'occhio.",
  },
  vehicles: {
    title: 'Veicoli',
    subtitle: 'Auto e moto del tuo garage.',
  },
  refuels: {
    title: 'Rifornimenti',
    subtitle: 'Litri, costo e contachilometri dei tuoi pieni.',
  },
  expenses: {
    title: 'Spese',
    subtitle: 'Assicurazione, bollo e altre uscite del garage.',
  },
};

export default function App() {
  const hasAttemptedLocalSession = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isPreparingLocalMode, setIsPreparingLocalMode] = useState(
    isUsingFirebaseEmulators,
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isVehiclesReady, setIsVehiclesReady] = useState(false);
  const [isRefuelsReady, setIsRefuelsReady] = useState(false);
  const [isExpensesReady, setIsExpensesReady] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(
    null,
  );
  const [isShowingAllVehiclesData, setIsShowingAllVehiclesData] = useState(false);
  const [isSwitchingVehicle, setIsSwitchingVehicle] = useState(false);

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
      setRefuels([]);
      setExpenses([]);
      setIsVehiclesReady(false);
      setIsRefuelsReady(false);
      setIsExpensesReady(false);
      return;
    }

    const unsubscribeVehicles = subscribeToVehicles(
      user.uid,
      nextVehicles => {
        setVehicles(nextVehicles);
        setIsVehiclesReady(true);
      },
      error => {
        console.error('Error fetching vehicles', error);
        setToast({
          message: getReadableDataError(error),
          tone: 'error',
        });
      },
    );

    const unsubscribeRefuels = subscribeToRefuels(
      user.uid,
      nextRefuels => {
        setRefuels(nextRefuels);
        setIsRefuelsReady(true);
      },
      error => {
        console.error('Error fetching refuels', error);
        setToast({
          message: getReadableDataError(error),
          tone: 'error',
        });
      },
    );

    const unsubscribeExpenses = subscribeToExpenses(
      user.uid,
      nextExpenses => {
        setExpenses(nextExpenses);
        setIsExpensesReady(true);
      },
      error => {
        console.error('Error fetching expenses', error);
        setToast({
          message: getReadableDataError(error),
          tone: 'error',
        });
      },
    );

    return () => {
      unsubscribeVehicles();
      unsubscribeRefuels();
      unsubscribeExpenses();
    };
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
    const shouldLockScroll = isQuickAddOpen || modalState !== null;

    if (!shouldLockScroll) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isQuickAddOpen, modalState]);

  const visibleVehicles =
    pendingDeletion?.kind === 'vehicle'
      ? vehicles.filter(vehicle => vehicle.id !== pendingDeletion.vehicle.id)
      : vehicles;
  const visibleRefuels =
    pendingDeletion?.kind === 'refuel'
      ? refuels.filter(refuel => refuel.id !== pendingDeletion.refuel.id)
      : refuels;
  const visibleExpenses =
    pendingDeletion?.kind === 'expense'
      ? expenses.filter(expense => expense.id !== pendingDeletion.expense.id)
      : expenses;
  const activeVehicle =
    visibleVehicles.find(vehicle => vehicle.is_active) ?? visibleVehicles[0] ?? null;
  const sectionCopy = SECTION_COPY[activeTab];

  useEffect(() => {
    if (visibleVehicles.length <= 1 && isShowingAllVehiclesData) {
      setIsShowingAllVehiclesData(false);
    }
  }, [isShowingAllVehiclesData, visibleVehicles.length]);

  const filteredRefuels = useMemo(() => {
    if (isShowingAllVehiclesData || !activeVehicle) {
      return visibleRefuels;
    }

    return visibleRefuels.filter(refuel => refuel.vehicle_id === activeVehicle.id);
  }, [activeVehicle, isShowingAllVehiclesData, visibleRefuels]);

  const filteredExpenses = useMemo(() => {
    if (isShowingAllVehiclesData || !activeVehicle) {
      return visibleExpenses;
    }

    return visibleExpenses.filter(expense => expense.vehicle_id === activeVehicle.id);
  }, [activeVehicle, isShowingAllVehiclesData, visibleExpenses]);

  const closeModal = () => {
    setModalState(null);
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

  const handleSelectActiveVehicle = async (vehicleId: string) => {
    if (!user || !vehicleId) {
      return;
    }

    if (vehicleId === activeVehicle?.id) {
      setIsShowingAllVehiclesData(false);
      return;
    }

    setIsSwitchingVehicle(true);

    try {
      await setActiveVehicle(user.uid, vehicleId);
      setIsShowingAllVehiclesData(false);
      setToast({ message: 'Veicolo attivo aggiornato.', tone: 'success' });
    } catch (error) {
      console.error('Failed to switch active vehicle', error);
      setToast({ message: getReadableDataError(error), tone: 'error' });
    } finally {
      setIsSwitchingVehicle(false);
    }
  };

  const openCreateVehicleModal = () => {
    setModalState({ kind: 'vehicle', mode: 'create' });
    setActiveTab('vehicles');
  };

  const openCreateRefuelModal = () => {
    if (visibleVehicles.length === 0) {
      setToast({
        message: 'Aggiungi prima un veicolo.',
        tone: 'info',
      });
      return;
    }

    setModalState({ kind: 'refuel', mode: 'create' });
    setActiveTab('refuels');
  };

  const openCreateExpenseModal = () => {
    if (visibleVehicles.length === 0) {
      setToast({
        message: 'Aggiungi prima un veicolo.',
        tone: 'info',
      });
      return;
    }

    setModalState({ kind: 'expense', mode: 'create' });
    setActiveTab('expenses');
  };

  const handleCreateVehicle = async (input: VehicleInput) => {
    await createVehicle(input);
    setModalState(null);
    setActiveTab('vehicles');
    setToast({ message: 'Veicolo salvato.', tone: 'success' });
  };

  const handleUpdateVehicle = async (input: VehicleInput) => {
    if (modalState?.kind !== 'vehicle' || modalState.mode !== 'edit' || !modalState.vehicle) {
      return;
    }

    await updateVehicle(modalState.vehicle.id, input);
    setModalState(null);
    setToast({ message: 'Veicolo aggiornato.', tone: 'success' });
  };

  const handleCreateRefuel = async (input: RefuelInput) => {
    await createRefuel(input);
    setModalState(null);
    setActiveTab('refuels');
    setToast({ message: 'Rifornimento salvato.', tone: 'success' });
  };

  const handleUpdateRefuel = async (input: RefuelInput) => {
    if (modalState?.kind !== 'refuel' || modalState.mode !== 'edit' || !modalState.refuel) {
      return;
    }

    await updateRefuel(modalState.refuel.id, input);
    setModalState(null);
    setToast({ message: 'Rifornimento aggiornato.', tone: 'success' });
  };

  const handleCreateExpense = async (input: ExpenseInput) => {
    await createExpense(input);
    setModalState(null);
    setActiveTab('expenses');
    setToast({ message: 'Spesa salvata.', tone: 'success' });
  };

  const handleUpdateExpense = async (input: ExpenseInput) => {
    if (modalState?.kind !== 'expense' || modalState.mode !== 'edit' || !modalState.expense) {
      return;
    }

    await updateExpense(modalState.expense.id, input);
    setModalState(null);
    setToast({ message: 'Spesa aggiornata.', tone: 'success' });
  };

  const commitDeletion = async (deletion: PendingDeletion) => {
    try {
      if (deletion.kind === 'vehicle') {
        await deleteVehicle(deletion.vehicle.uid, deletion.vehicle.id);
        setToast({ message: 'Veicolo eliminato.', tone: 'info' });
      } else if (deletion.kind === 'refuel') {
        await deleteRefuel(deletion.refuel.uid, deletion.refuel.id);
        setToast({ message: 'Rifornimento eliminato.', tone: 'info' });
      } else {
        await deleteExpense(deletion.expense.uid, deletion.expense.id);
        setToast({ message: 'Spesa eliminata.', tone: 'info' });
      }
    } catch (error) {
      console.error('Failed to delete entry', error);
      setToast({ message: getReadableDataError(error), tone: 'error' });
    } finally {
      setPendingDeletion(current =>
        current?.timeoutId === deletion.timeoutId ? null : current,
      );
    }
  };

  const scheduleDeletion = async (nextDeletion: PendingDeletion) => {
    if (pendingDeletion) {
      window.clearTimeout(pendingDeletion.timeoutId);
      await commitDeletion(pendingDeletion);
    }

    setToast(null);
    setPendingDeletion(nextDeletion);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    setModalState(null);

    const timeoutId = window.setTimeout(() => {
      void commitDeletion({ kind: 'vehicle', vehicle, timeoutId });
    }, 4200);

    await scheduleDeletion({ kind: 'vehicle', vehicle, timeoutId });
  };

  const handleDeleteRefuel = async (refuel: Refuel) => {
    setModalState(null);

    const timeoutId = window.setTimeout(() => {
      void commitDeletion({ kind: 'refuel', refuel, timeoutId });
    }, 4200);

    await scheduleDeletion({ kind: 'refuel', refuel, timeoutId });
  };

  const handleDeleteExpense = async (expense: Expense) => {
    setModalState(null);

    const timeoutId = window.setTimeout(() => {
      void commitDeletion({ kind: 'expense', expense, timeoutId });
    }, 4200);

    await scheduleDeletion({ kind: 'expense', expense, timeoutId });
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
      openCreateVehicleModal();
      return;
    }

    if (type === 'refuel') {
      openCreateRefuelModal();
      return;
    }

    openCreateExpenseModal();
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
              viene usato l'account demo autorizzato{' '}
              <span className="font-medium text-slate-100">{localAuthEmail}</span>.
            </p>
            <p className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-400">
              {authError ||
                "Avvia auth e firestore in locale, poi lancia il seed demo per entrare direttamente nell'app."}
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
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] pb-[calc(6.85rem+env(safe-area-inset-bottom))] text-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/6 bg-slate-950/88 backdrop-blur">
        <div className="h-[env(safe-area-inset-top)]" />
        <div className="mx-auto max-w-md px-4 pb-3.5 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Motorlog
              </p>
              <h1 className="mt-1 text-[1.65rem] font-semibold tracking-tight text-white">
                {sectionCopy.title}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{sectionCopy.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              {isUsingFirebaseEmulators ? (
                <div className="rounded-full border border-sky-400/20 bg-sky-500/12 px-3 py-1.5 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                    Demo locale
                  </p>
                  <p className="text-xs font-medium text-sky-100">Emulator</p>
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

          {visibleVehicles.length > 0 ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[1.35rem] border border-white/8 bg-white/5 px-3 py-2.5">
                {activeVehicle ? (
                  <BrandLogo
                    brand={activeVehicle.brand}
                    vehicleType={activeVehicle.vehicle_type}
                    size="sm"
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-slate-950/70 text-slate-300">
                    <CarFront className="h-4 w-4" />
                  </span>
                )}
                <div className="relative min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Veicolo selezionato
                  </p>
                  <select
                    value={activeVehicle?.id ?? ''}
                    onChange={event => {
                      void handleSelectActiveVehicle(event.target.value);
                    }}
                    disabled={isSwitchingVehicle}
                    className="mt-1 w-full appearance-none bg-transparent pr-6 text-sm font-medium text-white outline-none disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    {visibleVehicles.map(vehicle => (
                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                        className="bg-slate-950 text-white"
                      >
                        {vehicle.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-[1.1rem] h-4 w-4 text-slate-500" />
                </div>
              </div>

              {visibleVehicles.length > 1 || isShowingAllVehiclesData ? (
                <button
                  type="button"
                  onClick={() =>
                    setIsShowingAllVehiclesData(current => !current)
                  }
                  className={`shrink-0 rounded-[1.15rem] border px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                    isShowingAllVehiclesData
                      ? 'border-sky-400/20 bg-sky-500/12 text-sky-100'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {isShowingAllVehiclesData ? 'Solo attivo' : 'Mostra tutto'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3.5 px-4 py-4">
        <div key={activeTab} className="section-enter">
          {activeTab === 'overview' ? (
            <OverviewSection
              vehicles={visibleVehicles}
              refuels={filteredRefuels}
              expenses={filteredExpenses}
              isShowingAllVehiclesData={isShowingAllVehiclesData}
            />
          ) : activeTab === 'vehicles' ? (
            <VehiclesSection
              vehicles={visibleVehicles}
              isLoading={!isVehiclesReady}
              onAddVehicle={openCreateVehicleModal}
              onEditVehicle={vehicle =>
                setModalState({ kind: 'vehicle', mode: 'edit', vehicle })
              }
            />
          ) : activeTab === 'refuels' ? (
            <RefuelsSection
              vehicles={visibleVehicles}
              refuels={filteredRefuels}
              isLoading={!isRefuelsReady}
              onAddRefuel={openCreateRefuelModal}
              onEditRefuel={refuel =>
                setModalState({ kind: 'refuel', mode: 'edit', refuel })
              }
            />
          ) : (
            <ExpensesSection
              vehicles={visibleVehicles}
              expenses={filteredExpenses}
              isLoading={!isExpensesReady}
              onAddExpense={openCreateExpenseModal}
              onEditExpense={expense =>
                setModalState({ kind: 'expense', mode: 'edit', expense })
              }
            />
          )}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-slate-950/92 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 px-3 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-2.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = item.tab === activeTab;

            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[1rem] px-1.5 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? item.activeClassName
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setIsQuickAddOpen(current => !current)}
        className="fixed bottom-[calc(5.35rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-slate-950 shadow-[0_18px_40px_rgba(14,165,233,0.35)] transition hover:bg-sky-400 active:scale-[0.97]"
      >
        {isQuickAddOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>

      {isQuickAddOpen ? (
        <>
          <button
            type="button"
            aria-label="Chiudi inserimento rapido"
            onClick={() => setIsQuickAddOpen(false)}
            className="quick-add-overlay z-20"
          />
          <div className="quick-add-enter fixed bottom-[calc(9.2rem+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end gap-2">
            {QUICK_ADD_OPTIONS.map(option => (
              <button
                key={option.type}
                type="button"
                onClick={() => handleQuickAddSelection(option.type)}
                className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:scale-[1.02] ${option.accentClassName}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {modalState?.kind === 'vehicle' ? (
        <AddEntryModal
          entryType="vehicle"
          uid={user.uid}
          mode={modalState.mode}
          vehicle={modalState.vehicle}
          onClose={closeModal}
          onDelete={
            modalState.mode === 'edit' && modalState.vehicle
              ? () => handleDeleteVehicle(modalState.vehicle)
              : undefined
          }
          onSubmit={
            modalState.mode === 'create' ? handleCreateVehicle : handleUpdateVehicle
          }
        />
      ) : null}

      {modalState?.kind === 'refuel' ? (
        <AddEntryModal
          entryType="refuel"
          uid={user.uid}
          mode={modalState.mode}
          refuel={modalState.refuel}
          vehicles={visibleVehicles}
          onClose={closeModal}
          onDelete={
            modalState.mode === 'edit' && modalState.refuel
              ? () => handleDeleteRefuel(modalState.refuel)
              : undefined
          }
          onSubmit={
            modalState.mode === 'create' ? handleCreateRefuel : handleUpdateRefuel
          }
        />
      ) : null}

      {modalState?.kind === 'expense' ? (
        <AddEntryModal
          entryType="expense"
          uid={user.uid}
          mode={modalState.mode}
          expense={modalState.expense}
          vehicles={visibleVehicles}
          onClose={closeModal}
          onDelete={
            modalState.mode === 'edit' && modalState.expense
              ? () => handleDeleteExpense(modalState.expense)
              : undefined
          }
          onSubmit={
            modalState.mode === 'create' ? handleCreateExpense : handleUpdateExpense
          }
        />
      ) : null}

      {pendingDeletion ? (
        <div className="fixed inset-x-4 bottom-[calc(5.8rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md">
          <div className="toast-enter flex items-center justify-between gap-3 rounded-3xl border border-white/8 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
            <span className="min-w-0 truncate">
              {pendingDeletion.kind === 'vehicle'
                ? 'Veicolo rimosso.'
                : pendingDeletion.kind === 'refuel'
                  ? 'Rifornimento rimosso.'
                  : 'Spesa rimossa.'}
            </span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed inset-x-4 top-[calc(1rem+env(safe-area-inset-top))] z-40 mx-auto max-w-md">
          <div
            className={`toast-enter rounded-3xl px-4 py-3 text-sm font-medium shadow-2xl ${
              toast.tone === 'error'
                ? 'bg-rose-500 text-white'
                : toast.tone === 'info'
                  ? 'bg-slate-100 text-slate-950'
                  : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}
