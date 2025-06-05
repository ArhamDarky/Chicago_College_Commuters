'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ticket, AlertTriangle, Train, RefreshCcw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Helper Interfaces
interface ApiTimestamp {
  low: string; // Assuming this is the primary timestamp string like "2025-06-04T04:40:40.000Z"
  high: number;
  unsigned: boolean;
}

interface TranslationItem {
  text: string;
  language: string;
}

interface TranslatedText {
  translation: TranslationItem[];
}

// Metra Alert Interface
interface MetraAlert {
  id: string;
  is_deleted: boolean;
  alert: {
    active_period: any[];
    informed_entity: Array<{ agency_id?: string; route_id?: string; trip?: any; stop_id?: string; }>;
    cause?: number;
    effect?: number;
    url: TranslatedText;
    header_text: TranslatedText;
    description_text: TranslatedText; // Assuming similar structure
  };
}

// Metra Position Interfaces
interface MetraVehiclePosition {
  trip?: { // Trip can be null
    trip_id: string;
    route_id: string;
    direction_id?: number | null;
    start_time?: string;
    start_date?: string;
    schedule_relationship?: number;
  };
  vehicle?: {
    id: string;
    label: string;
    license_plate?: string | null;
  };
  position?: {
    latitude: number;
    longitude: number;
    bearing?: number | null;
    odometer?: number | null;
    speed?: number | null; // Speed can be null
  };
  current_stop_sequence?: number | null;
  stop_id?: string | null;
  current_status?: number; // e.g., 2 for IN_TRANSIT_TO
  timestamp: ApiTimestamp;
}

interface MetraApiPositionEntry {
  id: string;
  is_deleted: boolean;
  trip_update: null; // As per API response for positions
  vehicle: MetraVehiclePosition;
}

// Metra Trip Update Interfaces
interface StopTimeEvent {
  delay: number;
  time: ApiTimestamp;
  uncertainty?: number;
}

interface StopTimeUpdateItem {
  stop_sequence: number;
  stop_id: string;
  arrival?: StopTimeEvent;
  departure?: StopTimeEvent;
  schedule_relationship?: number; // e.g., 0 for SCHEDULED
}

interface MetraTripDetails {
  trip_id: string;
  route_id: string;
  direction_id?: number | null;
  start_time: string;
  start_date: string;
  schedule_relationship?: number;
}

interface MetraVehicleDetails {
  id: string;
  label: string;
  license_plate?: string | null;
}

interface MetraApiTripUpdate {
  trip: MetraTripDetails;
  vehicle?: MetraVehicleDetails; // Vehicle can sometimes be null
  stop_time_update: StopTimeUpdateItem[];
  timestamp?: ApiTimestamp; // Optional, based on GTFS-RT spec
}

interface MetraApiTripUpdateEntry {
  id: string;
  is_deleted: boolean;
  trip_update: MetraApiTripUpdate;
  vehicle: null; // As per API response for tripUpdates
  alert: null; // As per API response for tripUpdates
}

// --- Static Metra Data (YOU NEED TO POPULATE THIS ACCURATELY) ---
interface MetraStation {
  id: string; // e.g., "LAKEFOREST" (use actual GTFS stop_ids)
  name: string; // e.g., "Lake Forest"
}

interface MetraLine {
  id: string;    // e.g., "UP-N" (use actual GTFS route_ids)
  name: string;  // e.g., "Union Pacific North"
  stations: MetraStation[];
}

