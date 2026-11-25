import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// DESIGN.md §6 Buttons. No gradients, no shadows; text buttons carry no icons.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // The one main action on a page or dialog.
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        // Only the confirm button inside a confirmation dialog.
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // Secondary actions: white with a border. `outline` and `secondary` look the same.
        outline: 'border border-input bg-white text-foreground hover:bg-gray-50',
        secondary: 'border border-input bg-white text-foreground hover:bg-gray-50',
        ghost: 'text-gray-700 hover:bg-accent hover:text-accent-foreground',
        // Red text, used for destructive items outside dialogs (e.g. inside menus).
        'destructive-ghost': 'text-status-danger hover:bg-status-danger-bg',
        link: 'h-auto px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3.5',
        sm: 'h-8 px-2.5 text-[13px]',
        lg: 'h-10 px-5',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
