import { useRouter } from 'expo-router';
import { useState } from 'react';

import { DateField } from '@/components/date-field';
import { Sheet } from '@/components/sheet';
import { Button, Card, Empty, Field, Icon, ListRow, Loading, Row, Screen, Segmented, T, ToggleRow } from '@/components/ui';
import { useLoanPayments, useLoans, useSave } from '@/data/queries';
import { loanOutstanding } from '@/lib/calc';
import { daysUntil, formatDate, todayISO } from '@/lib/dates';
import { errorMessage, notify } from '@/lib/dialog';
import { formatINR, parseAmount } from '@/lib/money';
import type { Loan } from '@/lib/types';
import { useColors } from '@/providers/theme';

export default function Loans() {
  const c = useColors();
  const router = useRouter();
  const loans = useLoans();
  const payments = useLoanPayments();
  const save = useSave<Partial<Loan>>('loans');
  const [view, setView] = useState<'open' | 'settled'>('open');
  const [form, setForm] = useState(false);
  const [direction, setDirection] = useState<Loan['direction']>('lent');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [hasDue, setHasDue] = useState(false);
  const [dueDate, setDueDate] = useState(todayISO());
  const [note, setNote] = useState('');

  if (loans.isLoading || payments.isLoading) return <Loading />;

  const all = loans.data ?? [];
  const pays = payments.data ?? [];
  const outstanding = (l: Loan) => loanOutstanding(l, pays);
  const isOpen = (l: Loan) => outstanding(l) > 0;
  const toGet = all.filter((l) => l.direction === 'lent').reduce((s, l) => s + outstanding(l), 0);
  const toPay = all.filter((l) => l.direction === 'borrowed').reduce((s, l) => s + outstanding(l), 0);
  const list = all.filter((l) => (view === 'open' ? isOpen(l) : !isOpen(l)));

  const openForm = () => {
    setDirection('lent');
    setPerson('');
    setAmount('');
    setDate(todayISO());
    setHasDue(false);
    setNote('');
    setForm(true);
  };

  const submit = async () => {
    const amt = parseAmount(amount);
    if (!person.trim()) return notify('Enter the person’s name');
    if (!(amt > 0)) return notify('Enter an amount');
    try {
      await save.mutateAsync({ direction, person: person.trim(), amount: amt, date, due_date: hasDue ? dueDate : null, note: note.trim() });
      setForm(false);
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  };

  return (
    <Screen>
      <Row>
        <Card style={{ flex: 1 }}>
          <T variant="label">You will get</T>
          <T variant="h2" color={c.income}>
            {formatINR(toGet)}
          </T>
        </Card>
        <Card style={{ flex: 1 }}>
          <T variant="label">You owe</T>
          <T variant="h2" color={c.expense}>
            {formatINR(toPay)}
          </T>
        </Card>
      </Row>
      <Button title="Add lend / borrow" icon="plus" onPress={openForm} />
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'open', label: 'Open' },
          { value: 'settled', label: 'Settled' },
        ]}
      />
      <Card>
        {list.length === 0 && <Empty icon="handshake" title={view === 'open' ? 'No open loans' : 'Nothing settled yet'} />}
        {list.map((l) => {
          const out = outstanding(l);
          const d = l.due_date ? daysUntil(l.due_date) : null;
          const sub = [
            l.direction === 'lent' ? 'You lent' : 'You borrowed',
            formatINR(l.amount),
            formatDate(l.date),
            d !== null && out > 0 ? (d < 0 ? `Overdue ${-d}d` : `Due ${formatDate(l.due_date!)}`) : '',
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <ListRow
              key={l.id}
              icon={l.direction === 'lent' ? 'arrow-top-right' : 'arrow-bottom-left'}
              iconColor={l.direction === 'lent' ? c.income : c.expense}
              title={l.person}
              subtitle={sub}
              onPress={() => router.push({ pathname: '/loan/[id]', params: { id: l.id } })}
              right={
                out > 0 ? (
                  <T style={{ fontWeight: '700' }} color={l.direction === 'lent' ? c.income : c.expense}>
                    {formatINR(out)}
                  </T>
                ) : (
                  <Icon name="check-circle" color={c.income} />
                )
              }
            />
          );
        })}
      </Card>

      <Sheet visible={form} title="Lend / borrow" onClose={() => setForm(false)}>
        <Segmented
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'lent', label: 'I gave (lent)', color: c.income },
            { value: 'borrowed', label: 'I took (borrowed)', color: c.expense },
          ]}
        />
        <Field label="Person" value={person} onChangeText={setPerson} placeholder="Name" />
        <Field label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
        <DateField label="Date" value={date} onChange={setDate} />
        <ToggleRow label="Has a due date" hint="Get a reminder on that day" value={hasDue} onChange={setHasDue} />
        {hasDue && <DateField label="Due date" value={dueDate} onChange={setDueDate} />}
        <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
        <Button title="Save" onPress={submit} loading={save.isPending} />
      </Sheet>
    </Screen>
  );
}
