const alertKey = ({ eventType, entityType, entityId }) => {
  if (!eventType || !entityType || entityId == null) return null;
  return `${eventType}:${entityType}:${entityId}`;
};

export const suppressRealtimeAlert = (suppressedAlertKeys, alert) => {
  const key = alertKey(alert);
  if (key) suppressedAlertKeys.add(key);
};

export const shouldPresentRealtimeAlert = (seenIds, suppressedAlertKeys, alert) => {
  if (seenIds.has(alert.id)) return false;

  seenIds.add(alert.id);
  const key = alertKey(alert);
  if (key && suppressedAlertKeys.delete(key)) return false;

  return true;
};
