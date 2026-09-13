<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
import { useExpenses } from '@/composables/useExpenses';

// Open the single Firestore listener when the app starts and close it when
// the app is destroyed.
const { subscribe, unsubscribeAll } = useExpenses();

onMounted(() => subscribe());
onUnmounted(() => unsubscribeAll());
</script>
