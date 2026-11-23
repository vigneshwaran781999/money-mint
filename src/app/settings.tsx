import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Platform } from 'react-native';

import { PinPad } from '@/components/pin-pad';
import { Sheet } from '@/components/sheet';
import { Button, Card, Divider, Segmented, Screen, Section, T, ToggleRow } from '@/components/ui';
import { useAppData } from '@/data/use-app-data';
import { exportTransactionsCSV } from '@/lib/csv';
import { confirm, errorMessage, notify } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { useLock } from '@/providers/lock';
import { useTheme, type ThemePref } from '@/providers/theme';

export default function Settings() {
  const { pref, setPref } = useTheme();
  const { session } = useAuth();
  const lock = useLock();
  const data = useAppData();
  const [pinStep, setPinStep] = useState<null | 'new' | 'confirm'>(null);
  const [firstPin, setFirstPin] = useState('');
  const [exporting, setExporting] = useState(false);
  const [checking, setChecking] = useState(false);

  const onPinEntered = async (pin: string) => {
    if (pinStep === 'new') {
      setFirstPin(pin);
      setPinStep('confirm');
      return true;
    }
    if (pin !== firstPin) {
      setPinStep('new');
      notify('PINs did not match', 'Please try again.');
      return true;
    }
    await lock.setPin(pin);
    setPinStep(null);
    notify('PIN lock enabled');
    return true;
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await exportTransactionsCSV(data.transactions, data.accounts, data.categories);
    } catch (e) {
      notify('Export failed', errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const checkUpdates = async () => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) {
      return notify('Updates', 'Over-the-air updates work in the installed app (APK). In Expo Go / web you always run the latest code.');
    }
    setChecking(true);
    try {
      const res = await Updates.checkForUpdateAsync();
      if (!res.isAvailable) return notify('You are up to date');
      await Updates.fetchUpdateAsync();
      if (await confirm('Update downloaded', 'Restart now to use the latest version?', 'Restart')) await Updates.reloadAsync();
    } catch (e) {
      notify('Update check failed', errorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  const signOut = async () => {
    if (await confirm('Sign out?', 'Your data stays safe in the cloud.', 'Sign out')) await supabase.auth.signOut();
  };

  return (
    <Screen>
      <Section title="Appearance">
        <Card>
          <Segmented<ThemePref>
            value={pref}
            onChange={setPref}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Card>
      </Section>

      <Section title="Security">
        <Card>
          <ToggleRow
            label="PIN lock"
            hint="Ask for a 4-digit PIN when the app opens"
            value={lock.pinEnabled}
            onChange={async (on) => {
              if (on) setPinStep('new');
              else if (await confirm('Turn off PIN lock?', 'Anyone with your device can open the app.', 'Turn off')) await lock.disablePin();
            }}
          />
          {lock.pinEnabled && lock.biometricAvailable && (
            <>
              <Divider />
              <ToggleRow label="Fingerprint unlock" hint="Use fingerprint / face instead of typing the PIN" value={lock.biometricEnabled} onChange={lock.setBiometricEnabled} />
            </>
          )}
          {lock.pinEnabled && (
            <>
              <Divider />
              <Button title="Change PIN" variant="ghost" small onPress={() => setPinStep('new')} />
            </>
          )}
        </Card>
      </Section>

      <Section title="Data">
        <Card>
          <T variant="muted">Your data syncs automatically between your phone and the Windows app when you are signed in.</T>
          <Button title={`Export ${data.transactions.length} entries to CSV (Excel)`} icon="file-export" variant="secondary" loading={exporting} onPress={exportCsv} />
        </Card>
      </Section>

      <Section title="App">
        <Card>
          <T variant="muted">
            Money Mint v{Constants.expoConfig?.version ?? '1.0.0'}
            {Updates.updateId ? ` · update ${Updates.updateId.slice(0, 8)}` : ''}
          </T>
          <Button title="Check for updates" icon="update" variant="secondary" loading={checking} onPress={checkUpdates} />
        </Card>
      </Section>

      <Section title="Account">
        <Card>
          <T variant="muted">{session?.user.email}</T>
          <Button title="Sign out" icon="logout" variant="danger" onPress={signOut} />
        </Card>
      </Section>

      <Sheet visible={pinStep !== null} title="Set PIN" onClose={() => setPinStep(null)}>
        <PinPad
          key={pinStep ?? 'none'}
          title={pinStep === 'confirm' ? 'Confirm new PIN' : 'Enter new PIN'}
          subtitle="4 digits"
          onComplete={onPinEntered}
        />
      </Sheet>
    </Screen>
  );
}
