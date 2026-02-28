import { useDebounce } from '@/api/apiClient';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useEffect } from 'react';

export function DebouncedSearch({ value, onSearch, delay = 500, loading = false, onChange, placeholder = 'Search...' }) {
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue.trim());
    }
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    if (onChange) onChange('');
    if (onSearch) onSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="px-9 bg-white"
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        {loading ? (
          <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
        ) : (
          value && (
            <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground transition">
              <X className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
