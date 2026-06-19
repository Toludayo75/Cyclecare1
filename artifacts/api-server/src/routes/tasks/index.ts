import { Router } from 'express';
import { sendPeriodRemindersForToday } from '../../lib/notifications';

const router = Router();

// Protected task endpoint. Set TASKS_SECRET env var and send it in header 'x-task-secret'.
router.post('/tasks/send-reminders', async (req, res) => {
  const secret = process.env.TASKS_SECRET ?? '';
  const header = (req.headers['x-task-secret'] as string) ?? '';
  if (!secret || header !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await sendPeriodRemindersForToday();
    return res.json({ ok: true, result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('send-reminders failed', err);
    return res.status(500).json({ error: 'failed' });
  }
});

export default router;
