import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { format, parseISO } from 'date-fns';

const CTA_TRAIN_API_KEY = process.env.CTA_TRAIN_API_KEY;
const CTA_TRAIN_BASE_URL = "http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx";

interface CtaTrainArrival {
  staId: string;      // Station ID
  stpId: string;      // Stop ID (platform level)
  staNm: string;      // Station Name
  stpDe: string;      // Stop Description (platform description)
  rn: string;         // Run Number
  rt: string;         // Route (e.g., "Red", "Blue", "Brn")
  destSt: string;     // Destination Station (numeric ID)
  destNm: string;     // Destination Name (e.g., "Howard", "O'Hare")
  trDr: string;       // Train Direction (numeric)
  prdt: string;       // Prediction Generated Time (YYYYMMDD HH:MM:SS)
  arrT: string;       // Arrival Time (YYYY-MM-DDTHH:MM:SS)
  isApp: string;      // Is Approaching (0 or 1)
  isSch: string;      // Is Scheduled (0 or 1, 0 for live, 1 for scheduled)
  isDly: string;      // Is Delayed (0 or 1)
  isFlt: string;      // Is Fault (0 or 1)
  flags: string | null; // Flag (e.g., for accessibility alert, often null)
  lat: string;        // Latitude
  lon: string;        // Longitude
  heading: string;    // Heading (degrees)
}

interface CtaTrainApiResponse {
  ctatt: {
    tmst: string; // Timestamp of the data
    errCd: string; // Error Code (0 for no error)
    errNm: string | null; // Error Name (null for no error)
    eta?: CtaTrainArrival[]; // Array of arrivals, optional if no trains
  }
}

// Route Short Code to Full Name and Color mapping
const lineDetails: Record<string, { name: string; color: string }> = {
  "Red": { name: "Red Line", color: "#C0392B" },
  "Blue": { name: "Blue Line", color: "#3B5998" },
  "Brn": { name: "Brown Line", color: "#6E4B3A" },
  "G": { name: "Green Line", color: "#6BAE75" },
  "Org": { name: "Orange Line", color: "#E08E45" },
  "P": { name: "Purple Line", color: "#5E4A82" }, // Purple Line Express uses 'P', regular Purple Line might vary or be part of 'P'
  "Pink": { name: "Pink Line", color: "#D28A94" },
  "Y": { name: "Yellow Line", color: "#D6B84B" },
};


export async function GET(request: NextRequest) {
  if (!CTA_TRAIN_API_KEY) {
    console.error("CTA_TRAIN_API_KEY is not defined in environment variables.");
    return NextResponse.json({ message: "API key configuration error." }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const mapId = searchParams.get('mapid'); // Station ID from client
  const routeCode = searchParams.get('rt'); // Optional route code (e.g., "Red", "Blue")

  if (!mapId) {
    return NextResponse.json({ message: "Missing 'mapid' (station ID) query parameter." }, { status: 400 });
  }

  const apiParams = new URLSearchParams({
    key: CTA_TRAIN_API_KEY,
    mapid: mapId,
    outputType: 'JSON',
  });

  // If a specific route code is provided, add it to the params to filter results
  // The API seems to filter by 'rt' on its own if provided with 'mapid'
  // However, the example python code filters client-side after fetching all for a station.
  // For simplicity, we'll fetch all for the station and let client filter if necessary, or rely on API's mapid behavior.
  // If direct API filtering by 'rt' along with 'mapid' is desired and confirmed, 'rt' can be added to apiParams.

  const apiUrl = `${CTA_TRAIN_BASE_URL}?${apiParams.toString()}`;

  try {
    // Using { next: { revalidate: 30 } } for ISR-like caching behavior if deployed on Vercel
    const apiResponse = await fetch(apiUrl, { cache: 'no-store' }); // Opt-out of caching for real-time data

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`CTA Train API request failed: ${apiResponse.status} ${apiResponse.statusText}`, errorText);
      return NextResponse.json({ message: `Error fetching data from CTA Train API: ${apiResponse.statusText}` }, { status: apiResponse.status });
    }

    const data: CtaTrainApiResponse = await apiResponse.json();

    if (data.ctatt.errCd !== "0" && data.ctatt.errCd !== null) { // errCd can be null for success sometimes
      console.warn("CTA Train API returned an error:", data.ctatt.errNm, `Code: ${data.ctatt.errCd}`);
      // Distinguish "no trains" from actual errors if possible
      if (data.ctatt.errCd === "101" && data.ctatt.errNm?.includes("No arrivals")) {
         return NextResponse.json({ arrivals: [], message: data.ctatt.errNm });
      }
      return NextResponse.json({ message: `Error from CTA Train API: ${data.ctatt.errNm || 'Unknown API error'}` }, { status: 400 });
    }
    
    if (!data.ctatt.eta || data.ctatt.eta.length === 0) {
      return NextResponse.json({ arrivals: [], message: "No scheduled trains found for this station at this time." });
    }

    const processedArrivals = data.ctatt.eta
      .map(train => {
        const lineDetail = lineDetails[train.rt] || { name: train.rt, color: '#808080' }; // Default for unknown lines
        return {
          runNumber: train.rn,
          line: train.rt,
          lineFullName: lineDetail.name,
          lineColor: lineDetail.color,
          destination: train.destNm,
          arrivalTime: train.arrT ? format(parseISO(train.arrT), "p") : "N/A", // Formats to h:mm aa (e.g., 12:30 PM)
          isApproaching: train.isApp === "1",
          isDelayed: train.isDly === "1",
          isScheduled: train.isSch === "1", // 0 for live tracking, 1 for scheduled (not yet departed from terminal)
          rawArrivalTime: train.arrT, // Useful for client-side sorting or countdowns
        };
      })
      .sort((a, b) => {
        // Sort by arrival time, soonest first
        if (a.rawArrivalTime && b.rawArrivalTime) {
          return parseISO(a.rawArrivalTime).getTime() - parseISO(b.rawArrivalTime).getTime();
        }
        if (a.rawArrivalTime) return -1; // a comes first if b has no time
        if (b.rawArrivalTime) return 1;  // b comes first if a has no time
        return 0; // no change in order if neither has time
      });

    return NextResponse.json({ arrivals: processedArrivals });

  } catch (error) {
    console.error("Error processing CTA Train API request:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "An unexpected server error occurred.", error: errorMessage }, { status: 500 });
  }
}
