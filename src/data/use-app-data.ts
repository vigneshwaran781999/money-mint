import { useMemo } from 'react';

import { accountBalances } from '@/lib/calc';

import { useAccounts, useCategories, useTransactions } from './queries';

/** Accounts, categories, transactions plus lookup maps and live balances. */
export function useAppData() {
  const accountsQ = useAccounts();
  const categoriesQ = useCategories();
  const txQ = useTransactions();

  const accounts = useMemo(() => accountsQ.data ?? [], [accountsQ.data]);
  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const transactions = useMemo(() => txQ.data ?? [], [txQ.data]);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const balances = useMemo(() => accountBalances(accounts, transactions), [accounts, transactions]);
  const totalBalance = useMemo(
    () => accounts.filter((a) => !a.archived).reduce((s, a) => s + (balances.get(a.id) ?? 0), 0),
    [accounts, balances],
  );

  return {
    accounts,
    categories,
    transactions,
    accountMap,
    categoryMap,
    balances,
    totalBalance,
    isLoading: accountsQ.isLoading || categoriesQ.isLoading || txQ.isLoading,
    error: accountsQ.error ?? categoriesQ.error ?? txQ.error,
    refetch: () => {
      void Promise.all([accountsQ.refetch(), categoriesQ.refetch(), txQ.refetch()]);
    },
    isRefetching: accountsQ.isRefetching || txQ.isRefetching,
  };
}
