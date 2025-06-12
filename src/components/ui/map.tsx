'use client';

import { useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ensure Leaflet is only initialized on the client side
const isBrowser = typeof window !== 'undefined';

// Fix for default marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icons for stations
const BoardingStationIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#22c55e"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const DestinationStationIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#ef4444"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

export function MapComponent({ positions, selectedLine, boardingStation, destinationStation }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  
  // Chicago's coordinates as default center
  const defaultCenter: [number, number] = [41.8781, -87.6298];

  // Find center based on train positions or default to Chicago
  const mapCenter = positions.length > 0 && positions[0].position
    ? [positions[0].position.latitude, positions[0].position.longitude] as [number, number]
    : defaultCenter;

  useEffect(() => {
    // Only run on client side
    if (!isBrowser) return;

    return () => {
      // Cleanup Leaflet map container on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      
      // Additional cleanup for any remaining containers
      const containers = document.querySelectorAll('.leaflet-container');
      containers.forEach(container => {
        // @ts-ignore - Leaflet types
        if (container._leaflet_id) {
          try {
            container.remove();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
    };
  }, []);

  // Don't render on server side
  if (!isBrowser) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={11}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0, position: 'relative'}}
      ref={mapRef}
      key={`map-${selectedLine}`} // Force re-render when line changes
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positions.map((pos) => {
        if (!pos.position?.latitude || !pos.position?.longitude) return null;
        
        return (
          <Marker
            key={pos.vehicle?.id}
            position={[pos.position.latitude, pos.position.longitude]}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Train {pos.vehicle?.label || pos.vehicle?.id}</p>
                <p>Status: {pos.current_status === 2 ? 'In Transit' : 'N/A'}</p>
                {pos.timestamp && (
                  <p>Last Update: {new Date(pos.timestamp.low).toLocaleTimeString()}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Boarding Station Marker */}
      {boardingStation && (
        <Marker
          position={[boardingStation.latitude, boardingStation.longitude]}
          icon={BoardingStationIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Get On At: {boardingStation.name}</p>
              <p>Station ID: {boardingStation.id}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination Station Marker */}
      {destinationStation && (
        <Marker
          position={[destinationStation.latitude, destinationStation.longitude]}
          icon={DestinationStationIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Get Off At: {destinationStation.name}</p>
              <p>Station ID: {destinationStation.id}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}