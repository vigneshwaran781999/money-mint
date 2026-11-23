import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLock } from '@/providers/lock';
import { useColors } from '@/providers/theme';

import { PinPad } from './pin-pad';
import { Icon, T } from './ui';

/** Full-screen overlay shown while the app is locked. */
export function LockScreen() {
  const c = useColors();
  const { unlockWithPin, unlockWithBiometric, biometricEnabled } = useLock();

  useEffect(() => {
    if (biometricEnabled) unlockWithBiometric();
  }, [biometricEnabled, unlockWithBiometric]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.wrap, { backgroundColor: c.background }]}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Icon name="leaf" size={44} color={c.primary} />
        <T variant="title">Money Mint</T>
      </View>
      <PinPad
        title="Enter PIN"
        onComplete={unlockWithPin}
        extraKey={biometricEnabled ? { icon: 'fingerprint', onPress: unlockWithBiometric } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 40, zIndex: 100 },
});
