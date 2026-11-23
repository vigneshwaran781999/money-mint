import { shareTextFile } from './share-file';
import type { Account, Category, Transaction } from './types';

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function transactionsToCSV(txs: Transaction[], accounts: Account[], categories: Category[]): string {
  const acc = new Map(accounts.map((a) => [a.id, a.name]));
  const cat = new Map(categories.map((c) => [c.id, c.name]));
  const header = ['Date', 'Type', 'Amount', 'Account', 'To account', 'Category', 'Note'];
  const rows = [...txs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      t.date,
      t.type,
      t.amount.toFixed(2),
      acc.get(t.account_id) ?? '',
      t.to_account_id ? (acc.get(t.to_account_id) ?? '') : '',
      t.category_id ? (cat.get(t.category_id) ?? '') : '',
      t.note,
    ]);
  return [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export async function exportTransactionsCSV(txs: Transaction[], accounts: Account[], categories: Category[]) {
  const csv = transactionsToCSV(txs, accounts, categories);
  const stamp = new Date().toISOString().slice(0, 10);
  await shareTextFile(`money-mint-${stamp}.csv`, '﻿' + csv, 'text/csv');
}
