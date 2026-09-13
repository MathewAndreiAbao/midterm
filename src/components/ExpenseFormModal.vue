<template>
  <ion-modal :is-open="isOpen" @did-dismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="close">Cancel</ion-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Edit Expense' : 'New Expense' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :strong="true" :disabled="saving" @click="save">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list :inset="true">
        <!-- 1. NAME -->
        <ion-item>
          <ion-input
            v-model="form.name"
            label="Expense name"
            label-placement="stacked"
            placeholder="e.g. Lunch at the canteen"
            :maxlength="60"
            autocapitalize="sentences"
          />
        </ion-item>

        <!-- 2. AMOUNT -->
        <ion-item>
          <ion-input
            v-model="amountText"
            label="Amount (PHP)"
            label-placement="stacked"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </ion-item>

        <!-- 3. CATEGORY -->
        <ion-item>
          <ion-select
            v-model="form.category"
            label="Category"
            label-placement="stacked"
            interface="action-sheet"
            :interface-options="{ header: 'Choose a category' }"
          >
            <ion-select-option v-for="c in CATEGORIES" :key="c.id" :value="c.id">
              {{ c.label }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- 4. DATE -->
        <ion-item>
          <ion-label>Date</ion-label>
          <ion-datetime-button slot="end" datetime="expense-date" />
        </ion-item>

        <!-- 5. NOTES -->
        <ion-item>
          <ion-textarea
            v-model="form.notes"
            label="Notes (optional)"
            label-placement="stacked"
            placeholder="Anything you want to remember about this expense"
            :auto-grow="true"
            :rows="3"
            :maxlength="200"
          />
        </ion-item>
      </ion-list>

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
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue';
import { CATEGORIES, type Expense, type ExpenseInput } from '@/types/expense';
import { useExpenses } from '@/composables/useExpenses';

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

async function showToast(message: string, color: string): Promise<void> {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'bottom',
  });
  await toast.present();
}

/** Check the required fields before we write anything to Firestore. */
function validate(): boolean {
  const amount = Number(amountText.value);

  if (!form.name.trim()) {
    validationError.value = 'Please enter the expense name.';
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
      await showToast('Expense updated.', 'success');
    } else {
      await addExpense(payload);
      await showToast('Expense added.', 'success');
    }
    close();
  } catch (error) {
    console.error('[ExpenseFormModal] save failed', error);
    await showToast('Could not save. Check your internet connection.', 'danger');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.form-error {
  color: var(--ion-color-danger);
  font-size: 0.9rem;
  margin: 4px 20px;
}
</style>
