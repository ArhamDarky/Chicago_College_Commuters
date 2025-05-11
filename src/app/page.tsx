import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { TrainFront, Bus, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 text-center">
      <Image 
        src="https://picsum.photos/seed/chicago/300/200" 
        alt="Chicago Skyline" 
        width={300} 
        height={200} 
        className="rounded-lg mb-8 shadow-xl"
        data-ai-hint="city skyline"
      />
      <h1 className="text-5xl font-extrabold tracking-tight text-primary sm:text-6xl md:text-7xl">
        Welcome to ChiCommute
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-foreground/80 sm:text-xl">
        Your one-stop solution for tracking Chicago's buses and trains in real-time. Get to your destination smarter and faster.
      </p>
      <div className="mt-10">
        <Link href="/dashboard" passHref>
          <Button size="lg" className="text-lg px-8 py-6 shadow-md">
            Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl w-full">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Bus className="mr-2 h-7 w-7 text-primary" />
              Bus Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              View live bus locations, routes, and arrival times. Never miss your bus again.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <TrainFront className="mr-2 h-7 w-7 text-primary" />
              Train Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Stay updated with real-time train schedules, line statuses, and station information.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
