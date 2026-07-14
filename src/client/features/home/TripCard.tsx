import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '@/api/client';
import { fillUrl } from '@/lib/cloudinary';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Trip } from '../../../shared/types';

export const TripCard = ({ trip }: { trip: Trip }) => {
  const navigate = useNavigate();
  const cover = useQuery({
    queryKey: ['tripPhotos', trip.id],
    queryFn: async () => {
      const res = await api.tripPhotos.$get({ query: { tripId: String(trip.id) } });
      if (!res.ok) throw new Error(`Failed to load trip photos (${res.status})`);
      return res.json();
    },
  });

  const photos = cover.data ?? [];
  const coverUrl = photos[0] ? fillUrl(photos[0].photoFilepath, 500, 300) : null;

  return (
    <Card className="tilt-l cursor-pointer overflow-hidden" onClick={() => navigate(`/trips/${trip.id}`)}>
      <div className="relative border-b-[2.5px] border-foreground">
        {coverUrl ? (
          <img src={coverUrl} alt={trip.tripName} className="h-[132px] w-full object-cover" />
        ) : (
          <Skeleton className="h-[132px] w-full" />
        )}
        <Badge className="absolute left-2 top-2 border-[2px] border-foreground bg-accent text-accent-foreground">
          {photos.length} photos
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="font-display text-base font-bold">{trip.tripName}</div>
        <div className="mt-1 text-[12.5px] text-muted-foreground">
          {new Date(trip.tripDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
        </div>
      </CardContent>
    </Card>
  );
};
