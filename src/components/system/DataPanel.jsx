import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';

/**
 * The shell around every table or list (DESIGN.md §6): a bordered panel with a header (title, count, filters),
 * and consistent loading, error and empty states. The table itself goes in `children`.
 *
 * <DataPanel title="Your requests" count={total} toolbar={<Select …/>}
 *            loading={loading} error={error} onRetry={load}
 *            isEmpty={!rows.length} empty={{ title: 'No loan requests yet', description: '…', action: <Button>…</Button> }}
 *            footer={<TablePagination page={page} pageSize={rows} total={total} onPageChange={setPage} />}>
 *   <Table>…</Table>
 * </DataPanel>
 */
export function DataPanel({
  title,
  count,
  toolbar,
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  empty,
  footer,
  skeletonRows = 5,
  children,
  className,
}) {
  let body = children;
  if (loading) {
    body = (
      <div className="flex flex-col gap-3 p-4" aria-busy="true" aria-label="Loading">
        {Array.from({ length: skeletonRows }, (_, index) => (
          <Skeleton key={index} className="h-6 w-full" />
        ))}
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center" role="alert">
        <p className="text-[15px] font-semibold text-foreground">Couldn&apos;t load this list</p>
        <p className="max-w-[48ch] text-sm text-gray-600">
          {typeof error === 'string' ? error : error?.message || 'Check your connection and try again.'}
        </p>
        {onRetry ? (
          <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  } else if (isEmpty) {
    body = <EmptyState {...empty} />;
  }

  const showHeader = title || toolbar;

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card', className)}>
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          {title ? (
            <h2 className="text-base font-semibold text-foreground">
              {title}
              {typeof count === 'number' ? <span className="font-normal text-muted-foreground"> · {count}</span> : null}
            </h2>
          ) : (
            <span />
          )}
          {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}
      <div className="overflow-x-auto">{body}</div>
      {footer && !loading && !error && !isEmpty ? <div className="border-t">{footer}</div> : null}
    </div>
  );
}

/** "Showing 1–25 of 120" with previous / next. `page` is 1-based. */
export function TablePagination({ page, pageSize, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total || 0);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] text-muted-foreground">
      <span className="tabular-nums">
        Showing {first}–{last} of {total ?? 0}
      </span>
      <div className="flex gap-1.5">
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
