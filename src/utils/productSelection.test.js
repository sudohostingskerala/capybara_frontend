import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findSelectedVariant,
  getInitialProductSelection,
  getUniqueColors,
} from './productSelection.js';

const variant = (id, color, size) => ({
  id,
  ...(color ? { color: { name: color } } : {}),
  size: { name: size },
});

test('a single-colour product selects its colour and first size automatically', () => {
  const product = {
    variants: [variant(1, 'Blue', '2-3Y'), variant(2, 'Blue', '3-4Y')],
  };

  assert.deepEqual(getInitialProductSelection(product), {
    color: 'Blue',
    size: '2-3Y',
  });
  assert.equal(findSelectedVariant(product, 'Blue', '2-3Y').id, 1);
});

test('a multi-colour product requires a colour before resolving a variant', () => {
  const product = {
    variants: [variant(1, 'Blue', '2-3Y'), variant(2, 'Red', '2-3Y')],
  };

  assert.deepEqual(getInitialProductSelection(product), { color: '', size: '' });
  assert.deepEqual(getUniqueColors(product).map(({ name }) => name), ['Blue', 'Red']);
  assert.equal(findSelectedVariant(product, '', '2-3Y'), null);
  assert.equal(findSelectedVariant(product, 'Red', '2-3Y').id, 2);
});

test('a product without colour options resolves purchases by size', () => {
  const product = { variants: [variant(1, null, '2-3Y')] };

  assert.deepEqual(getInitialProductSelection(product), { color: '', size: '' });
  assert.deepEqual(getUniqueColors(product), []);
  assert.equal(findSelectedVariant(product, '', '2-3Y').id, 1);
});
