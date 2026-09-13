<!--
  SummaryPage.vue

  Shows how much was spent in each category, and the biggest expenses.
  This page only reads the same list - it never writes to Firebase.
-->
<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="brand">Summary</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <header class="masthead">
        <p class="eyebrow">Total spent</p>
        <p class="figure">
          <span class="figure-symbol">{{ PESO }}</span>{{ formatAmount(total) }}
        </p>
        <p class="meta">
          {{ expenses.length }} entries &nbsp;·&nbsp; average {{ PESO
          }}{{ formatAmount(average) }}
        </p>
      </header>

      <div v-if="expenses.length === 0" class="empty-state">
        <div class="rule" />
        <h2>Nothing to summarise</h2>
        <p>Record a few expenses and the breakdown will appear here.</p>
      </div>

      <template v-else>
        <h2 class="section-title">By category</h2>

        <div v-for="row in categoryTotals" :key="row.id" class="cat-row">
          <div class="cat-head">
            <span class="cat-name">{{ row.label }}</span>
            <span class="cat-amount tabular">{{ PESO }}{{ formatAmount(row.amount) }}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: row.percent + '%', backgroundColor: row.color }" />
          </div>
          <span class="cat-percent tabular">{{ row.percent.toFixed(1) }}%</span>
        </div>

        <h2 class="section-title">Largest entries</h2>

        <div v-for="expense in biggestExpenses" :key="expense.id" class="top-row">
          <div class="top-text">
            <p class="name">{{ expense.name }}</p>
            <p class="cat">
              {{ findCategory(expense.category).label }} &nbsp;·&nbsp;
              {{ formatDate(expense.date) }}
            </p>
          </div>
          <p class="amount tabular">{{ formatAmount(expense.amount) }}</p>
        </div>

        <div class="tail-rule" />
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';

import { categories, findCategory } from '../categories.js';
import { expenses, total } from '../expenses.js';
import { PESO, formatAmount, formatDate } from '../helpers.js';

// The average amount of one expense.
const average = computed(() => {
  if (expenses.value.length === 0) {
    return 0;
  }
  return total.value / expenses.value.length;
});

// Work out the total for every category, then sort them biggest first.
const categoryTotals = computed(() => {
  const rows = [];

  for (const category of categories) {
    // Add up the expenses that belong to this category.
    let amount = 0;
    for (const expense of expenses.value) {
      if (expense.category === category.id) {
        amount = amount + expense.amount;
      }
    }

    // Skip categories that have no spending at all.
    if (amount === 0) {
      continue;
    }

    // What share of the grand total is this? Used for the width of the bar.
    let percent = 0;
    if (total.value > 0) {
      percent = (amount / total.value) * 100;
    }

    rows.push({
      id: category.id,
      label: category.label,
      color: category.color,
      amount: amount,
      percent: percent,
    });
  }

  // Sort so the biggest category is at the top.
  rows.sort((a, b) => b.amount - a.amount);

  return rows;
});

// The five most expensive entries.
const biggestExpenses = computed(() => {
  // Make a copy first, so we do not reorder the real list.
  const copy = [...expenses.value];
  copy.sort((a, b) => b.amount - a.amount);
  return copy.slice(0, 5);
});
</script>

<style scoped>
.brand {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  padding-inline: 0;
}

.cat-row {
  padding: 16px var(--gutter);
  border-top: 1px solid var(--hairline);
}

.cat-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.cat-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink);
}

.cat-amount {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ink);
}

.bar-track {
  height: 2px;
  background: var(--hairline);
  margin: 12px 0 8px;
}

.bar-fill {
  height: 100%;
}

.cat-percent {
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
}

.top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 15px var(--gutter);
  border-top: 1px solid var(--hairline);
}

.top-text {
  min-width: 0;
}

.name {
  font-size: 0.9375rem;
  font-weight: 500;
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

.amount {
  flex: 0 0 auto;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.tail-rule {
  height: 1px;
  background: var(--hairline);
  margin: 0 0 90px;
}
</style>
