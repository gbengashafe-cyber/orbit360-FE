import * as React from 'react';

import { cn } from '@/lib/utils';

// DESIGN.md §6 Forms: 36px, gray-300 border, brand focus ring.
export const inputBaseClasses =
  'flex h-9 w-full rounded-md border border-input bg-white px-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70 aria-[invalid=true]:border-destructive';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        inputBaseClasses,
        'py-1 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
