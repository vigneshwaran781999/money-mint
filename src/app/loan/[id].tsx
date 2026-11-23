import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { DateField } from '@/components/date-field';
import { Sheet } from '@/components/sheet';
import { Button, Card, Empty, Field, IconButton, ListRow, Loading, ProgressBar, Row, Screen, Section, T } from '@/components/ui';
import { useLoanPayments, useLoans, useRemove, useSave } from '@/data/queries';
import { loanOutstanding, loanPaid } from '@/lib/calc';
import { formatDate, todayISO } from '@/lib/dates';
import { confirm, errorMessage, notify } from '@/lib/dialog';
import { formatINR, parseAmount } from '@/lib/money';
import type { Loan, LoanPayment } from '@/lib/types';
import { useColors } from '@/providers/theme';

export default function LoanDetail() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const loans = useLoans();
  const payments = useLoanPayments();
  const saveLoan = useSave<Partial<Loan>>('loans');
  const removeLoan = useRemove('loans');
  const savePayment = useSave<Partial<LoanPayment>>('loan_payments');
  const removePayment = useRemove('loan_payments');
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());

  if (loans.isLoading || payments.isLoading) return <Loading />;
  const loan = loans.data?.find((l) => l.id === id);
  if (!loan) return <Empty icon="handshake" title="Loan not found" />;

  const pays = (payments.data ?? []).filter((p) => p.loan_id === loan.id);
  const paid = loanPaid(loan, pays);
  const out = loanOutstanding(loan, pays);
  const lent = loan.direction === 'lent';
  const tint = lent ? c.income : c.expense;

  const addPayment = async () => {
    const amt = parseAmount(amount);
    if (!(amt > 0)) return notify('Enter an amount');
    try {
      await savePayment.mutateAsync({ loan_id: loan.id, amount: amt, date });
      if (amt >= out) await saveLoan.mutateAsync({ id: loan.id, settled: true });
      setPayOpen(false);
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  };

  const toggleSettled = () => saveLoan.mutate({ id: loan.id, settled: !loan.settled });

  const del = async () => {
    if (!(await confirm('Delete this record?', 'The loan and its repayments will be removed.'))) return;
    await removeLoan.mutateAsync(loan.id);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: loan.person }} />
      <Card>
        <T variant="label">{lent ? `${loan.person} owes you` : `You owe ${loan.person}`}</T>
        <T variant="title" color={tint}>
          {formatINR(out)}
        </T>
        <ProgressBar value={loan.amount ? paid / loan.amount : 0} color={tint} />
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="small">
            {lent ? 'Lent' : 'Borrowed'} {formatINR(loan.amount)} on {formatDate(loan.date)}
          </T>
          <T variant="small">Repaid {formatINR(paid)}</T>
        </Row>
        {loan.due_date && <T variant="small">Due {formatDate(loan.due_date)}</T>}
        {loan.note ? <T variant="muted">{loan.note}</T> : null}
      </Card>

      <Row>
        <Button
          title={lent ? 'Received payment' : 'Made payment'}
          icon="cash-plus"
          style={{ flex: 1 }}
          disabled={out <= 0}
          onPress={() => {
            setAmount(String(out));
            setDate(todayISO());
            setPayOpen(true);
          }}
        />
        <Button title={loan.settled ? 'Reopen' : 'Mark settled'} variant="secondary" style={{ flex: 1 }} onPress={toggleSettled} />
      </Row>

      <Section title="Repayments">
        <Card>
          {pays.length === 0 && <T variant="muted">No repayments yet.</T>}
          {pays.map((p) => (
            <ListRow
              key={p.id}
              icon="cash"
              iconColor={tint}
              title={formatINR(p.amount)}
              subtitle={formatDate(p.date)}
              right={
                <IconButton
                  name="delete-outline"
                  color={c.textMuted}
                  onPress={async () => {
                    if (await confirm('Delete repayment?', formatINR(p.amount))) removePayment.mutate(p.id);
                  }}
                />
              }
            />
          ))}
        </Card>
      </Section>

      <Button title="Delete record" icon="delete" variant="danger" onPress={del} />

      <Sheet visible={payOpen} title="Add repayment" onClose={() => setPayOpen(false)}>
        <Field label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <DateField label="Date" value={date} onChange={setDate} />
        <Button title="Save" onPress={addPayment} loading={savePayment.isPending} />
      </Sheet>
    </Screen>
  );
}
