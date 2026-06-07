/**
 * Load test script — simulates multiple concurrent users
 * Run: node scripts/load-test.mjs
 */

const BASE_URL = 'http://localhost:3007/api/v1';
const CONCURRENT_USERS = 50;
const REQUESTS_PER_USER = 5;

async function makeRequest(url, options = {}) {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const duration = Date.now() - start;
    const data = await response.text();
    return { status: response.status, duration, ok: response.ok, data: data.substring(0, 100) };
  } catch (error) {
    return { status: 0, duration: Date.now() - start, ok: false, error: error.message };
  }
}

async function simulateUser(userId) {
  const results = [];

  // 1. Login
  results.push({ step: 'login', ...await makeRequest(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: { email: 'test@test.com', password: 'Test1234' },
  }) });

  // 2. List wallets
  results.push({ step: 'list-wallets', ...await makeRequest(`${BASE_URL}/wallets`) });

  // 3. Health check
  results.push({ step: 'health', ...await makeRequest(`${BASE_URL}/health`) });

  // 4. Create wallet
  results.push({ step: 'create-wallet', ...await makeRequest(`${BASE_URL}/wallets`, {
    method: 'POST',
    body: { name: `Load-Test-${userId}-${Date.now()}` },
  }) });

  // 5. Get metrics
  results.push({ step: 'metrics', ...await makeRequest(`${BASE_URL}/metrics`) });

  return results;
}

async function main() {
  console.log(`\n=== Load Test: ${CONCURRENT_USERS} concurrent users, ${REQUESTS_PER_USER} requests each ===\n`);

  const allResults = [];
  const startTime = Date.now();

  // Run all users concurrently
  const userPromises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }

  const userResults = await Promise.all(userPromises);
  const totalDuration = Date.now() - startTime;

  for (const results of userResults) {
    allResults.push(...results);
  }

  // Statistics
  const total = allResults.length;
  const ok = allResults.filter(r => r.ok).length;
  const failed = allResults.filter(r => !r.ok).length;
  const durations = allResults.map(r => r.duration).sort((a, b) => a - b);
  const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  console.log('=== Results ===');
  console.log(`Total requests: ${total}`);
  console.log(`Successful: ${ok}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${(ok / total * 100).toFixed(1)}%`);
  console.log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`\nLatency:`);
  console.log(`  Average: ${avg.toFixed(0)}ms`);
  console.log(`  P95:     ${p95.toFixed(0)}ms`);
  console.log(`  P99:     ${p99.toFixed(0)}ms`);
  console.log(`  Min:     ${durations[0].toFixed(0)}ms`);
  console.log(`  Max:     ${durations[durations.length - 1].toFixed(0)}ms`);

  // Per-step breakdown
  const steps = [...new Set(allResults.map(r => r.step))];
  console.log(`\nPer-step breakdown:`);
  for (const step of steps) {
    const stepResults = allResults.filter(r => r.step === step);
    const stepDurations = stepResults.map(r => r.duration);
    const stepAvg = stepDurations.reduce((s, d) => s + d, 0) / stepDurations.length;
    const stepOk = stepResults.filter(r => r.ok).length;
    console.log(`  ${step}: avg=${stepAvg.toFixed(0)}ms, ok=${stepOk}/${stepResults.length}`);
  }

  // Failed requests detail
  if (failed > 0) {
    console.log(`\nFailed requests:`);
    for (const r of allResults.filter(r => !r.ok)) {
      console.log(`  [${r.step}] status=${r.status} error=${r.error || r.data}`);
    }
  }

  // Thresholds check
  console.log(`\n=== Thresholds ===`);
  console.log(`P95 < 2000ms: ${p95 < 2000 ? '✅ PASS' : '❌ FAIL'} (${p95.toFixed(0)}ms)`);
  console.log(`Error rate < 10%: ${(failed / total * 100) < 10 ? '✅ PASS' : '❌ FAIL'} (${(failed / total * 100).toFixed(1)}%)`);
}

main().catch(console.error);
