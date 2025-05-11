import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket } from 'lucide-react';
import Image from 'next/image';
import '../tracker.css';

export const metadata: Metadata = {
  title: 'Metra Tracking - ChiCommute',
  description: 'Real-time Metra commuter rail tracking for the Chicago metropolitan area.',
};

export default function MetraTrackingPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center space-x-3">
        <Ticket className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-primary">Metra Commuter Rail</h1>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Live Metra Train Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Metra tracking features are currently under development. Check back soon for live train schedules, line status, and station information for the Metra commuter rail system.
          </p>
          <div className="map-placeholder aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center text-muted-foreground shadow-inner">
            <Image
              src="https://picsum.photos/seed/metramap/600/400"
              alt="Metra Map Placeholder"
              width={600}
              height={400}
              className="object-cover w-full h-full opacity-70"
              data-ai-hint="train station platform"
            />
          </div>
           <div className="mt-6 text-center p-4 border border-dashed border-border rounded-md bg-card">
            <p className="text-lg font-semibold text-primary">Stay Tuned!</p>
            <p className="text-muted-foreground">We're working hard to bring you comprehensive Metra tracking capabilities. Future updates will include real-time data and more interactive features.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
