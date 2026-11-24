import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GUEST_CART_TOKEN_KEY,
  clearGuestCartToken,
  getGuestCartToken,
  getGuestCartRequestHeaders,
  saveGuestCartToken,
} from './guestCartToken.js';

test('guest cart token is persisted and can be discarded after merge', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };

  saveGuestCartToken('guest-token');
  assert.equal(getGuestCartToken(), 'guest-token');
  assert.equal(values.get(GUEST_CART_TOKEN_KEY), 'guest-token');
  assert.deepEqual(getGuestCartRequestHeaders(), {
    'Cache-Control': 'no-store',
    'X-Guest-Cart-Token': 'guest-token',
  });

  clearGuestCartToken();
  assert.equal(getGuestCartToken(), null);
  assert.deepEqual(getGuestCartRequestHeaders(), { 'Cache-Control': 'no-store' });
  delete globalThis.localStorage;
});

test('invalid tokens are not persisted and unavailable storage fails safely', () => {
  delete globalThis.localStorage;
  saveGuestCartToken('');
  assert.equal(getGuestCartToken(), null);
  assert.doesNotThrow(clearGuestCartToken);
});
