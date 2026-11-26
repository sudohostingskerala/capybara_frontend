import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findSelectedVariant,
  getAvailableColors,
  getInitialProductSelection,
  getPurchasableVariant,
  getUniqueColors,
  reconcileProductSelection,
} from './productSelection.js';

const variant = (id, color, size, inStock = true) => ({
  id,
  ...(color ? { color: { name: color } } : {}),
  size: { name: size },
  availability_status: inStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
});

test('one available colour is selected automatically', () => {
  const product = { variants: [variant(1, 'Blue', '2-3Y'), variant(2, 'Red', '2-3Y', false)] };
  assert.deepEqual(getAvailableColors(product).map(({ name }) => name), ['Blue']);
  assert.deepEqual(getInitialProductSelection(product), { color: 'Blue', size: '2-3Y' });
});

test('one colour with multiple available sizes selects the colour, not a size', () => {
  const product = { variants: [variant(1, 'Blue', '1-2Y'), variant(2, 'Blue', '2-3Y'), variant(3, 'Blue', '3-4Y', false)] };
  assert.deepEqual(getInitialProductSelection(product), { color: 'Blue', size: '' });
});

test('multiple available colours retain manual colour selection', () => {
  const product = { variants: [variant(1, 'Blue', '2-3Y'), variant(2, 'Red', '2-3Y')] };
  assert.deepEqual(getInitialProductSelection(product), { color: '', size: '' });
  assert.deepEqual(getUniqueColors(product).map(({ name }) => name), ['Blue', 'Red']);
  assert.equal(findSelectedVariant(product, '', '2-3Y'), null);
  assert.equal(findSelectedVariant(product, 'Red', '2-3Y').id, 2);
});

test('no available colours does not select an unavailable variant for purchase', () => {
  const product = { variants: [variant(1, 'Blue', '2-3Y', false)] };
  assert.deepEqual(getAvailableColors(product), []);
  assert.deepEqual(getInitialProductSelection(product), { color: '', size: '' });
  assert.equal(getPurchasableVariant(product, 'Blue', '2-3Y'), null);
});

test('out of stock sizes are never automatically selected', () => {
  const product = { variants: [variant(1, 'Blue', '1-2Y', false), variant(2, 'Blue', '2-3Y')] };
  assert.deepEqual(getInitialProductSelection(product), { color: 'Blue', size: '2-3Y' });
  assert.equal(getPurchasableVariant(product, 'Blue', '1-2Y'), null);
});

test('selection reconciliation clears stale product selections and recalculates availability', () => {
  const nextProduct = { variants: [variant(3, 'Green', '4-5Y')] };
  assert.deepEqual(reconcileProductSelection(nextProduct, { color: 'Blue', size: '2-3Y' }), {
    color: 'Green', size: '4-5Y',
  });
});

test('Add to Cart and Buy Now can share the same validated selected variant', () => {
  const product = { variants: [variant(11, 'Blue', '2-3Y')] };
  const selected = getPurchasableVariant(product, 'Blue', '2-3Y');
  assert.equal(selected.id, 11);
  assert.equal(selected.id, getPurchasableVariant(product, 'Blue', '2-3Y').id);
});
