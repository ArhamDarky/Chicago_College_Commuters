'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ticket, AlertTriangle, Train, RefreshCcw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapComponent } from '@/components/ui/dynamic-map';

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
  latitude: number;
  longitude: number;
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
      { id: "OTC", name: "Ogilvie Transportation Center", latitude: 41.8825, longitude: -87.6394 }, 
      { id: "RAVENSWOOD", name: "Ravenswood", latitude: 41.9578, longitude: -87.6736 },
      { id: "EVANSTONMAIN", name: "Evanston Main St", latitude: 42.0450, longitude: -87.6839 },
      { id: "WINNETKA", name: "Winnetka", latitude: 42.1081, longitude: -87.7356 },
      { id: "HIGHLANDPARK", name: "Highland Park", latitude: 42.1817, longitude: -87.8006 },
      { id: "LAKEFOREST", name: "Lake Forest", latitude: 42.2581, longitude: -87.8414 },
      { id: "WAUKEGAN", name: "Waukegan", latitude: 42.3664, longitude: -87.8211 },
      { id: "KENOSHA", name: "Kenosha", latitude: 42.5847, longitude: -87.8211 }
    ] 
  },
  { 
    id: "MD-N", 
    name: "Milwaukee District North", 
    stations: [
      { id: "CUS", name: "Chicago Union Station", latitude: 41.8786, longitude: -87.6397 }, 
      { id: "WESTERN", name: "Western Ave", latitude: 41.8867, longitude: -87.6867 },
      { id: "GRAYLAND", name: "Grayland", latitude: 41.9525, longitude: -87.7675 },
      { id: "MORTONGROVE", name: "Morton Grove", latitude: 42.0397, longitude: -87.7828 },
      { id: "GLENVIEW", name: "Glenview", latitude: 42.0744, longitude: -87.8117 },
      { id: "DEERFIELD", name: "Deerfield", latitude: 42.1694, longitude: -87.8453 },
      { id: "LAKEFOREST", name: "Lake Forest", latitude: 42.2581, longitude: -87.8414 }, // Note: Some stations can be on multiple lines
      { id: "LIBERTYVILLE", name: "Libertyville", latitude: 42.2889, longitude: -87.9631 },
      { id: "FOX LAKE", name: "Fox Lake", latitude: 42.3961, longitude: -88.1867 }
    ] 
  },
  { 
    id: "BNSF", 
    name: "BNSF Railway", 
    stations: [
      { id: "AURORA", name: "Aurora", latitude: 41.760556, longitude: -88.320000 },
      { id: "ROUTE59", name: "Route 59", latitude: 41.770556, longitude: -88.203611 },
      { id: "NAPERVILLE", name: "Naperville", latitude: 41.771944, longitude: -88.148056 },
      { id: "LISLE", name: "Lisle", latitude: 41.784167, longitude: -88.080556 },
      { id: "BELMONT", name: "Belmont", latitude: 41.782222, longitude: -88.033056 },
      { id: "DOWNERSGROVE", name: "Downers Grove Main St", latitude: 41.788889, longitude: -88.011667 },
      { id: "FAIRVIEW", name: "Fairview Avenue", latitude: 41.791111, longitude: -88.002500 },
      { id: "WESTMONT", name: "Westmont", latitude: 41.795000, longitude: -87.975556 },
      { id: "CLARENDON_HILLS", name: "Clarendon Hills", latitude: 41.797500, longitude: -87.954167 },
      { id: "WEST_HINSDALE", name: "West Hinsdale", latitude: 41.796944, longitude: -87.944722 },
      { id: "HINSDALE", name: "Hinsdale", latitude: 41.800556, longitude: -87.937000 },
      { id: "HIGHLANDS", name: "Highlands", latitude: 41.810556, longitude: -87.919167 },
      { id: "WESTERN_SPRINGS", name: "Western Springs", latitude: 41.809167, longitude: -87.900556 },
      { id: "STONE_AVE", name: "Stone Avenue", latitude: 41.804444, longitude: -87.872778 },
      { id: "LAGRANGE", name: "La Grange Road", latitude: 41.805000, longitude: -87.879167 },
      { id: "CONGRESS_PARK", name: "Congress Park", latitude: 41.818611, longitude: -87.855278 },
      { id: "BROOKFIELD", name: "Brookfield", latitude: 41.821389, longitude: -87.846389 },
      { id: "HOLLYWOOD", name: "Hollywood", latitude: 41.822778, longitude: -87.828056 },
      { id: "RIVERSIDE", name: "Riverside", latitude: 41.826667, longitude: -87.819722 },
      { id: "HARLEM", name: "Harlem Avenue", latitude: 41.830556, longitude: -87.807500 },
      { id: "BERWYN", name: "Berwyn", latitude: 41.833056, longitude: -87.793611 },
      { id: "LA_VERGNE", name: "La Vergne", latitude: 41.836389, longitude: -87.780556 },
      { id: "CICERO", name: "Cicero", latitude: 41.844167, longitude: -87.745556 },
      { id: "BNWESTERN", name: "Western Avenue", latitude: 41.857778, longitude: -87.685278 },
      { id: "HALSTED", name: "Halsted Street", latitude: 41.860278, longitude: -87.647222 },
      { id: "CUS", name: "Chicago Union Station", latitude: 41.878889, longitude: -87.638889 }
    ]
  },
  { 
    id: "ME", 
    name: "Metra Electric", 
    stations: [
      { id: "MESTD", name: "Millennium Station", latitude: 41.8825, longitude: -87.6247 }, 
      { id: "VANDERPOEL", name: "Van Buren St.", latitude: 41.8769, longitude: -87.6247 },
      { id: "MUSEUM", name: "Museum Campus/11th St.", latitude: 41.8661, longitude: -87.6161 },
      { id: "MCCORMICK", name: "McCormick Place", latitude: 41.8508, longitude: -87.6069 },
      { id: "55-56-57", name: "55th-56th-57th St.", latitude: 41.7919, longitude: -87.6061 },
      { id: "HYDEPARK", name: "Hyde Park", latitude: 41.7844, longitude: -87.5906 },
      { id: "SOUTHSHORE", name: "South Shore", latitude: 41.7569, longitude: -87.5661 },
      { id: "BLUEISLAND", name: "Blue Island-Vermont St.", latitude: 41.6572, longitude: -87.6806 },
      { id: "UNIVERSITY_PARK", name: "University Park", latitude: 41.4419, longitude: -87.6889 }
    ]
  },
  {
    id: "RI",
    name: "Rock Island District",
    stations: [
      { id: "LASALLE", name: "LaSalle Street Station", latitude: 41.8756, longitude: -87.6314 },
      { id: "35TH", name: "35th St./'Lou' Jones", latitude: 41.8306, longitude: -87.6061 },
      { id: "BRAINERD", name: "Brainerd", latitude: 41.7194, longitude: -87.6444 },
      { id: "BLUEISLAND", name: "Blue Island-Vermont St.", latitude: 41.6572, longitude: -87.6806 },
      { id: "TINLEYPARK", name: "Tinley Park", latitude: 41.5731, longitude: -87.7931 },
      { id: "JOLIET", name: "Joliet", latitude: 41.5250, longitude: -88.0817 }
    ]
  },
  {
    id: "MD-W",
    name: "Milwaukee District West",
    stations: [
      { id: "CUS", name: "Chicago Union Station", latitude: 41.8786, longitude: -87.6397 },
      { id: "MARS", name: "Mars", latitude: 41.8867, longitude: -87.7042 },
      { id: "FRANKLINPARK", name: "Franklin Park", latitude: 41.9306, longitude: -87.8711 },
      { id: "ELMHURST", name: "Elmhurst", latitude: 41.8994, longitude: -87.9403 },
      { id: "ITASCA", name: "Itasca", latitude: 41.9750, longitude: -88.0106 },
      { id: "ELGIN", name: "Elgin", latitude: 42.0372, longitude: -88.2825 }
    ]
  },
  {
    id: "UP-W",
    name: "Union Pacific West",
    stations: [
      { id: "OTC", name: "Ogilvie Transportation Center", latitude: 41.8825, longitude: -87.6394 },
      { id: "KEDZIE", name: "Kedzie", latitude: 41.8856, longitude: -87.7058 },
      { id: "OAKPARK", name: "Oak Park", latitude: 41.8719, longitude: -87.7928 },
      { id: "LOMBARD", name: "Lombard", latitude: 41.8800, longitude: -88.0078 },
      { id: "WHEATON", name: "Wheaton", latitude: 41.8661, longitude: -88.1070 },
      { id: "GENEVA", name: "Geneva", latitude: 41.8875, longitude: -88.3053 },
      { id: "ELBURN", name: "Elburn", latitude: 41.8922, longitude: -88.4728 }
    ]
  },
  {
    id: "SWS",
    name: "SouthWest Service",
    stations: [
      { id: "CUS", name: "Chicago Union Station", latitude: 41.8786, longitude: -87.6397 },
      { id: "WRIGHTWOOD", name: "Wrightwood", latitude: 41.8306, longitude: -87.6661 },
      { id: "OAKLAWN", name: "Oak Lawn-Patriot", latitude: 41.7194, longitude: -87.7544 },
      { id: "ORLANDPARK", name: "Orland Park 153rd St", latitude: 41.6039, longitude: -87.7839 },
      { id: "MANHATTAN", name: "Manhattan", latitude: 41.4242, longitude: -87.9856 }
    ]
  },
  {
    id: "HC",
    name: "Heritage Corridor",
    stations: [
      { id: "CUS", name: "Chicago Union Station", latitude: 41.8786, longitude: -87.6397 },
      { id: "SUMMIT", name: "Summit", latitude: 41.7889, longitude: -87.8097 },
      { id: "LEMONT", name: "Lemont", latitude: 41.6731, longitude: -87.9886 },
      { id: "JOLIET", name: "Joliet", latitude: 41.5250, longitude: -88.0817 }
    ]
  },
  {
    id: "NCS",
    name: "North Central Service",
    stations: [
      { id: "CUS", name: "Chicago Union Station", latitude: 41.8786, longitude: -87.6397 },
      { id: "OHARE", name: "O'Hare Transfer", latitude: 41.9786, longitude: -87.8647 },
      { id: "PROSPECTHEIGHTS", name: "Prospect Heights", latitude: 42.0953, longitude: -87.9375 },
      { id: "BUFFALOGROVE", name: "Buffalo Grove", latitude: 42.1661, longitude: -87.9597 },
      { id: "ANTIOCH", name: "Antioch", latitude: 42.4772, longitude: -88.0956 }
    ]
  },
  {
    id: "UP-NW",
    name: "Union Pacific Northwest",
    stations: [
      { id: "OTC", name: "Ogilvie Transportation Center", latitude: 41.8825, longitude: -87.6394 },
      { id: "JEFFERSONPARK", name: "Jefferson Park", latitude: 41.9706, longitude: -87.7606 },
      { id: "PARKRIDGE", name: "Park Ridge", latitude: 42.0111, longitude: -87.8406 },
      { id: "DESPLAINES", name: "Des Plaines", latitude: 42.0333, longitude: -87.8836 },
      { id: "ARLINGTONPARK", name: "Arlington Park", latitude: 42.0631, longitude: -87.9806 },
      { id: "BARRINGTON", name: "Barrington", latitude: 42.1539, longitude: -88.1361 },
      { id: "CRYSTALLAKE", name: "Crystal Lake", latitude: 42.2411, longitude: -88.3161 },
      { id: "MCHENRY", name: "McHenry", latitude: 42.3331, longitude: -88.2667 }, // Some UP-NW trains go to McHenry, others to Harvard
      { id: "HARVARD", name: "Harvard", latitude: 42.4197, longitude: -88.6131 }
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
            <div className="h-[400px] w-full relative z-0">
              <MapComponent 
              positions={filteredPositions.map(p => p.vehicle)} 
              selectedLine={selectedLine}
              boardingStation={availableStations.find(s => s.id === selectedOnStation) || null}
              destinationStation={availableStations.find(s => s.id === selectedOffStation) || null}
              />
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
              <Alert key={alertItem.id} variant={alertItem.alert.effect === 8 /* UNKNOWN_EFFECT or NO_SERVICE or REDUCED_SERVICE etc. */ ? "default" : "destructive"}>
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