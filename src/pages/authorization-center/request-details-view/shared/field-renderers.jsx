import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '@/pages/authorization-center/authorization-center.util';
import { format } from 'date-fns';

export const TYPE_RENDERERS = {
  string: (v) => v ?? 'N/A',
  number: (v) => (v != null ? v : '—'),
  currency: (v) => (v != null ? `₦${Number(v).toLocaleString()}` : '—'),
  percentage: (v) => (v != null ? `${v}%` : '—'),
  date: (v) => {
    if (!v) return 'N/A';
    try {
      return format(new Date(v), 'dd-MMM-yyyy');
    } catch {
      return v;
    }
  },
  timestamp: (v) => {
    if (!v) return 'N/A';
    try {
      return format(new Date(v), 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return v;
    }
  },
  badge: (v) => (
    <Badge variant="outline" className={getStatusColor(v)}>
      {v ?? 'unknown'}
    </Badge>
  ),
  node: (v) => v,
};
