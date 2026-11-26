import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notificationQuery } from './notification-query.js';

test('omits absent notification filters while preserving selected values and cursors', () => {
  assert.equal(notificationQuery({ rows: '20', status: 'all', category: undefined, cursor: null }), 'rows=20&status=all');
  assert.equal(notificationQuery({ category: 'LEAVE', cursor: 'abc+/=' }), 'category=LEAVE&cursor=abc%2B%2F%3D');
});
