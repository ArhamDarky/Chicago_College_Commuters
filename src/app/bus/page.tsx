import { BusView } from '@/components/bus-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import '../tracker.css';

export const metadata: Metadata = {
  title: 'Bus Tracking - ChiCommute',
  description: 'Real-time bus tracking for Chicago.',
};

export default function BusTrackingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Bus Tracking</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Live Bus Map & Information</CardTitle>
        </CardHeader>
        <CardContent>
          <BusView />
        </CardContent>
      </Card>
    </div>
  );
}
