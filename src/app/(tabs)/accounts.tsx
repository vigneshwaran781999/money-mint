import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AccountForm } from '@/components/account-form';
import { Button, Card, Divider, Empty, ListRow, Loading, Row, Screen, Section, T } from '@/components/ui';
import { useAppData } from '@/data/use-app-data';
import { formatINR } from '@/lib/money';
import { ACCOUNT_TYPES } from '@/lib/types';
import { useColors } from '@/providers/theme';

export default function Accounts() {
  const c = useColors();
  const router = useRouter();
  const data = useAppData();
  const [formOpen, setFormOpen] = useState(false);

  if (data.isLoading) return <Loading />;

  const active = data.accounts.filter((a) => !a.archived);
  const archived = data.accounts.filter((a) => a.archived);

  const assets = active.reduce((s, a) => s + Math.max(0, data.balances.get(a.id) ?? 0), 0);
  const debts = active.reduce((s, a) => s + Math.min(0, data.balances.get(a.id) ?? 0), 0);

  const renderList = (list: typeof active) =>
    list.map((a, i) => {
      const bal = data.balances.get(a.id) ?? 0;
      const type = ACCOUNT_TYPES.find((x) => x.value === a.type);
      return (
        <ListRow
          key={a.id}
          icon={type?.icon ?? 'bank'}
          iconColor={a.color}
          title={a.name}
          subtitle={type?.label}
          onPress={() => router.push({ pathname: '/account/[id]', params: { id: a.id } })}
          right={
            <T style={{ fontWeight: '700' }} color={bal < 0 ? c.expense : undefined}>
              {formatINR(bal)}
            </T>
          }
        />
      );
    });

  return (
    <Screen onRefresh={data.refetch} refreshing={data.isRefetching}>
      <Card>
        <T variant="label">Net worth</T>
        <T variant="title">{formatINR(data.totalBalance)}</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="small">Assets {formatINR(assets)}</T>
          <T variant="small" color={c.expense}>
            Owed {formatINR(Math.abs(debts))}
          </T>
        </Row>
      </Card>

      <Row>
        <Button title="Add account" icon="plus" onPress={() => setFormOpen(true)} style={{ flex: 1 }} />
        <Button
          title="Transfer"
          icon="swap-horizontal"
          variant="secondary"
          disabled={active.length < 2}
          onPress={() => router.push({ pathname: '/transaction', params: { type: 'transfer' } })}
          style={{ flex: 1 }}
        />
      </Row>

      <Section title="Accounts">
        <Card>
          {active.length ? (
            renderList(active)
          ) : (
            <Empty icon="bank-plus" title="No accounts yet" subtitle="Add bank, cash, UPI, wallet or credit card accounts." />
          )}
        </Card>
      </Section>

      {archived.length > 0 && (
        <Section title="Archived">
          <Card>
            <Divider />
            {renderList(archived)}
          </Card>
        </Section>
      )}

      <AccountForm visible={formOpen} onClose={() => setFormOpen(false)} />
    </Screen>
  );
}
