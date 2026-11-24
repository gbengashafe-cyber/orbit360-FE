import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FILTER_CONTROL_STATES } from './filter-control-states';

// Radix Select doesn't allow an empty-string item, so "no filter" is represented internally by this value.
const ALL = '__all__';

/**
 * Shared filter dropdown.
 * - `value` is '' when no filter is applied; `onChange` receives '' for the "All" option.
 * - options: [{ value, label }]
 * - With `label`, the trigger is a compact toolbar button: shows "Urgency" when empty and "Urgency: High" when set,
 *   with a highlighted (active) style while a value is selected.
 */
export function FilterSelect({
  id,
  value,
  onChange,
  options = [],
  label,
  allLabel = 'All',
  placeholder,
  disabled = false,
  className,
}) {
  const selected = options.find((option) => String(option.value) === String(value));
  const isActive = !!selected;

  return (
    <Select value={value ? String(value) : ALL} onValueChange={(next) => onChange(next === ALL ? '' : next)} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          label ? 'w-auto gap-2 whitespace-nowrap' : 'bg-white',
          label && (isActive ? FILTER_CONTROL_STATES.active : FILTER_CONTROL_STATES.default),
          FILTER_CONTROL_STATES.disabled,
          className,
        )}
      >
        {label ? (
          <SelectValue>
            {isActive ? (
              <>
                {label}: <span className="font-medium">{selected.label}</span>
              </>
            ) : (
              label
            )}
          </SelectValue>
        ) : (
          <SelectValue placeholder={placeholder ?? allLabel} />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
