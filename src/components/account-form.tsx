import { useState } from 'react';

import { useSave } from '@/data/queries';
import { errorMessage, notify } from '@/lib/dialog';
import { parseAmount } from '@/lib/money';
import { ACCOUNT_TYPES, type Account, type AccountType } from '@/lib/types';

import { ColorPicker, Sheet } from './sheet';
import { Button, Chip, Field, Row, T } from './ui';

export function AccountForm({ visible, account, onClose }: { visible: boolean; account?: Account | null; onClose: () => void }) {
  return (
    <Sheet visible={visible} title={account ? 'Edit account' : 'New account'} onClose={onClose}>
      {/* Mounted fresh each time the sheet opens, so fields start from the current account. */}
      {visible && <AccountFormBody key={account?.id ?? 'new'} account={account} onDone={onClose} />}
    </Sheet>
  );
}

function AccountFormBody({ account, onDone }: { account?: Account | null; onDone: () => void }) {
  const save = useSave<Partial<Account>>('accounts');
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'bank');
  const [opening, setOpening] = useState(account ? String(account.opening_balance) : '');
  const [color, setColor] = useState(account?.color ?? '#10B981');

  const submit = async () => {
    const negative = opening.trim().startsWith('-');
    const amt = opening.trim() === '' ? 0 : parseAmount(opening.replace('-', ''));
    if (!name.trim()) return notify('Enter an account name');
    if (Number.isNaN(amt)) return notify('Enter a valid opening balance');
    try {
      await save.mutateAsync({
        id: account?.id,
        name: name.trim(),
        type,
        opening_balance: negative ? -amt : amt,
        color,
      });
      onDone();
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  };

  return (
    <>
      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. SBI Savings, Cash, GPay" />
      <T variant="label">Type</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {ACCOUNT_TYPES.map((t) => (
          <Chip key={t.value} label={t.label} active={type === t.value} onPress={() => setType(t.value)} />
        ))}
      </Row>
      <Field
        label={type === 'card' ? 'Current balance (use - for amount owed)' : 'Opening balance'}
        value={opening}
        onChangeText={setOpening}
        keyboardType="numbers-and-punctuation"
        placeholder="0"
      />
      <ColorPicker value={color} onChange={setColor} />
      <Button title="Save" onPress={submit} loading={save.isPending} />
    </>
  );
}
