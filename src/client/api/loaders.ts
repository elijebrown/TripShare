import type { LoaderFunctionArgs } from 'react-router';
import { api } from './client';

export const tripPhotosLoader = async ({ params }: LoaderFunctionArgs) => {
  const res = await api.tripPhotos.$get({
    query: { tripId: params.tripId ?? '' },
  });
  if (!res.ok) {
    throw new Error(`Failed to load trip photos (${res.status})`);
  }
  return res.json();
};

export const photosLoader = async () => {
  const res = await api.photos.$get();
  if (!res.ok) {
    throw new Error(`Failed to load photos (${res.status})`);
  }
  return res.json();
};
