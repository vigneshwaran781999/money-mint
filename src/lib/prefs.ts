import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Small synchronous preferences store. `localStorage` exists on web natively and on
 * Android/iOS via `expo-sqlite/localStorage/install` (imported in lib/supabase.ts).
 */
export const prefs = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(`mm.${key}`) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) globalThis.localStorage?.removeItem(`mm.${key}`);
      else globalThis.localStorage?.setItem(`mm.${key}`, value);
    } catch {
      // storage unavailable (private browsing) – preference just won't persist
    }
  },
};

/** Secrets (PIN hash): Keychain/Keystore on phone, localStorage fallback on web. */
export const secure = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return prefs.get(`secure.${key}`);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string | null): Promise<void> {
    if (Platform.OS === 'web') return prefs.set(`secure.${key}`, value);
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  },
};
