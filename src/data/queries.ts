import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Account, Budget, Category, Loan, LoanPayment, Recurring, Transaction } from '@/lib/types';

export type Table =
  | 'accounts'
  | 'categories'
  | 'transactions'
  | 'budgets'
  | 'recurring'
  | 'loans'
  | 'loan_payments';

const NUMERIC_FIELDS = ['amount', 'opening_balance'];

/** PostgREST can return numerics as strings; normalise to numbers. */
function normalise<T>(row: Record<string, unknown>): T {
  for (const f of NUMERIC_FIELDS) if (f in row && row[f] !== null) row[f] = Number(row[f]);
  return row as T;
}

/** Supabase caps a response at 1000 rows by default, so page through everything. */
async function fetchAll<T>(table: Table, orderBy: string, ascending: boolean): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending })
      .order('created_at', { ascending })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []).map((r) => normalise<T>(r)));
    if (!data || data.length < PAGE) return out;
  }
}

const useTable = <T,>(table: Table, orderBy = 'created_at', ascending = true) =>
  useQuery({ queryKey: [table], queryFn: () => fetchAll<T>(table, orderBy, ascending) });

export const useAccounts = () => useTable<Account>('accounts');
export const useCategories = () => useTable<Category>('categories', 'name');
export const useTransactions = () => useTable<Transaction>('transactions', 'date', false);
export const useBudgets = () => useTable<Budget>('budgets');
export const useRecurring = () => useTable<Recurring>('recurring', 'next_date');
export const useLoans = () => useTable<Loan>('loans', 'date', false);
export const useLoanPayments = () => useTable<LoanPayment>('loan_payments', 'date');

/** Insert (no id) or update (with id) a row. */
export async function saveRow<T extends { id?: string }>(table: Table, row: T) {
  const { id, ...fields } = row;
  const rest = fields as Record<string, unknown>;
  const q = id
    ? supabase.from(table).update(rest).eq('id', id).select().single()
    : supabase.from(table).insert(rest).select().single();
  const { data, error } = await q;
  if (error) throw error;
  return normalise<T & { id: string }>(data);
}

export async function insertRows(table: Table, rows: object[]) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

export async function deleteRow(table: Table, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

/** Deleting accounts/categories/loans cascades into other tables. */
const RELATED: Partial<Record<Table, Table[]>> = {
  accounts: ['transactions', 'recurring'],
  categories: ['transactions', 'budgets', 'recurring'],
  loans: ['loan_payments'],
};

function useInvalidate() {
  const qc = useQueryClient();
  return (table: Table) =>
    Promise.all([table, ...(RELATED[table] ?? [])].map((t) => qc.invalidateQueries({ queryKey: [t] })));
}

export function useSave<T extends { id?: string }>(table: Table) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (row: T) => saveRow(table, row),
    onSuccess: () => invalidate(table),
  });
}

export function useRemove(table: Table) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onSuccess: () => invalidate(table),
  });
}
