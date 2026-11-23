import { focusManager, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { Bootstrap } from '@/components/bootstrap';
import { LockScreen } from '@/components/lock-screen';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/providers/auth';
import { LockProvider, useLock } from '@/providers/lock';
import { AppThemeProvider, useTheme } from '@/providers/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
});

// Refetch when the phone app returns to the foreground (web does this on window focus).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LockProvider>
            <Navigator />
          </LockProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppThemeProvider>
  );
}

function Navigator() {
  const { colors, scheme } = useTheme();
  const { session, loading } = useAuth();
  const lock = useLock();
  const qc = useQueryClient();
  const signedIn = !!session;

  useEffect(() => {
    if (!loading && lock.ready) SplashScreen.hideAsync();
  }, [loading, lock.ready]);

  // Never show one user's cached data to the next user.
  useEffect(() => {
    if (!signedIn) qc.clear();
  }, [signedIn, qc]);

  if (loading || !lock.ready) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={!isSupabaseConfigured}>
          <Stack.Screen name="setup" options={{ title: 'Setup required' }} />
        </Stack.Protected>

        <Stack.Protected guard={isSupabaseConfigured && !signedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={isSupabaseConfigured && signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="transaction" options={{ presentation: 'modal', title: 'Transaction' }} />
          <Stack.Screen name="account/[id]" options={{ title: 'Account' }} />
          <Stack.Screen name="loan/[id]" options={{ title: 'Loan' }} />
          <Stack.Screen name="budgets" options={{ title: 'Budgets' }} />
          <Stack.Screen name="recurring" options={{ title: 'Recurring & reminders' }} />
          <Stack.Screen name="loans" options={{ title: 'Lend & borrow' }} />
          <Stack.Screen name="categories" options={{ title: 'Categories' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack.Protected>
      </Stack>
      {signedIn && <Bootstrap />}
      {signedIn && lock.locked && <LockScreen />}
    </ThemeProvider>
  );
}
