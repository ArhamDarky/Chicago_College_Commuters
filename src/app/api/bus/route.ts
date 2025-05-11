
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CTA_BASE_URL = "http://www.ctabustracker.com/bustime/api/v2";
const CTA_BUS_API_KEY = process.env.CTA_BUS_API_KEY;

async function fetchCtaData(endpoint: string, params: Record<string, string>) {
  if (!CTA_BUS_API_KEY) {
    console.error("CTA_BUS_API_KEY is not defined in environment variables.");
    return NextResponse.json({ message: "API key configuration error." }, { status: 500 });
  }

  const queryParams = new URLSearchParams({
    key: CTA_BUS_API_KEY,
    format: 'json',
    ...params,
  });

  const apiUrl = `${CTA_BASE_URL}/${endpoint}?${queryParams.toString()}`;

  try {
    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      console.error(`CTA API request failed (${endpoint}): ${apiResponse.status}`, await apiResponse.text());
      return NextResponse.json({ message: `Error fetching data from CTA API: ${apiResponse.statusText}` }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();

    if (data["bustime-response"]?.error) {
      console.warn(`CTA API returned an error (${endpoint}):`, data["bustime-response"].error);
      return NextResponse.json({ message: "Error from CTA API.", errors: data["bustime-response"].error }, { status: 400 });
    }

    return NextResponse.json(data["bustime-response"]);

  } catch (error) {
    console.error(`Error processing CTA API request (${endpoint}):`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "An unexpected error occurred.", error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const routeId = searchParams.get('rt');
  const direction = searchParams.get('dir');
  const stopId = searchParams.get('stpid');

  switch (action) {
    case 'routes':
      return fetchCtaData('getroutes', {});
    case 'directions':
      if (!routeId) return NextResponse.json({ message: "Missing 'rt' (route ID) query parameter." }, { status: 400 });
      return fetchCtaData('getdirections', { rt: routeId });
    case 'stops':
      if (!routeId) return NextResponse.json({ message: "Missing 'rt' (route ID) query parameter." }, { status: 400 });
      if (!direction) return NextResponse.json({ message: "Missing 'dir' (direction) query parameter." }, { status: 400 });
      return fetchCtaData('getstops', { rt: routeId, dir: direction });
    case 'predictions':
      if (!routeId) return NextResponse.json({ message: "Missing 'rt' (route ID) query parameter." }, { status: 400 });
      if (!stopId) return NextResponse.json({ message: "Missing 'stpid' (stop ID) query parameter." }, { status: 400 });
      return fetchCtaData('getpredictions', { rt: routeId, stpid: stopId });
    case 'vehicles':
      if (!routeId) return NextResponse.json({ message: "Missing 'rt' (route ID) query parameter." }, { status: 400 });
      // The old logic filtered by direction on the server, the new provided JSX filters client-side or implies all vehicles for a route.
      // For now, fetching all vehicles for the route. Can add direction filter if needed.
      return fetchCtaData('getvehicles', { rt: routeId });
    default:
      return NextResponse.json({ message: "Invalid or missing 'action' query parameter." }, { status: 400 });
  }
}
