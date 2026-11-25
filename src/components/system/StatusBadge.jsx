import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusMeta } from './status';

/**
 * A status from any module, shown with the shared tone and plain-English label (DESIGN.md §7).
 * <StatusBadge status="PENDING_REVIEW" />  ->  "● Pending review" in the pending tone.
 * Pass `label` only when a screen needs different wording for the same status.
 */
export function StatusBadge({ status, label, className }) {
  const meta = getStatusMeta(status);
  return (
    <Badge variant={meta.tone} className={className}>
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full bg-current')} />
      {label ?? meta.label}
    </Badge>
  );
}
