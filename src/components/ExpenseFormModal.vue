<template>
  <ion-modal :is-open="isOpen" @did-dismiss="close">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button class="ghost" @click="close">Cancel</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button class="ghost strong" :disabled="saving" @click="save">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <header class="form-head">
        <p class="eyebrow">{{ isEditing ? 'Edit entry' : 'New entry' }}</p>
        <h1>{{ isEditing ? 'Update this expense' : 'What did you spend on?' }}</h1>
      </header>

      <div class="fields">
        <!-- 1. NAME -->
        <label class="field">
          <span class="field-label">Description</span>
          <ion-input
            v-model="form.name"
            class="field-input"
            placeholder="Lunch at the canteen"
            :maxlength="60"
            autocapitalize="sentences"
          />
        </label>

        <!-- 2. AMOUNT -->
        <label class="field">
          <span class="field-label">Amount</span>
          <div class="amount-wrap">
            <span class="peso">{{ PESO }}</span>
            <ion-input
              v-model="amountText"
              class="field-input amount-input"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </label>

        <!-- 3. CATEGORY -->
        <label class="field">
          <span class="field-label">Category</span>
          <ion-select
            v-model="form.category"
            class="field-input"
            interface="action-sheet"
            :interface-options="{ header: 'Category' }"
          >
            <ion-select-option v-for="c in CATEGORIES" :key="c.id" :value="c.id">
              {{ c.label }}
            </ion-select-option>
          </ion-select>
        </label>

        <!-- 4. DATE -->
        <div class="field field-row">
          <span class="field-label">Date</span>
          <ion-datetime-button datetime="expense-date" />
        </div>

        <!-- 5. NOTES -->
        <label class="field">
          <span class="field-label">Notes <em>optional</em></span>
          <ion-textarea
            v-model="form.notes"
            class="field-input"
            placeholder="Anything worth remembering"
            :auto-grow="true"
            :rows="2"
            :maxlength="200"
          />
        </label>
      </div>

      <!-- The date picker itself lives in its own modal, opened by the
           ion-datetime-button above. -->
      <ion-modal :keep-contents-mounted="true">
        <ion-datetime
          id="expense-date"
          v-model="dateValue"
          presentation="date"
          :prefer-wheel="false"
          :show-default-buttons="true"
        />
      </ion-modal>

      <p v-if="validationError" class="form-error">{{ validationError }}</p>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonInput,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonToolbar,
  toastController,
} from '@ionic/vue';
import { CATEGORIES, type Expense, type ExpenseInput } from '@/types/expense';
import { PESO, useExpenses } from '@/composables/useExpenses';

const props = defineProps<{
  isOpen: boolean;
  /** null = create a new expense, otherwise edit this one. */
  expense: Expense | null;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const { addExpense, updateExpense } = useExpenses();

const saving = ref(false);
const validationError = ref('');

/** Today's date as "YYYY-MM-DD" in the user's own timezone. */
function today(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

const form = reactive<ExpenseInput>({
  name: '',
  amount: 0,
  category: 'food',
  date: today(),
  notes: '',
});

// ion-input with type="number" gives us a string, so we keep the raw text
// separately and convert it only when saving.
const amountText = ref('');

// ion-datetime works with a full ISO string; we store only the date part.
const dateValue = computed({
  get: () => form.date,
  set: (value: string) => {
    form.date = (value || '').slice(0, 10);
  },
});

const isEditing = computed(() => props.expense !== null);

/** Refill the form every time the modal opens. */
watch(
  () => props.isOpen,
  (open) => {
    if (!open) return;
    validationError.value = '';
    if (props.expense) {
      form.name = props.expense.name;
      form.amount = props.expense.amount;
      form.category = props.expense.category;
      form.date = props.expense.date || today();
      form.notes = props.expense.notes;
      amountText.value = String(props.expense.amount);
    } else {
      form.name = '';
      form.amount = 0;
      form.category = 'food';
      form.date = today();
      form.notes = '';
      amountText.value = '';
    }
  },
);

function close(): void {
  emit('close');
}

async function showToast(message: string): Promise<void> {
  const toast = await toastController.create({ message, duration: 2000, position: 'bottom' });
  await toast.present();
}

/** Check the required fields before we write anything to Firestore. */
function validate(): boolean {
  const amount = Number(amountText.value);

  if (!form.name.trim()) {
    validationError.value = 'Please enter a description.';
    return false;
  }
  if (!amountText.value || Number.isNaN(amount) || amount <= 0) {
    validationError.value = 'Please enter an amount greater than zero.';
    return false;
  }
  if (!form.date) {
    validationError.value = 'Please choose a date.';
    return false;
  }

  validationError.value = '';
  form.amount = Math.round(amount * 100) / 100;
  return true;
}

/** CREATE or UPDATE, depending on how the modal was opened. */
async function save(): Promise<void> {
  if (!validate()) return;

  saving.value = true;
  const payload: ExpenseInput = {
    name: form.name.trim(),
    amount: form.amount,
    category: form.category,
    date: form.date,
    notes: form.notes.trim(),
  };

  try {
    if (props.expense) {
      await updateExpense(props.expense.id, payload);
      await showToast('Entry updated');
    } else {
      await addExpense(payload);
      await showToast('Entry added');
    }
    close();
  } catch (error) {
    console.error('[ExpenseFormModal] save failed', error);
    await showToast('Could not save. Check your internet connection.');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.ghost {
  --color: var(--ink-muted);
  --padding-start: 0;
  --padding-end: 0;
  font-size: 0.6875rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  font-weight: 500;
}

.ghost.strong {
  --color: var(--ink);
}

.form-head {
  padding: 12px var(--gutter) 34px;
}

.form-head h1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 14px 0 0;
  max-width: 16ch;
}

.fields {
  border-top: 1px solid var(--hairline);
}

.field {
  display: block;
  padding: 16px var(--gutter);
  border-bottom: 1px solid var(--hairline);
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.field-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.field-label em {
  font-style: normal;
  color: var(--ink-faint);
  letter-spacing: 0.1em;
}

.field-input {
  --background: transparent;
  --color: var(--ink);
  --placeholder-color: var(--ink-faint);
  --placeholder-opacity: 1;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 8px;
  --padding-bottom: 0;
  font-size: 1rem;
  letter-spacing: -0.01em;
  min-height: auto;
}

.amount-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.peso {
  font-size: 1rem;
  color: var(--ink-faint);
  padding-top: 8px;
}

.amount-input {
  font-variant-numeric: tabular-nums;
}

.form-error {
  font-size: 0.8125rem;
  color: var(--ion-color-danger);
  margin: 18px var(--gutter) 0;
  letter-spacing: -0.005em;
}
</style>
