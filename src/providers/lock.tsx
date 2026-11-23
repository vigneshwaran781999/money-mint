import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { prefs, secure } from '@/lib/prefs';

const PIN_KEY = 'mm_pin_hash';
const RELOCK_AFTER_MS = 60_000;

interface LockCtx {
  ready: boolean;
  locked: boolean;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  setBiometricEnabled: (on: boolean) => void;
}

const Ctx = createContext<LockCtx | null>(null);

const hashPin = (pin: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `money-mint:${pin}`);

export function LockProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [biometricEnabled, setBio] = useState(prefs.get('biometric') === '1');
  const [biometricAvailable, setBioAvailable] = useState(false);
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const hash = await secure.get(PIN_KEY);
      setPinHash(hash);
      setLocked(!!hash); // lock on every app launch when a PIN exists
      if (Platform.OS !== 'web') {
        const [hw, enrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        setBioAvailable(hw && enrolled);
      }
      setReady(true);
    })();
  }, []);

  // Re-lock after the app has been in the background for a while.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        backgroundAt.current ??= Date.now();
      } else if (state === 'active') {
        const away = backgroundAt.current ? Date.now() - backgroundAt.current : 0;
        backgroundAt.current = null;
        if (pinHash && away > RELOCK_AFTER_MS) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [pinHash]);

  const unlockWithPin = useCallback(
    async (pin: string) => {
      if (!pinHash) return true;
      const ok = (await hashPin(pin)) === pinHash;
      if (ok) setLocked(false);
      return ok;
    },
    [pinHash],
  );

  const unlockWithBiometric = useCallback(async () => {
    if (!biometricAvailable || !biometricEnabled) return false;
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Money Mint',
      disableDeviceFallback: false,
    });
    if (res.success) setLocked(false);
    return res.success;
  }, [biometricAvailable, biometricEnabled]);

  const value = useMemo<LockCtx>(
    () => ({
      ready,
      locked: locked && !!pinHash,
      pinEnabled: !!pinHash,
      biometricEnabled: biometricEnabled && biometricAvailable,
      biometricAvailable,
      unlockWithPin,
      unlockWithBiometric,
      setPin: async (pin) => {
        const h = await hashPin(pin);
        await secure.set(PIN_KEY, h);
        setPinHash(h);
      },
      disablePin: async () => {
        await secure.set(PIN_KEY, null);
        setPinHash(null);
        setLocked(false);
      },
      setBiometricEnabled: (on) => {
        prefs.set('biometric', on ? '1' : '0');
        setBio(on);
      },
    }),
    [ready, locked, pinHash, biometricEnabled, biometricAvailable, unlockWithPin, unlockWithBiometric],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLock() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLock must be used inside LockProvider');
  return v;
}
