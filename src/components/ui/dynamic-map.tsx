'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface Position {
  position?: {
    latitude: number;
    longitude: number;
  };
  vehicle?: {
    id: string;
    label: string;
  };
  current_status?: number;
  timestamp?: {
    low: string;
  };
}

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface MapComponentProps {
  positions: Position[];
  selectedLine: string;
  boardingStation?: Station | null;
  destinationStation?: Station | null;
}

// Dynamic import with no SSR to prevent server-side rendering issues
const DynamicMapComponent = dynamic(
  () => import('./map').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
) as ComponentType<MapComponentProps>;

export { DynamicMapComponent as MapComponent };
