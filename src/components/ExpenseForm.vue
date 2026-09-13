<!--
  ExpenseForm.vue

  The form used for BOTH adding a new expense and editing an old one.

  How it knows which job to do:
    - the "expense" prop is null   -> we are adding    -> addExpense()
    - the "expense" prop has data  -> we are editing   -> updateExpense()
-->
<template>
  <ion-modal :is-open="isOpen" @did-dismiss="closeForm">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button class="ghost" @click="closeForm">Cancel</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button class="ghost strong" @click="saveForm">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <header class="form-head">
        <p class="eyebrow">{{ expense ? 'Edit entry' : 'New entry' }}</p>
        <h1>{{ expense ? 'Update this expense' : 'What did you spend on?' }}</h1>
      </header>

      <div class="fields">
        <!-- 1. NAME -->
        <label class="field">
          <span class="field-label">Description</span>
          <ion-input
            v-model="name"
            class="field-input"
            placeholder="Lunch at the canteen"
            maxlength="60"
          />
        </label>

        <!-- 2. AMOUNT -->
        <label class="field">
          <span class="field-label">Amount</span>
          <div class="amount-wrap">
            <span class="peso">{{ PESO }}</span>
            <ion-input
              v-model="amount"
              class="field-input amount-input"
              type="number"
              placeholder="0.00"
            />
          </div>
        </label>

        <!-- 3. CATEGORY -->
        <label class="field">
          <span class="field-label">Category</span>
          <ion-select v-model="category" class="field-input" interface="action-sheet">
            <ion-select-option v-for="item in categories" :key="item.id" :value="item.id">
              {{ item.label }}
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
            v-model="notes"
            class="field-input"
            placeholder="Anything worth remembering"
            auto-grow="true"
            rows="2"
            maxlength="200"
          />
        </label>
      </div>

      <!-- The calendar that opens when the date above is tapped. -->
      <ion-modal keep-contents-mounted="true">
        <ion-datetime id="expense-date" v-model="date" presentation="date" />
      </ion-modal>

      <p v-if="errorText" class="form-error">{{ errorText }}</p>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch } from 'vue';
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

import { categories } from '../categories.js';
import { addExpense, updateExpense } from '../expenses.js';
import { PESO, todayText } from '../helpers.js';

// Values coming in from ExpensesPage.vue.
const props = defineProps({
  isOpen: Boolean,
  expense: Object, // null when adding a new expense
});

// How this component tells ExpensesPage.vue to close the form.
const emit = defineEmits(['close']);

// One box for each field on the form.
const name = ref('');
const amount = ref('');
const category = ref('food');
const date = ref(todayText());
const notes = ref('');
const errorText = ref('');

// Every time the form opens, fill the boxes in.
watch(
  () => props.isOpen,
  (isNowOpen) => {
    if (!isNowOpen) {
      return;
    }

    errorText.value = '';

    if (props.expense) {
      // Editing: copy the values of the expense we tapped.
      name.value = props.expense.name;
      amount.value = String(props.expense.amount);
      category.value = props.expense.category;
      date.value = props.expense.date;
      notes.value = props.expense.notes;
    } else {
      // Adding: start with empty boxes and today's date.
      name.value = '';
      amount.value = '';
      category.value = 'food';
      date.value = todayText();
      notes.value = '';
    }
  },
);

function closeForm() {
  emit('close');
}

// Show a short message at the bottom of the screen.
async function showMessage(text) {
  const toast = await toastController.create({
    message: text,
    duration: 2000,
  });
  await toast.present();
}

// Check the form before we send anything to Firebase.
// Returns true if everything is fine.
function isFormValid() {
  if (name.value.trim() === '') {
    errorText.value = 'Please enter a description.';
    return false;
  }

  if (amount.value === '' || Number(amount.value) <= 0) {
    errorText.value = 'Please enter an amount greater than zero.';
    return false;
  }

  if (date.value === '') {
    errorText.value = 'Please choose a date.';
    return false;
  }

  errorText.value = '';
  return true;
}

// This runs when the Save button is tapped.
async function saveForm() {
  if (!isFormValid()) {
    return;
  }

  // Put the five fields together into one object.
  const newExpense = {
    name: name.value.trim(),
    amount: Number(amount.value),
    category: category.value,
    // The calendar gives back "2026-09-13T00:00:00", but we only want the
    // first 10 letters, which is the date on its own.
    date: date.value.slice(0, 10),
    notes: notes.value.trim(),
  };

  try {
    if (props.expense) {
      await updateExpense(props.expense.id, newExpense); // UPDATE
      await showMessage('Entry updated');
    } else {
      await addExpense(newExpense); // CREATE
      await showMessage('Entry added');
    }
    closeForm();
  } catch (error) {
    console.error(error);
    await showMessage('Could not save. Please check your internet.');
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
