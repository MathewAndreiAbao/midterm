<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="brand">About</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <header class="colophon">
        <p class="eyebrow">Midterm project</p>
        <h1>Ledger</h1>
        <p class="lede">
          A personal expense tracker built with the Ionic Framework and Firebase
          Cloud Firestore. Every entry is saved to the cloud the moment it is
          written, and the list keeps itself up to date.
        </p>
      </header>

      <h2 class="section-title">Team</h2>
      <div v-for="member in TEAM" :key="member.name" class="entry">
        <div class="entry-head">
          <span class="entry-name">{{ member.name }}</span>
          <span class="entry-tag">{{ member.role }}</span>
        </div>
        <p class="entry-body">{{ member.contribution }}</p>
      </div>

      <h2 class="section-title">Built with</h2>
      <div v-for="tech in STACK" :key="tech.name" class="entry">
        <div class="entry-head">
          <span class="entry-name">{{ tech.name }}</span>
        </div>
        <p class="entry-body">{{ tech.purpose }}</p>
      </div>

      <h2 class="section-title">CRUD operations</h2>
      <div v-for="op in CRUD" :key="op.letter" class="entry">
        <div class="entry-head">
          <span class="entry-letter">{{ op.letter }}</span>
          <span class="entry-name">{{ op.title }}</span>
        </div>
        <p class="entry-body">{{ op.detail }}</p>
      </div>

      <div class="tail-rule" />
      <p class="footnote">
        Edit <code>src/views/AboutPage.vue</code> to put your own names and roles here.
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';

// TODO: replace these with the real names, roles and contributions.
// Change these to your own names and roles.
const TEAM = [
  {
    name: 'Partner 1 Name',
    role: 'Interface',
    contribution:
      'Designed the pages and the entry form, built the tab navigation, the category filter, the search and the Summary layout.',
  },
  {
    name: 'Partner 2 Name',
    role: 'Data',
    contribution:
      'Set up the Firebase project and Firestore rules, wrote expenses.js with the add, read, update and delete functions, and handled validation and error states.',
  },
];

const STACK = [
  {
    name: 'Ionic Framework 8 · Vue',
    purpose: 'Mobile UI components: pages, lists, modals, tabs and the date picker.',
  },
  {
    name: 'Vue 3 · Vite',
    purpose: 'Plain JavaScript components, reactivity and a fast development server.',
  },
  {
    name: 'Firebase Cloud Firestore',
    purpose: 'Online NoSQL database. Real-time listeners keep the list in sync automatically.',
  },
];

const CRUD = [
  {
    letter: 'C',
    title: 'Create',
    detail: 'The + button opens the form; Save calls addDoc() to write a new document.',
  },
  {
    letter: 'R',
    title: 'Read',
    detail: 'startListening() uses onSnapshot to stream every expense and redraw the list on any change.',
  },
  {
    letter: 'U',
    title: 'Update',
    detail: 'Tapping a row reopens the same form and calls updateDoc() with the new values.',
  },
  {
    letter: 'D',
    title: 'Delete',
    detail: 'Swipe left, tap Delete, confirm the alert, then deleteDoc() removes the document.',
  },
];
</script>

<style scoped>
.brand {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  padding-inline: 0;
}

.colophon {
  padding: 16px var(--gutter) 36px;
}

.colophon h1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 2.75rem;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 14px 0 0;
}

.lede {
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--ink-soft);
  margin: 18px 0 0;
  max-width: 38ch;
}

.entry {
  padding: 16px var(--gutter);
  border-top: 1px solid var(--hairline);
}

.entry-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.entry-letter {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--ink-muted);
  width: 14px;
  flex: 0 0 auto;
}

.entry-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.01em;
  flex: 1 1 auto;
}

.entry-tag {
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.entry-body {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--ink-soft);
  margin: 8px 0 0;
  max-width: 46ch;
}

.tail-rule {
  height: 1px;
  background: var(--hairline);
}

.footnote {
  text-align: center;
  font-size: 0.75rem;
  color: var(--ink-faint);
  padding: 22px var(--gutter) 110px;
  margin: 0;
}

.footnote code {
  font-size: 0.72rem;
  color: var(--ink-muted);
}
</style>
