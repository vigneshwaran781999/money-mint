import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Select } from '@/components/select';
import { Button, Card, Empty, Field, IconBadge, Loading, Row, Screen, Segmented, T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useRemove, useSave } from '@/data/queries';
import { useAppData } from '@/data/use-app-data';
import { todayISO } from '@/lib/dates';
import { confirm, errorMessage, notify } from '@/lib/dialog';
import { formatINR, parseAmount } from '@/lib/money';
import { prefs } from '@/lib/prefs';
import { ACCOUNT_TYPES, type Transaction, type TxType } from '@/lib/types';
import { useColors } from '@/providers/theme';

type Params = { id?: string; type?: TxType; accountId?: string };

/** Waits for data, then mounts the form with its initial values. */
export default function TransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const data = useAppData();

  if (data.isLoading) return <Loading />;
  const existing = params.id ? data.transactions.find((t) => t.id === params.id) : undefined;
  if (params.id && !existing) return <Empty icon="file-question" title="Entry not found" />;
  if (!data.accounts.some((a) => !a.archived))
    return (
      <Empty
        icon="bank-plus"
        title="Add an account first"
        subtitle="Every entry belongs to an account such as Cash or your bank."
        action={<Button title="Go to accounts" onPress={() => router.replace('/(tabs)/accounts')} />}
      />
    );
  return <TransactionForm existing={existing} params={params} data={data} />;
}

function TransactionForm({
  existing,
  params,
  data,
}: {
  existing?: Transaction;
  params: Params;
  data: ReturnType<typeof useAppData>;
}) {
  const c = useColors();
  const router = useRouter();
  const save = useSave<Partial<Transaction>>('transactions');
  const remove = useRemove('transactions');
  const amountRef = useRef<ComponentRef<typeof TextInput>>(null);

  const activeAccounts = useMemo(
    () => data.accounts.filter((a) => !a.archived || a.id === existing?.account_id || a.id === existing?.to_account_id),
    [data.accounts, existing],
  );

  const defaultAccount = () => {
    const last = prefs.get('lastAccount');
    return params.accountId ?? activeAccounts.find((a) => a.id === last)?.id ?? activeAccounts[0]?.id ?? null;
  };

  const [type, setType] = useState<TxType>(existing?.type ?? params.type ?? 'expense');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id ?? null);
  const [accountId, setAccountId] = useState<string | null>(existing?.account_id ?? defaultAccount);
  const [toAccountId, setToAccountId] = useState<string | null>(existing?.to_account_id ?? null);
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [note, setNote] = useState(existing?.note ?? '');

  const categories = useMemo(() => data.categories.filter((cat) => cat.kind === type), [data.categories, type]);
  const accountOptions = activeAccounts.map((a) => ({
    value: a.id,
    label: a.name,
    subtitle: formatINR(data.balances.get(a.id) ?? 0),
    icon: ACCOUNT_TYPES.find((t) => t.value === a.type)?.icon ?? 'bank',
    color: a.color,
  }));

  const color = type === 'income' ? c.income : type === 'expense' ? c.expense : c.transfer;

  const submit = async (addAnother: boolean) => {
    const amt = parseAmount(amount);
    if (!(amt > 0)) return notify('Enter an amount', 'Amount must be more than 0 (up to 2 decimals).');
    if (!accountId) return notify('Choose an account');
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId))
      return notify('Choose a different "to" account for the transfer');
    try {
      await save.mutateAsync({
        id: existing?.id,
        type,
        amount: amt,
        account_id: accountId,
        to_account_id: type === 'transfer' ? toAccountId : null,
        category_id: type === 'transfer' ? null : categoryId,
        date,
        note: note.trim(),
      });
      prefs.set('lastAccount', accountId);
      if (addAnother) {
        setAmount('');
        setNote('');
        amountRef.current?.focus();
      } else {
        router.back();
      }
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  };

  const del = async () => {
    if (!existing || !(await confirm('Delete entry?', 'This cannot be undone.'))) return;
    try {
      await remove.mutateAsync(existing.id);
      router.back();
    } catch (e) {
      notify('Could not delete', errorMessage(e));
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit entry' : 'New entry' }} />
      <Segmented
        value={type}
        onChange={(v) => {
          setType(v);
          setCategoryId(null);
        }}
        options={[
          { value: 'expense', label: 'Expense', color: c.expense },
          { value: 'income', label: 'Income', color: c.income },
          { value: 'transfer', label: 'Transfer', color: c.transfer },
        ]}
      />

      <Card style={{ alignItems: 'center' }}>
        <T variant="label">Amount</T>
        <Row gap={4}>
          <T style={{ fontSize: 34, fontWeight: '800' }} color={color}>
            ₹
          </T>
          <TextInput
            ref={amountRef}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={c.textMuted}
            autoFocus={!existing}
            style={{ fontSize: 40, fontWeight: '800', color, minWidth: 120, textAlign: 'center', padding: 0 }}
          />
        </Row>
      </Card>

      {type !== 'transfer' && (
        <View style={{ gap: 8 }}>
          <T variant="label">Category</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(active ? null : cat.id)}
                  style={{
                    width: 84,
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 8,
                    borderRadius: Radius.md,
                    borderWidth: 2,
                    borderColor: active ? cat.color : 'transparent',
                    backgroundColor: active ? cat.color + '18' : c.surface,
                  }}>
                  <IconBadge name={cat.icon} color={cat.color} size={36} />
                  <T variant="small" numberOfLines={1} style={{ maxWidth: 76 }} color={active ? cat.color : undefined}>
                    {cat.name}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <Select label={type === 'transfer' ? 'From account' : 'Account'} value={accountId} onChange={setAccountId} options={accountOptions} />
      {type === 'transfer' && (
        <Select
          label="To account"
          value={toAccountId}
          onChange={setToAccountId}
          options={accountOptions.filter((o) => o.value !== accountId)}
        />
      )}
      <DateField label="Date" value={date} onChange={setDate} />
      <Field label="Note" value={note} onChangeText={setNote} placeholder="e.g. Vegetables, petrol, electricity bill" />

      <Button title={existing ? 'Save changes' : 'Save'} onPress={() => submit(false)} loading={save.isPending} />
      {!existing && <Button title="Save & add another" variant="secondary" onPress={() => submit(true)} disabled={save.isPending} />}
      {existing && <Button title="Delete entry" icon="delete" variant="danger" onPress={del} loading={remove.isPending} />}
    </Screen>
  );
}
