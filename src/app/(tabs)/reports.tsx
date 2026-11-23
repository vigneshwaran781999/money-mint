import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { BarChart, DonutChart } from '@/components/charts';
import { Card, Divider, Empty, IconButton, Loading, Row, Screen, Section, Segmented, T } from '@/components/ui';
import { useAppData } from '@/data/use-app-data';
import { byCategory, inMonth, inYear, monthlySeries, totals } from '@/lib/calc';
import { currentMonthKey, MONTHS, monthLabel, shiftMonth } from '@/lib/dates';
import { formatINR } from '@/lib/money';
import { useColors } from '@/providers/theme';

export default function Reports() {
  const c = useColors();
  const data = useAppData();
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [month, setMonth] = useState(currentMonthKey());
  const year = Number(month.slice(0, 4));

  const periodTx = useMemo(
    () => (mode === 'month' ? inMonth(data.transactions, month) : inYear(data.transactions, year)),
    [data.transactions, mode, month, year],
  );
  const t = useMemo(() => totals(periodTx), [periodTx]);
  const expenseCats = useMemo(() => byCategory(periodTx, data.categories, 'expense'), [periodTx, data.categories]);
  const incomeCats = useMemo(() => byCategory(periodTx, data.categories, 'income'), [periodTx, data.categories]);

  const series = useMemo(() => {
    const end = mode === 'month' ? month : `${year}-12`;
    const count = mode === 'month' ? 6 : 12;
    return monthlySeries(data.transactions, end, count).map((s) => ({
      ...s,
      label: MONTHS[Number(s.key.slice(5)) - 1],
    }));
  }, [data.transactions, mode, month, year]);

  if (data.isLoading) return <Loading />;

  const step = (d: number) => setMonth((m) => shiftMonth(m, mode === 'month' ? d : d * 12));
  const savingsRate = t.income > 0 ? Math.round((t.net / t.income) * 100) : 0;

  return (
    <Screen onRefresh={data.refetch} refreshing={data.isRefetching}>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'month', label: 'Monthly' },
          { value: 'year', label: 'Yearly' },
        ]}
      />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton name="chevron-left" onPress={() => step(-1)} size={28} />
        <T variant="h2">{mode === 'month' ? monthLabel(month) : String(year)}</T>
        <IconButton name="chevron-right" onPress={() => step(1)} size={28} />
      </Row>

      <Card>
        <T variant="label">Profit & Loss</T>
        <PLRow label="Total income" value={t.income} color={c.income} />
        <PLRow label="Total expense" value={-t.expense} color={c.expense} />
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="h2">{t.net >= 0 ? 'Net profit' : 'Net loss'}</T>
          <T variant="h2" color={t.net >= 0 ? c.income : c.expense}>
            {formatINR(t.net, { sign: true })}
          </T>
        </Row>
        {t.income > 0 && <T variant="small">You saved {savingsRate}% of your income.</T>}
      </Card>

      <Section title={mode === 'month' ? 'Last 6 months' : `Month by month, ${year}`}>
        <Card>
          <BarChart data={series} />
        </Card>
      </Section>

      <Section title="Spending by category">
        <Card>
          {expenseCats.length ? (
            <DonutChart data={expenseCats} centerLabel="Spent" />
          ) : (
            <Empty icon="chart-donut" title="No expenses in this period" />
          )}
        </Card>
      </Section>

      <Section title="Income by category">
        <Card>
          {incomeCats.length ? (
            <DonutChart data={incomeCats} centerLabel="Earned" />
          ) : (
            <Empty icon="chart-donut" title="No income in this period" />
          )}
        </Card>
      </Section>

      {mode === 'year' && (
        <Section title="Monthly table">
          <Card>
            <Row>
              <T variant="label" style={{ flex: 1 }}>Month</T>
              <T variant="label" style={{ flex: 1.3, textAlign: 'right' }}>Income</T>
              <T variant="label" style={{ flex: 1.3, textAlign: 'right' }}>Expense</T>
              <T variant="label" style={{ flex: 1.3, textAlign: 'right' }}>Net</T>
            </Row>
            {series.map((s) => {
              const net = s.income - s.expense;
              return (
                <View key={s.key}>
                  <Divider />
                  <Row style={{ paddingVertical: 6 }}>
                    <T style={{ flex: 1 }}>{s.label}</T>
                    <T variant="small" style={{ flex: 1.3, textAlign: 'right' }}>{formatINR(s.income)}</T>
                    <T variant="small" style={{ flex: 1.3, textAlign: 'right' }}>{formatINR(s.expense)}</T>
                    <T variant="small" style={{ flex: 1.3, textAlign: 'right', fontWeight: '700' }} color={net >= 0 ? c.income : c.expense}>
                      {formatINR(net)}
                    </T>
                  </Row>
                </View>
              );
            })}
          </Card>
        </Section>
      )}
    </Screen>
  );
}

function PLRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <T>{label}</T>
      <T style={{ fontWeight: '700' }} color={color}>
        {formatINR(value, { sign: true })}
      </T>
    </Row>
  );
}
