import { cn } from '@/lib/utils';

const TONE_TEXT = {
  pending: 'text-status-pending',
  info: 'text-status-info',
  success: 'text-status-success',
  danger: 'text-status-danger',
  neutral: 'text-foreground',
};

/**
 * A single figure on a dashboard (DESIGN.md §6 Stat cards). Neutral surface; colour only when the number is
 * itself a status (e.g. tone="pending" for a pending count). Never a different colour per card, never an icon.
 *
 * <StatCard label="Leave days left" value="14" hint="of 21 for 2026" />
 */
export function StatCard({ label, value, hint, tone = 'neutral', className }) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-lg border bg-card p-4', className)}>
      <span className="text-[13px] font-medium text-gray-600">{label}</span>
      <span className={cn('text-2xl font-semibold tabular-nums leading-8', TONE_TEXT[tone] ?? TONE_TEXT.neutral)}>{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
