import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Space } from '@/constants/theme';
import { useColors } from '@/providers/theme';

import { Divider, Icon, IconBadge, T } from './ui';

export interface Option<V extends string = string> {
  value: V;
  label: string;
  subtitle?: string;
  icon?: string;
  color?: string;
}

/** A field that opens a bottom-sheet list to pick one option. */
export function Select<V extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  allowClear,
}: {
  label?: string;
  value: V | null;
  options: Option<V>[];
  onChange: (v: V | null) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 6 }}>
      {label ? <T variant="label">{label}</T> : null}
      <Pressable onPress={() => setOpen(true)} style={[styles.field, { borderColor: c.border, backgroundColor: c.surface }]}>
        {selected?.icon ? <Icon name={selected.icon} size={20} color={selected.color ?? c.primary} /> : null}
        <T style={{ flex: 1 }} color={selected ? undefined : c.textMuted} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </T>
        <Icon name="chevron-down" size={20} color={c.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + Space.lg }]}>
          <T variant="h2" style={{ marginBottom: Space.sm }}>
            {label ?? 'Select'}
          </T>
          <FlatList
            data={allowClear ? [{ value: '' as V, label: 'None' } as Option<V>, ...options] : options}
            keyExtractor={(o) => o.value || 'none'}
            ItemSeparatorComponent={Divider}
            ListEmptyComponent={<T variant="muted">Nothing here yet.</T>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.value === '' ? null : item.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}>
                {item.icon ? <IconBadge name={item.icon} color={item.color ?? c.primary} size={34} /> : null}
                <View style={{ flex: 1 }}>
                  <T>{item.label}</T>
                  {item.subtitle ? <T variant="small">{item.subtitle}</T> : null}
                </View>
                {item.value === (value ?? '') ? <Icon name="check" color={c.primary} /> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backdrop: { flex: 1, backgroundColor: '#0008' },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Space.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: Space.md },
});
