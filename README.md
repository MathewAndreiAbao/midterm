# Personal Expense Tracker

A simple mobile app for recording daily expenses, built for our midterm project with
**Ionic Framework 8 (Vue)** and **Firebase Cloud Firestore**.

Every expense stores the five required fields: **name, amount, category, date and notes**.
All four **CRUD** operations are implemented and every change is saved to Firebase.

---

## 1. Screens

| Tab | What it does |
| --- | --- |
| **Entries** | The main ledger. A running total at the top, then a search box, category filters, and the entries grouped by day with a subtotal per day. The `+` button adds a new entry; tapping a row edits it; swiping left reveals Edit and Delete. |
| **Summary** | Total spending broken down per category with a percentage bar, plus the largest entries. |
| **About** | Team members and their contributions, the technology used, and a short list of the CRUD functions. |

### Design

The interface is deliberately quiet: a warm paper background, near-black ink,
hairline rules instead of boxed cards, and a lot of empty space. Figures are set
in **Instrument Serif** and everything else in **Inter**; labels are small,
uppercase and letter-spaced. Category colours are muted and earthy, and only
ever appear as a 6px dot on a row or a 2px bar on the Summary page.

Both fonts are **self-hosted** from `public/fonts/` (about 170 KB, latin and
latin-ext subsets only), so the typography looks the same whether or not the
demo machine has internet - there are no external requests. The `latin-ext`
subset is the one that carries the peso sign, so it is required, not optional.

Dark mode is automatic: the palette flips to ink-on-black when the phone or
browser is set to dark. Nothing needs to be toggled in the app.

All of the design tokens live in `src/theme/variables.css`. Change the handful
of custom properties at the top of that file and the whole app follows.

---

## 2. Setting it up

### Step 1 - Install the dependencies

```bash
npm install
```

### Step 2 - Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Inside the project, open **Build → Firestore Database → Create database**.
   Choose **Start in test mode** (fine for the demo) and pick a location.
3. Back on the project overview, click the **`</>` (Web)** icon to register a web app.
4. Firebase shows you a `firebaseConfig` object. Keep that page open.

### Step 3 - Add your keys

```bash
cp .env.example .env
```

Open `.env` and paste the values from `firebaseConfig`:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

`.env` is git-ignored, so the keys are never pushed to GitHub.
If you skip this step the app still opens, but it shows a yellow **"Setup needed"** card
instead of crashing.

### Step 4 - Run it

```bash
npm run dev
```

Open <http://localhost:5173>. Use your browser's device toolbar (F12 → phone icon)
so it looks like a real phone during the demo.

### Optional - Demo without internet

If the room's Wi-Fi is unreliable, run the local Firebase emulator instead:

```bash
npm install -g firebase-tools     # once
npm run emulator                  # terminal 1
npm run dev                       # terminal 2
```

and set these two lines in `.env`:

```
VITE_FIREBASE_PROJECT_ID=demo-expense-tracker
VITE_USE_FIREBASE_EMULATOR=true
```

---

## 3. How the app works

### The data

Each expense is one document in the Firestore collection **`expenses`**:

```json
{
  "name": "Lunch at canteen",
  "amount": 150.5,
  "category": "food",
  "date": "2026-09-13",
  "notes": "Chicken adobo with rice",
  "createdAt": "<server timestamp>"
}
```

`date` is stored as the text `"YYYY-MM-DD"` on purpose - in that format the dates sort
correctly, which is what `orderBy('date', 'desc')` relies on.

### The files

```
src/
├─ main.js                       starts the app (Vue + Ionic + router)
├─ App.vue                       calls startListening() once, for the whole app
├─ firebase.js                   reads .env and connects to Firebase
├─ categories.js                 the 8 categories and findCategory()
├─ expenses.js                   ★ the shared list + ALL FOUR CRUD functions
├─ helpers.js                    formatting money and dates
├─ router/index.js               the three tab routes
├─ components/
│  └─ ExpenseForm.vue            the add / edit form and its validation
└─ views/
   ├─ TabsPage.vue               the bottom tab bar
   ├─ ExpensesPage.vue           the list, search, filter, delete confirmation
   ├─ SummaryPage.vue            totals per category
   └─ AboutPage.vue              team and technology
```

The important idea: **only `expenses.js` talks to Firebase.** The pages import from it
and display the results, so there is exactly one place to look when something about the
database goes wrong.

The whole project is plain JavaScript - no TypeScript, no build step beyond Vite, and no
clever one-liners. Every function is short enough to read out loud.

### The CRUD functions

All four are in `src/expenses.js`:

| Operation | Function | Firestore call | Where it is triggered |
| --- | --- | --- | --- |
| **C**reate | `addExpense()` | `addDoc()` | `+` button → form → **Save** |
| **R**ead | `startListening()` | `onSnapshot()` | Runs once when the app starts (`App.vue`) |
| **U**pdate | `updateExpense()` | `updateDoc()` | Tap a row (or swipe → Edit) → **Save** |
| **D**elete | `deleteExpense()` | `deleteDoc()` | Swipe left → trash icon → confirm |

