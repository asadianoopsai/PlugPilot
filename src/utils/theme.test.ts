import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from './theme';

test('resolveTheme honors valid stored dark or light preference', () => {
  assert.equal(resolveTheme('light'), 'light');
  assert.equal(resolveTheme('dark'), 'dark');
});

test('resolveTheme falls back cleanly when stored value is null or unrecognized', () => {
  assert.equal(resolveTheme(null), 'dark');
  assert.equal(resolveTheme(undefined), 'dark');
  assert.equal(resolveTheme('sepia'), 'dark');
  assert.equal(resolveTheme('invalid', 'light'), 'light');
});
