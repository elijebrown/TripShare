import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';

const trips = [{ id: 1, tripName: 'Patagonia Loop', tripDate: '2026-03-01', tripText: null }];
const photos = [
  { id: 1, cityId: null, photoFilepath: 'p1.jpg', date: '2026-03-02', caption: null },
];
const memories = [{ id: 1, tripId: 1, memoryTitle: 'Sunrise', memoryText: null }];

vi.mock('@/api/client', () => ({
  api: {
    trips: { $get: vi.fn().mockResolvedValue({ ok: true, json: async () => trips }) },
    photos: { $get: vi.fn().mockResolvedValue({ ok: true, json: async () => photos }) },
    memories: { $get: vi.fn().mockResolvedValue({ ok: true, json: async () => memories }) },
    tripPhotos: { $get: vi.fn().mockResolvedValue({ ok: true, json: async () => photos }) },
  },
}));

import Home from './Home';

describe('Home', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the hero tagline and section headings once data loads', async () => {
    renderWithProviders(<Home />);
    expect(await screen.findByText(/Featured trips/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent memories/i)).toBeInTheDocument();
    expect(screen.getByText(/Latest photos/i)).toBeInTheDocument();
    const tripNames = await screen.findAllByText('Patagonia Loop');
    expect(tripNames[0]).toBeInTheDocument();
  });
});
