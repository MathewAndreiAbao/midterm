<!--
  ExpensesPage.vue - the main page.

  It shows the list of expenses and lets the user add, edit and delete them.
-->
<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="brand">Ledger</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Only shown when the .env file has not been filled in yet. -->
      <div v-if="errorMessage" class="notice">
        <p class="eyebrow">Setup needed</p>
        <p>{{ errorMessage }}</p>
      </div>

      <!-- The totals at the top of the page. -->
      <header class="masthead">
        <p class="eyebrow">Total spent</p>
        <p class="figure">
          <span class="figure-symbol">{{ PESO }}</span>{{ formatAmount(total) }}
        </p>
        <p class="meta">
          {{ monthName }} &nbsp;·&nbsp; {{ PESO }}{{ formatAmount(monthTotal) }} &nbsp;·&nbsp;
          {{ expenses.length }} entries
        </p>
      </header>

      <div class="controls">
        <ion-searchbar v-model="searchText" class="ledger-search" placeholder="Search" />

        <!-- The category buttons. Tapping one changes activeCategory. -->
        <nav class="filters">
          <button
            type="button"
            class="filter"
            :class="{ 'is-active': activeCategory === 'all' }"
            @click="activeCategory = 'all'"
          >
            All
          </button>
          <button
            v-for="item in categories"
            :key="item.id"
            type="button"
            class="filter"
            :class="{ 'is-active': activeCategory === item.id }"
            @click="activeCategory = item.id"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>

      <!-- 1. While we wait for Firebase -->
      <div v-if="loading" class="skeletons">
        <div v-for="n in 4" :key="n" class="skeleton-row">
          <ion-skeleton-text animated="true" style="width: 45%; height: 13px" />
          <ion-skeleton-text animated="true" style="width: 22%; height: 13px" />
        </div>
      </div>

      <!-- 2. When there is nothing to show -->
      <div v-else-if="dayGroups.length === 0" class="empty-state">
        <div class="rule" />
        <h2>{{ expenses.length === 0 ? 'Nothing recorded yet' : 'No matches' }}</h2>
        <p>
          {{
            expenses.length === 0
              ? 'Your expenses will appear here once you add the first one.'
              : 'Try another category, or clear the search.'
          }}
        </p>
      </div>

      <!-- 3. The list itself, one block per day -->
      <div v-for="group in dayGroups" v-else :key="group.date">
        <div class="day-head">
          <span class="day-label">{{ group.label }}</span>
          <span class="day-total tabular">{{ PESO }}{{ formatAmount(group.total) }}</span>
        </div>

        <ion-list lines="none">
          <ion-item-sliding v-for="expense in group.items" :key="expense.id">
            <!-- Tapping the row opens the form so it can be edited. -->
            <ion-item button detail="false" @click="openEditForm(expense)">
              <div class="row">
                <span class="dot" :style="{ backgroundColor: findCategory(expense.category).color }" />
                <div class="row-text">
                  <p class="name">{{ expense.name }}</p>
                  <p class="cat">{{ findCategory(expense.category).label }}</p>
                  <p v-if="expense.notes" class="note">{{ expense.notes }}</p>
                </div>
                <p class="amount tabular">{{ formatAmount(expense.amount) }}</p>
              </div>
            </ion-item>

            <!-- Swipe the row to the left to see these two buttons. -->
            <ion-item-options side="end">
              <ion-item-option class="opt-edit" @click="openEditForm(expense)">Edit</ion-item-option>
              <ion-item-option class="opt-delete" @click="askBeforeDeleting(expense)">
                Delete
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
      </div>

      <div class="tail-rule" />

      <!-- The round + button that opens an empty form. -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="fab-wrap">
        <ion-fab-button class="ledger-fab" @click="openAddForm">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- One form is used for both adding and editing. -->
    <expense-form :is-open="isFormOpen" :expense="expenseBeingEdited" @close="isFormOpen = false" />
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonPage,
  IonSearchbar,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  alertController,
  toastController,
} from '@ionic/vue';
import { addOutline } from 'ionicons/icons';

import ExpenseForm from '../components/ExpenseForm.vue';
import { categories, findCategory } from '../categories.js';
import { expenses, loading, errorMessage, total, monthTotal, deleteExpense } from '../expenses.js';
import { PESO, formatAmount, dayLabel } from '../helpers.js';

// What the user typed in the search box.
const searchText = ref('');

