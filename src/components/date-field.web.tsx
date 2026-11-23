import { createElement } from 'react';
import { View } from 'react-native';

import { useColors } from '@/providers/theme';

import { T } from './ui';

/** Native browser date input for the Windows/web build. */
export function DateField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      {label ? <T variant="label">{label}</T> : null}
      {createElement('input', {
        type: 'date',
        value,
        onChange: (e: { target: { value: string } }) => e.target.value && onChange(e.target.value),
        style: {
          border: `1px solid ${c.border}`,
          background: c.surface,
          color: c.text,
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 16,
          fontFamily: 'inherit',
          colorScheme: 'light dark',
        },
      })}
    </View>
  );
}
