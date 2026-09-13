<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>My Expenses</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          v-model="searchText"
          placeholder="Search name or notes"
          :debounce="200"
        />
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Shown only when .env has not been filled in yet. -->
      <ion-card v-if="errorMessage" color="warning">
        <ion-card-header>
          <ion-card-title>Setup needed</ion-card-title>
        </ion-card-header>
        <ion-card-content>{{ errorMessage }}</ion-card-content>
      </ion-card>

      <!-- Running totals -->
      <div class="total-card">
        <div class="total-label">Total spent</div>
        <div class="total-value">{{ formatPeso(total) }}</div>
        <div class="total-sub">
          This month: {{ formatPeso(monthTotal) }} &middot;
          {{ expenses.length }} {{ expenses.length === 1 ? 'record' : 'records' }}
        </div>
      </div>

      <!-- Category filter -->
      <div class="filter-row">
        <ion-chip
          :outline="activeCategory !== 'all'"
          :color="activeCategory === 'all' ? 'primary' : 'medium'"
          @click="activeCategory = 'all'"
        >
          All
        </ion-chip>
        <ion-chip
          v-for="c in CATEGORIES"
          :key="c.id"
          :outline="activeCategory !== c.id"
          :color="activeCategory === c.id ? 'primary' : 'medium'"
          @click="activeCategory = c.id"
        >
          {{ c.label }}
        </ion-chip>
      </div>

      <!-- Loading placeholder -->
      <ion-list v-if="loading">
        <ion-item v-for="n in 4" :key="n">
          <ion-label>
            <ion-skeleton-text :animated="true" style="width: 60%" />
            <ion-skeleton-text :animated="true" style="width: 35%" />
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Empty state -->
      <div v-else-if="filteredExpenses.length === 0" class="empty-state">
        <ion-icon :icon="receiptOutline" />
        <h2>{{ expenses.length === 0 ? 'No expenses yet' : 'Nothing matches your filter' }}</h2>
        <p>
          {{
            expenses.length === 0
              ? 'Tap the + button to record your first expense.'
              : 'Try another category or clear the search box.'
          }}
        </p>
      </div>

      <!-- READ: the live list of expenses -->
      <ion-list v-else>
        <ion-item-sliding v-for="expense in filteredExpenses" :key="expense.id">
          <ion-item button :detail="false" @click="openEdit(expense)">
            <div
              slot="start"
              class="category-dot"
              :style="{ backgroundColor: getCategory(expense.category).color }"
            >
              <ion-icon :icon="iconFor(expense.category)" />
            </div>

            <ion-label>
              <h2>{{ expense.name }}</h2>
              <p>
                {{ getCategory(expense.category).label }} &middot; {{ formatDate(expense.date) }}
              </p>
              <p v-if="expense.notes" class="notes">{{ expense.notes }}</p>
            </ion-label>

            <ion-note slot="end" color="dark" class="amount">
              {{ formatPeso(expense.amount) }}
            </ion-note>
          </ion-item>

          <!-- Swipe left for Edit / Delete -->
          <ion-item-options side="end">
            <ion-item-option color="primary" @click="openEdit(expense)">
              <ion-icon slot="icon-only" :icon="createOutline" />
            </ion-item-option>
            <ion-item-option color="danger" @click="confirmDelete(expense)">
              <ion-icon slot="icon-only" :icon="trashOutline" />
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- CREATE: floating add button -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="openCreate">
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  alertController,
  toastController,
} from '@ionic/vue';
import { addOutline, createOutline, receiptOutline, trashOutline } from 'ionicons/icons';
import * as allIcons from 'ionicons/icons';
import ExpenseFormModal from '@/components/ExpenseFormModal.vue';
import { formatDate, formatPeso, useExpenses } from '@/composables/useExpenses';
import { CATEGORIES, getCategory, type Expense } from '@/types/expense';

const { expenses, loading, errorMessage, total, monthTotal, deleteExpense } = useExpenses();

const searchText = ref('');
const activeCategory = ref<string>('all');
const isModalOpen = ref(false);
const selectedExpense = ref<Expense | null>(null);

/** Turn "fast-food-outline" into the imported ionicon of the same name. */
function iconFor(categoryId: string) {
  const name = getCategory(categoryId).icon.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
  return (allIcons as Record<string, string>)[name] ?? receiptOutline;
}

/** The list after the search box and the category chips are applied. */
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
    header: 'Delete expense?',
    message: `"${expense.name}" will be permanently removed.`,
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
    const toast = await toastController.create({
      message: 'Expense deleted.',
      duration: 2000,
      color: 'medium',
    });
    await toast.present();
  } catch (error) {
    console.error('[ExpensesPage] delete failed', error);
    const toast = await toastController.create({
      message: 'Could not delete. Please try again.',
      duration: 2000,
      color: 'danger',
    });
    await toast.present();
  }
}
</script>

<style scoped>
.filter-row {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  padding: 8px 12px 4px;
  scrollbar-width: none;
}

.filter-row::-webkit-scrollbar {
  display: none;
}

.filter-row ion-chip {
  flex: 0 0 auto;
}

.amount {
  font-weight: 600;
  font-size: 1rem;
}

.notes {
  font-style: italic;
  opacity: 0.75;
}
</style>
