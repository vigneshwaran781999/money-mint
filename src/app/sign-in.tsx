import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { Button, Card, Field, Icon, Screen, Segmented, T } from '@/components/ui';
import { errorMessage, notify } from '@/lib/dialog';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/providers/theme';

export default function SignIn() {
  const c = useColors();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || password.length < 6) {
      notify('Check your details', 'Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (!data.session) {
          notify('Confirm your email', 'We sent you a confirmation link. Open it, then sign in here.');
          setMode('in');
        }
      }
    } catch (e) {
      notify(mode === 'in' ? 'Sign in failed' : 'Sign up failed', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.includes('@')) return notify('Enter your email first');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    notify(error ? 'Could not send reset email' : 'Password reset email sent', error?.message);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={{ alignItems: 'center', gap: 8, marginTop: 64, marginBottom: 16 }}>
          <View style={{ backgroundColor: c.primary + '22', borderRadius: 40, padding: 18 }}>
            <Icon name="leaf" size={44} color={c.primary} />
          </View>
          <T variant="title">Money Mint</T>
          <T variant="muted">Track income, expenses and every account in one place.</T>
        </View>
        <Card style={{ gap: 16, maxWidth: 440, width: '100%', alignSelf: 'center' }}>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'in', label: 'Sign in' },
              { value: 'up', label: 'Create account' },
            ]}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'in' ? 'password' : 'new-password'}
            placeholder="At least 6 characters"
            onSubmitEditing={submit}
          />
          <Button title={mode === 'in' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy} />
          {mode === 'in' && <Button title="Forgot password?" variant="ghost" small onPress={forgot} />}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
