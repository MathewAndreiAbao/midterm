<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />

      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="expenses" href="/tabs/expenses">
          <ion-icon :icon="listOutline" />
          <ion-label>Entries</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="summary" href="/tabs/summary">
          <ion-icon :icon="statsChartOutline" />
          <ion-label>Summary</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="about" href="/tabs/about">
          <ion-icon :icon="informationCircleOutline" />
          <ion-label>About</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import {
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue';
import { informationCircleOutline, listOutline, statsChartOutline } from 'ionicons/icons';
</script>
