import { Cloudinary } from '@cloudinary/url-gen/index';
import { fill, fit } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

const cld = new Cloudinary({ cloud: { cloudName: 'dchwbmloi' } });

export function fillUrl(filepath: string, width: number, height: number): string {
  return cld
    .image(filepath)
    .format('auto')
    .quality('auto')
    .resize(fill().width(width).height(height).gravity(autoGravity()))
    .toURL();
}

export function fitUrl(filepath: string, max: number): string {
  return cld.image(filepath).format('auto').quality('auto').resize(fit(max, max)).toURL();
}
