import test from 'node:test';
import assert from 'node:assert/strict';
import api from './api.js';
import {
  GUEST_RECOVERY_KEY,
  clearGuestRecovery,
  getGuestRecovery,
  saveGuestRecovery,
} from './guestOrderRecovery.js';
import { requestGuestOrderRecovery, verifyGuestOrderRecovery } from './guestOrderRecovery.js';

const setupStorage = () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  return values;
};

test('guest recovery credentials persist separately with a 12 hour expiry', () => {
  const values = setupStorage();
  const jwtAccess = 'authenticated-jwt';
  const jwtRefresh = 'authenticated-refresh';
  globalThis.localStorage.setItem('capybara_access', jwtAccess);
  globalThis.localStorage.setItem('capybara_refresh', jwtRefresh);

  saveGuestRecovery(81, 'gtr-recovery-secret');
  assert.equal(values.has(GUEST_RECOVERY_KEY), true);
  assert.equal(getGuestRecovery().orderId, '81');
  assert.equal(getGuestRecovery().token, 'gtr-recovery-secret');
  assert.ok(getGuestRecovery().expiresAt > Date.now());
  assert.equal(values.get('capybara_access'), jwtAccess);
  assert.equal(values.get('capybara_refresh'), jwtRefresh);

  clearGuestRecovery();
  assert.equal(getGuestRecovery(), null);
  delete globalThis.localStorage;
});

test('expired and malformed guest recovery data is discarded', () => {
  const values = setupStorage();
  values.set(GUEST_RECOVERY_KEY, JSON.stringify({ orderId: '81', token: 'expired', expiresAt: Date.now() - 1 }));
  assert.equal(getGuestRecovery(), null);
  assert.equal(values.has(GUEST_RECOVERY_KEY), false);
  values.set(GUEST_RECOVERY_KEY, '{broken');
  assert.equal(getGuestRecovery(), null);
  delete globalThis.localStorage;
});

test('recovery API requests are unauthenticated and verification uses backend `code` field', async () => {
  const requests = [];
  const originalAdapter = api.defaults.adapter;
  const values = setupStorage();
  values.set('capybara_access', 'customer-jwt');
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: config.url.includes('verify') ? { access_token: 'gtr-token', expires_in: 43200, order_id: 7 } : { detail: 'accepted' }, status: config.url.includes('verify') ? 200 : 202, statusText: 'OK', headers: {}, config };
  };
  try {
    await requestGuestOrderRecovery('ORD-7', 'buyer@example.com');
    await verifyGuestOrderRecovery('ORD-7', 'buyer@example.com', '123456');
    assert.deepEqual(JSON.parse(requests[0].data), { order_number: 'ORD-7', email: 'buyer@example.com' });
    assert.deepEqual(JSON.parse(requests[1].data), { order_number: 'ORD-7', email: 'buyer@example.com', code: '123456' });
    assert.equal(requests[0].headers.Authorization, undefined);
    assert.equal(requests[1].headers.Authorization, undefined);
  } finally {
    api.defaults.adapter = originalAdapter;
    delete globalThis.localStorage;
  }
});
