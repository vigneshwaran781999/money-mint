import { monthKey, shiftMonth } from './dates';
import type { Account, Category, Loan, LoanPayment, Transaction } from './types';

/** opening balance + income − expense − transfers out + transfers in */
export function accountBalances(accounts: Account[], txs: Transaction[]): Map<string, number> {
  const bal = new Map(accounts.map((a) => [a.id, a.opening_balance]));
  const add = (id: string | null, v: number) => {
    if (id && bal.has(id)) bal.set(id, (bal.get(id) ?? 0) + v);
  };
  for (const t of txs) {
    if (t.type === 'income') add(t.account_id, t.amount);
    else if (t.type === 'expense') add(t.account_id, -t.amount);
    else {
      add(t.account_id, -t.amount);
      add(t.to_account_id, t.amount);
    }
  }
  return bal;
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
}

export function totals(txs: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

export const inMonth = (txs: Transaction[], key: string) => txs.filter((t) => monthKey(t.date) === key);
export const inYear = (txs: Transaction[], year: number) => txs.filter((t) => t.date.startsWith(`${year}-`));

export interface CategorySlice {
  id: string;
  name: string;
  color: string;
  value: number;
}

export function byCategory(txs: Transaction[], categories: Category[], kind: 'income' | 'expense'): CategorySlice[] {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const sums = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== kind) continue;
    const k = t.category_id ?? 'none';
    sums.set(k, (sums.get(k) ?? 0) + t.amount);
  }
  return [...sums.entries()]
    .map(([id, value]) => {
      const c = catMap.get(id);
      return { id, value, name: c?.name ?? 'Uncategorised', color: c?.color ?? '#94A3B8' };
    })
    .sort((a, b) => b.value - a.value);
}

/** Income/expense for the `count` months ending at `endKey` (oldest first). */
export function monthlySeries(txs: Transaction[], endKey: string, count: number) {
  const keys = Array.from({ length: count }, (_, i) => shiftMonth(endKey, i - count + 1));
  const map = new Map(keys.map((k) => [k, { key: k, income: 0, expense: 0 }]));
  for (const t of txs) {
    const row = map.get(monthKey(t.date));
    if (!row) continue;
    if (t.type === 'income') row.income += t.amount;
    else if (t.type === 'expense') row.expense += t.amount;
  }
  return keys.map((k) => map.get(k)!);
}

export function loanPaid(loan: Loan, payments: LoanPayment[]): number {
  return payments.filter((p) => p.loan_id === loan.id).reduce((s, p) => s + p.amount, 0);
}

export const loanOutstanding = (loan: Loan, payments: LoanPayment[]) =>
  loan.settled ? 0 : Math.max(0, loan.amount - loanPaid(loan, payments));
