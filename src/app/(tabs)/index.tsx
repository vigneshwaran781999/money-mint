import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { TransactionRow } from '@/components/transaction-row';
import { Button, Card, Divider, Empty, Fab, IconBadge, Loading, ProgressBar, Row, Screen, Section, T } from '@/components/ui';
import { useBudgets, useRecurring } from '@/data/queries';
import { useAppData } from '@/data/use-app-data';
import { inMonth, totals } from '@/lib/calc';
import { currentMonthKey, daysUntil, formatDate, monthLabel } from '@/lib/dates';
import { formatINR } from '@/lib/money';
import { ACCOUNT_TYPES } from '@/lib/types';
import { useColors } from '@/providers/theme';

export default function Home() {
  const c = useColors();
  const router = useRouter();
  const data = useAppData();
  const budgets = useBudgets();
  const recurring = useRecurring();
  const month = currentMonthKey();

  const monthTx = useMemo(() => inMonth(data.transactions, month), [data.transactions, month]);
  const t = useMemo(() => totals(monthTx), [monthTx]);

  const budgetAlerts = useMemo(() => {
    const spent = new Map<string, number>();
    for (const tx of monthTx) if (tx.type === 'expense' && tx.category_id) spent.set(tx.category_id, (spent.get(tx.category_id) ?? 0) + tx.amount);
    return (budgets.data ?? [])
      .map((b) => ({ b, spent: spent.get(b.category_id) ?? 0, cat: data.categoryMap.get(b.category_id) }))
      .filter((x) => x.spent >= x.b.amount * 0.8)
      .sort((a, b) => b.spent / b.b.amount - a.spent / a.b.amount);
  }, [budgets.data, monthTx, data.categoryMap]);

  const upcoming = useMemo(
    () => (recurring.data ?? []).filter((r) => r.active && daysUntil(r.next_date) <= 7).slice(0, 5),
    [recurring.data],
  );

  if (data.isLoading) return <Loading />;
  if (data.error) return <Empty icon="cloud-off-outline" title="Couldn't load your data" subtitle={String(data.error.message)} action={<Button title="Retry" onPress={data.refetch} />} />;

  const add = () => router.push('/transaction');
  const activeAccounts = data.accounts.filter((a) => !a.archived);

  return (
    <Screen onRefresh={data.refetch} refreshing={data.isRefetching} footer={<Fab onPress={add} />}>
      {/* Summary */}
      <Card style={{ backgroundColor: c.primaryDark, borderColor: c.primaryDark, gap: 12 }}>
        <T variant="small" color="#D1FAE5">
          Total balance
        </T>
        <T variant="title" color="#fff" style={{ fontSize: 32 }}>
          {formatINR(data.totalBalance)}
        </T>
        <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
          <Stat label="Income" value={t.income} />
          <Stat label="Expense" value={t.expense} />
          <Stat label={t.net >= 0 ? 'Profit' : 'Loss'} value={t.net} />
        </Row>
        <T variant="small" color="#D1FAE5">
          {monthLabel(month)}
        </T>
      </Card>

      {data.accounts.length === 0 && (
        <Card>
          <Empty
            icon="bank-plus"
            title="Add your first account"
            subtitle="Add your bank accounts, cash, UPI or card to start tracking."
            action={<Button title="Add account" icon="plus" onPress={() => router.push('/(tabs)/accounts')} />}
          />
        </Card>
      )}

      {/* Accounts strip */}
      {activeAccounts.length > 0 && (
        <Section title="Accounts">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {activeAccounts.map((a) => (
              <Card key={a.id} style={{ width: 160 }} onPress={() => router.push({ pathname: '/account/[id]', params: { id: a.id } })}>
                <IconBadge name={ACCOUNT_TYPES.find((x) => x.value === a.type)?.icon ?? 'bank'} color={a.color} size={34} />
                <T numberOfLines={1} style={{ fontWeight: '600' }}>
                  {a.name}
                </T>
                <T style={{ fontWeight: '800' }} color={(data.balances.get(a.id) ?? 0) < 0 ? c.expense : undefined}>
                  {formatINR(data.balances.get(a.id) ?? 0)}
                </T>
              </Card>
            ))}
          </ScrollView>
        </Section>
      )}

      {/* Budget alerts */}
      {budgetAlerts.length > 0 && (
        <Section title="Budget alerts">
          <Card>
            {budgetAlerts.map(({ b, spent, cat }) => {
              const over = spent > b.amount;
              return (
                <View key={b.id} style={{ gap: 6, paddingVertical: 4 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T style={{ fontWeight: '600' }}>{cat?.name ?? 'Category'}</T>
                    <T variant="small" color={over ? c.expense : c.warning}>
                      {formatINR(spent)} / {formatINR(b.amount)}
                    </T>
                  </Row>
                  <ProgressBar value={spent / b.amount} color={over ? c.expense : c.warning} />
                </View>
              );
            })}
          </Card>
        </Section>
      )}

      {/* Upcoming bills */}
      {upcoming.length > 0 && (
        <Section title="Upcoming" action={<Button title="All" variant="ghost" small onPress={() => router.push('/recurring')} />}>
          <Card>
            {upcoming.map((r, i) => {
              const d = daysUntil(r.next_date);
              return (
                <View key={r.id}>
                  {i > 0 && <Divider />}
                  <Row style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
                    <View style={{ flex: 1 }}>
                      <T style={{ fontWeight: '600' }}>{r.title}</T>
                      <T variant="small" color={d < 0 ? c.expense : undefined}>
                        {d < 0 ? `Overdue · ${formatDate(r.next_date)}` : d === 0 ? 'Due today' : `In ${d} day${d > 1 ? 's' : ''} · ${formatDate(r.next_date)}`}
                      </T>
                    </View>
                    <T style={{ fontWeight: '700' }} color={r.type === 'income' ? c.income : c.expense}>
                      {formatINR(r.amount)}
                    </T>
                  </Row>
                </View>
              );
            })}
          </Card>
        </Section>
      )}

      {/* Recent */}
      <Section title="Recent entries" action={<Button title="See all" variant="ghost" small onPress={() => router.push('/(tabs)/transactions')} />}>
        <Card>
          {data.transactions.length === 0 ? (
            <Empty icon="notebook-edit-outline" title="No entries yet" subtitle="Tap + to add today's income or expense." />
          ) : (
            data.transactions.slice(0, 8).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} accounts={data.accountMap} categories={data.categoryMap} showDate />
            ))
          )}
        </Card>
      </Section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ gap: 2 }}>
      <T variant="small" color="#D1FAE5">
        {label}
      </T>
      <T color="#fff" style={{ fontWeight: '700', fontSize: 16 }}>
        {formatINR(Math.abs(value))}
      </T>
    </View>
  );
}
