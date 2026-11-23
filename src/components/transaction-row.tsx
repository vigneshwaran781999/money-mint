import { useRouter } from 'expo-router';

import { formatINR } from '@/lib/money';
import type { Account, Category, Transaction } from '@/lib/types';
import { useColors } from '@/providers/theme';

import { ListRow, T } from './ui';

export function TransactionRow({
  tx,
  accounts,
  categories,
  showDate,
}: {
  tx: Transaction;
  accounts: Map<string, Account>;
  categories: Map<string, Category>;
  showDate?: boolean;
}) {
  const c = useColors();
  const router = useRouter();
  const cat = tx.category_id ? categories.get(tx.category_id) : undefined;
  const acc = accounts.get(tx.account_id);
  const to = tx.to_account_id ? accounts.get(tx.to_account_id) : undefined;

  const isTransfer = tx.type === 'transfer';
  const color = isTransfer ? c.transfer : tx.type === 'income' ? c.income : c.expense;
  const title = isTransfer ? 'Transfer' : (cat?.name ?? (tx.type === 'income' ? 'Income' : 'Expense'));
  const where = isTransfer ? `${acc?.name ?? '?'} → ${to?.name ?? '?'}` : (acc?.name ?? '');
  const subtitle = [tx.note, where, showDate ? tx.date : ''].filter(Boolean).join(' · ');
  const sign = isTransfer ? '' : tx.type === 'income' ? '+' : '-';

  return (
    <ListRow
      icon={isTransfer ? 'swap-horizontal' : (cat?.icon ?? 'cash')}
      iconColor={isTransfer ? c.transfer : (cat?.color ?? color)}
      title={title}
      subtitle={subtitle}
      onPress={() => router.push({ pathname: '/transaction', params: { id: tx.id } })}
      right={
        <T style={{ fontWeight: '700' }} color={color}>
          {sign}
          {formatINR(tx.amount)}
        </T>
      }
    />
  );
}
