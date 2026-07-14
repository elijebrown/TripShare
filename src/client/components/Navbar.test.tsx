import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Navbar } from './Navbar';

vi.mock('@/api/client', () => ({
  api: {
    trips: { $get: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) },
    memories: { $get: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) },
    searchAll: { $get: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) },
  },
}));

describe('Navbar', () => {
  it('renders the brand and primary nav links', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText(/TripShare/i)).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});
