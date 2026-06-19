import { db, pushTokensTable, cycleProfilesTable, usersTable } from '@workspace/db';

export type ExpoPushMessage = {
  to: string;
  sound?: string;
  title?: string;
  body?: string;
  data?: any;
};

export async function sendExpoPushMessages(messages: ExpoPushMessage[]) {
  if (!messages || messages.length === 0) return;

  // Chunk to 100 messages per request per Expo guidelines
  const chunkSize = 100;
  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn('Expo push send failed', await res.text());
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Error sending expo push messages', err);
    }
  }
}

export async function sendPeriodRemindersForToday() {
  const today = new Date();
  const todayIso = today.toISOString().slice(0,10); // YYYY-MM-DD

  // Fetch cycle profiles with notifications enabled
  const rows = await db
    .select({ id: cycleProfilesTable.id, userId: cycleProfilesTable.userId, lastPeriodDate: cycleProfilesTable.lastPeriodDate, cycleLength: cycleProfilesTable.cycleLength })
    .from(cycleProfilesTable)
    .where(cycleProfilesTable.notificationsEnabled.eq(true));

  const messages: ExpoPushMessage[] = [];

  for (const r of rows) {
    try {
      const last = new Date(r.lastPeriodDate);
      if (Number.isNaN(last.getTime())) continue;
      const next = new Date(last.getTime() + r.cycleLength * 24 * 60 * 60 * 1000);
      const nextIso = next.toISOString().slice(0,10);
      if (nextIso !== todayIso) continue;

      // fetch push tokens for user
      const tokens = await db.select({ token: pushTokensTable.token }).from(pushTokensTable).where(pushTokensTable.userId.eq(r.userId));
      for (const t of tokens) {
        messages.push({
          to: t.token,
          title: 'CycleCare reminder',
          body: 'Your period is expected today — check in to log symptoms and get support.',
          data: { type: 'period_reminder' },
        });
      }
    } catch (err) {
      // ignore per-user errors
    }
  }

  if (messages.length > 0) {
    await sendExpoPushMessages(messages);
  }

  return { sent: messages.length };
}
