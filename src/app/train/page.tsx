import { TrainView } from '@/components/train-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import '../tracker.css';

export const metadata: Metadata = {
  title: 'Train Tracking - ChiCommute',
  description: 'Real-time train tracking for Chicago.',
};

export default function TrainTrackingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-primary">Train Tracking</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Live Train Map & Information</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainView />
        </CardContent>
      </Card>
    </div>
  );
}