// EXAMPLE - Replace with actual and complete data from Metra's GTFS or official sources
const metraLinesData: MetraLine[] = [
  { 
    id: "UP-N", 
    name: "Union Pacific North", 
    stations: [
      { id: "OTC", name: "Ogilvie Transportation Center" }, 
      { id: "RAVENSWOOD", name: "Ravenswood" },
      { id: "EVANSTONMAIN", name: "Evanston Main St" },
      { id: "WINNETKA", name: "Winnetka" },
      { id: "HIGHLANDPARK", name: "Highland Park" },
      { id: "LAKEFOREST", name: "Lake Forest" },
      { id: "WAUKEGAN", name: "Waukegan" },
      { id: "KENOSHA", name: "Kenosha" }
    ] 
  },
  { 
    id: "MD-N", 
    name: "Milwaukee District North", 
    stations: [
      { id: "CUS", name: "Chicago Union Station" }, 
      { id: "WESTERN", name: "Western Ave" },
      { id: "GRAYLAND", name: "Grayland" },
      { id: "MORTONGROVE", name: "Morton Grove" },
      { id: "GLENVIEW", name: "Glenview" },
      { id: "DEERFIELD", name: "Deerfield" },
      { id: "LAKEFOREST", name: "Lake Forest" }, // Note: Some stations can be on multiple lines
      { id: "LIBERTYVILLE", name: "Libertyville" },
      { id: "FOX LAKE", name: "Fox Lake" }
    ] 
  },
  { 
    id: "BNSF", 
    name: "BNSF Railway", 
    stations: [
      { id: "CUS", name: "Chicago Union Station" }, 
      { id: "CICERO", name: "Cicero" },
      { id: "LAGRANGE", name: "La Grange Road" },
      { id: "HINSDALE", name: "Hinsdale" },
      { id: "DOWNERSGROVE", name: "Downers Grove Main St" },
      { id: "NAPERVILLE", name: "Naperville" },
      { id: "AURORA", name: "Aurora" }
    ] 
  },
  { 
    id: "ME", 
    name: "Metra Electric", 
    stations: [
      { id: "MESTD", name: "Millennium Station" }, 
      { id: "VANDERPOEL", name: "Van Buren St." },
      { id: "MUSEUM", name: "Museum Campus/11th St." },
      { id: "MCCORMICK", name: "McCormick Place" },
      { id: "55-56-57", name: "55th-56th-57th St." },
      { id: "HYDEPARK", name: "Hyde Park" },
      { id: "SOUTHSHORE", name: "South Shore" },
      { id: "BLUEISLAND", name: "Blue Island-Vermont St." },
      { id: "UNIVERSITY_PARK", name: "University Park" }
    ]
  },
  {
    id: "RI",
    name: "Rock Island District",
    stations: [
      { id: "LASALLE", name: "LaSalle Street Station" },
      { id: "35TH", name: "35th St./'Lou' Jones" },
      { id: "BRAINERD", name: "Brainerd" },
      { id: "BLUEISLAND", name: "Blue Island-Vermont St." },
      { id: "TINLEYPARK", name: "Tinley Park" },
      { id: "JOLIET", name: "Joliet" }
    ]
  },
  {
    id: "MD-W",
    name: "Milwaukee District West",
    stations: [
      { id: "CUS", name: "Chicago Union Station" },
      { id: "MARS", name: "Mars" },
      { id: "FRANKLINPARK", name: "Franklin Park" },
      { id: "ELMHURST", name: "Elmhurst" },
      { id: "ITASCA", name: "Itasca" },
      { id: "ELGIN", name: "Elgin" }
    ]
  },
  {
    id: "UP-W",
    name: "Union Pacific West",
    stations: [
      { id: "OTC", name: "Ogilvie Transportation Center" },
      { id: "KEDZIE", name: "Kedzie" },
      { id: "OAKPARK", name: "Oak Park" },
      { id: "LOMBARD", name: "Lombard" },
      { id: "WHEATON", name: "Wheaton" },
      { id: "GENEVA", name: "Geneva" },
      { id: "ELBURN", name: "Elburn" }
    ]
  },
  {
    id: "SWS",
    name: "SouthWest Service",
    stations: [
      { id: "CUS", name: "Chicago Union Station" },
      { id: "WRIGHTWOOD", name: "Wrightwood" },
      { id: "OAKLAWN", name: "Oak Lawn-Patriot" },
      { id: "ORLANDPARK", name: "Orland Park 153rd St" },
      { id: "MANHATTAN", name: "Manhattan" }
    ]
  },
  {
    id: "HC",
    name: "Heritage Corridor",
    stations: [
      { id: "CUS", name: "Chicago Union Station" },
      { id: "SUMMIT", name: "Summit" },
      { id: "LEMONT", name: "Lemont" },
      { id: "JOLIET", name: "Joliet" }
    ]
  },
  {
    id: "NCS",
    name: "North Central Service",
    stations: [
      { id: "CUS", name: "Chicago Union Station" },
      { id: "OHARE", name: "O'Hare Transfer" },
      { id: "PROSPECTHEIGHTS", name: "Prospect Heights" },
      { id: "BUFFALOGROVE", name: "Buffalo Grove" },
      { id: "ANTIOCH", name: "Antioch" }
    ]
  },
  {
    id: "UP-NW",
    name: "Union Pacific Northwest",
    stations: [
      { id: "OTC", name: "Ogilvie Transportation Center" },
      { id: "JEFFERSONPARK", name: "Jefferson Park" },
      { id: "PARKRIDGE", name: "Park Ridge" },
      { id: "DESPLAINES", name: "Des Plaines" },
      { id: "ARLINGTONPARK", name: "Arlington Park" },
      { id: "BARRINGTON", name: "Barrington" },
      { id: "CRYSTALLAKE", name: "Crystal Lake" },
      { id: "MCHENRY", name: "McHenry" }, // Some UP-NW trains go to McHenry, others to Harvard
      { id: "HARVARD", name: "Harvard" }
    ]
  }
  // ... Continue to add all Metra lines and their stations with correct IDs
];
// --- End Static Metra Data ---

