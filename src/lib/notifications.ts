import * as Notifications from 'expo-notifications';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

import { fromISO } from './dates';
import { formatINR } from './money';
import type { Loan, Recurring } from './types';

const REMIND_HOUR = 9;
let configured = false;

function configure() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Bill & loan reminders',
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

interface Reminder {
  title: string;
  body: string;
  date: Date;
}

/**
 * Re-schedules all local reminders (bills/recurring + loan due dates) at 9 AM on the due day.
 * Phone only; on web this does nothing.
 */
export async function syncReminders(recurring: Recurring[], loans: Loan[]) {
  if (Platform.OS === 'web') return;
  try {
    configure();
    const now = Date.now();
    const at9 = (iso: string) => {
      const d = fromISO(iso);
      d.setHours(REMIND_HOUR, 0, 0, 0);
      return d;
    };

    const reminders: Reminder[] = [
      ...recurring
        .filter((r) => r.active && r.remind)
        .map((r) => ({
          title: r.type === 'expense' ? `Bill due: ${r.title}` : `Expected: ${r.title}`,
          body: `${formatINR(r.amount)} due today`,
          date: at9(r.next_date),
        })),
      ...loans
        .filter((l) => !l.settled && l.due_date)
        .map((l) => ({
          title: l.direction === 'lent' ? `Collect from ${l.person}` : `Repay ${l.person}`,
          body: `Loan of ${formatINR(l.amount)} is due today`,
          date: at9(l.due_date!),
        })),
    ].filter((r) => r.date.getTime() > now);

    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!reminders.length || !(await ensurePermission())) return;

    for (const r of reminders) {
      await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: r.date,
          channelId: 'reminders',
        },
      });
    }
  } catch (e) {
    console.warn('Could not schedule reminders', e);
  }
}
