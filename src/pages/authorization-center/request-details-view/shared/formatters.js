import { format } from 'date-fns';

export const formatDateSafe = (date, pattern = 'PPP') => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), pattern);
  } catch {
    return date;
  }
};

export const formatEnum = (value) => (value ? value.replace(/_/g, ' ') : 'N/A');

export const formatCurrency = (value) => (typeof value === 'number' ? `₦${value.toLocaleString()}` : 'N/A');
