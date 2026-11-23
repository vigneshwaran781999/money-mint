import { Card, Screen, T } from '@/components/ui';

/** Shown until .env has the Supabase keys. */
export default function Setup() {
  return (
    <Screen>
      <T variant="title">Connect your database</T>
      <Card>
        <T variant="h2">1. Create a free Supabase project</T>
        <T variant="muted">Go to supabase.com → New project.</T>
      </Card>
      <Card>
        <T variant="h2">2. Create the tables</T>
        <T variant="muted">Open SQL Editor, paste the contents of supabase/schema.sql and press Run.</T>
      </Card>
      <Card>
        <T variant="h2">3. Add your keys</T>
        <T variant="muted">
          Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Project
          Settings → API). Then restart: npx expo start -c
        </T>
      </Card>
    </Screen>
  );
}
