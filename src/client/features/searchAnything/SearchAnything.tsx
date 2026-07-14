import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '@/api/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

export const SearchAnything = () => {
  const [value, setValue] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const latestQuery = useRef('');
  const navigate = useNavigate();

  const handleChange = async (next: string) => {
    setValue(next);
    latestQuery.current = next;
    if (!next) {
      setResults([]);
      setOpen(false);
      return;
    }
    const res = await api.searchAll.$get({ query: { search: next } });
    if (!res.ok) return;
    const searchResults = await res.json();
    if (latestQuery.current !== next) return;
    setResults(
      searchResults.map(
        (r) => `${r.name}: ${r.type === 'province' ? 'region' : r.type}`
      )
    );
    setOpen(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search anything…"
          className="w-full rounded-full border-[2.5px] border-foreground bg-card px-4 py-2 text-sm shadow-[2px_2px_0_var(--color-primary)] outline-none placeholder:text-muted-foreground"
        />
      </PopoverTrigger>
      <PopoverContent className="w-[260px] border-[2.5px] border-foreground p-0" align="end">
        <Command>
          <CommandList>
            <CommandGroup>
              {results.map((r) => (
                <CommandItem
                  key={r}
                  onSelect={() => {
                    setOpen(false);
                    navigate('/');
                  }}
                >
                  {r}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
