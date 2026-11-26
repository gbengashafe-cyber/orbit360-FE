export function notificationQuery(params = {}) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null)).toString();
}
