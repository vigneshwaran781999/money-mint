import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { formatDate, fromISO, toISO } from '@/lib/dates';
import { useColors } from '@/providers/theme';

import { Icon, T } from './ui';

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

  if (Platform.OS === 'ios') {
    return (
      <View style={{ gap: 6 }}>
        {label ? <T variant="label">{label}</T> : null}
        <DateTimePicker
          value={fromISO(value)}
          mode="date"
          display="compact"
          onValueChange={(_e, d) => onChange(toISO(d))}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    );
  }

  const open = () =>
    DateTimePickerAndroid.open({
      value: fromISO(value),
      mode: 'date',
      onValueChange: (_e, d) => onChange(toISO(d)),
    });

  return (
    <View style={{ gap: 6 }}>
      {label ? <T variant="label">{label}</T> : null}
      <Pressable
        onPress={open}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          borderRadius: Radius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}>
        <Icon name="calendar" size={20} color={c.textMuted} />
        <T>{formatDate(value)}</T>
      </Pressable>
    </View>
  );
}
