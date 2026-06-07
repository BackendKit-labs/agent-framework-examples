import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3007/api/v1';
const AUTH_EMAIL = 'test@test.com';
const AUTH_PASSWORD = 'Test1234';

// Custom metrics
const authDuration = new Trend('auth_duration');
const walletDuration = new Trend('wallet_duration');
const fusionDuration = new Trend('fusion_duration');
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 20 },    // Ramp to 20 users
    { duration: '2m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    error_rate: ['rate<0.1'],          // Less than 10% errors
  },
};

// Shared state
let accessToken = '';
let walletId = '';

export function setup() {
  // Register test user
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email: `k6-test-${Date.now()}@test.com`,
    password: 'Test1234',
    name: 'K6 Test User',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (registerRes.status === 201) {
    accessToken = registerRes.json('accessToken');
  } else {
    // Try login if user already exists
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD,
    }), { headers: { 'Content-Type': 'application/json' } });
    accessToken = loginRes.json('accessToken');
  }

  // Create a wallet for testing
  const walletRes = http.post(`${BASE_URL}/wallets`, JSON.stringify({
    name: 'K6 Test Wallet',
  }), { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` } });
  walletId = walletRes.json('id');

  return { accessToken, walletId };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.accessToken}`,
  };

  group('Auth endpoints', () => {
    // Login
    const loginStart = Date.now();
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD,
    }), { headers: { 'Content-Type': 'application/json' } });
    authDuration.add(Date.now() - loginStart);

    check(loginRes, {
      'login status 200': (r) => r.status === 200,
      'login has token': (r) => r.json('accessToken') !== '',
    });
    errorRate.add(loginRes.status !== 200);

    // Refresh token
    const refreshRes = http.post(`${BASE_URL}/auth/refresh`, JSON.stringify({
      refreshToken: loginRes.json('refreshToken'),
    }), { headers: { 'Content-Type': 'application/json' } });

    check(refreshRes, {
      'refresh status 200': (r) => r.status === 200,
    });
  });

  group('Wallet endpoints', () => {
    // List wallets
    const listStart = Date.now();
    const listRes = http.get(`${BASE_URL}/wallets`, { headers });
    walletDuration.add(Date.now() - listStart);

    check(listRes, {
      'list wallets status 200': (r) => r.status === 200,
      'list returns array': (r) => Array.isArray(r.json()),
    });

    // Get single wallet
    if (data.walletId) {
      const getRes = http.get(`${BASE_URL}/wallets/${data.walletId}`, { headers });
      check(getRes, {
        'get wallet status 200': (r) => r.status === 200,
      });
    }

    // Create portfolio
    if (data.walletId) {
      const portfolioRes = http.post(`${BASE_URL}/wallets/${data.walletId}/portfolios`, JSON.stringify({
        name: `Portfolio-${Date.now()}`,
        strategy: 'growth',
      }), { headers });

      check(portfolioRes, {
        'create portfolio status 201': (r) => r.status === 201,
      });
    }
  });

  group('Health endpoint', () => {
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health status 200': (r) => r.status === 200,
      'health is healthy': (r) => r.json('status') === 'healthy',
    });
  });

  sleep(1);
}

export function teardown(data) {
  // Cleanup test wallet
  if (data.walletId) {
    http.del(`${BASE_URL}/wallets/${data.walletId}`, null, {
      headers: { 'Authorization': `Bearer ${data.accessToken}` },
    });
  }
}
