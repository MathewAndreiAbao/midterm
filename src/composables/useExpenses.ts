/**
 * useExpenses - the single place where the app talks to Firebase Firestore.
 *
 * This composable holds ALL FOUR CRUD operations:
 *
 *   CREATE  ->  addExpense()
 *   READ    ->  subscribe()  (live onSnapshot listener)
 *   UPDATE  ->  updateExpense()
 *   DELETE  ->  deleteExpense()
 *
 * Every page imports this one file, so the pages stay focused on the UI and
 * none of them contain Firestore code.
 */
import { computed, ref } from 'vue';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { EXPENSES_COLLECTION, getDb, isFirebaseConfigured } from '@/firebase';
import type { Expense, ExpenseInput } from '@/types/expense';

// These refs live at module level so every component shares the SAME list.
// One Firestore listener feeds the whole application.
const expenses = ref<Expense[]>([]);
const loading = ref<boolean>(true);
const errorMessage = ref<string>('');

let unsubscribe: Unsubscribe | null = null;

/** Convert a raw Firestore document into our Expense type. */
function toExpense(id: string, data: Record<string, unknown>): Expense {
  return {
    id,
    name: String(data.name ?? ''),
    amount: Number(data.amount ?? 0),
    category: String(data.category ?? 'others'),
    date: String(data.date ?? ''),
    notes: String(data.notes ?? ''),
    createdAt:
      data.createdAt && typeof (data.createdAt as { toMillis?: () => number }).toMillis === 'function'
        ? (data.createdAt as { toMillis: () => number }).toMillis()
        : undefined,
  };
}

export function useExpenses() {
  /**
   * READ - opens a real-time listener on the "expenses" collection.
   *
   * onSnapshot fires once immediately with the current data and then again
   * every time a document is added, changed or removed - which is why the
   * list updates by itself after a save or a delete.
   */
  function subscribe(): void {
    if (unsubscribe) return; // already listening

    if (!isFirebaseConfigured) {
      loading.value = false;
      errorMessage.value =
        'Firebase is not configured yet. Copy .env.example to .env, paste your Firebase keys and restart the dev server.';
      return;
    }

    loading.value = true;
    const q = query(collection(getDb(), EXPENSES_COLLECTION), orderBy('date', 'desc'));

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        expenses.value = snapshot.docs.map((d) => toExpense(d.id, d.data()));
        loading.value = false;
        errorMessage.value = '';
      },
      (error) => {
        loading.value = false;
        errorMessage.value = `Could not read expenses: ${error.message}`;
        console.error('[useExpenses] snapshot error', error);
      },
    );
  }

  /** Detach the listener (called when the app is torn down). */
  function unsubscribeAll(): void {
    unsubscribe?.();
    unsubscribe = null;
  }

  /** CREATE - add one new expense document to Firestore. */
  async function addExpense(input: ExpenseInput): Promise<void> {
    await addDoc(collection(getDb(), EXPENSES_COLLECTION), {
      ...input,
      amount: Number(input.amount),
      createdAt: serverTimestamp(),
    });
  }

  /** UPDATE - overwrite the editable fields of an existing document. */
  async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
    await updateDoc(doc(getDb(), EXPENSES_COLLECTION, id), {
      ...input,
      amount: Number(input.amount),
    });
  }

  /** DELETE - remove one document permanently. */
  async function deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(getDb(), EXPENSES_COLLECTION, id));
  }

  /** Grand total of every expense currently loaded. */
  const total = computed(() =>
    expenses.value.reduce((sum, expense) => sum + expense.amount, 0),
  );

  /** Total for the current calendar month. */
  const monthTotal = computed(() => {
    const prefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    return expenses.value
      .filter((expense) => expense.date.startsWith(prefix))
      .reduce((sum, expense) => sum + expense.amount, 0);
  });

  /** { categoryId: total } used by the Summary page. */
  const totalsByCategory = computed<Record<string, number>>(() => {
    const totals: Record<string, number> = {};
    for (const expense of expenses.value) {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    }
    return totals;
  });

  return {
    expenses,
    loading,
    errorMessage,
    total,
    monthTotal,
    totalsByCategory,
    subscribe,
    unsubscribeAll,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}

/** Format a number as Philippine pesos, e.g. 1234.5 -> "₱1,234.50". */
export function formatPeso(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value || 0);
}

/** Format "2026-09-13" as "Sep 13, 2026". */
export function formatDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format a number with no currency symbol, e.g. 1234.5 -> "1,234.50". */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

/** The peso sign, kept separate so it can be styled smaller than the digits. */
export const PESO = '₱';

/** Heading for a group of expenses: "Today", "Yesterday" or "Sep 13, 2026". */
export function formatDayLabel(iso: string): string {
  if (!iso) return 'No date';

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return iso;

  const diffDays = Math.round(
    (startOfDay(target).getTime() - startOfDay(new Date()).getTime()) / 86_400_000,
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  return formatDate(iso);
}

/** "September 2026" - used as the label under the running total. */
export function formatMonthLabel(date = new Date()): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
