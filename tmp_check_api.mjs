import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const env = process.env;

const baseUrl = 'http://127.0.0.1:5001/api';

async function login() {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyclecare.com', password: 'admin123' }),
  });
  const body = await response.text();
  console.log('LOGIN', response.status, body);
  return response.ok ? JSON.parse(body).token : null;
}

async function getRequests(token) {
  const response = await fetch(`${baseUrl}/requests`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.text();
  console.log('REQUESTS', response.status, body);
}

async function getCycleDashboard(token) {
  const response = await fetch(`${baseUrl}/cycle/dashboard`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.text();
  console.log('DASHBOARD', response.status, body);
}

async function getCycleProfile(token) {
  const response = await fetch(`${baseUrl}/cycle/profile`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.text();
  console.log('PROFILE', response.status, body);
}

(async () => {
  const token = await login();
  if (token) {
    await getRequests(token);
    await getCycleDashboard(token);
    await getCycleProfile(token);
  }
})();
