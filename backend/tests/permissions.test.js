import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageProduct, canManageUser } from '../utils/permissions.js';

test('admin can manage any product', () => {
  const product = { _id: 'p1', submittedBy: 'vendor-1' };
  const admin = { role: 'admin', _id: 'admin-1' };
  assert.equal(canManageProduct(product, admin), true);
});

test('vendor can manage only their own product', () => {
  const product = { _id: 'p1', submittedBy: 'vendor-1' };
  const vendor = { role: 'vendor', _id: 'vendor-1' };
  const otherVendor = { role: 'vendor', _id: 'vendor-2' };

  assert.equal(canManageProduct(product, vendor), true);
  assert.equal(canManageProduct(product, otherVendor), false);
});

test('admin can manage any user record', () => {
  const target = { _id: 'buyer-1' };
  const actor = { role: 'admin', _id: 'admin-1' };
  assert.equal(canManageUser(target, actor), true);
});

test('buyer cannot manage another user', () => {
  const target = { _id: 'buyer-2' };
  const actor = { role: 'buyer', _id: 'buyer-1' };
  assert.equal(canManageUser(target, actor), false);
});
