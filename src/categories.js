// ---------------------------------------------------------------------------
// categories.js
//
// The list of categories the user can choose from. We keep it in one file so
// the form, the list and the summary page all use exactly the same list.
// ---------------------------------------------------------------------------

export const categories = [
  { id: 'food', label: 'Food', color: '#9c6644' },
  { id: 'transportation', label: 'Transportation', color: '#4a5d5e' },
  { id: 'bills', label: 'Bills & Utilities', color: '#6b6152' },
  { id: 'shopping', label: 'Shopping', color: '#8c6a72' },
  { id: 'health', label: 'Health', color: '#a15c4e' },
  { id: 'education', label: 'Education', color: '#4f6155' },
  { id: 'entertainment', label: 'Entertainment', color: '#8a7a4e' },
  { id: 'others', label: 'Others', color: '#7a7772' },
];

// Find one category using its id, for example 'food'.
// If the id is not in the list we return the last one ("Others").
export function findCategory(id) {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
  }
  return categories[categories.length - 1];
}
