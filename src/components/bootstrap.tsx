import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { insertRows, useCategories, useLoans, useRecurring } from '@/data/queries';
import { syncReminders } from '@/lib/notifications';
import { processDueRecurring } from '@/lib/recurring';
import { DEFAULT_CATEGORIES } from '@/lib/types';

/**
 * Invisible component that runs once per signed-in session:
 * seeds default categories, auto-adds due recurring entries, and schedules reminders.
 */
export function Bootstrap() {
  const qc = useQueryClient();
  const categories = useCategories();
  const recurring = useRecurring();
  const loans = useLoans();
  const seeded = useRef(false);
  const processed = useRef(false);

  useEffect(() => {
    if (seeded.current || !categories.isSuccess || categories.data.length > 0) return;
    seeded.current = true;
    insertRows('categories', DEFAULT_CATEGORIES)
      .then(() => qc.invalidateQueries({ queryKey: ['categories'] }))
      .catch((e) => console.warn('Seeding categories failed', e));
  }, [categories.isSuccess, categories.data, qc]);

  useEffect(() => {
    if (processed.current || !recurring.isSuccess) return;
    processed.current = true;
    processDueRecurring(recurring.data)
      .then((n) => {
        if (n > 0) {
          qc.invalidateQueries({ queryKey: ['transactions'] });
          qc.invalidateQueries({ queryKey: ['recurring'] });
        }
      })
      .catch((e) => console.warn('Recurring processing failed', e));
  }, [recurring.isSuccess, recurring.data, qc]);

  useEffect(() => {
    if (recurring.isSuccess && loans.isSuccess) syncReminders(recurring.data, loans.data);
  }, [recurring.isSuccess, recurring.data, loans.isSuccess, loans.data]);

  return null;
}
