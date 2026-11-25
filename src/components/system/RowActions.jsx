import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

/**
 * The ⋯ menu for table rows (DESIGN.md §6 Dropdown menu).
 * - Any table where rows can have more than one action uses this on every row, so the column lines up.
 * - Items that don't apply to a row are passed with `hidden: true` (or left out).
 * - Text only. The destructive item goes last, in red; end its label with "…" when it opens a confirmation.
 * - Clicks inside the menu don't trigger the row's own click (which opens the row's details).
 *
 * <RowActions label="Loan · Salary advance" items={[
 *   { label: 'View details', onSelect: () => open(loan) },
 *   { label: 'Cancel request…', onSelect: () => confirmCancel(loan), destructive: true, hidden: !canCancel },
 * ]} />
 */
export function RowActions({ items = [], label, ariaLabel = 'Actions' }) {
  const visible = items.filter((item) => item && !item.hidden);
  if (!visible.length) return <span className="inline-block h-8 w-8" aria-hidden="true" />;

  const regular = visible.filter((item) => !item.destructive);
  const destructive = visible.filter((item) => item.destructive);
  const stop = (event) => event.stopPropagation();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild onClick={stop}>
        <Button variant="ghost" size="icon-sm" aria-label={ariaLabel}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={stop}>
        {label ? <DropdownMenuLabel>{label}</DropdownMenuLabel> : null}
        {regular.map((item) => (
          <DropdownMenuItem key={item.label} disabled={item.disabled} onSelect={item.onSelect}>
            {item.label}
          </DropdownMenuItem>
        ))}
        {regular.length && destructive.length ? <DropdownMenuSeparator /> : null}
        {destructive.map((item) => (
          <DropdownMenuItem key={item.label} variant="destructive" disabled={item.disabled} onSelect={item.onSelect}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
