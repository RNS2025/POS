import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasPermission } from '../domain/merchant-permissions.js';

describe('merchant role permissions', () => {
  it('owner has full access', () => {
    assert.equal(hasPermission('owner', 'users:write'), true);
    assert.equal(hasPermission('owner', 'orders:write'), true);
    assert.equal(hasPermission('owner', 'setup:write'), true);
  });

  it('manager cannot manage users, orders, or setup write', () => {
    assert.equal(hasPermission('manager', 'catalog:write'), true);
    assert.equal(hasPermission('manager', 'orders:read'), true);
    assert.equal(hasPermission('manager', 'orders:write'), false);
    assert.equal(hasPermission('manager', 'setup:write'), false);
    assert.equal(hasPermission('manager', 'users:read'), false);
  });

  it('viewer is read-only', () => {
    assert.equal(hasPermission('viewer', 'catalog:read'), true);
    assert.equal(hasPermission('viewer', 'catalog:write'), false);
    assert.equal(hasPermission('viewer', 'setup:read'), false);
    assert.equal(hasPermission('viewer', 'orders:read'), true);
  });

  it('staff and platform roles have no merchant permissions', () => {
    assert.equal(hasPermission('staff', 'catalog:read'), false);
    assert.equal(hasPermission('platform_admin', 'users:write'), false);
  });
});
