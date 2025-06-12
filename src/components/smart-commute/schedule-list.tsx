'use client';

import { ScheduleItem } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, CalendarDays, MapPin, Clock, Tag } from 'lucide-react';

interface ScheduleListProps {
  schedules: ScheduleItem[];
  onEdit: (schedule: ScheduleItem) => void;
  onDelete: (scheduleId: string) => void;
}

// Helper function to convert HH:MM to 12-hour AM/PM format
const formatTo12HourTime = (time24: string): string => {
  if (!time24 || !time24.includes(':')) {
    return time24; // Return original if format is unexpected
  }
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // The hour '0' should be '12'

  const minutesFormatted = minutes < 10 ? `0${minutes}` : minutes.toString();
  return `${hours}:${minutesFormatted} ${ampm}`;
};

export function ScheduleList({ schedules, onEdit, onDelete }: ScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No schedules added yet. Add a schedule item to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="shadow-md overflow-hidden">
          <CardHeader className="flex flex-row justify-between items-start bg-card-foreground/5 p-4">
            <div>
              <CardTitle className="text-xl text-primary">{schedule.name}</CardTitle>
              <CardDescription className="flex items-center text-sm">
                <Tag className="h-3 w-3 mr-1.5" /> Type: <Badge variant="secondary" className="ml-1.5">{schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}</Badge>
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={() => onEdit(schedule)} aria-label="Edit schedule">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => onDelete(schedule.id)} aria-label="Delete schedule">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 mr-2 text-primary/70" />
              Days: {schedule.days.join(', ')}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2 text-primary/70" />
              Time: {formatTo12HourTime(schedule.startTime)} - {formatTo12HourTime(schedule.endTime)}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 text-primary/70" />
              Location: {schedule.location}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}