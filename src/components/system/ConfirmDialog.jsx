import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

/**
 * Confirmation before an action (DESIGN.md §6 Modal).
 * - Title is a question ("Cancel this loan request?"); description says what will happen.
 * - Buttons say exactly what they do ("Keep request" / "Cancel request"). Primary action on the right.
 * - `destructive` makes the confirm button solid red: the only place a solid red button appears.
 * - Optional `children` (details, a reason field) sit between the header and the footer.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
  loading = false,
  confirmDisabled = false,
  children,
}) {
  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="max-w-[460px] gap-0 p-0">
        <DialogHeader className="px-5 pb-4 pt-5">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children ? <div className="flex flex-col gap-3 px-5 pb-4 text-sm">{children}</div> : null}
        <div className="flex flex-col-reverse gap-2 rounded-b-lg border-t bg-gray-50 px-5 py-3.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange?.(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={loading || confirmDisabled}>
            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