async function fetchMetraData(endpoint: 'alerts' | 'tripUpdates' | 'positions') {
  console.log(`Fetching ${endpoint} from GTFS API...`);
  
  try {
    const response = await fetch(`/api/metra/${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    const contentType = response.headers.get('content-type');
    console.log(`Response content-type for ${endpoint}:`, contentType);

    // Check if response is HTML instead of JSON
    if (contentType?.includes('text/html')) {
      const text = await response.text();
      console.error(`Received HTML instead of JSON for ${endpoint}:`, text);
      throw new Error(`Invalid response format for ${endpoint}`);
    }

    if (!response.ok) {
      const text = await response.text();
      console.error(`Error response for ${endpoint}:`, text);
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || `Failed to fetch ${endpoint}`);
      } catch (e) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log(`Successfully fetched ${endpoint} data:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

export function MetraClient() {
  // Raw data states
  const [alerts, setAlerts] = useState<MetraAlert[]>([]);
  const [tripUpdates, setTripUpdates] = useState<MetraApiTripUpdateEntry[]>([]);
  const [positions, setPositions] = useState<MetraApiPositionEntry[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // User selection states
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedOnStation, setSelectedOnStation] = useState<string | null>(null);
  const [selectedOffStation, setSelectedOffStation] = useState<string | null>(null);

  // Filtered data states
  const [filteredAlerts, setFilteredAlerts] = useState<MetraAlert[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<MetraApiPositionEntry[]>([]);
  const [filteredTripUpdates, setFilteredTripUpdates] = useState<MetraApiTripUpdateEntry[]>([]);

  const [availableStations, setAvailableStations] = useState<MetraStation[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching all Metra data...');
      
      // Types for fetched data will be inferred by Promise.all
      const [alertsData, updatesData, positionsData] = await Promise.all([
        fetchMetraData('alerts') as Promise<MetraAlert[]>,
        fetchMetraData('tripUpdates') as Promise<MetraApiTripUpdateEntry[]>,
        fetchMetraData('positions') as Promise<MetraApiPositionEntry[]>,
      ]);

      setAlerts(alertsData || []);
      setTripUpdates(updatesData || []);
      setPositions(positionsData || []);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setAlerts([]); setTripUpdates([]); setPositions([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Fetch every 60 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  // Effect to update available stations when line changes
  useEffect(() => {
    if (selectedLine) {
      const lineData = metraLinesData.find(line => line.id === selectedLine);
      setAvailableStations(lineData ? lineData.stations : []);
      setSelectedOnStation(null); // Reset stations when line changes
      setSelectedOffStation(null);
    } else {
      setAvailableStations([]);
    }
  }, [selectedLine]);

  // Effect to filter data when selections or raw data change
  useEffect(() => {
    if (!selectedLine) {
      setFilteredAlerts(alerts); // Show all alerts if no line selected, or an empty array
      setFilteredPositions([]); // Show no positions if no line selected
      setFilteredTripUpdates([]); // Show no trip updates if no line selected
      return;
    }

    // Filter Alerts
    setFilteredAlerts(
      alerts.filter(alertItem =>
        alertItem.alert.informed_entity.some(entity => entity.route_id === selectedLine)
      )
    );

    // Filter Positions
    setFilteredPositions(
      positions.filter(posEntry => posEntry.vehicle?.trip?.route_id === selectedLine)
    );

    // Filter Trip Updates (more complex, might need to consider selected stations too)
    let currentTripUpdates = tripUpdates.filter(
      updateEntry => updateEntry.trip_update?.trip?.route_id === selectedLine
    );
    
    if (selectedOnStation) {
        currentTripUpdates = currentTripUpdates.filter(updateEntry => 
            updateEntry.trip_update.stop_time_update.some(stu => stu.stop_id === selectedOnStation)
        );
    }
    // Further filtering for selectedOffStation could be added if needed,
    // e.g., ensuring the trip serves both on and off stations in sequence.

    setFilteredTripUpdates(currentTripUpdates);

  }, [selectedLine, selectedOnStation, alerts, positions, tripUpdates]);


  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header and Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Ticket className="h-10 w-10 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Metra Tracker</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {lastUpdate && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selections */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Journey</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="line-select" className="block text-sm font-medium text-muted-foreground mb-1">Metra Line</label>
            <Select onValueChange={setSelectedLine} value={selectedLine || ""}>
              <SelectTrigger id="line-select">
                <SelectValue placeholder="Select a line" />
              </SelectTrigger>
              <SelectContent>
                {metraLinesData.map(line => (
                  <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="on-station-select" className="block text-sm font-medium text-muted-foreground mb-1">Get On At</label>
            <Select onValueChange={setSelectedOnStation} value={selectedOnStation || ""} disabled={!selectedLine || availableStations.length === 0}>
              <SelectTrigger id="on-station-select">
                <SelectValue placeholder="Select boarding station" />
              </SelectTrigger>
              <SelectContent>
                {availableStations.map(station => (
                  <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="off-station-select" className="block text-sm font-medium text-muted-foreground mb-1">Get Off At</label>
            <Select onValueChange={setSelectedOffStation} value={selectedOffStation || ""} disabled={!selectedLine || availableStations.length === 0}>
              <SelectTrigger id="off-station-select">
                <SelectValue placeholder="Select destination station" />
              </SelectTrigger>
              <SelectContent>
                {availableStations.map(station => (
                  <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      {selectedLine && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Live Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-muted rounded flex items-center justify-center">
              <p className="text-muted-foreground">Map integration placeholder. Active trains for {metraLinesData.find(l=>l.id === selectedLine)?.name} would show here.</p>
              {/* TODO: Integrate a map library like React Leaflet here */}
              {/* Pass filteredPositions to the map component */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtered Alerts */}
      {selectedLine && (
        <Card>
          <CardHeader>
            <CardTitle>Service Alerts for {metraLinesData.find(l=>l.id === selectedLine)?.name || 'Selected Line'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && filteredAlerts.length === 0 && <p className="text-muted-foreground">Loading alerts...</p>}
            {!loading && filteredAlerts.length === 0 && <p className="text-muted-foreground">No current alerts for this line.</p>}
            {filteredAlerts.length > 0 && (
              <div className="space-y-4">
                {filteredAlerts.map((alertItem) => (
                  <Alert key={alertItem.id} variant={alertItem.alert.effect === 8 /* UNKNOWN_EFFECT or NO_SERVICE or REDUCED_SERVICE etc. */ ? "default" : "warning"}>
                     <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{alertItem.alert.header_text.translation[0]?.text || 'N/A'}</AlertTitle>
                    <AlertDescription>
                      {alertItem.alert.description_text?.translation[0]?.text || 'No further details.'}
                      {alertItem.alert.url?.translation[0]?.text && (
                        <a href={alertItem.alert.url.translation[0].text} target="_blank" rel="noopener noreferrer" className="block text-blue-500 hover:underline mt-1">
                          More Info
                        </a>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Active Trains (Filtered Positions) */}
      {selectedLine && (
        <Card>
          <CardHeader>
            <CardTitle>Active Trains on {metraLinesData.find(l=>l.id === selectedLine)?.name || 'Selected Line'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && filteredPositions.length === 0 && <p className="text-muted-foreground">Loading train positions...</p>}
            {!loading && filteredPositions.length === 0 && <p className="text-muted-foreground">No active trains reported for this line.</p>}
            {filteredPositions.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPositions.map((posEntry) => {
                  const vehicleInfo = posEntry.vehicle;
                  if (!vehicleInfo?.vehicle?.id) return null; // Skip if no vehicle ID

                  return (
                    <div key={vehicleInfo.vehicle.id} className="p-4 border rounded-lg shadow">
                      <div className="flex items-center gap-2 font-semibold">
                        <Train className="h-5 w-5 text-primary" />
                        <span>Train {vehicleInfo.vehicle.label || vehicleInfo.vehicle.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Trip ID: {vehicleInfo.trip?.trip_id || 'N/A'}<br />
                        Status: {vehicleInfo.current_status === 2 ? 'In Transit' : vehicleInfo.current_status || 'N/A'}<br />
                        {vehicleInfo.position && <>
                          Speed: {vehicleInfo.position?.speed !== null && vehicleInfo.position?.speed !== undefined ? `${Math.round(vehicleInfo.position.speed * 2.23694)} mph` : 'N/A'} <br />
                          Last Update: {new Date(vehicleInfo.timestamp.low).toLocaleTimeString()}
                        </>}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Updates (Filtered Trip Updates) */}
      {selectedLine && (selectedOnStation || selectedOffStation) && ( // Show only if a station is also selected
        <Card>
          <CardHeader>
            <CardTitle>Schedule Updates for {metraLinesData.find(l=>l.id === selectedLine)?.name || 'Selected Line'}</CardTitle>
            {selectedOnStation && <p className="text-sm text-muted-foreground">Relevant to station: {availableStations.find(s=>s.id === selectedOnStation)?.name}</p>}
          </CardHeader>
          <CardContent>
            {loading && filteredTripUpdates.length === 0 && <p className="text-muted-foreground">Loading schedule updates...</p>}
            {!loading && filteredTripUpdates.length === 0 && <p className="text-muted-foreground">No relevant schedule updates for the selected criteria.</p>}
            {filteredTripUpdates.length > 0 && (
              <div className="space-y-4">
                {filteredTripUpdates.map((updateEntry) => {
                  const tripUpdate = updateEntry.trip_update;
                  return (
                    <div key={updateEntry.id} className="p-4 border rounded-lg shadow">
                      <h3 className="font-medium text-md">
                        Trip ID: {tripUpdate.trip.trip_id}
                        {tripUpdate.vehicle && <span className="text-sm text-muted-foreground"> (Vehicle: {tripUpdate.vehicle.label || tripUpdate.vehicle.id})</span>}
                      </h3>
                      <div className="mt-2 space-y-1">
                        {tripUpdate.stop_time_update
                          .filter(stu => !selectedOnStation || stu.stop_id === selectedOnStation || !selectedOffStation || stu.stop_id === selectedOffStation) // Further filter STUs if needed
                          .map((stu, index) => (
                          <div key={`${stu.stop_id}-${stu.stop_sequence}-${index}`} className="pl-4 border-l-2 border-primary/50 py-1">
                            <p className="text-sm font-semibold">Stop: {availableStations.find(s=>s.id === stu.stop_id)?.name || stu.stop_id} (Seq: {stu.stop_sequence})</p>
                            {stu.arrival && (
                              <p className="text-xs text-muted-foreground">
                                Arrival: {new Date(stu.arrival.time.low).toLocaleTimeString()}
                                {stu.arrival.delay !== 0 && <span className={stu.arrival.delay > 0 ? "text-red-500" : "text-green-500"}> (Delay: {Math.round(stu.arrival.delay / 60)} min)</span>}
                              </p>
                            )}
                            {stu.departure && (
                              <p className="text-xs text-muted-foreground">
                                Departure: {new Date(stu.departure.time.low).toLocaleTimeString()}
                                {stu.departure.delay !== 0 && <span className={stu.departure.delay > 0 ? "text-red-500" : "text-green-500"}> (Delay: {Math.round(stu.departure.delay / 60)} min)</span>}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}