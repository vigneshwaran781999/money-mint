import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useColors } from '@/providers/theme';

import { Icon, T } from './ui';

export const PIN_LENGTH = 4;

/** 4-digit keypad. `onComplete` returns false to shake/clear (wrong PIN). */
export function PinPad({
  title,
  subtitle,
  onComplete,
  extraKey,
}: {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => Promise<boolean> | boolean;
  extraKey?: { icon: string; onPress: () => void };
}) {
  const c = useColors();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const [checking, setChecking] = useState(false);

  const press = (d: string) => {
    if (checking || pin.length >= PIN_LENGTH) return;
    setError(false);
    const next = pin + d;
    setPin(next);
    if (next.length < PIN_LENGTH) return;
    setChecking(true);
    Promise.resolve(onComplete(next))
      .then((ok) => {
        if (!ok) setError(true);
      })
      .finally(() => {
        setPin('');
        setChecking(false);
      });
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'extra', '0', 'del'];

  return (
    <View style={{ alignItems: 'center', gap: 24 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <T variant="h2">{title}</T>
        <T variant="muted" color={error ? c.expense : undefined}>
          {error ? 'Wrong PIN, try again' : (subtitle ?? ' ')}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, { borderColor: error ? c.expense : c.primary }, i < pin.length && { backgroundColor: c.primary }]}
          />
        ))}
      </View>
      <View style={styles.grid}>
        {keys.map((k) => {
          if (k === 'extra')
            return extraKey ? (
              <Pressable key={k} onPress={extraKey.onPress} style={styles.key} accessibilityLabel="Use fingerprint">
                <Icon name={extraKey.icon} size={30} color={c.primary} />
              </Pressable>
            ) : (
              <View key={k} style={styles.key} />
            );
          if (k === 'del')
            return (
              <Pressable key={k} onPress={() => setPin((p) => p.slice(0, -1))} style={styles.key} accessibilityLabel="Delete">
                <Icon name="backspace-outline" size={26} color={c.text} />
              </Pressable>
            );
          return (
            <Pressable
              key={k}
              onPress={() => press(k)}
              style={({ pressed }) => [styles.key, { backgroundColor: pressed ? c.border : c.surfaceAlt }]}>
              <T style={{ fontSize: 26, fontWeight: '600' }}>{k}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  grid: { width: 270, flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center' },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
});
