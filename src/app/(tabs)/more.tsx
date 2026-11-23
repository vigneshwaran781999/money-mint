import { useRouter, type Href } from 'expo-router';

import { Card, Divider, Icon, ListRow, Screen, T } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { useColors } from '@/providers/theme';

const ITEMS: { href: Href; icon: string; color: string; title: string; subtitle: string }[] = [
  { href: '/budgets', icon: 'target', color: '#F97316', title: 'Budgets', subtitle: 'Monthly spending limits per category' },
  { href: '/recurring', icon: 'calendar-sync', color: '#6366F1', title: 'Recurring & reminders', subtitle: 'Salary, rent, EMIs, bills' },
  { href: '/loans', icon: 'handshake', color: '#0EA5E9', title: 'Lend & borrow', subtitle: 'Money given to or taken from people' },
  { href: '/categories', icon: 'shape', color: '#EC4899', title: 'Categories', subtitle: 'Add or edit income & expense categories' },
  { href: '/settings', icon: 'cog', color: '#64748B', title: 'Settings', subtitle: 'Theme, PIN lock, export, sign out' },
];

export default function More() {
  const c = useColors();
  const router = useRouter();
  const { session } = useAuth();

  return (
    <Screen>
      <Card>
        {ITEMS.map((it, i) => (
          <ListRowWrap key={it.title} first={i === 0}>
            <ListRow
              icon={it.icon}
              iconColor={it.color}
              title={it.title}
              subtitle={it.subtitle}
              onPress={() => router.push(it.href)}
              right={<Icon name="chevron-right" color={c.textMuted} />}
            />
          </ListRowWrap>
        ))}
      </Card>
      <T variant="small" style={{ textAlign: 'center' }}>
        Signed in as {session?.user.email}
      </T>
    </Screen>
  );
}

function ListRowWrap({ first, children }: { first: boolean; children: React.ReactNode }) {
  return (
    <>
      {!first && <Divider />}
      {children}
    </>
  );
}
