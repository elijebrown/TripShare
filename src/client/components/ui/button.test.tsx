import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders wheat default variant with granola border', () => {
    render(<Button>Explore trips</Button>);
    const btn = screen.getByRole('button', { name: 'Explore trips' });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('bg-primary');
    expect(btn.className).toContain('border-foreground');
  });
});