**Why the list refreshes by itself:** we use `onSnapshot()` instead of a one-time `getDocs()`.
`onSnapshot` is a *live listener* - Firestore pushes a new snapshot every time a document is
added, changed or removed, so after saving or deleting we never have to reload the page
manually. The totals recalculate automatically because they are Vue `computed()` values
derived from the same list.

### Validation

Before anything is written to Firebase, `ExpenseForm.vue` checks that:

- the **name** is not empty,
- the **amount** is a number greater than zero,
- a **date** is chosen.

If a check fails, a red message appears and nothing is sent to Firestore.
The category defaults to *Food* and the notes are optional.

### Security rules

`firestore.rules` also validates the shape of each document on the server side, so a broken
client cannot write junk. To deploy them:

```bash
firebase deploy --only firestore:rules
```

> **Note for the demo:** the app has no login screen, so the rules allow anyone with the
> project keys to read and write. That is acceptable for a classroom project. The comment
> at the top of `firestore.rules` shows what to change if Firebase Authentication is added.

---

## 4. Division of work

> Replace the names below with ours, and update the same list in `src/views/AboutPage.vue`
> so it matches what the app shows on screen.

| Partner | Role | What they did |
| --- | --- | --- |
| **Partner 1** | Front-end / UI Developer | Page layouts and Ionic components, the tab navigation, the expense form modal, the search bar and category filter, the Summary page and the app styling. |
| **Partner 2** | Firebase / Data Developer | Created the Firebase project and Firestore database, wrote `expenses.js` (add / read / update / delete), the security rules, the form validation and the error handling. |

Both partners reviewed the whole codebase together and can explain any file.

---

## 5. Demo checklist

Run through this once before the face-to-face check.

1. **Open the app** with the browser in phone view; the list and total are already there.
2. **Create** - tap `+`, add *"Lunch at canteen", 150.50, Food, today, "Chicken adobo with rice"* → Save.
   Point out that the row, the day subtotal and the grand total all appear
   **without refreshing**.
3. Add two more with different categories so the Summary has something to show.
4. **Read** - type in the search box, then tap a category chip, to show the filtering.
5. **Update** - tap the *Lunch* row, change the amount to `175`, Save. The row and the
   total both update instantly.
6. **Delete** - swipe a row left, tap **Delete**, confirm the alert. The row disappears.
7. Open the **Summary** tab to show the per-category percentages.
8. Open the **Firebase console → Firestore Database** side by side and show the same
   documents living in the cloud. This is the strongest proof that Firebase is really used.
9. Open the **About** tab to show the team and roles.

---

## 6. Questions we should both be able to answer

**What is Ionic and what is Firebase doing here?**
Ionic gives us ready-made mobile UI components (pages, lists, modals, tabs, the date picker)
so the web app looks and behaves like a native phone app. Firebase Cloud Firestore is the
online NoSQL database that stores the expense documents - we did not write any backend
server ourselves.

**How do all three tabs show the same data?**
`expenses.js` declares `export const expenses = ref([])` outside of any function. Because it
sits at the top level of the file, every page that imports it gets the *same* array and the
*same* single Firestore listener. Update it once and all three tabs redraw.

**What does `computed` do?**
It is a value Vue works out from other values, and re-calculates by itself when they change.
`total` is a `computed` that loops through `expenses` and adds up the amounts - so we never
have to remember to update the total after adding or deleting.

**Why is `amount` a number and `date` a string?**
`amount` must be a number so we can add the totals; if it were a string, `150 + 50` would
give `"15050"`. `date` is the text `"YYYY-MM-DD"` because in that exact format alphabetical
sorting is the same as chronological sorting, which makes `orderBy('date')` work.

**What happens if the internet drops mid-demo?**
The Firebase SDK keeps a local cache and queues the write, so the UI still updates and the
change syncs once the connection returns. If the keys are missing entirely, the app shows
the yellow "Setup needed" card instead of a blank screen.

**Where would you add a login?**
Add Firebase Authentication, store the signed-in user's `uid` on every expense document,
filter the query with `where('uid', '==', currentUser.uid)`, and tighten `firestore.rules`
to the commented-out line at the top of that file.

**How is deleting made safe?**
`askBeforeDeleting()` in `ExpensesPage.vue` opens an Ionic confirmation alert first.
`deleteDoc()` only runs if the user taps **Delete**, and the call is wrapped in try/catch so
a failure shows a toast instead of breaking the app.

**How does the list get grouped by day?**
`dayGroups` in `ExpensesPage.vue` walks through the visible expenses one at a time. For each
one it looks for a group with the same date; if there isn't one it starts a new group, then
pushes the expense in and adds its amount to that group's total. That is the whole algorithm
- one loop and a `find`.

---

## 7. Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the development server on port 5173 |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run emulator` | Start the local Firestore emulator |

---

## 8. Where to change the look

| What | File |
| --- | --- |
| Colours, fonts, spacing, all design tokens | `src/theme/variables.css` |
| The `@font-face` declarations | `src/theme/fonts.css` |
| The font files themselves | `public/fonts/` |
| Category names and colours | `src/categories.js` |
