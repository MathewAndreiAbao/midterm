/**
 * The shape of one expense record.
 *
 * These are exactly the five fields required by the midterm specification
 * (name, amount, category, date, notes) plus the Firestore document id.
 */
export interface Expense {
  /** Firestore document id. Empty for a record that has not been saved yet. */
  id: string;
  /** What the money was spent on, e.g. "Lunch at Jollibee". */
  name: string;
  /** Amount in pesos. Always stored as a number, never a string. */
  amount: number;
  /** One of the ids in CATEGORIES below. */
  category: string;
  /** Date of the expense in "YYYY-MM-DD" form, so it sorts correctly. */
  date: string;
  /** Optional free text. */
  notes: string;
  /** Set by Firestore when the record is created (used as a tie-breaker). */
  createdAt?: number;
}

/** Everything the user types in the form - no id, no timestamp. */
export type ExpenseInput = Omit<Expense, 'id' | 'createdAt'>;

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

/**
 * The fixed list of categories the user can pick from.
 * Keeping them in one place means the list page, the form and the summary
 * page all stay in sync.
 *
 * The colours are deliberately muted and earthy rather than bright - they are
 * only ever used as a small dot on a row or a thin bar on the Summary page.
 */
export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Food', icon: 'fast-food-outline', color: '#9c6644' },
  { id: 'transportation', label: 'Transportation', icon: 'bus-outline', color: '#4a5d5e' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'receipt-outline', color: '#6b6152' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#8c6a72' },
  { id: 'health', label: 'Health', icon: 'medkit-outline', color: '#a15c4e' },
  { id: 'education', label: 'Education', icon: 'school-outline', color: '#4f6155' },
  { id: 'entertainment', label: 'Entertainment', icon: 'game-controller-outline', color: '#8a7a4e' },
  { id: 'others', label: 'Others', icon: 'ellipsis-horizontal-outline', color: '#7a7772' },
];

/** Look up a category by id, falling back to "Others" for unknown values. */
export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
