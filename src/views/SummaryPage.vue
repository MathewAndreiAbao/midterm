<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Summary</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding-bottom">
      <div class="total-card">
        <div class="total-label">Total spent</div>
        <div class="total-value">{{ formatPeso(total) }}</div>
        <div class="total-sub">Across {{ expenses.length }} expenses</div>
      </div>

      <div v-if="expenses.length === 0" class="empty-state">
        <ion-icon :icon="pieChartOutline" />
        <h2>Nothing to summarise yet</h2>
        <p>Add a few expenses and your spending breakdown will appear here.</p>
      </div>

      <template v-else>
        <ion-list-header>Spending by category</ion-list-header>
        <ion-list>
          <ion-item v-for="row in breakdown" :key="row.category.id" lines="full">
            <div slot="start" class="category-dot" :style="{ backgroundColor: row.category.color }">
              <ion-icon :icon="iconFor(row.category.icon)" />
            </div>
            <ion-label>
              <h2>{{ row.category.label }}</h2>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: row.percent + '%', backgroundColor: row.category.color }"
                />
              </div>
              <p>{{ row.percent.toFixed(1) }}% of total</p>
            </ion-label>
            <ion-note slot="end" color="dark" class="amount">{{ formatPeso(row.amount) }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list-header>Biggest expenses</ion-list-header>
        <ion-list>
          <ion-item v-for="expense in topExpenses" :key="expense.id" lines="full">
            <ion-label>
              <h2>{{ expense.name }}</h2>
              <p>{{ getCategory(expense.category).label }} &middot; {{ formatDate(expense.date) }}</p>
            </ion-label>
            <ion-note slot="end" color="dark" class="amount">
              {{ formatPeso(expense.amount) }}
            </ion-note>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { pieChartOutline } from 'ionicons/icons';
import * as allIcons from 'ionicons/icons';
import { formatDate, formatPeso, useExpenses } from '@/composables/useExpenses';
import { CATEGORIES, getCategory } from '@/types/expense';

const { expenses, total, totalsByCategory } = useExpenses();

function iconFor(iconName: string) {
  const key = iconName.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return (allIcons as Record<string, string>)[key] ?? pieChartOutline;
}

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
</script>

<style scoped>
.amount {
  font-weight: 600;
}

.bar-track {
  height: 6px;
  border-radius: 999px;
  background: var(--ion-color-light-shade, #e5e7eb);
  overflow: hidden;
  margin: 6px 0 4px;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}
</style>
