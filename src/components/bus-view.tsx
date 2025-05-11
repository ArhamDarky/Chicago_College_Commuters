
'use client';

import type { FC } from 'react';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image'; // Added for placeholder image

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, ListCollapse, BusFront, Info } from 'lucide-react'; // Added BusFront and Info

// --- Interfaces for API Responses ---
interface CtaRoute {
  rt: string;
  rtnm: string;
  rtclr: string; 
  rtdd: string; 
}
interface CtaDirection {
  dir: string;
}
interface CtaStop {
  stpid: string;
  stpnm: string;
}
interface CtaPrediction {
  ty: string; 
  stpnm: string; 
  stpid: string; 
  vid: string; 
  rt: string; 
  rtdir: string; 
  des: string; 
  prdtm: string; 
  dly: boolean; 
  prdctdn: string; 
}

// --- Helper Functions ---
const formatPredictionTime = (timestamp: string): string => {
  if (!timestamp || !timestamp.includes(' ')) return "N/A";
  const [_datePart, timePart] = timestamp.split(' ');
  const [hour, minute] = timePart.split(':');
  let h = parseInt(hour, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const formattedHour = h % 12 === 0 ? 12 : h % 12;
  return `${formattedHour}:${minute} ${suffix}`;
};


export function BusView() {
  const [routes, setRoutes] = useState<CtaRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [directions, setDirections] = useState<CtaDirection[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  const [stops, setStops] = useState<CtaStop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [predictions, setPredictions] = useState<CtaPrediction[]>([]);
  
  const [isLoading, setIsLoading] = useState({
    routes: true, // Start with routes loading true
    directions: false,
    stops: false,
    predictions: false,
  });
  const [error, setError] = useState<string | null>(null);

  const selectedStopDetails = useMemo(() => stops.find(s => s.stpid === selectedStopId), [stops, selectedStopId]);


  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(prev => ({ ...prev, routes: true }));
      setError(null);
      try {
        const res = await fetch('/api/bus?action=routes');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch routes: ${res.statusText}` }));
          throw new Error(errorData.message || `Failed to fetch routes: ${res.statusText}`);
        }
        const data = await res.json();
        if (data && data.routes) {
          setRoutes(data.routes);
        } else if (data && data.errors) { 
          setError(`API Error: ${data.errors.map((e: {msg: string}) => e.msg).join(', ')}`);
          setRoutes([]);
        } else {
          setRoutes([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load routes.');
        setRoutes([]);
      }
      setIsLoading(prev => ({ ...prev, routes: false }));
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (!selectedRoute) {
      setDirections([]);
      setSelectedDirection('');
      setStops([]);
      setSelectedStopId('');
      setPredictions([]);
      return;
    }
    const fetchDirections = async () => {
      setIsLoading(prev => ({ ...prev, directions: true, stops: false, predictions: false }));
      setStops([]); 
      setSelectedStopId('');
      setPredictions([]);
      setError(null);
      try {
        const res = await fetch(`/api/bus?action=directions&rt=${selectedRoute}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch directions: ${res.statusText}` }));
          throw new Error(errorData.message || `Failed to fetch directions: ${res.statusText}`);
        }
        const data = await res.json();
        if (data && data.directions) {
          setDirections(data.directions);
        } else if (data && data.errors) {
          setError(`API Error: ${data.errors.map((e: {msg: string}) => e.msg).join(', ')}`);
          setDirections([]);
        } else {
          setDirections([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load directions.');
        setDirections([]);
      }
      setIsLoading(prev => ({ ...prev, directions: false }));
    };
    fetchDirections();
  }, [selectedRoute]);

  useEffect(() => {
    if (!selectedRoute || !selectedDirection) {
      setStops([]);
      setSelectedStopId('');
      setPredictions([]);
      return;
    }
    const fetchStops = async () => {
      setIsLoading(prev => ({ ...prev, stops: true, predictions: false }));
      setPredictions([]); 
      setError(null);
      try {
        const res = await fetch(`/api/bus?action=stops&rt=${selectedRoute}&dir=${encodeURIComponent(selectedDirection)}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch stops: ${res.statusText}` }));
          throw new Error(errorData.message || `Failed to fetch stops: ${res.statusText}`);
        }
        const data = await res.json();
        if (data && data.stops) {
          setStops(data.stops);
        } else if (data && data.errors) {
          setError(`API Error: ${data.errors.map((e: {msg: string}) => e.msg).join(', ')}`);
          setStops([]);
        } else {
          setStops([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stops.');
        setStops([]);
      }
      setIsLoading(prev => ({ ...prev, stops: false }));
    };

    fetchStops();
    setSelectedStopId(''); 
  }, [selectedRoute, selectedDirection]);

  const handleFetchPredictions = async () => {
    if (!selectedRoute || !selectedStopId) {
      setPredictions([]); 
      return;
    }
    setIsLoading(prev => ({ ...prev, predictions: true }));
    setError(null);
    try {
      const res = await fetch(`/api/bus?action=predictions&rt=${selectedRoute}&stpid=${selectedStopId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Failed to fetch predictions: ${res.statusText}` }));
        throw new Error(errorData.message || `Failed to fetch predictions: ${res.statusText}`);
      }
      const data = await res.json();
      if (data && data.prd) {
        setPredictions(data.prd);
      } else if (data && data.error) { 
        // CTA API sometimes returns error as an array of objects with a 'msg' field
        const errorMessages = Array.isArray(data.error) ? data.error.map((e: {msg: string}) => e.msg).join(', ') : String(data.error);
        setError(`API Error: ${errorMessages}`);
        setPredictions([]);
      } else if (data && data.errors) { // Handle { "bustime-response": { "errors": [...] } }
        const errorMessages = Array.isArray(data.errors) ? data.errors.map((e: {msg: string}) => e.msg).join(', ') : String(data.errors);
        setError(`API Error: ${errorMessages}`);
        setPredictions([]);
      } else {
        setPredictions([]); 
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions.');
      setPredictions([]);
    }
    setIsLoading(prev => ({ ...prev, predictions: false }));
  };
  
  useEffect(() => {
    if (selectedStopId && selectedRoute) { 
        handleFetchPredictions();
    } else {
        setPredictions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStopId, selectedRoute]);

  const resetForm = () => {
    setSelectedRoute('');
    // Other states will be reset by chained useEffects clearing them.
    setError(null);
  };

  const renderInitialContent = () => {
    return (
      <div className="bus-view-container p-4 border border-border rounded-lg bg-card shadow-sm">
        <div className="flex items-center mb-4">
          <BusFront className="h-6 w-6 mr-2 text-primary" />
          <h2 className="text-xl font-semibold text-card-foreground">Real-time Bus Tracker</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Please select a route, direction, and stop to view live bus arrivals.
        </p>
        <div className="map-placeholder aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center text-muted-foreground shadow-inner">
          <Image
            src="https://picsum.photos/seed/busmapchicago/600/400"
            alt="Bus Map Placeholder"
            width={600}
            height={400}
            className="object-cover w-full h-full opacity-70"
            data-ai-hint="city bus route"
          />
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6 p-1 bus-view-container">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bus Selection</span>
            <Button variant="ghost" size="icon" onClick={resetForm} aria-label="Reset selections" disabled={!selectedRoute && !selectedDirection && !selectedStopId}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </CardTitle>
           {isLoading.routes && !routes.length && (
            <CardDescription>Loading available bus routes...</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="route-select">Route</Label>
            <Select
              value={selectedRoute}
              onValueChange={(value) => {
                setSelectedRoute(value);
                setSelectedDirection('');
                setSelectedStopId('');
                setDirections([]);
                setStops([]);
                setPredictions([]);
              }}
              disabled={isLoading.routes || routes.length === 0}
            >
              <SelectTrigger id="route-select" className="w-full">
                <SelectValue placeholder={isLoading.routes ? "Loading routes..." : (routes.length === 0 ? "No routes available" : "Select a route")} />
              </SelectTrigger>
              <SelectContent>
                {isLoading.routes ? (
                  <SelectItem value="loading-routes" disabled>Loading routes...</SelectItem>
                ) : routes.length > 0 ? (
                  routes.map(route => (
                    <SelectItem key={route.rt} value={route.rt}>
                      {route.rt} - {route.rtnm}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-routes" disabled>No routes available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedRoute && (
            <div>
              <Label htmlFor="direction-select">Direction</Label>
              <Select 
                value={selectedDirection} 
                onValueChange={(value) => {
                  setSelectedDirection(value);
                  setSelectedStopId('');
                  setStops([]);
                  setPredictions([]);
                }}
                disabled={isLoading.directions || directions.length === 0}
              >
                <SelectTrigger id="direction-select" className="w-full">
                  <SelectValue placeholder={
                      isLoading.directions ? "Loading directions..." :
                      (directions.length === 0 && !isLoading.directions ? "No directions for this route" : "Select a direction")
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoading.directions ? (
                     <SelectItem value="loading-directions" disabled>Loading directions...</SelectItem>
                  ) : directions.length > 0 ? (
                    directions.map(dir => (
                      <SelectItem key={dir.dir} value={dir.dir}>
                        {dir.dir}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-directions" disabled>No directions available for this route</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedDirection && ( 
            <div>
              <Label htmlFor="stop-select">Stop</Label>
              <Select 
                value={selectedStopId} 
                onValueChange={setSelectedStopId} 
                disabled={isLoading.stops || stops.length === 0}
              >
                <SelectTrigger id="stop-select" className="w-full">
                  <SelectValue placeholder={
                    isLoading.stops ? "Loading stops..." :
                    (stops.length === 0 && !isLoading.stops ? "No stops for this direction" : "Select a stop")
                  } />
                </SelectTrigger>
                <SelectContent>
                 {isLoading.stops ? (
                    <SelectItem value="loading-stops" disabled>Loading stops...</SelectItem>
                  ) : stops.length > 0 ? (
                    stops.map(stop => (
                      <SelectItem key={stop.stpid} value={stop.stpid}>
                        {stop.stpnm} ({stop.stpid})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-stops" disabled>No stops available for this direction</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {!selectedRoute && !isLoading.routes && renderInitialContent()}


      {isLoading.predictions && selectedStopId && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading predictions...
        </div>
      )}

      {predictions.length > 0 && selectedStopId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <ListCollapse className="h-5 w-5 mr-2"/> Upcoming Buses at {selectedStopDetails?.stpnm || 'Selected Stop'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {predictions.map((p, i) => (
                <li key={`${p.vid}-${p.prdtm}-${i}`} className="text-sm p-3 border rounded-md shadow-sm bg-card hover:bg-muted/50 transition-colors">
                  <div className="font-semibold">Route <strong>{p.rt}</strong> to <strong>{p.des}</strong></div>
                  <div className="text-muted-foreground text-xs">Direction: {p.rtdir}</div>
                  <div className="mt-1">
                    Arrival: <strong>{formatPredictionTime(p.prdtm)}</strong> (Est. {p.prdctdn})
                    {p.dly && <span className="ml-2 px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded-full">Delayed</span>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {selectedStopId && !isLoading.predictions && predictions.length === 0 && !error && (
         <Card>
            <CardContent className="pt-6 text-center">
                <Info className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No bus predictions available for this stop at the moment, or the selected route may not service this stop directly.</p>
            </CardContent>
         </Card>
      )}
    </div>
  );
}

