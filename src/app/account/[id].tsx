import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AccountForm } from '@/components/account-form';
import { TransactionRow } from '@/components/transaction-row';
import { Button, Card, Empty, Loading, Row, Screen, Section, T } from '@/components/ui';
import { useRemove, useSave } from '@/data/queries';
import { useAppData } from '@/data/use-app-data';
import { inMonth, totals } from '@/lib/calc';
import { currentMonthKey } from '@/lib/dates';
import { confirm, errorMessage, notify } from '@/lib/dialog';
import { formatINR } from '@/lib/money';
import type { Account } from '@/lib/types';
import { useColors } from '@/providers/theme';

export default function AccountDetail() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useAppData();
  const save = useSave<Partial<Account>>('accounts');
  const remove = useRemove('accounts');
  const [editing, setEditing] = useState(false);

  const account = data.accountMap.get(id);
  const ledger = useMemo(
    () => data.transactions.filter((t) => t.account_id === id || t.to_account_id === id),
    [data.transactions, id],
  );
  const month = useMemo(() => {
    // Transfers count as money in/out for this account's monthly flow.
    const m = inMonth(ledger, currentMonthKey());
    const base = totals(m);
    let inflow = base.income;
    let outflow = base.expense;
    for (const t of m) {
      if (t.type !== 'transfer') continue;
      if (t.to_account_id === id) inflow += t.amount;
      else outflow += t.amount;
    }
    return { inflow, outflow };
  }, [ledger, id]);

  if (data.isLoading) return <Loading />;
  if (!account) return <Empty icon="bank-off" title="Account not found" />;

  const balance = data.balances.get(account.id) ?? 0;

  const toggleArchive = async () => {
    try {
      await save.mutateAsync({ id: account.id, archived: !account.archived });
    } catch (e) {
      notify('Could not update', errorMessage(e));
    }
  };

  const del = async () => {
    const ok = await confirm(
      'Delete account?',
      `This permanently deletes "${account.name}" and all ${ledger.length} of its entries. Archive it instead to keep history.`,
    );
    if (!ok) return;
    try {
      await remove.mutateAsync(account.id);
      router.back();
    } catch (e) {
      notify('Could not delete', errorMessage(e));
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: account.name }} />
      <Card style={{ borderLeftWidth: 6, borderLeftColor: account.color }}>
        <T variant="label">Current balance</T>
        <T variant="title" color={balance < 0 ? c.expense : undefined}>
          {formatINR(balance)}
        </T>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="small" color={c.income}>
            In this month {formatINR(month.inflow)}
          </T>
          <T variant="small" color={c.expense}>
            Out this month {formatINR(month.outflow)}
          </T>
        </Row>
        <T variant="small">Opening balance {formatINR(account.opening_balance)}</T>
      </Card>

      <Row>
        <Button title="Edit" icon="pencil" variant="secondary" small onPress={() => setEditing(true)} style={{ flex: 1 }} />
        <Button
          title={account.archived ? 'Unarchive' : 'Archive'}
          icon="archive"
          variant="secondary"
          small
          onPress={toggleArchive}
          style={{ flex: 1 }}
        />
        <Button title="Delete" icon="delete" variant="danger" small onPress={del} style={{ flex: 1 }} />
      </Row>

      <Button
        title="Add entry to this account"
        icon="plus"
        onPress={() => router.push({ pathname: '/transaction', params: { accountId: account.id } })}
      />

      <Section title={`Entries (${ledger.length})`}>
        <Card>
          {ledger.length ? (
            ledger.slice(0, 300).map((t) => (
              <View key={t.id}>
                <TransactionRow tx={t} accounts={data.accountMap} categories={data.categoryMap} showDate />
              </View>
            ))
          ) : (
            <Empty icon="notebook-outline" title="No entries in this account yet" />
          )}
        </Card>
      </Section>

      <AccountForm visible={editing} account={account} onClose={() => setEditing(false)} />
    </Screen>
  );
}
