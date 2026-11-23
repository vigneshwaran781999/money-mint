import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Platform, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Select } from '@/components/select';
import { Sheet } from '@/components/sheet';
import { Button, Card, Chip, Divider, Empty, Field, IconBadge, Loading, Row, Screen, Segmented, T, ToggleRow } from '@/components/ui';
import { useRecurring, useRemove, useSave } from '@/data/queries';
import { useAppData } from '@/data/use-app-data';
import { daysUntil, formatDate, todayISO } from '@/lib/dates';
import { confirm, errorMessage, notify } from '@/lib/dialog';
import { formatINR, parseAmount } from '@/lib/money';
import { markRecurringPaid, skipRecurring } from '@/lib/recurring';
import { FREQUENCIES, type CategoryKind, type Frequency, type Recurring } from '@/lib/types';
import { useColors } from '@/providers/theme';

type Draft = Omit<Recurring, 'id' | 'amount'> & { id?: string; amount: string };

const emptyDraft = (accountId: string | null): Draft => ({
  title: '',
  type: 'expense',
  amount: '',
  account_id: accountId ?? '',
  category_id: null,
  frequency: 'monthly',
  next_date: todayISO(),
  auto_add: false,
  remind: true,
  active: true,
});

export default function RecurringScreen() {
  const c = useColors();
  const qc = useQueryClient();
  const data = useAppData();
  const rules = useRecurring();
  const save = useSave<Partial<Recurring>>('recurring');
  const remove = useRemove('recurring');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (data.isLoading || rules.isLoading) return <Loading />;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const submit = async () => {
    if (!draft) return;
    const amt = parseAmount(draft.amount);
    if (!draft.title.trim()) return notify('Enter a title', 'e.g. Rent, Salary, Phone bill');
    if (!(amt > 0)) return notify('Enter an amount');
    if (!draft.account_id) return notify('Choose an account');
    try {
      await save.mutateAsync({ ...draft, title: draft.title.trim(), amount: amt });
      setDraft(null);
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  };

  const del = async () => {
    if (!draft?.id || !(await confirm('Delete this rule?', 'Entries already created are kept.'))) return;
    await remove.mutateAsync(draft.id);
    setDraft(null);
  };

  const act = async (r: Recurring, fn: (r: Recurring) => Promise<void>) => {
    setBusyId(r.id);
    try {
      await fn(r);
      await Promise.all([qc.invalidateQueries({ queryKey: ['recurring'] }), qc.invalidateQueries({ queryKey: ['transactions'] })]);
    } catch (e) {
      notify('Something went wrong', errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const list = rules.data ?? [];
  const firstAccount = data.accounts.find((a) => !a.archived)?.id ?? null;

  return (
    <Screen>
      <T variant="muted">
        Add salary, rent, EMIs, subscriptions or bills. Choose to add them automatically on the due date, or just get a reminder
        {Platform.OS === 'web' ? ' (reminders appear on your phone)' : ''}.
      </T>
      <Button title="Add recurring" icon="plus" onPress={() => setDraft(emptyDraft(firstAccount))} disabled={!firstAccount} />

      <Card>
        {list.length === 0 && <Empty icon="calendar-sync" title="Nothing recurring yet" />}
        {list.map((r, i) => {
          const cat = r.category_id ? data.categoryMap.get(r.category_id) : undefined;
          const d = daysUntil(r.next_date);
          const due = d <= 0 && r.active && !r.auto_add;
          return (
            <View key={r.id} style={{ opacity: r.active ? 1 : 0.5 }}>
              {i > 0 && <Divider />}
              <Row style={{ paddingVertical: 10 }}>
                <IconBadge name={cat?.icon ?? 'calendar-sync'} color={cat?.color ?? c.primary} size={38} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '600' }}>{r.title}</T>
                  <T variant="small" color={due ? c.expense : undefined}>
                    {FREQUENCIES.find((f) => f.value === r.frequency)?.label} · {due ? 'Due ' : 'Next '}
                    {formatDate(r.next_date)} · {r.auto_add ? 'Auto-add' : 'Reminder'}
                  </T>
                </View>
                <T style={{ fontWeight: '700' }} color={r.type === 'income' ? c.income : c.expense}>
                  {formatINR(r.amount)}
                </T>
              </Row>
              <Row style={{ paddingBottom: 10, flexWrap: 'wrap' }}>
                {due && <Button small title={r.type === 'income' ? 'Mark received' : 'Mark paid'} icon="check" loading={busyId === r.id} onPress={() => act(r, markRecurringPaid)} />}
                {due && <Button small variant="secondary" title="Skip" onPress={() => act(r, skipRecurring)} />}
                <Button small variant="ghost" title="Edit" icon="pencil" onPress={() => setDraft({ ...r, amount: String(r.amount) })} />
              </Row>
            </View>
          );
        })}
      </Card>

      <Sheet visible={!!draft} title={draft?.id ? 'Edit recurring' : 'New recurring'} onClose={() => setDraft(null)}>
        {draft && (
          <>
            <Segmented<CategoryKind>
              value={draft.type}
              onChange={(v) => setDraft({ ...draft, type: v, category_id: null })}
              options={[
                { value: 'expense', label: 'Expense / bill', color: c.expense },
                { value: 'income', label: 'Income', color: c.income },
              ]}
            />
            <Field label="Title" value={draft.title} onChangeText={(v) => set('title', v)} placeholder="e.g. House rent" />
            <Field label="Amount (₹)" value={draft.amount} onChangeText={(v) => set('amount', v)} keyboardType="decimal-pad" placeholder="0" />
            <Select
              label="Category"
              value={draft.category_id}
              onChange={(v) => set('category_id', v)}
              allowClear
              options={data.categories.filter((x) => x.kind === draft.type).map((x) => ({ value: x.id, label: x.name, icon: x.icon, color: x.color }))}
            />
            <Select
              label="Account"
              value={draft.account_id || null}
              onChange={(v) => set('account_id', v ?? '')}
              options={data.accounts.filter((a) => !a.archived).map((a) => ({ value: a.id, label: a.name, color: a.color, icon: 'bank' }))}
            />
            <T variant="label">Repeats</T>
            <Row style={{ flexWrap: 'wrap' }}>
              {FREQUENCIES.map((f) => (
                <Chip key={f.value} label={f.label} active={draft.frequency === f.value} onPress={() => set('frequency', f.value as Frequency)} />
              ))}
            </Row>
            <DateField label="Next due date" value={draft.next_date} onChange={(v) => set('next_date', v)} />
            <ToggleRow label="Add entry automatically" hint="Creates the entry on the due date without asking" value={draft.auto_add} onChange={(v) => set('auto_add', v)} />
            <ToggleRow label="Remind me" hint="Phone notification at 9 AM on the due date" value={draft.remind} onChange={(v) => set('remind', v)} />
            {draft.id && <ToggleRow label="Active" value={draft.active} onChange={(v) => set('active', v)} />}
            <Button title="Save" onPress={submit} loading={save.isPending} />
            {draft.id && <Button title="Delete" variant="danger" onPress={del} />}
          </>
        )}
      </Sheet>
    </Screen>
  );
}
