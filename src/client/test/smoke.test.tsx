import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './render';

describe('test harness', () => {
  it('renders a component with providers', () => {
    renderWithProviders(<h1>hello prairie</h1>);
    expect(screen.getByText('hello prairie')).toBeInTheDocument();
  });
});
