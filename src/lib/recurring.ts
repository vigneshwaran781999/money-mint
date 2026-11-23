import { insertRows, saveRow } from '@/data/queries';

import { addFrequency, todayISO } from './dates';
import type { Recurring } from './types';

const MAX_CATCH_UP = 120;

const txFrom = (r: Recurring, date: string) => ({
  type: r.type,
  amount: r.amount,
  account_id: r.account_id,
  category_id: r.category_id,
  date,
  note: r.title,
});

/**
 * For every active auto-add rule whose date has passed, create the missing
 * transactions (catching up on days the app was not opened) and move `next_date` forward.
 * Returns how many transactions were created.
 */
export async function processDueRecurring(rules: Recurring[]): Promise<number> {
  const today = todayISO();
  let created = 0;
  for (const r of rules) {
    if (!r.active || !r.auto_add || r.next_date > today) continue;
    const dates: string[] = [];
    let next = r.next_date;
    while (next <= today && dates.length < MAX_CATCH_UP) {
      dates.push(next);
      next = addFrequency(next, r.frequency);
    }
    // Advance first so a crash/retry can never create duplicates.
    await saveRow('recurring', { id: r.id, next_date: next });
    await insertRows('transactions', dates.map((d) => txFrom(r, d)));
    created += dates.length;
  }
  return created;
}

/** For reminder-only bills: record today's payment and schedule the next due date. */
export async function markRecurringPaid(r: Recurring) {
  await saveRow('recurring', { id: r.id, next_date: addFrequency(r.next_date, r.frequency) });
  await insertRows('transactions', [txFrom(r, todayISO())]);
}

/** Skip this occurrence without recording a transaction. */
export async function skipRecurring(r: Recurring) {
  await saveRow('recurring', { id: r.id, next_date: addFrequency(r.next_date, r.frequency) });
}
