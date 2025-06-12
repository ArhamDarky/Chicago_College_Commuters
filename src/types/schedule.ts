export interface ScheduleItem {
  id: string;
  name: string; // e.g., "CS 101 Lecture", "Work Shift"
  days: DayOfWeek[]; // Array of days
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  location: string; // Address or landmark
  type: 'class' | 'work' | 'personal' | 'other';
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface UserLocation {
  latitude: number;
  longitude: number;
}