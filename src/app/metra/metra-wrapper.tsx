'use client';

import dynamic from 'next/dynamic';

const MetraClient = dynamic(
  () => import('./metra-client').then(mod => mod.MetraClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <p className="text-lg text-muted-foreground">Loading Metra tracker...</p>
      </div>
    ),
  }
);

export function MetraWrapper() {
  return <MetraClient />;
}