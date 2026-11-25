import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// For statuses use <StatusBadge> from '@/components/system', which picks the tone and label for you.
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium leading-4',
  {
    variants: {
      variant: {
        default: 'border-status-info-line bg-status-info-bg text-status-info',
        secondary: 'border-status-neutral-line bg-status-neutral-bg text-status-neutral',
        destructive: 'border-status-danger-line bg-status-danger-bg text-status-danger',
        outline: 'border-border bg-white text-foreground',
        pending: 'border-status-pending-line bg-status-pending-bg text-status-pending',
        info: 'border-status-info-line bg-status-info-bg text-status-info',
        success: 'border-status-success-line bg-status-success-bg text-status-success',
        danger: 'border-status-danger-line bg-status-danger-bg text-status-danger',
        neutral: 'border-status-neutral-line bg-status-neutral-bg text-status-neutral',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
