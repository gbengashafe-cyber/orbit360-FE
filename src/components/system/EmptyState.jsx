import { cn } from '@/lib/utils';

/**
 * Empty lists and tables (DESIGN.md §6): a short title, one sentence, at most one action. No illustration or big icon.
 *
 * <EmptyState title="No loan requests yet" description="When you request a loan…" action={<Button>New loan request</Button>} />
 */
export function EmptyState({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-6 py-10 text-center', className)}>
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-[44ch] text-sm text-gray-600">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
