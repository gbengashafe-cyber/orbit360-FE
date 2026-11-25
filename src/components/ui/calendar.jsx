import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// DESIGN.md §6 Date picker: weeks start on Monday; selected day solid brand; today outlined; range middle brand-50.
function Calendar({ className, classNames, showOutsideDays = true, weekStartsOn = 1, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      weekStartsOn={weekStartsOn}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-3',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-semibold',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(buttonVariants({ variant: 'outline' }), 'h-7 w-7 p-0 text-gray-600'),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'text-muted-foreground w-9 font-normal text-xs',
        row: 'flex w-full mt-0.5',
        cell: cn(
          'relative p-0 text-center text-[13px] tabular-nums focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-brand-50 [&:has([aria-selected].day-outside)]:bg-brand-50/50 [&:has([aria-selected].day-range-end)]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md',
        ),
        day: cn(buttonVariants({ variant: 'ghost' }), 'h-9 w-9 p-0 font-normal text-foreground aria-selected:opacity-100'),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'shadow-[inset_0_0_0_1px_hsl(var(--primary))]',
        day_outside: 'day-outside text-gray-400 aria-selected:bg-brand-50/50 aria-selected:text-gray-500',
        day_disabled: 'text-gray-400 line-through opacity-70',
        day_range_middle: 'aria-selected:bg-brand-50 aria-selected:font-normal aria-selected:text-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => <ChevronLeft className={cn('h-4 w-4', className)} {...props} />,
        IconRight: ({ className, ...props }) => <ChevronRight className={cn('h-4 w-4', className)} {...props} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
