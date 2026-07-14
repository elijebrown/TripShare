import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '@/api/client';
import { fillUrl } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WavyDivider } from '@/components/ui/wavy-divider';
import { TripCard } from '@/features/home/TripCard';
import type { Photo } from '../../shared/types';

function SectionHeading({ title }: { title: string }) {
  return <h3 className="font-display text-2xl font-bold">{title}</h3>;
}

export default function Home() {
  const navigate = useNavigate();

  const trips = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.trips.$get();
      if (!res.ok) throw new Error(`Failed to load trips (${res.status})`);
      return res.json();
    },
  });
  const photos = useQuery({
    queryKey: ['photos'],
    queryFn: async () => {
      const res = await api.photos.$get();
      if (!res.ok) throw new Error(`Failed to load photos (${res.status})`);
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

  const featured = (trips.data ?? []).slice(0, 3);
  const latest = [...(photos.data ?? [])]
    .sort((a: Photo, b: Photo) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 6);
  const recentMemories = (memories.data ?? []).slice(0, 3);

  return (
    <div>
      {/* HERO */}
      <section className="relative m-6 overflow-hidden rounded-[36px_26px_40px_24px] border-[2.5px] border-foreground bg-accent p-11 shadow-[var(--shadow-granola)]">
        <div className="relative max-w-[560px]">
          <span className="mb-4 inline-block rounded-full border-[2px] border-foreground bg-background px-3 py-1 text-xs font-bold text-secondary">
            🌾 {trips.data?.length ?? 0} trips · {photos.data?.length ?? 0} photos
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] text-accent-foreground">
            Every journey,<br />
            <span className="italic">kept somewhere warm.</span>
          </h1>
          <p className="mb-6 mt-3 max-w-[430px] text-base text-foreground">
            Relive your trips and the memories inside them — photos, places, and the little
            moments in between.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/trips')}>Explore trips →</Button>
            <Button variant="secondary" onClick={() => navigate('/photos')}>
              View photos
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURED TRIPS */}
      <section className="px-6 pb-2 pt-4">
        <div className="mb-4 flex items-baseline justify-between">
          <SectionHeading title="Featured trips" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {trips.isLoading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[220px] w-full rounded-[22px]" />)
            : featured.map((t) => <TripCard key={t.id} trip={t} />)}
        </div>
      </section>

      {/* RECENT MEMORIES */}
      <section className="mt-8">
        <WavyDivider />
        <div className="bg-accent px-6 py-4">
          <SectionHeading title="Recent memories" />
          <div className="mt-3 flex flex-col gap-4 sm:flex-row">
            {recentMemories.map((m) => (
              <div
                key={m.id}
                className="flex-1 rounded-[16px_12px_14px_12px] border-[2.5px] border-foreground bg-background p-3 shadow-[3px_3px_0_var(--color-foreground)]"
              >
                <div className="font-display text-[14.5px] font-bold">
                  {m.memoryTitle ?? `Memory #${m.id}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {trips.data?.find((t) => t.id === m.tripId)?.tripName ?? 'Trip'}
                </div>
              </div>
            ))}
          </div>
        </div>
        <WavyDivider flip />
      </section>

      {/* LATEST PHOTOS */}
      <section className="px-6 pb-10 pt-4">
        <SectionHeading title="Latest photos" />
        <div className="mt-3 flex gap-3 overflow-hidden">
          {latest.map((p) => (
            <img
              key={p.id}
              src={fillUrl(p.photoFilepath, 200, 200)}
              alt={p.caption ?? ''}
              className="h-[100px] w-1/6 rounded-[14px_10px_12px_11px] border-[2.5px] border-foreground object-cover"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
