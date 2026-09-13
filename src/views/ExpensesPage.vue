<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="brand">Ledger</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Shown only when .env has not been filled in yet. -->
      <div v-if="errorMessage" class="notice">
        <p class="eyebrow">Setup needed</p>
        <p>{{ errorMessage }}</p>
      </div>

      <!-- Running total -->
      <header class="masthead">
        <p class="eyebrow">Total spent</p>
        <p class="figure">
          <span class="figure-symbol">{{ PESO }}</span>{{ formatAmount(total) }}
        </p>
        <p class="meta">
          {{ formatMonthLabel() }} &nbsp;·&nbsp; {{ PESO }}{{ formatAmount(monthTotal) }}
          &nbsp;·&nbsp; {{ expenses.length }} {{ expenses.length === 1 ? 'entry' : 'entries' }}
        </p>
      </header>

      <div class="controls">
        <ion-searchbar
          v-model="searchText"
          class="ledger-search"
          placeholder="Search"
          :debounce="200"
        />

        <!-- Category filter: plain text, underlined when active -->
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
            v-for="c in CATEGORIES"
            :key="c.id"
            type="button"
            class="filter"
            :class="{ 'is-active': activeCategory === c.id }"
            @click="activeCategory = c.id"
          >
            {{ c.label }}
          </button>
        </nav>
      </div>

      <!-- Loading placeholder -->
      <div v-if="loading" class="skeletons">
        <div v-for="n in 4" :key="n" class="skeleton-row">
          <ion-skeleton-text :animated="true" style="width: 45%; height: 13px" />
          <ion-skeleton-text :animated="true" style="width: 22%; height: 13px" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="grouped.length === 0" class="empty-state">
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

      <!-- READ: the live list, grouped by day -->
      <template v-else>
        <section v-for="group in grouped" :key="group.date" class="day">
          <div class="day-head">
            <span class="day-label">{{ group.label }}</span>
            <span class="day-total tabular">{{ PESO }}{{ formatAmount(group.total) }}</span>
          </div>

          <ion-list :lines="'none'">
            <ion-item-sliding v-for="expense in group.items" :key="expense.id">
              <ion-item button :detail="false" @click="openEdit(expense)">
                <div class="row">
                  <span
                    class="dot"
                    :style="{ backgroundColor: getCategory(expense.category).color }"
                  />
                  <div class="row-text">
                    <p class="name">{{ expense.name }}</p>
                    <p class="cat">{{ getCategory(expense.category).label }}</p>
                    <p v-if="expense.notes" class="note">{{ expense.notes }}</p>
                  </div>
                  <p class="amount tabular">{{ formatAmount(expense.amount) }}</p>
                </div>
              </ion-item>

              <!-- Swipe left for Edit / Delete -->
              <ion-item-options side="end">
                <ion-item-option class="opt-edit" @click="openEdit(expense)">Edit</ion-item-option>
                <ion-item-option class="opt-delete" @click="confirmDelete(expense)">
                  Delete
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
        </section>

        <div class="tail-rule" />
      </template>

      <!-- CREATE -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="fab-wrap">
        <ion-fab-button class="ledger-fab" @click="openCreate">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- The one modal used for both Add and Edit -->
    <expense-form-modal
      :is-open="isModalOpen"
      :expense="selectedExpense"
      @close="isModalOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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
import ExpenseFormModal from '@/components/ExpenseFormModal.vue';
import {
  PESO,
  formatAmount,
  formatDayLabel,
  formatMonthLabel,
  useExpenses,
} from '@/composables/useExpenses';
import { CATEGORIES, getCategory, type Expense } from '@/types/expense';

const { expenses, loading, errorMessage, total, monthTotal, deleteExpense } = useExpenses();

const searchText = ref('');
const activeCategory = ref<string>('all');
const isModalOpen = ref(false);
const selectedExpense = ref<Expense | null>(null);

/** The list after the search box and the category filter are applied. */
const filteredExpenses = computed(() => {
  const term = searchText.value.trim().toLowerCase();

  return expenses.value.filter((expense) => {
    const matchesCategory =
      activeCategory.value === 'all' || expense.category === activeCategory.value;
    const matchesSearch =
      term === '' ||
      expense.name.toLowerCase().includes(term) ||
      expense.notes.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });
});

/**
 * Group the filtered list by date so the page reads like a statement:
 * a day heading with that day's subtotal, then the entries underneath.
 * The list already arrives sorted newest-first, so insertion order is correct.
 */
const grouped = computed(() => {
  const days = new Map<string, Expense[]>();

  for (const expense of filteredExpenses.value) {
    const bucket = days.get(expense.date);
    if (bucket) bucket.push(expense);
    else days.set(expense.date, [expense]);
  }

  return [...days.entries()].map(([date, items]) => ({
    date,
    label: formatDayLabel(date),
    total: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  }));
});

function openCreate(): void {
  selectedExpense.value = null;
  isModalOpen.value = true;
}

function openEdit(expense: Expense): void {
  selectedExpense.value = expense;
  isModalOpen.value = true;
}

/** DELETE - always ask first, then remove the document from Firestore. */
async function confirmDelete(expense: Expense): Promise<void> {
  const alert = await alertController.create({
    header: 'Delete this entry?',
    message: `“${expense.name}” will be permanently removed.`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          void removeExpense(expense);
        },
      },
    ],
  });
  await alert.present();
}

async function removeExpense(expense: Expense): Promise<void> {
  try {
    await deleteExpense(expense.id);
    await notify('Entry deleted');
  } catch (error) {
    console.error('[ExpensesPage] delete failed', error);
    await notify('Could not delete. Please try again.');
  }
}

async function notify(message: string): Promise<void> {
  const toast = await toastController.create({ message, duration: 2000, position: 'bottom' });
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

/* --- Category filter ---------------------------------------------------- */
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
  transition: color 0.15s ease;
}

.filter.is-active {
  color: var(--ink);
  border-bottom-color: var(--ink);
}

/* --- Day groups --------------------------------------------------------- */
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

/* --- Rows --------------------------------------------------------------- */
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

/* --- Loading ------------------------------------------------------------ */
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
