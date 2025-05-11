'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, TrainFront, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Image from 'next/image'; // Keep for placeholder if needed

const STATION_OPTIONS: Record<string, string> = {
  "Adams/Wabash": "40540",
  "Clark/Lake": "40380",
  "Roosevelt": "41320",
  "Fullerton": "41220",
  "Belmont": "41330",
  "Ashland (Green/Pink)": "40170",
  "Harold Washington Library": "40850",
  "Ashland/Lake": "40010",
  "Cermak-McCormick Place": "41690",
  "Midway (Orange)": "40930",
  "Kimball (Brown)": "41290",
  "54th/Cermak (Pink)": "40580",
  "O'Hare (Blue)": "40890",
  "Howard (Red/Purple/Yellow)": "40900",
  "95th/Dan Ryan (Red)": "40450"
};

// Direct mapping from API route codes to display properties
const LINE_DETAILS: Record<string, { name: string; color: string }> = {
    "Red": { name: "Red Line", color: "#C0392B" },
    "Blue": { name: "Blue Line", color: "#3B5998" },
    "Brn": { name: "Brown Line", color: "#6E4B3A" },
    "G": { name: "Green Line", color: "#6BAE75" },
    "Org": { name: "Orange Line", color: "#E08E45" },
    "P": { name: "Purple Line", color: "#5E4A82" }, // API uses 'P'
    "Pink": { name: "Pink Line", color: "#D28A94" },
    "Y": { name: "Yellow Line", color: "#D6B84B" }  // API uses 'Y'
};


interface TrainArrival {
  runNumber: string;
  line: string; // e.g., "Red", "Blue", "Brn"
  lineFullName: string;
  lineColor: string;
  destination: string;
  arrivalTime: string; // Formatted as h:mm aa
  isApproaching: boolean;
  isDelayed: boolean;
  isScheduled: boolean; // true if scheduled, false if live tracking
  rawArrivalTime: string;
}

export function TrainView() {
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [arrivals, setArrivals] = useState<TrainArrival[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null); // For messages like "No trains found"

  const selectedStationName = Object.keys(STATION_OPTIONS).find(
    name => STATION_OPTIONS[name] === selectedStationId
  );

  useEffect(() => {
    if (!selectedStationId) {
      setArrivals([]);
      setError(null);
      setApiMessage(null);
      return;
    }

    let isActive = true; // Flag to prevent state updates on unmounted component

    const fetchArrivals = async () => {
      if (!isActive) return;
      setIsLoading(true);
      setError(null);
      setApiMessage(null);
      try {
        const res = await fetch(`/api/train?mapid=${selectedStationId}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch train arrivals: ${res.statusText} (Status: ${res.status})` }));
          throw new Error(errorData.message || `Failed to fetch train arrivals: ${res.statusText} (Status: ${res.status})`);
        }
        const data = await res.json();

        if (!isActive) return;

        if (data.arrivals) {
          setArrivals(data.arrivals);
          if (data.arrivals.length === 0 && data.message) {
            setApiMessage(data.message);
          }
        } else {
          setArrivals([]);
          setError(data.message || 'No arrivals data received or unexpected response structure.');
        }
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load train arrivals.');
        setArrivals([]);
      }
      if (isActive) {
        setIsLoading(false);
      }
    };

    fetchArrivals(); // Initial fetch
    const intervalId = setInterval(fetchArrivals, 30000); // Refresh every 30 seconds

    return () => {
      isActive = false; // Cleanup function to set isActive to false
      clearInterval(intervalId);
    };
  }, [selectedStationId]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading train arrivals...
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (!selectedStationId) {
         return (
            <div className="train-view-container p-4 border border-border rounded-lg bg-card shadow-sm">
                <div className="flex items-center mb-4">
                    <TrainFront className="h-6 w-6 mr-2 text-primary" />
                    <h2 className="text-xl font-semibold text-card-foreground">Real-time Train Tracker</h2>
                </div>
                 <p className="text-muted-foreground mb-4">
                    Please select a station to view live train arrivals.
                </p>
                <div className="map-placeholder aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center text-muted-foreground">
                    <Image
                    src="https://picsum.photos/seed/trainmapchic/600/400"
                    alt="Train Map Placeholder"
                    width={600}
                    height={400}
                    className="object-cover w-full h-full opacity-70"
                    data-ai-hint="subway map"
                    />
                </div>
            </div>
        );
    }

    if (arrivals.length === 0) {
      return (
        <Card>
          <CardContent className="pt-6 text-center">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {apiMessage || `No train predictions available for ${selectedStationName || 'this station'} at the moment.`}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Arrivals at {selectedStationName}</CardTitle>
          <CardDescription>Showing upcoming train arrivals. Data refreshes automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {arrivals.map((arrival, index) => (
              <li 
                key={`${arrival.runNumber}-${arrival.line}-${index}`} 
                className="p-4 border rounded-lg shadow-sm bg-card hover:bg-muted/50 transition-colors"
                style={{ borderLeft: `5px solid ${arrival.lineColor}`}}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span 
                      className="font-semibold text-lg" 
                      style={{ color: arrival.lineColor }}
                    >
                      {arrival.lineFullName}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">to {arrival.destination}</span>
                  </div>
                  <span className="font-bold text-lg">{arrival.arrivalTime}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-x-2">
                  <span>Run: {arrival.runNumber}</span>
                  {arrival.isApproaching && <span className="font-medium text-green-600">Approaching</span>}
                  {arrival.isDelayed && <span className="font-medium text-destructive">Delayed</span>}
                  {arrival.isScheduled && !arrival.isApproaching && !arrival.isDelayed && <span className="font-medium text-blue-600">Scheduled</span>}
                  {!arrival.isScheduled && !arrival.isApproaching && !arrival.isDelayed && <span className="font-medium text-primary">Live</span>}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="space-y-6 p-1 train-view-container">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrainFront className="h-5 w-5 mr-2 text-primary" />
            Select Train Station
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="station-select" className="sr-only">Select Station</Label>
            <Select
              value={selectedStationId}
              onValueChange={setSelectedStationId}
            >
              <SelectTrigger id="station-select" className="w-full">
                <SelectValue placeholder="Choose a station to see arrivals" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATION_OPTIONS).map(([name, id]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {renderContent()}
    </div>
  );
}