// Which category button is selected. 'all' means no filter.
const activeCategory = ref('all');

// Is the form open, and which expense is it editing?
const isFormOpen = ref(false);
const expenseBeingEdited = ref(null); // null means "adding a new one"

// "September 2026", shown under the total.
const monthName = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

// STEP 1: keep only the expenses that match the search box AND the category.
const visibleExpenses = computed(() => {
  const search = searchText.value.trim().toLowerCase();
  const result = [];

  for (const expense of expenses.value) {
    // Does it match the category buttons?
    let categoryMatches = false;
    if (activeCategory.value === 'all' || activeCategory.value === expense.category) {
      categoryMatches = true;
    }

    // Does it match what was typed in the search box?
    let searchMatches = false;
    if (search === '') {
      searchMatches = true;
    } else if (expense.name.toLowerCase().includes(search)) {
      searchMatches = true;
    } else if (expense.notes.toLowerCase().includes(search)) {
      searchMatches = true;
    }

    if (categoryMatches && searchMatches) {
      result.push(expense);
    }
  }

  return result;
});

// STEP 2: put the expenses into groups, one group per day, so the page can
// show a heading and a subtotal above each day.
const dayGroups = computed(() => {
  const groups = [];

  for (const expense of visibleExpenses.value) {
    // Do we already have a group for this date?
    let group = groups.find((item) => item.date === expense.date);

    // If not, start a new one.
    if (!group) {
      group = {
        date: expense.date,
        label: dayLabel(expense.date),
        total: 0,
        items: [],
      };
      groups.push(group);
    }

    group.items.push(expense);
    group.total = group.total + expense.amount;
  }

  return groups;
});

// Open the form with nothing in it.
function openAddForm() {
  expenseBeingEdited.value = null;
  isFormOpen.value = true;
}

// Open the form already filled in with this expense.
function openEditForm(expense) {
  expenseBeingEdited.value = expense;
  isFormOpen.value = true;
}

// Ask "are you sure?" before deleting, because deleting cannot be undone.
async function askBeforeDeleting(expense) {
  const alert = await alertController.create({
    header: 'Delete this entry?',
    message: '"' + expense.name + '" will be permanently removed.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          removeExpense(expense);
        },
      },
    ],
  });
  await alert.present();
}

// Actually delete it. This only runs if the user tapped Delete in the alert.
async function removeExpense(expense) {
  try {
    await deleteExpense(expense.id);
    showMessage('Entry deleted');
  } catch (error) {
    console.error(error);
    showMessage('Could not delete. Please try again.');
  }
}

async function showMessage(text) {
  const toast = await toastController.create({ message: text, duration: 2000 });
  await toast.present();
}
</script>

<style scoped>
.brand {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  padding-inline: 0;
}

.notice {
  margin: 0 var(--gutter);
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline);
}

.notice p:last-child {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--ink-soft);
  margin: 8px 0 0;
}

.controls {
  padding-top: 18px;
}

.filters {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 4px var(--gutter) 0;
  scrollbar-width: none;
}

.filters::-webkit-scrollbar {
  display: none;
}

.filter {
  flex: 0 0 auto;
  background: none;
  border: 0;
  padding: 6px 0;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--ink-faint);
  border-bottom: 1px solid transparent;
  cursor: pointer;
}

.filter.is-active {
  color: var(--ink);
  border-bottom-color: var(--ink);
}

.day-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 30px var(--gutter) 12px;
}

.day-label {
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.day-total {
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  color: var(--ink-faint);
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
  padding: 15px var(--gutter);
  border-top: 1px solid var(--hairline);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: 0 0 auto;
  margin-top: 7px;
}

.row-text {
  flex: 1 1 auto;
  min-width: 0;
}

.name {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--ink);
  margin: 0;
  letter-spacing: -0.01em;
}

.cat {
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin: 5px 0 0;
}

.note {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ink-soft);
  margin: 6px 0 0;
}

.amount {
  flex: 0 0 auto;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
  padding-top: 1px;
  letter-spacing: -0.01em;
}

.tail-rule {
  height: 1px;
  background: var(--hairline);
  margin: 0 0 120px;
}

.skeletons {
  padding-top: 30px;
}

.skeleton-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px var(--gutter);
  border-top: 1px solid var(--hairline);
}

.fab-wrap {
  margin-bottom: 6px;
  margin-inline-end: 6px;
}
</style>
