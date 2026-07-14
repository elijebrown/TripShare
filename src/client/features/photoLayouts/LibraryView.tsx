import type { Photo } from '../../../shared/types';
import { fillUrl } from '@/lib/cloudinary';

export const LibraryView = ({ photos }: { photos: Photo[] }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 p-3">
      {photos.map((value) => (
        <img
          key={value.photoFilepath}
          src={fillUrl(value.photoFilepath, 320, 320)}
          alt={value.caption ?? ''}
          className="h-40 w-40 rounded-[14px_10px_12px_11px] border-[2.5px] border-foreground object-cover"
        />
      ))}
    </div>
  );
};
