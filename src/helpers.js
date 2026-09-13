// ---------------------------------------------------------------------------
// helpers.js
//
// Small functions for showing numbers and dates nicely on the screen.
// They do not touch Firebase - they only change how something looks.
// ---------------------------------------------------------------------------

// The peso sign. We keep it in a variable so we can style it separately.
export const PESO = '₱';

// 1234.5  ->  "1,234.50"
export function formatAmount(value) {
  return Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// "2026-09-13"  ->  "Sep 13, 2026"
export function formatDate(dateText) {
  if (!dateText) {
    return '';
  }
  const date = new Date(dateText + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Today's date as "2026-09-13". Used as the default date in the form.
export function todayText() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// The heading above a group of expenses: "Today", "Yesterday" or the date.
export function dayLabel(dateText) {
  if (dateText === todayText()) {
    return 'Today';
  }

  // Work out what yesterday's date was.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');

  if (dateText === year + '-' + month + '-' + day) {
    return 'Yesterday';
  }

  return formatDate(dateText);
}
