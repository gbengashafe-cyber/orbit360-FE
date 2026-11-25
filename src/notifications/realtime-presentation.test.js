import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shouldPresentRealtimeAlert, suppressRealtimeAlert } from './realtime-presentation.js';

const appliedTraining = { id: 101, eventType: 'TRAINING_APPLIED', entityType: 'training_request', entityId: 'request-1' };

describe('real-time notification presentation', () => {
  it('suppresses only the matching alert after the recipient has already received action feedback', () => {
    const seenIds = new Set();
    const suppressedAlertKeys = new Set();

    suppressRealtimeAlert(suppressedAlertKeys, appliedTraining);

    assert.equal(shouldPresentRealtimeAlert(seenIds, suppressedAlertKeys, appliedTraining), false);
    assert.equal(shouldPresentRealtimeAlert(seenIds, suppressedAlertKeys, { ...appliedTraining, id: 102, entityId: 'request-2' }), true);
  });

  it('still presents a matching alert to another recipient session', () => {
    const initiatingSessionKeys = new Set();
    suppressRealtimeAlert(initiatingSessionKeys, appliedTraining);

    assert.equal(shouldPresentRealtimeAlert(new Set(), initiatingSessionKeys, appliedTraining), false);
    assert.equal(shouldPresentRealtimeAlert(new Set(), new Set(), appliedTraining), true);
  });

  it('does not present an alert twice after it has been handled', () => {
    const seenIds = new Set();

    assert.equal(shouldPresentRealtimeAlert(seenIds, new Set(), appliedTraining), true);
    assert.equal(shouldPresentRealtimeAlert(seenIds, new Set(), appliedTraining), false);
  });
});
