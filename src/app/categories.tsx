import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ColorPicker, Sheet } from '@/components/sheet';
import { Button, Card, Field, Icon, ListRow, Loading, Row, Screen, Segmented, T } from '@/components/ui';
import { Radius } from '@/constants/theme';
import { useCategories, useRemove, useSave } from '@/data/queries';
import { confirm, errorMessage, notify } from '@/lib/dialog';
import type { Category, CategoryKind } from '@/lib/types';
import { useColors } from '@/providers/theme';

const ICONS = [
  'food', 'cart', 'home', 'flash', 'water', 'gas-station', 'bus', 'car', 'train', 'airplane',
  'shopping', 'tshirt-crew', 'medical-bag', 'pill', 'school', 'book-open-variant', 'movie', 'gamepad-variant',
  'cellphone', 'wifi', 'television', 'gift', 'heart', 'paw', 'baby-carriage', 'hand-coin', 'bank-transfer',
  'briefcase', 'store', 'percent', 'chart-line', 'cash', 'piggy-bank', 'tools', 'hammer-wrench', 'dumbbell',
  'coffee', 'silverware-fork-knife', 'church', 'charity', 'shield-check', 'dots-horizontal',
];

export default function Categories() {
  const c = useColors();
  const categories = useCategories();
  const save = useSave<Partial<Category>>('categories');
  const remove = useRemove('categories');
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [draft, setDraft] = useState<Partial<Category> | null>(null);

  if (categories.isLoading) return <Loading />;
  const list = (categories.data ?? []).filter((x) => x.kind === kind);

  const submit = async () => {
    if (!draft?.name?.trim()) return notify('Enter a name');
    try {
      await save.mutateAsync({ ...draft, name: draft.name.trim() });
      setDraft(null);
    } catch (e) {
      notify('Could not save', errorMessage(e));
    }
  };

  const del = async () => {
    if (!draft?.id) return;
    if (!(await confirm('Delete category?', 'Entries in this category become "Uncategorised". Its budget is removed.'))) return;
    await remove.mutateAsync(draft.id);
    setDraft(null);
  };

  return (
    <Screen>
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: 'expense', label: 'Expense', color: c.expense },
          { value: 'income', label: 'Income', color: c.income },
        ]}
      />
      <Button title="Add category" icon="plus" onPress={() => setDraft({ kind, name: '', icon: 'shape', color: '#10B981' })} />
      <Card>
        {list.map((cat) => (
          <ListRow
            key={cat.id}
            icon={cat.icon}
            iconColor={cat.color}
            title={cat.name}
            onPress={() => setDraft(cat)}
            right={<Icon name="pencil" size={18} color={c.textMuted} />}
          />
        ))}
      </Card>

      <Sheet visible={!!draft} title={draft?.id ? 'Edit category' : 'New category'} onClose={() => setDraft(null)}>
        {draft && (
          <>
            <Field label="Name" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="e.g. Petrol" />
            <ColorPicker value={draft.color ?? '#10B981'} onChange={(color) => setDraft({ ...draft, color })} />
            <T variant="label">Icon</T>
            <Row style={{ flexWrap: 'wrap' }}>
              {ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setDraft({ ...draft, icon: ic })}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: Radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: draft.icon === ic ? (draft.color ?? c.primary) + '33' : c.surface,
                  }}>
                  <Icon name={ic} color={draft.icon === ic ? draft.color : c.textMuted} />
                </Pressable>
              ))}
            </Row>
            <View style={{ height: 4 }} />
            <Button title="Save" onPress={submit} loading={save.isPending} />
            {draft.id && <Button title="Delete" variant="danger" onPress={del} />}
          </>
        )}
      </Sheet>
    </Screen>
  );
}
