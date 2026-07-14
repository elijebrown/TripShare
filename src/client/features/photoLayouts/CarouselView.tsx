import type { Photo } from '../../../shared/types';
import { fitUrl } from '@/lib/cloudinary';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

export const CarouselView = ({ photos }: { photos: Photo[] }) => {
  return (
    <Carousel opts={{ dragFree: true, loop: true, align: 'start' }} className="mx-6 mt-4">
      <CarouselContent>
        {photos.map((value) => (
          <CarouselItem key={value.photoFilepath} className="basis-auto">
            <img
              src={fitUrl(value.photoFilepath, 1200)}
              alt={value.caption ?? ''}
              className="max-h-[500px] rounded-[18px_14px_20px_12px] border-[2.5px] border-foreground object-contain"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
