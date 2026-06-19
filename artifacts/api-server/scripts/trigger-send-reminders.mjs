#!/usr/bin/env node

const API_BASE = (process.env.API_BASE_URL || process.env.API_URL || process.env.EXPRESS_PUBLIC_API_URL || 'https://cyclecare-api.onrender.com').replace(/\/+$/,'');
const secret = process.env.TASKS_SECRET;

if (!secret) {
  console.error('Error: TASKS_SECRET environment variable is required');
  process.exit(2);
}

(async () => {
  try {
    const res = await fetch(`${API_BASE}/tasks/send-reminders`, {
      method: 'POST',
      headers: { 'x-task-secret': secret },
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log(text);
    process.exit(res.ok ? 0 : 1);
  } catch (err) {
    console.error('Request failed', err);
    process.exit(1);
  }
})();
