import { BusView } from '@/components/bus-view';
import { TrainView } from '@/components/train-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';
import '../tracker.css'; // Import the tracker.css as requested

export const metadata: Metadata = {
  title: 'Dashboard - ChiCommute',
  description: 'Overview of Chicago bus and train tracking.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Commute Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overview of Chicago's public transit.
          </p>
        </div>
      </div>
      
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg bus-view-card">
          <CardHeader>
            <CardTitle className="text-2xl">Bus Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <BusView />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg train-view-card">
          <CardHeader>
            <CardTitle className="text-2xl">Train Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <TrainView />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section can be used for displaying alerts, news, or other relevant commute information.
            Stay tuned for more features!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
