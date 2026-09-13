<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { startListening } from './expenses.js';

// When the app opens, start listening to the Firebase database.
// We only do this once, here, and every page shares the result.
onMounted(() => {
  startListening();
});
</script>
