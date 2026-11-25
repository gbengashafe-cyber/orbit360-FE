import { cn } from '@/lib/utils';

/**
 * Top of every page (DESIGN.md §6 Page header): what the page is, what you can do there, and its actions.
 * No icon or coloured tile beside the title.
 *
 * <PageHeader title="Loans" description="Request a cooperative loan…" actions={<Button>New loan request</Button>} />
 */
export function PageHeader({ title, description, actions, children, className }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-page-title text-balance text-foreground">{title}</h1>
        {description ? <p className="max-w-[68ch] text-sm text-gray-600">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
