import { describe, it, expect } from 'vitest';
import { fillUrl, fitUrl } from './cloudinary';

describe('cloudinary helpers', () => {
  it('fillUrl builds a delivery URL with the cloud name and filepath', () => {
    const url = fillUrl('sample.jpg', 320, 320);
    expect(url).toContain('dchwbmloi');
    expect(url).toContain('sample.jpg');
  });
  it('fitUrl builds a delivery URL with the cloud name and filepath', () => {
    const url = fitUrl('sample.jpg', 1200);
    expect(url).toContain('dchwbmloi');
    expect(url).toContain('sample.jpg');
  });
});
