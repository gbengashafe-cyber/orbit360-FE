import { toast } from 'sonner';

/*
 * Legacy helper, kept so older pages keep working while they are migrated.
 * It forwards to Sonner, the app's only toast system (DESIGN.md §6 Toasts).
 * New code should call `toast` from 'sonner' directly.
 */

const DEFAULT_TITLES = ['Success', 'Error', 'Info', 'Warning'];

// The message becomes the toast title; a custom title (not the old generic default) becomes the title
// and the message its one line of text.
const show = (type) => (message, title) => {
  if (!title || DEFAULT_TITLES.includes(title)) return toast[type](message);
  return toast[type](title, { description: message });
};

// No longer needed: toasts no longer go through NotificationContext. Kept as a no-op for old callers.
export const setNotificationCallback = () => {};

export const showToast = {
  success: show('success'),
  error: show('error'),
  info: show('info'),
  warning: show('warning'),
};
