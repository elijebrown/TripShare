import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { SearchAnything } from '@/features/searchAnything/SearchAnything';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  const navigate = useNavigate();

  const trips = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.trips.$get();
      if (!res.ok) throw new Error(`Failed to load trips (${res.status})`);
      return res.json();
    },
  });
  const memories = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const res = await api.memories.$get();
      if (!res.ok) throw new Error(`Failed to load memories (${res.status})`);
      return res.json();
    },
  });

  return (
    <header className="sticky top-0 z-20 flex items-center gap-5 border-b-[2.5px] border-foreground bg-background px-6 py-3">
      <button
        onClick={() => navigate('/')}
        className="font-display text-xl font-bold italic text-secondary"
      >
        🏕 TripShare
      </button>
      <NavigationMenu>
        <NavigationMenuList className="gap-1">
          <NavigationMenuItem>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Home
            </Button>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="font-display">Trips</NavigationMenuTrigger>
            <NavigationMenuContent className="flex min-w-[200px] flex-col p-1">
              {trips.data?.map((t) => (
                <Button
                  key={t.id}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate(`/trips/${t.id}`)}
                >
                  {t.tripName}
                </Button>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="font-display">Memories</NavigationMenuTrigger>
            <NavigationMenuContent className="flex min-w-[200px] flex-col p-1">
              {memories.data?.map((m) => (
                <Button
                  key={m.id}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate(`/memories/${m.id}`)}
                >
                  {m.memoryTitle ?? `Memory #${m.id}`}
                </Button>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button variant="ghost" size="sm" onClick={() => navigate('/photos')}>
              Photos
            </Button>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button variant="ghost" size="sm">
              About
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="ml-auto w-[240px]">
        <SearchAnything />
      </div>
    </header>
  );
};
