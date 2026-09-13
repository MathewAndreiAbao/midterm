<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />

      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="expenses" href="/tabs/expenses">
          <ion-icon :icon="walletOutline" />
          <ion-label>Expenses</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="summary" href="/tabs/summary">
          <ion-icon :icon="pieChartOutline" />
          <ion-label>Summary</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="about" href="/tabs/about">
          <ion-icon :icon="peopleOutline" />
          <ion-label>About</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue';
import { peopleOutline, pieChartOutline, walletOutline } from 'ionicons/icons';
</script>
