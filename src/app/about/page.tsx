
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import Link from 'next/link';
import { Wind, Info, Users, Linkedin, Briefcase, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About ChiCommute',
  description: 'Learn more about the ChiCommute application and the team behind it.',
};

const teamMembers = [
  {
    name: 'Arham Darky',
    role: 'Project Lead',
    major: 'Computer Science',
    linkedinUrl: 'https://www.linkedin.com/in/arham-darky-982aa9224/',
    avatarSeed: 'alice',
    avatarHint: 'woman professional',
  },
  {
    name: 'Talha Shaikh',
    role: 'Frontend Developer',
    major: 'Computer Science',
    linkedinUrl: 'https://www.linkedin.com/in/talha-shaikh-826b49259/',
    avatarSeed: 'bob',
    avatarHint: 'man coding',
  },
  {
    name: 'Hassaan Hameedi',
    role: 'Backend Developer',
    major: 'Computer Science',
    linkedinUrl: 'https://www.linkedin.com/in/hassaan-hameedi-87172a2a3/',
    avatarSeed: 'Hassaan',
    avatarHint: 'person sketching',
  },
  {
    name: 'Denil Dominic',
    role: 'Backend Developer',
    major: 'Computer Science',
    linkedinUrl: 'https://www.linkedin.com/in/denildominic/',
    avatarSeed: 'Denil',
    avatarHint: 'Man tech',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex items-center space-x-3">
        <Info className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-primary">About ChiCommute</h1>
      </div>
      
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-card-foreground/5 p-6">
          <div className="flex items-center space-x-3">
            <Wind className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl text-primary">Our Mission</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-lg text-foreground/90 leading-relaxed">
            ChiCommute is dedicated to providing Chicago residents and visitors with a seamless and efficient way to navigate the city's public transportation system. 
            We aim to deliver real-time bus and train information to make your commute stress-free and predictable.
          </p>
          <div className="rounded-lg overflow-hidden shadow-md">
            <Image
              src="https://picsum.photos/seed/chicago-transit/800/400"
              alt="Chicago Transit Scene"
              width={800}
              height={400}
              className="object-cover w-full h-auto"
              data-ai-hint="public transit"
            />
          </div>
          <CardDescription className="text-base text-muted-foreground italic">
            Our platform leverages cutting-edge technology to bring you live tracking, route information, and service alerts. Whether you're a daily commuter or an occasional rider, ChiCommute is your trusted partner for navigating Chicago.
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="bg-card-foreground/5 p-6">
          <div className="flex items-center space-x-3">
            <Users className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl text-primary">Meet the Team</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.name} className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="items-center text-center p-4">
                <Avatar className="w-24 h-24 mb-3 border-2 border-primary">
                  <AvatarImage src={`https://picsum.photos/seed/${member.avatarSeed}/150/150`} alt={member.name} data-ai-hint={member.avatarHint} />
                  <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{member.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-2 px-4 pb-4">
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4 mr-2 text-primary/70" />
                  <span>{member.role}</span>
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 mr-2 text-primary/70" />
                  <span>{member.major}</span>
                </div>
                <Link href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                  <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md">
          <CardHeader className="p-6">
            <CardTitle className="text-xl">Key Features</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <ul className="list-disc list-inside space-y-2 text-foreground/80">
              <li>Real-time CTA bus tracking: Select routes, directions, and stops for live arrival predictions.</li>
              <li>Live CTA 'L' train tracking: Choose from major stations to view upcoming train arrivals, line details, and destinations.</li>
              <li>Integrated Dashboard: Access both bus and train tracking modules from a single, convenient dashboard.</li>
              <li>User-Friendly Interface: Navigate easily with intuitive selectors and clear presentation of transit data.</li>
              <li>Mobile-Responsive Design: Check commute information on any device, anytime, anywhere.</li>
              <li>Metra Commuter Rail: Information for Metra lines (currently a placeholder, with future updates planned).</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="p-6">
            <CardTitle className="text-xl">Technology Stack</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="text-foreground/80">
              This application is proudly built with modern web technologies including:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Next.js (App Router) for a fast, modern web experience.</li>
                <li>React and TypeScript for robust and maintainable component-based UI.</li>
                <li>Tailwind CSS for utility-first styling.</li>
                <li>ShadCN UI Components for a polished and accessible user interface.</li>
                <li>Node.js (via Next.js API Routes) for backend data fetching.</li>
                <li>CTA Bus Tracker API & CTA Train Tracker API for real-time transit data.</li>
                <li>Genkit (for potential future AI-powered enhancements).</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
