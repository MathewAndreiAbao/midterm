<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>About</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-card>
        <ion-card-header>
          <ion-card-subtitle>Midterm Project</ion-card-subtitle>
          <ion-card-title>Personal Expense Tracker</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          A simple mobile app for recording daily expenses. Built with the Ionic
          Framework (Vue) for the user interface and Firebase Cloud Firestore as
          the online database, so every change is saved in the cloud and shows up
          instantly on any device signed in to the same project.
        </ion-card-content>
      </ion-card>

      <ion-list-header>Team members</ion-list-header>
      <ion-list :inset="true">
        <ion-item v-for="member in TEAM" :key="member.name" lines="full">
          <ion-avatar slot="start" class="initials">{{ initials(member.name) }}</ion-avatar>
          <ion-label class="ion-text-wrap">
            <h2>{{ member.name }}</h2>
            <p><strong>{{ member.role }}</strong></p>
            <p>{{ member.contribution }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-list-header>Technology used</ion-list-header>
      <ion-list :inset="true">
        <ion-item v-for="tech in STACK" :key="tech.name" lines="full">
          <ion-icon slot="start" :icon="tech.icon" color="primary" />
          <ion-label class="ion-text-wrap">
            <h2>{{ tech.name }}</h2>
            <p>{{ tech.purpose }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-list-header>CRUD functions implemented</ion-list-header>
      <ion-list :inset="true">
        <ion-item v-for="op in CRUD" :key="op.letter" lines="full">
          <ion-badge slot="start" color="primary">{{ op.letter }}</ion-badge>
          <ion-label class="ion-text-wrap">
            <h2>{{ op.title }}</h2>
            <p>{{ op.detail }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <p class="footnote">
        Edit <code>src/views/AboutPage.vue</code> to put your own names and roles here.
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAvatar,
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { cloudOutline, logoVue, phonePortraitOutline } from 'ionicons/icons';

// TODO: replace these with the real names, roles and contributions.
const TEAM = [
  {
    name: 'Partner 1 Name',
    role: 'Front-end / UI Developer',
    contribution:
      'Designed the pages and the expense form, built the tab navigation, the category filter, the search bar and the Summary page layout.',
  },
  {
    name: 'Partner 2 Name',
    role: 'Firebase / Data Developer',
    contribution:
      'Set up the Firebase project and Firestore rules, wrote the useExpenses composable with the add, read, update and delete functions, and handled form validation and error messages.',
  },
];

const STACK = [
  {
    name: 'Ionic Framework 8 (Vue)',
    purpose: 'Ready-made mobile UI components: pages, lists, modals, tabs and the date picker.',
    icon: phonePortraitOutline,
  },
  {
    name: 'Vue 3 + Vite + TypeScript',
    purpose: 'Component logic, reactivity and a fast development server.',
    icon: logoVue,
  },
  {
    name: 'Firebase Cloud Firestore',
    purpose: 'Online NoSQL database. Real-time listeners keep the list in sync automatically.',
    icon: cloudOutline,
  },
];

const CRUD = [
  {
    letter: 'C',
    title: 'Create - addExpense()',
    detail: 'The + button opens the form; Save calls addDoc() to write a new document.',
  },
  {
    letter: 'R',
    title: 'Read - onSnapshot()',
    detail: 'A live listener loads every expense and re-renders the list whenever data changes.',
  },
  {
    letter: 'U',
    title: 'Update - updateExpense()',
    detail: 'Tapping a row (or swiping to Edit) reopens the same form and calls updateDoc().',
  },
  {
    letter: 'D',
    title: 'Delete - deleteExpense()',
    detail: 'Swipe left, tap the trash icon, confirm the alert, then deleteDoc() removes it.',
  },
];

/** "Juan Dela Cruz" -> "JD" */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}
</script>

<style scoped>
.initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
}

.footnote {
  text-align: center;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  padding: 8px 24px 24px;
}
</style>
