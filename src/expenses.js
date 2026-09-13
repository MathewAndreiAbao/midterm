// ---------------------------------------------------------------------------
// expenses.js
//
// This is the most important file in the project. It holds the list of
// expenses and the FOUR CRUD functions that talk to Firebase:
//
//     CREATE  ->  addExpense()
//     READ    ->  startListening()
//     UPDATE  ->  updateExpense()
//     DELETE  ->  deleteExpense()
//
// The pages do not talk to Firebase at all. They import from this file.
// ---------------------------------------------------------------------------
import { ref, computed } from 'vue';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseReady } from './firebase.js';

// The name of our collection (table) inside Firestore.
const COLLECTION_NAME = 'expenses';

// ---------------------------------------------------------------------------
// Shared data
//
// "ref" makes a value reactive: when it changes, every page that uses it
// redraws by itself. These are declared outside any function, so all the
// pages share the same three values.
// ---------------------------------------------------------------------------

export const expenses = ref([]); // the list of all expenses
export const loading = ref(true); // true while we are waiting for Firebase
export const errorMessage = ref(''); // shown on screen if something goes wrong

// ---------------------------------------------------------------------------
// READ - listen to the database
//
// We call this once, in App.vue, when the app starts.
//
// onSnapshot is a LIVE listener. Firebase calls our function immediately with
// the current data, and then again every single time a document is added,
// changed or deleted. That is why the list updates by itself after we save or
// delete something - we never reload the page.
// ---------------------------------------------------------------------------
export function startListening() {
  if (!isFirebaseReady) {
    loading.value = false;
    errorMessage.value =
      'Firebase is not set up yet. Copy .env.example to .env, add your keys, then restart npm run dev.';
    return;
  }

  // Ask Firestore for the expenses collection, newest date first.
  const expensesCollection = collection(db, COLLECTION_NAME);
  const expensesQuery = query(expensesCollection, orderBy('date', 'desc'));

  onSnapshot(
    expensesQuery,
    (snapshot) => {
      // Build a normal array out of the documents Firebase gave us.
      const list = [];

      for (const document of snapshot.docs) {
        const data = document.data();
        list.push({
          id: document.id, // the id Firebase created for this document
          name: data.name,
          amount: data.amount,
          category: data.category,
          date: data.date,
          notes: data.notes,
        });
      }

      expenses.value = list;
      loading.value = false;
      errorMessage.value = '';
    },
    (error) => {
      // This runs if Firebase refuses the request, for example if the
      // security rules block us or there is no internet.
      loading.value = false;
      errorMessage.value = 'Could not load the expenses: ' + error.message;
      console.error(error);
    },
  );
}

// ---------------------------------------------------------------------------
// CREATE - add one new expense
// ---------------------------------------------------------------------------
export async function addExpense(expense) {
  await addDoc(collection(db, COLLECTION_NAME), {
    name: expense.name,
    amount: Number(expense.amount), // always save a number, never text
    category: expense.category,
    date: expense.date,
    notes: expense.notes,
  });
}

// ---------------------------------------------------------------------------
// UPDATE - change an expense that already exists
// ---------------------------------------------------------------------------
export async function updateExpense(id, expense) {
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    name: expense.name,
    amount: Number(expense.amount),
    category: expense.category,
    date: expense.date,
    notes: expense.notes,
  });
}

// ---------------------------------------------------------------------------
// DELETE - remove one expense for good
// ---------------------------------------------------------------------------
export async function deleteExpense(id) {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}

// ---------------------------------------------------------------------------
// Totals
//
// "computed" means Vue works these out again automatically whenever the
// expenses list changes.
// ---------------------------------------------------------------------------

// Add up every expense.
export const total = computed(() => {
  let sum = 0;
  for (const expense of expenses.value) {
    sum = sum + expense.amount;
  }
  return sum;
});

// Add up only the expenses of the current month.
export const monthTotal = computed(() => {
  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  let sum = 0;
  for (const expense of expenses.value) {
    // expense.date looks like "2026-09-13", so the first 7 letters are the month.
    if (expense.date.slice(0, 7) === thisMonth) {
      sum = sum + expense.amount;
    }
  }
  return sum;
});
