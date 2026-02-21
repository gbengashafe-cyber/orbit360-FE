import { useMemo, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Combobox({
  value,
  items = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  isLoading = false,
  getValue,
  getLabel,
  getDescription,
  onSearchChange,
  onSelect,
  emptyText = 'No results found.',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedItem = useMemo(() => items.find((item) => getValue(item) === value), [items, value, getValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal border-slate-200"
        >
          {selectedItem ? getLabel(selectedItem) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={(val) => {
              setQuery(val);
              onSearchChange?.(val);
            }}
          />

          <CommandList className="max-h-[300px] overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : items.length === 0 && query ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Start typing to search...</div>
            ) : (
              <CommandGroup>
                {items.map((item) => {
                  const itemValue = getValue(item);
                  const isSelected = itemValue === value;

                  return (
                    <CommandItem
                      key={itemValue}
                      value={itemValue}
                      onSelect={() => {
                        onSelect(item);
                        setOpen(false);
                        setQuery('');
                      }}
                      className="flex flex-col items-start py-2"
                    >
                      <div className="flex items-center w-full">
                        <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                        <span className="font-medium">{getLabel(item)}</span>
                      </div>

                      {getDescription && <span className="ml-6 text-xs text-muted-foreground">{getDescription(item)}</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
