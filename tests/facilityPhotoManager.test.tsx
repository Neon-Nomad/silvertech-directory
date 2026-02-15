// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FacilityPhotoManager } from '@/features/operator/dashboard/FacilityPhotoManager';

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
        remove: async () => ({ error: null }),
      }),
    },
  },
}));

describe('FacilityPhotoManager mobile upload ergonomics', () => {
  it('uses camera-capable input settings', async () => {
    const { container } = render(<FacilityPhotoManager facilityId="fac-1" />);
    await screen.findByText('No photos added yet');

    const input = container.querySelector('input#gallery-upload');
    expect(input).toBeTruthy();
    expect(input).toHaveAttribute('multiple');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('capture', 'environment');
  });
});
