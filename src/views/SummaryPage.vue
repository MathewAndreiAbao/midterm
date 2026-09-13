<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="brand">Summary</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <header class="masthead">
        <p class="eyebrow">Total spent</p>
        <p class="figure">
          <span class="figure-symbol">{{ PESO }}</span>{{ formatAmount(total) }}
        </p>
        <p class="meta">
          {{ expenses.length }} {{ expenses.length === 1 ? 'entry' : 'entries' }}
          &nbsp;·&nbsp; average {{ PESO }}{{ formatAmount(average) }}
        </p>
      </header>

      <div v-if="expenses.length === 0" class="empty-state">
        <div class="rule" />
        <h2>Nothing to summarise</h2>
        <p>Record a few expenses and the breakdown will appear here.</p>
      </div>

      <template v-else>
        <h2 class="section-title">By category</h2>

        <div v-for="row in breakdown" :key="row.category.id" class="cat-row">
          <div class="cat-head">
            <span class="cat-name">{{ row.category.label }}</span>
            <span class="cat-amount tabular">{{ PESO }}{{ formatAmount(row.amount) }}</span>
          </div>
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{ width: row.percent + '%', backgroundColor: row.category.color }"
            />
          </div>
          <span class="cat-percent tabular">{{ row.percent.toFixed(1) }}%</span>
        </div>

        <h2 class="section-title">Largest entries</h2>

        <div v-for="expense in topExpenses" :key="expense.id" class="top-row">
          <div class="top-text">
            <p class="name">{{ expense.name }}</p>
            <p class="cat">
              {{ getCategory(expense.category).label }} &nbsp;·&nbsp; {{ formatDate(expense.date) }}
            </p>
          </div>
          <p class="amount tabular">{{ formatAmount(expense.amount) }}</p>
        </div>

        <div class="tail-rule" />
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { PESO, formatAmount, formatDate, useExpenses } from '@/composables/useExpenses';
import { CATEGORIES, getCategory } from '@/types/expense';

const { expenses, total, totalsByCategory } = useExpenses();

/** Only the categories that actually have spending, biggest first. */
const breakdown = computed(() =>
  CATEGORIES.map((category) => {
    const amount = totalsByCategory.value[category.id] ?? 0;
    return {
      category,
      amount,
      percent: total.value > 0 ? (amount / total.value) * 100 : 0,
    };
  })
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount),
);

/** The five most expensive records. */
const topExpenses = computed(() =>
  [...expenses.value].sort((a, b) => b.amount - a.amount).slice(0, 5),
);

const average = computed(() =>
  expenses.value.length > 0 ? total.value / expenses.value.length : 0,
);
</script>

<style scoped>
.brand {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  padding-inline: 0;
}

/* --- Category breakdown -------------------------------------------------- */
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
  letter-spacing: -0.005em;
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
  transition: width 0.3s ease;
}

.cat-percent {
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
}

/* --- Largest entries ----------------------------------------------------- */
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
