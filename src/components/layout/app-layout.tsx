'use client';

import type React from 'react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="p-4 border-b">
      <Link href="/" className="block">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">ChiCommute</h1>
          <p className="text-sm text-gray-500">Welcome!</p>
        </div>
      </Link>
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Simplified sidebar */}
      <nav className="w-64 border-r bg-gray-50 p-4">
        <div className="space-y-2">
          <Link href="/dashboard" className="block p-2 hover:bg-gray-200 rounded">
            Dashboard
          </Link>
          <Link href="/bus" className="block p-2 hover:bg-gray-200 rounded">
            Bus Tracking
          </Link>
          <Link href="/train" className="block p-2 hover:bg-gray-200 rounded">
            Train Tracking
          </Link>
          <Link href="/metra" className="block p-2 hover:bg-gray-200 rounded">
            Metra Rail
          </Link>
          <Link href="/about" className="block p-2 hover:bg-gray-200 rounded">
            About
          </Link>
        </div>
      </nav>
      
      {/* Main content */}
      <div className="flex-1">
        <AppHeader />
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
