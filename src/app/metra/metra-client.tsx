'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ticket, AlertTriangle, Train, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MetraAlert {
  id: string;
  is_deleted: boolean;
  alert: {
    active_period: any[];
    informed_entity: any[];
    cause?: number;
    effect?: number;
    url: string;
    header_text: string;
    description_text: string;
  };
}

interface MetraTripUpdate {
  trip_id: string;
  route_id: string;
  stop_sequence: number;
  arrival_time: string;
  departure_time: string;
  delay: number;
}

interface MetraPosition {
  vehicle_id: string;
  trip_id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  timestamp: string;
}

async function fetchMetraData(endpoint: string) {
  const response = await fetch(`/api/metra/${endpoint}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Failed to fetch ${endpoint}`);
  }

  const data = await response.json();
  if (!data) throw new Error(`No data received for ${endpoint}`);
  return data;
}

export function MetraClient() {
  const [alerts, setAlerts] = useState<MetraAlert[]>([]);
  const [tripUpdates, setTripUpdates] = useState<MetraTripUpdate[]>([]);
  const [positions, setPositions] = useState<MetraPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching Metra data...');
      
      const [alertsData, updatesData, positionsData] = await Promise.all([
        fetchMetraData('alerts'),
        fetchMetraData('tripUpdates'),
        fetchMetraData('positions'),
      ]);

      setAlerts(alertsData);
      setTripUpdates(updatesData);
      setPositions(positionsData);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Ticket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Metra Status</h1>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
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

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Service Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground">No current alerts</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Alert key={alert.id}>
                  <AlertTitle>{alert.alert.header_text}</AlertTitle>
                  <AlertDescription>{alert.alert.description_text}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Trains */}
      <Card>
        <CardHeader>
          <CardTitle>Active Trains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {positions.map((position) => (
              <div key={position.vehicle_id} className="p-4 border rounded">
                <div className="flex items-center gap-2">
                  <Train className="h-5 w-5" />
                  <span>Train {position.vehicle_id}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Route: {position.route_id}<br />
                  Speed: {Math.round(position.speed)} mph<br />
                  Last Updated: {new Date(position.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tripUpdates.map((update) => (
              <div key={update.trip_id} className="p-4 border rounded">
                <h3 className="font-medium">Route {update.route_id}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {update.arrival_time && `Arrival: ${new Date(update.arrival_time).toLocaleTimeString()}`}<br />
                  {update.departure_time && `Departure: ${new Date(update.departure_time).toLocaleTimeString()}`}<br />
                  {update.delay && `Delay: ${Math.round(update.delay / 60)} minutes`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}