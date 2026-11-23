import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, SectionList, View } from 'react-native';

import { Select } from '@/components/select';
import { TransactionRow } from '@/components/transaction-row';
import { Card, Chip, Empty, Fab, Field, Loading, Row, T } from '@/components/ui';
import { MaxContentWidth, Space } from '@/constants/theme';
import { useAppData } from '@/data/use-app-data';
import { totals } from '@/lib/calc';
import { currentMonthKey, formatDayHeader, monthKey, shiftMonth } from '@/lib/dates';
import { formatINR } from '@/lib/money';
import type { Transaction, TxType } from '@/lib/types';
import { useColors } from '@/providers/theme';

type Period = 'month' | 'last' | 'year' | 'all';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'last', label: 'Last month' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

export default function Transactions() {
  const c = useColors();
  const router = useRouter();
  const data = useAppData();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TxType | 'all'>('all');
  const [period, setPeriod] = useState<Period>('month');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const thisMonth = currentMonthKey();
    const q = search.trim().toLowerCase();
    return data.transactions.filter((t) => {
      if (type !== 'all' && t.type !== type) return false;
      if (period === 'month' && monthKey(t.date) !== thisMonth) return false;
      if (period === 'last' && monthKey(t.date) !== shiftMonth(thisMonth, -1)) return false;
      if (period === 'year' && !t.date.startsWith(thisMonth.slice(0, 4))) return false;
      if (accountId && t.account_id !== accountId && t.to_account_id !== accountId) return false;
      if (categoryId && t.category_id !== categoryId) return false;
      if (q) {
        const hay = [
          t.note,
          t.amount.toString(),
          t.category_id ? data.categoryMap.get(t.category_id)?.name : '',
          data.accountMap.get(t.account_id)?.name,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data.transactions, data.categoryMap, data.accountMap, search, type, period, accountId, categoryId]);

  const sections = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of filtered) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
    return [...groups.entries()].map(([date, items]) => ({ date, data: items, net: totals(items).net }));
  }, [filtered]);

  const sum = useMemo(() => totals(filtered), [filtered]);

  if (data.isLoading) return <Loading />;

  const filterCount = [accountId, categoryId].filter(Boolean).length;

  const header = (
    <View style={{ gap: Space.md, paddingBottom: Space.sm }}>
      <Row>
        <View style={{ flex: 1 }}>
          <Field value={search} onChangeText={setSearch} placeholder="Search notes, category, amount…" />
        </View>
        <Chip label={filterCount ? `Filters (${filterCount})` : 'Filters'} active={showFilters || filterCount > 0} onPress={() => setShowFilters((s) => !s)} />
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {PERIODS.map((p) => (
          <Chip key={p.value} label={p.label} active={period === p.value} onPress={() => setPeriod(p.value)} />
        ))}
        <View style={{ width: 8 }} />
        {(['all', 'income', 'expense', 'transfer'] as const).map((v) => (
          <Chip
            key={v}
            label={v === 'all' ? 'All types' : v[0].toUpperCase() + v.slice(1)}
            active={type === v}
            color={v === 'income' ? c.income : v === 'expense' ? c.expense : v === 'transfer' ? c.transfer : undefined}
            onPress={() => setType(v)}
          />
        ))}
      </ScrollView>
      {showFilters && (
        <Card>
          <Select
            label="Account"
            value={accountId}
            onChange={setAccountId}
            allowClear
            placeholder="All accounts"
            options={data.accounts.map((a) => ({ value: a.id, label: a.name, color: a.color, icon: 'bank' }))}
          />
          <Select
            label="Category"
            value={categoryId}
            onChange={setCategoryId}
            allowClear
            placeholder="All categories"
            options={data.categories.map((cat) => ({ value: cat.id, label: cat.name, icon: cat.icon, color: cat.color, subtitle: cat.kind }))}
          />
        </Card>
      )}
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Total label="Income" value={sum.income} color={c.income} />
        <Total label="Expense" value={sum.expense} color={c.expense} />
        <Total label={sum.net >= 0 ? 'Profit' : 'Loss'} value={Math.abs(sum.net)} color={sum.net >= 0 ? c.income : c.expense} />
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: Space.lg, paddingBottom: 120, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}
        refreshControl={<RefreshControl refreshing={data.isRefetching} onRefresh={data.refetch} colors={[c.primary]} tintColor={c.primary} />}
        renderSectionHeader={({ section }) => (
          <Row style={{ justifyContent: 'space-between', marginTop: Space.md, marginBottom: 4 }}>
            <T variant="label">{formatDayHeader(section.date)}</T>
            <T variant="small" color={section.net >= 0 ? c.income : c.expense}>
              {formatINR(section.net, { sign: true })}
            </T>
          </Row>
        )}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: c.surface, paddingHorizontal: Space.md, borderRadius: 12, marginBottom: 4 }}>
            <TransactionRow tx={item} accounts={data.accountMap} categories={data.categoryMap} />
          </View>
        )}
        ListEmptyComponent={<Empty icon="magnify" title="No entries found" subtitle="Try another period or filter, or tap + to add one." />}
      />
      <Fab onPress={() => router.push('/transaction')} />
    </View>
  );
}

function Total({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <T variant="small">{label}</T>
      <T style={{ fontWeight: '700' }} color={color}>
        {formatINR(value)}
      </T>
    </View>
  );
}
