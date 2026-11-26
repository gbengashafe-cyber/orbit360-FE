import assert from 'node:assert/strict';
import test from 'node:test';
import { notificationDestination } from './destination.js';

test('confidential review alert opens the permitted queue without a record link', () => {
  const item = { eventType: 'COMPLAINT_REVIEW', audience: 'ACTOR_QUEUE' };
  assert.equal(notificationDestination(item, ['MANAGE_COMPLAINTS']), '/complaint-management');
  assert.equal(notificationDestination(item), '/notifications');
});
test('supervisor and submitter training notices have different destinations', () => {
  const record = { entityType: 'training_request', entityId: '1' };
  assert.equal(notificationDestination(record), '/request-training');
  assert.equal(notificationDestination({ ...record, eventType: 'TRAINING_SUPERVISOR_REVIEW', audience: 'ACTOR_QUEUE' }), '/authorization-center');
});
