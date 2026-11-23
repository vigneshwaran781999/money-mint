import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Space } from '@/constants/theme';
import { useColors } from '@/providers/theme';

import { IconButton, Row, T } from './ui';

/** Bottom-sheet modal used for add/edit forms. */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.background, paddingBottom: insets.bottom + Space.lg }]}>
          <Row style={{ justifyContent: 'space-between', marginBottom: Space.sm }}>
            <T variant="h2">{title}</T>
            <IconButton name="close" onPress={onClose} />
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: Space.md }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const SWATCHES = ['#10B981', '#0EA5E9', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#EAB308', '#84CC16', '#64748B'];

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <T variant="label">Colour</T>
      <Row style={{ flexWrap: 'wrap' }}>
        {SWATCHES.map((s) => (
          <Pressable
            key={s}
            onPress={() => onChange(s)}
            accessibilityLabel={`Colour ${s}`}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: s, borderWidth: value === s ? 3 : 0, borderColor: c.text }}
          />
        ))}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#0008' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Space.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
});
