import { Metadata } from 'next';
import { MetraWrapper } from './metra-wrapper';

export const metadata: Metadata = {
  title: 'Metra Tracking - ChiCommute',
  description: 'Real-time Metra commuter rail tracking for the Chicago metropolitan area.',
};

export default function MetraPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MetraWrapper />
    </div>
  );
}
