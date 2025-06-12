
'use server';
/**
 * @fileOverview An AI agent for suggesting commutes based on user schedules.
 *
 * - suggestCommute - A function that handles the commute suggestion process.
 * - SuggestCommuteInput - The input type for the suggestCommute function.
 * - SuggestCommuteOutput - The return type for the suggestCommute function.
 */

import { ai } from '@/ai/genkit';
import type { ScheduleItem, DayOfWeek } from '@/types/schedule';
import { z } from 'genkit';

// Define Zod schema for ScheduleItem to be used in Genkit
const ScheduleItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  days: z.array(z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),   // HH:MM
  location: z.string(),
  type: z.enum(['class', 'work', 'personal', 'other']),
});

const UserLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
}).describe("User's current geographical coordinates.");

const SuggestCommuteInputSchema = z.object({
  schedule: z.array(ScheduleItemSchema).describe('The list of user schedule items.'),
  currentDateTime: z.string().datetime().describe('The current date and time in ISO format. Use this to determine "today" and "tomorrow".'),
  currentUserLocation: UserLocationSchema.optional().describe("The user's current location (latitude, longitude). Optional, used if manualOriginAddress is not provided or not preferred."),
  manualOriginAddress: z.string().optional().describe("User's manually entered starting address. Used if lat/lon coordinates are not provided or preferred by the user."),
  preferences: z.object({
    preferredMode: z.enum(['bus', 'train', 'any']).default('any').describe('Preferred mode of transport.'),
    maxTransfers: z.number().int().min(0).max(5).default(2).describe('Maximum number of transfers allowed.'),
  }).optional(),
});
export type SuggestCommuteInput = z.infer<typeof SuggestCommuteInputSchema>;

const CommuteStepSchema = z.object({
  mode: z.enum(['Walk', 'Bus', 'Train', 'Drive', 'Bike', 'Other']).describe('Mode of transport for this step.'),
  instruction: z.string().describe('VERY CONCISE instruction (e.g., "Walk to Clark/Lake", "Bus #22 North").'),
  line: z.string().optional().describe('Bus/train line (e.g., "22", "Red"). OMIT if not applicable (like for walking).'),
  duration: z.string().optional().describe('Est. duration (e.g., "5 min", "10-15 min").'),
  notes: z.string().optional().describe('VERY brief notes (1-3 words, e.g., "Transfer here", "Express"). Often, no notes needed.')
});
export type CommuteStep = z.infer<typeof CommuteStepSchema>; // Exporting for potential use in UI

const CommuteSuggestionDetailsSchema = z.object({
  summary: z.string().describe('A VERY BRIEF summary (1 short sentence) of the overall commute for one event.'),
  totalDuration: z.string().optional().describe('Estimated total travel time (e.g., "Approx. 30 min").'),
  steps: z.array(CommuteStepSchema).describe('A list of VERY CONCISE, step-by-step instructions.'),
});
export type CommuteSuggestionDetails = z.infer<typeof CommuteSuggestionDetailsSchema>; // Exporting for potential use in UI

const SuggestCommuteOutputSchema = z.object({
  dailySuggestions: z.array(
    z.object({
      day: z.string().describe("The day for which suggestions are provided (e.g., 'Monday', 'Tuesday'). This should be 'Today' or 'Tomorrow' based on currentDateTime."),
      events: z.array(
        z.object({
          eventId: z.string().describe('The ID of the schedule item.'),
          eventName: z.string().describe('The name of the event.'),
          destination: z.string().describe('The event location/destination.'),
          suggestion: CommuteSuggestionDetailsSchema,
        })
      ).describe('List of commute suggestions for events on this day.'),
    })
  ).describe('An array of suggestions. IMPORTANT: This array MUST ONLY include entries for "today" and/or "tomorrow" (relative to currentDateTime), and only if there are events scheduled on those specific days. If no events are scheduled for today or tomorrow, this array should be empty.'),
});
export type SuggestCommuteOutput = z.infer<typeof SuggestCommuteOutputSchema>;


