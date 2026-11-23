import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Select } from '@/components/select';
import { Sheet } from '@/components/sheet';
import { Button, Card, Divider, Empty, Field, IconBadge, Loading, ProgressBar, Row, Screen, T } from '@/components/ui';
import { useBudgets, useRemove, useSave } from '@/data/queries';
import { useAppData } from '@/data/use-app-data';
import { inMonth } from '@/lib/calc';
import { currentMonthKey, monthLabel } from '@/lib/dates';
import { confirm, errorMessage, notify } from '@/lib/dialog';
import { formatINR, parseAmount } from '@/lib/money';
import type { Budget } from '@/lib/types';
import { useColors } from '@/providers/theme';

export default function Budgets() {
  const c = useColors();
  const data = useAppData();
  const budgets = useBudgets();
  const save = useSave<Partial<Budget>>('budgets');
  const remove = useRemove('budgets');
  const [editing, setEditing] = useState<Budget | 'new' | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const month = currentMonthKey();

  const spent = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of inMonth(data.transactions, month))
      if (t.type === 'expense' && t.category_id) m.set(t.category_id, (m.get(t.category_id) ?? 0) + t.amount);
    return m;
  }, [data.transactions, month]);

  if (data.isLoading || budgets.isLoading) return <Loading />;

  const list = budgets.data ?? [];
  const totalBudget = list.reduce((s, b) => s + b.amount, 0);
  const totalSpent = list.reduce((s, b) => s + (spent.get(b.category_id) ?? 0), 0);
  const usedCats = new Set(list.map((b) => b.category_id));

  const open = (b: Budget | 'new') => {
    setEditing(b);
    setCategoryId(b === 'new' ? null : b.category_id);
    setAmount(b === 'new' ? '' : String(b.amount));
  };

  const submit = async () => {
    const amt = parseAmount(amount);
    if (!categoryId) return notify('Choose a category');
    if (!(amt > 0)) return notify('Enter a monthly limit');
    try {
      await save.mutateAsync({ id: editing !== 'new' ? editing?.id : undefined, category_id: categoryId, amount: amt });
      setEditing(null);
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  };

  const del = async () => {
    if (!editing || editing === 'new' || !(await confirm('Remove budget?', 'Your entries are not affected.', 'Remove'))) return;
    await remove.mutateAsync(editing.id);
    setEditing(null);
  };

  return (
    <Screen>
      <Card>
        <T variant="label">{monthLabel(month)}</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="h2">{formatINR(totalSpent)}</T>
          <T variant="muted">of {formatINR(totalBudget)}</T>
        </Row>
        <ProgressBar value={totalBudget ? totalSpent / totalBudget : 0} color={totalSpent > totalBudget ? c.expense : c.primary} />
        <T variant="small">
          {totalSpent > totalBudget ? `Over budget by ${formatINR(totalSpent - totalBudget)}` : `${formatINR(totalBudget - totalSpent)} left this month`}
        </T>
      </Card>

      <Button title="Add budget" icon="plus" onPress={() => open('new')} />

      <Card>
        {list.length === 0 && <Empty icon="target" title="No budgets yet" subtitle="Set a monthly limit for categories like Food or Shopping." />}
        {list.map((b, i) => {
          const cat = data.categoryMap.get(b.category_id);
          const s = spent.get(b.category_id) ?? 0;
          const ratio = s / b.amount;
          const barColor = ratio > 1 ? c.expense : ratio >= 0.8 ? c.warning : c.income;
          return (
            <View key={b.id}>
              {i > 0 && <Divider />}
              <Pressable onPress={() => open(b)} style={{ gap: 6, paddingVertical: 10 }}>
                <Row>
                  <IconBadge name={cat?.icon ?? 'shape'} color={cat?.color ?? c.primary} size={34} />
                  <T style={{ flex: 1, fontWeight: '600' }}>{cat?.name ?? 'Category'}</T>
                  <T variant="small">
                    {formatINR(s)} / {formatINR(b.amount)}
                  </T>
                </Row>
                <ProgressBar value={ratio} color={barColor} />
                <T variant="small" color={ratio > 1 ? c.expense : undefined}>
                  {ratio > 1 ? `Over by ${formatINR(s - b.amount)}` : `${formatINR(b.amount - s)} left`}
                </T>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Sheet visible={editing !== null} title={editing === 'new' ? 'New budget' : 'Edit budget'} onClose={() => setEditing(null)}>
        <Select
          label="Expense category"
          value={categoryId}
          onChange={setCategoryId}
          options={data.categories
            .filter((cat) => cat.kind === 'expense' && (!usedCats.has(cat.id) || (editing !== 'new' && editing?.category_id === cat.id)))
            .map((cat) => ({ value: cat.id, label: cat.name, icon: cat.icon, color: cat.color }))}
        />
        <Field label="Monthly limit (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="5000" />
        <Button title="Save" onPress={submit} loading={save.isPending} />
        {editing !== 'new' && <Button title="Remove budget" variant="danger" onPress={del} />}
      </Sheet>
    </Screen>
  );
}
