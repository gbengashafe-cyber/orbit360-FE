import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FILTER_CONTROL_STATES } from '@/components/shared/filter-control-states';
import { cn } from '@/lib/utils';
import { countWorkingDays, formatDate, formatDateRange } from '@/components/system/format';
import { format, isValid, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Shared date pickers.
 * - Values are plain 'YYYY-MM-DD' strings ('' when empty), so they work directly with forms and API query params.
 * - Dates are displayed as "02 Dec 2026" (DESIGN.md §4).
 * - Weeks start on Monday. With `workingDaysOnly`, weekends and `holidays` ('YYYY-MM-DD') are greyed out and
 *   the range picker shows the number of working days.
 * - One month is shown at a time. Click the month or year in the header to jump straight to it.
 */

const DEFAULT_FROM_YEAR = 2015;

const toDate = (value) => {
  if (!value) return undefined;
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? date : undefined;
};

const toIso = (date) => (date ? format(date, 'yyyy-MM-dd') : '');

const disabledDays = (minDate, maxDate, { workingDaysOnly = false, holidays = [] } = {}) => {
  const rules = [];
  if (workingDaysOnly) {
    rules.push({ dayOfWeek: [0, 6] });
    holidays.map(toDate).filter(Boolean).forEach((day) => rules.push(day));
  }
  const min = toDate(minDate);
  const max = toDate(maxDate);
  if (min) rules.push({ before: min });
  if (max) rules.push({ after: max });
  return rules.length ? rules : undefined;
};

// Month/year dropdowns in the caption. The native <select> sits invisibly over the visible label,
// so clicking "November ▾" or "2026 ▾" opens a list to jump to.
const CAPTION_CLASSES = {
  caption: 'flex justify-center items-center relative h-9',
  caption_dropdowns: 'flex items-center gap-1',
  caption_label: 'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md hover:bg-accent',
  dropdown_month: 'relative inline-flex items-center',
  dropdown_year: 'relative inline-flex items-center',
  dropdown: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10',
  dropdown_icon: 'h-3.5 w-3.5 opacity-60',
  vhidden: 'sr-only',
};

function SharedCalendar({ minDate, maxDate, fromYear, toYear, workingDaysOnly, holidays, ...props }) {
  const max = toDate(maxDate);
  const min = toDate(minDate);

  return (
    <Calendar
      numberOfMonths={1}
      captionLayout="dropdown-buttons"
      fromYear={fromYear ?? min?.getFullYear() ?? DEFAULT_FROM_YEAR}
      toYear={toYear ?? max?.getFullYear() ?? new Date().getFullYear() + 5}
      disabled={disabledDays(minDate, maxDate, { workingDaysOnly, holidays })}
      classNames={CAPTION_CLASSES}
      // Passing `components` replaces the Calendar's own, so the arrow icons are repeated here.
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        IconDropdown: () => <ChevronDown className="h-3.5 w-3.5 opacity-60" />,
      }}
      initialFocus
      {...props}
    />
  );
}

function TriggerButton({ id, label, placeholder, disabled, className, onClear, showClear, compact }) {
  return (
    <div className={cn('relative', className)}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start px-2.5 text-left font-normal',
            showClear && 'pr-9',
            compact
              ? label
                ? FILTER_CONTROL_STATES.active
                : FILTER_CONTROL_STATES.default
              : cn('bg-white', !label && 'text-muted-foreground'),
            FILTER_CONTROL_STATES.disabled,
          )}
        >
          <span className="truncate">{label || placeholder}</span>
          {showClear ? null : <CalendarIcon className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        </Button>
      </PopoverTrigger>
      {showClear ? (
        <button
          type="button"
          aria-label="Clear date"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
        >
          <X className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  fromYear,
  toYear,
  disabled = false,
  clearable = true,
  workingDaysOnly = false,
  holidays = [],
  className,
}) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TriggerButton
        id={id}
        label={selected ? formatDate(toIso(selected)) : ''}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        showClear={clearable && !!selected && !disabled}
        onClear={() => onChange('')}
      />
      <PopoverContent className="w-auto p-0" align="start">
        <SharedCalendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? toDate(maxDate)}
          minDate={minDate}
          maxDate={maxDate}
          fromYear={fromYear}
          toYear={toYear}
          workingDaysOnly={workingDaysOnly}
          holidays={holidays}
          onSelect={(date) => {
            onChange(toIso(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Pick a single date or a start and end date.
 * First click sets the date (a one-day range); a second click on another day sets the end of the range.
 */
export function DateRangePicker({
  id,
  value = { from: '', to: '' },
  onChange,
  placeholder = 'Select date range',
  minDate,
  maxDate,
  fromYear,
  toYear,
  disabled = false,
  compact = false, // toolbar style: highlighted while a date is selected
  workingDaysOnly = false, // grey out weekends and holidays and show the working-day count
  holidays = [],
  className,
}) {
  const [open, setOpen] = useState(false);
  const from = toDate(value?.from);
  const to = toDate(value?.to);

  const label = from ? formatDateRange(toIso(from), toIso(to ?? from), { fallback: '' }) : '';
  const workingDays = from ? countWorkingDays(toIso(from), toIso(to ?? from), holidays) : 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TriggerButton
        id={id}
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        showClear={!!from && !disabled}
        onClear={() => onChange({ from: '', to: '' })}
        compact={compact}
      />
      <PopoverContent className="w-auto p-0" align="start">
        <SharedCalendar
          mode="range"
          selected={{ from, to }}
          defaultMonth={from ?? toDate(maxDate)}
          minDate={minDate}
          maxDate={maxDate}
          fromYear={fromYear}
          toYear={toYear}
          workingDaysOnly={workingDaysOnly}
          holidays={holidays}
          onSelect={(range) => onChange({ from: toIso(range?.from), to: toIso(range?.to ?? range?.from) })}
        />
        <div className="flex items-center justify-between gap-4 border-t px-3 py-2">
          <p className="text-xs text-muted-foreground tabular-nums">
            {workingDaysOnly && from
              ? `${workingDays} working day${workingDays === 1 ? '' : 's'}`
              : 'Pick one date, or a start and end date.'}
          </p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!from}
              onClick={() => onChange({ from: '', to: '' })}
            >
              Clear
            </Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