// Fallback mock data generation logic
async function internalSuggestCommuteFlow(input: SuggestCommuteInput): Promise<SuggestCommuteOutput> {
  console.log("SuggestCommuteFlow (mock) invoked with input:", JSON.stringify(input, null, 2));

  const shortDayNames: DayOfWeek[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const todayDate = new Date(input.currentDateTime);
  const todayShortDayName = shortDayNames[todayDate.getDay()];
  const todayFullDayName = fullDayNames[todayDate.getDay()];

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  const tomorrowShortDayName = shortDayNames[tomorrowDate.getDay()];
  const tomorrowFullDayName = fullDayNames[tomorrowDate.getDay()];

  const suggestionsMap: Map<string, SuggestCommuteOutput['dailySuggestions'][0]> = new Map();

  const originDescription = input.manualOriginAddress
    ? `address: ${input.manualOriginAddress}`
    : (input.currentUserLocation ? `current location (Lat: ${input.currentUserLocation.latitude.toFixed(2)}, Lon: ${input.currentUserLocation.longitude.toFixed(2)})` : 'your current location');

  const createMockEventSuggestion = (scheduledItem: ScheduleItem, targetDayFullName: string) => ({
    eventId: scheduledItem.id,
    eventName: scheduledItem.name,
    destination: scheduledItem.location,
    suggestion: {
      summary: `Mock: For ${scheduledItem.name} on ${targetDayFullName} to ${scheduledItem.location}: Quick transit.`,
      totalDuration: "Approx. 20 min (Mock)",
      steps: [
        { mode: 'Walk', instruction: `Walk from ${originDescription} to a nearby stop.`, duration: '5 min' } as const,
        { mode: (input.preferences?.preferredMode && input.preferences.preferredMode !== 'any' ? (input.preferences.preferredMode.charAt(0).toUpperCase() + input.preferences.preferredMode.slice(1)) : 'Bus') as 'Walk' | 'Bus' | 'Train' | 'Drive' | 'Bike' | 'Other', instruction: `Take transit towards ${scheduledItem.location}.`, duration: '10 min' } as const,
        { mode: 'Walk', instruction: `Walk to ${scheduledItem.location}.`, duration: '5 min' } as const,
      ],
    },
  });

  for (const item of input.schedule) {
    // Process for Today
    if (item.days.includes(todayShortDayName as DayOfWeek)) {
      const eventSugg = createMockEventSuggestion(item, todayFullDayName);
      if (suggestionsMap.has(todayFullDayName)) {
        suggestionsMap.get(todayFullDayName)!.events.push(eventSugg);
      } else {
        suggestionsMap.set(todayFullDayName, { day: todayFullDayName, events: [eventSugg] });
      }
    }

    // Process for Tomorrow
    if (item.days.includes(tomorrowShortDayName as DayOfWeek) && todayShortDayName !== tomorrowShortDayName) { // ensure not same day if schedule rolls over midnight
      const eventSugg = createMockEventSuggestion(item, tomorrowFullDayName);
      if (suggestionsMap.has(tomorrowFullDayName)) {
        suggestionsMap.get(tomorrowFullDayName)!.events.push(eventSugg);
      } else {
        suggestionsMap.set(tomorrowFullDayName, { day: tomorrowFullDayName, events: [eventSugg] });
      }
    }
  }

  let relevantSuggestions = Array.from(suggestionsMap.values());
  // Order: today first, then tomorrow, if both exist.
  relevantSuggestions.sort((a, b) => {
    if (a.day === todayFullDayName && b.day === tomorrowFullDayName) return -1;
    if (a.day === tomorrowFullDayName && b.day === todayFullDayName) return 1;
    if (a.day === todayFullDayName) return -1; // Make sure today is always first if present
    if (b.day === todayFullDayName) return 1;
    return 0;
  });

  // Fallback if no events for today/tomorrow but schedule exists
  if (relevantSuggestions.length === 0 && input.schedule.length > 0) {
    const firstItem = input.schedule[0];
    const firstItemFirstDayShort = firstItem.days[0];
    if (firstItemFirstDayShort) {
      const firstItemFirstDayFull = fullDayNames[shortDayNames.indexOf(firstItemFirstDayShort)];
      if (firstItemFirstDayFull) {
        relevantSuggestions.push({
          day: firstItemFirstDayFull,
          events: [createMockEventSuggestion(firstItem, firstItemFirstDayFull)]
        });
      }
    }
  }

  return { dailySuggestions: relevantSuggestions };
}


const prompt = ai.definePrompt({
  name: 'suggestCommutePrompt',
  input: { schema: SuggestCommuteInputSchema },
  output: { schema: SuggestCommuteOutputSchema },
  prompt: `You are a Chicago public transit expert assistant. Your goal is to provide **extremely concise, easy-to-understand, step-by-step commute instructions.** Focus on clarity and brevity. Prioritize official CTA routes.

User's Schedule:
{{#each schedule}}
- Event: {{name}} (ID: {{id}})
  Days: {{#each days}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
  Time: {{startTime}} - {{endTime}} (Needs to arrive by {{startTime}})
  Location (Destination): {{location}}
{{/each}}

Current Date & Time: {{currentDateTime}} (Use this to determine "today" and "tomorrow")
User's Starting Point: {{#if currentUserLocation}}Coordinates: Lat {{currentUserLocation.latitude}}, Lon {{currentUserLocation.longitude}}{{else if manualOriginAddress}}Address: {{manualOriginAddress}}{{else}}Generic starting point. Assume a common residential area in Chicago if not specified.{{/if}}

User Preferences:
Preferred Mode: {{preferences.preferredMode}}
Max Transfers: {{preferences.maxTransfers}}

Task:
Your primary goal is to generate commute suggestions *only for events scheduled for today and/or tomorrow*, relative to the \`currentDateTime\`.
1.  From the \`schedule\` input, identify events that are scheduled to occur on 'today' or 'tomorrow'. The day names for 'today' and 'tomorrow' can be determined from \`currentDateTime\`.
2.  For *only* these identified events occurring on 'today' or 'tomorrow', provide a **VERY CONCISE step-by-step commute suggestion.**
3.  The \`dailySuggestions\` array in your output MUST ONLY contain entries for 'today' and/or 'tomorrow' (e.g., "Monday", "Tuesday" if today is Monday).
4.  If an event occurs on both 'today' and 'tomorrow' (e.g. multi-day event in schedule spanning these days), provide suggestions for it under both day entries in \`dailySuggestions\`.
5.  If there are no events from the schedule that fall on 'today' or 'tomorrow', the \`dailySuggestions\` array should be empty.
Follow the output schema precisely.

For each step:
- MUST provide 'mode' and 'instruction'.
- 'line' and 'duration' are highly recommended if applicable (e.g., Bus line "22", Train "Red Line", duration "10 min"). OMIT 'line' for walking.
- 'notes' should be VERY short and only if essential (1-3 words max, e.g., "Transfer here", "Express bus"). Often, no notes are needed.
- **DO NOT include verbose details like specific stop IDs, full stop names unless absolutely critical for a transfer, or exact departure/arrival times for each step.**
- Instructions should be direct (e.g., "Walk to Clark/Lake", "Take Bus #22 Northbound", "Red Line towards Howard").
- Provide an overall 'summary' (1 very short sentence, e.g., "Take the Blue Line and a short walk.") and 'totalDuration' (e.g., "Approx. 45 min").
- **Act as if you have real-time CTA data to generate the optimal route. Synthesize this into concise steps.**

Output Format:
Provide your response strictly in the JSON format defined by the output schema. The \`dailySuggestions\` array should **only include entries for days that have scheduled events based on the input and are either "today" or "tomorrow"** relative to \`currentDateTime\`. If no events for today/tomorrow, return an empty \`dailySuggestions\` array.

Example for a step (AIM FOR THIS LEVEL OF CONCISENESS):
{
  "mode": "Bus",
  "instruction": "Take Bus #J14 towards Downtown.",
  "line": "J14",
  "duration": "Approx. 15 min"
}
Another example (Walking):
{
  "mode": "Walk",
  "instruction": "Walk to Millennium Station.",
  "duration": "5-7 min"
}
Keep everything brief.

BEGIN!`,
});

const suggestCommuteFlow = ai.defineFlow(
  {
    name: 'suggestCommuteFlow',
    inputSchema: SuggestCommuteInputSchema,
    outputSchema: SuggestCommuteOutputSchema,
  },
  async (input) => {
    const inputForPrompt = {
      ...input,
      preferences: {
        preferredMode: input.preferences?.preferredMode ?? 'any',
        maxTransfers: input.preferences?.maxTransfers ?? 2,
      },
    };

    try {
        console.log("Calling Genkit prompt for suggestCommuteFlow with processed input:", JSON.stringify(inputForPrompt, null, 2));
        const { output } = await prompt(inputForPrompt);
        
        if (!output) {
            console.warn("suggestCommuteFlow: Prompt returned no output. Falling back to mock.");
            return internalSuggestCommuteFlow(input);
        }
        
        if (output.dailySuggestions && Array.isArray(output.dailySuggestions)) {
            // Basic validation of structure - further validation can be added
             if (output.dailySuggestions.length > 0 && output.dailySuggestions[0].events.length > 0) {
                 const firstEventSuggestion = output.dailySuggestions[0].events[0].suggestion;
                 if (!firstEventSuggestion.steps || !Array.isArray(firstEventSuggestion.steps) || 
                     (firstEventSuggestion.steps.length > 0 && (typeof firstEventSuggestion.steps[0].mode === 'undefined' || typeof firstEventSuggestion.steps[0].instruction === 'undefined'))) {
                     console.warn("suggestCommuteFlow: Prompt output missing valid 'steps' structure. Falling back to mock.", JSON.stringify(output, null, 2));
                     return internalSuggestCommuteFlow(input);
                 }
             } else if (output.dailySuggestions.length > 0 && output.dailySuggestions[0].events.length === 0) {
                 // AI might correctly return a day with no events if it's today/tomorrow but schedule has nothing.
                 // Or if the prompt was to only list days with events, this is also fine.
             }
             console.log("suggestCommuteFlow: Prompt returned output:", JSON.stringify(output, null, 2));
             return output;
        } else {
            console.warn("suggestCommuteFlow: Prompt output structure mismatch (dailySuggestions not an array or undefined). Falling back to mock.", JSON.stringify(output, null, 2));
            return internalSuggestCommuteFlow(input);
        }
    } catch (e: any) {
        console.error("Error in Genkit prompt execution for suggestCommuteFlow:", e, e.stack ? e.stack : 'No stack');
        if (e.cause) console.error("Error cause:", e.cause);
        console.warn("Falling back to mock data due to Genkit execution error.");
        return internalSuggestCommuteFlow(input);
    }
  }
);

export async function suggestCommute(input: SuggestCommuteInput): Promise<SuggestCommuteOutput> {
  // Input validation can be done here if needed, or rely on Genkit's schema validation
  // For example, ensuring currentDateTime is a valid ISO string if not already guaranteed
  return suggestCommuteFlow(input);
}