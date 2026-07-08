import { useLoaderData } from 'react-router';
import { CarouselView } from '../features/photoLayouts/CarouselView';
import { tripPhotosLoader } from '../api/loaders';

export const Trip = () => {
  const photos = useLoaderData<typeof tripPhotosLoader>();

  return <CarouselView photos={photos ?? []} />;
};
