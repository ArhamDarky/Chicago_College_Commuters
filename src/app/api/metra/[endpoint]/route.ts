console.log('--- DEBUG: TOP OF METRA API ROUTE ---');
console.log('process.env.METRA_API_KEY:', process.env.METRA_API_KEY);
console.log('process.env.METRA_API_SECRET:', process.env.METRA_API_SECRET);
// For more extensive debugging, you could log a portion of process.env, but be careful with sensitive data.
// console.log('A few process.env keys:', Object.keys(process.env).slice(0, 10));

import { NextResponse } from 'next/server';

const METRA_API_BASE = 'https://gtfsapi.metrarail.com/gtfs';

const apiKey = process.env.METRA_API_KEY;
const apiSecret = process.env.METRA_API_SECRET;

let AUTH_STRING = '';
if (apiKey && apiSecret) {
  AUTH_STRING = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
} else {
  console.error('Metra API Key or Secret is missing from environment variables. Ensure .env.local is set up and the server is restarted.');
}

// The 'params' object will contain the dynamic segment, e.g., { endpoint: 'alerts' }
export async function GET(
  request: Request,
  context: { params: { endpoint: string } } // Use context object
) {
  try {
    // Explicitly "resolve" params from context, though it's usually direct
    // This is an attempt to satisfy the "params should be awaited" error literally
    // In most scenarios, context.params is directly available.
    const params = await Promise.resolve(context.params); 

    const endpoint = params.endpoint;

    if (!['alerts', 'tripUpdates', 'positions'].includes(endpoint)) {
      return NextResponse.json(
        { error: `Invalid endpoint: ${endpoint}` },
        { status: 400 }
      );
    }

    if (!AUTH_STRING) {
      console.error('Metra authentication string is not configured.');
      return NextResponse.json(
        { error: 'Server configuration error: Metra API credentials missing or not loaded.' },
        { status: 500 }
      );
    }

    console.log(`Requesting Metra ${endpoint}...`);

    const metraApiResponse = await fetch(`${METRA_API_BASE}/${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${AUTH_STRING}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const responseText = await metraApiResponse.text();
    console.log(`Raw Metra API response for ${endpoint} (status ${metraApiResponse.status}):\n`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

    if (!metraApiResponse.ok) {
      console.error(`Metra API error for ${endpoint} (status ${metraApiResponse.status}).`);
      try {
        const errorJson = JSON.parse(responseText);
        return NextResponse.json(
          { error: `Metra API returned ${metraApiResponse.status}`, details: errorJson },
          { status: metraApiResponse.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: `Metra API returned ${metraApiResponse.status}`, rawError: responseText },
          { status: metraApiResponse.status }
        );
      }
    }

    const metraContentType = metraApiResponse.headers.get('content-type');
    if (!metraContentType || !metraContentType.includes('application/json')) {
      console.warn(`Metra API for ${endpoint} did not return JSON. Content-Type: ${metraContentType}`);
      return NextResponse.json(
        { error: `Metra API for ${endpoint} returned non-JSON content: ${metraContentType}`, rawResponse: responseText },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      console.error(`Failed to parse JSON response from Metra API for ${endpoint}:`, e);
      console.error(`Problematic raw text for ${endpoint}:`, responseText);
      return NextResponse.json(
        {
          error: `Failed to parse JSON response from Metra API for ${endpoint}`,
          details: (e instanceof Error ? e.message : String(e)),
          rawResponsePreview: responseText.substring(0, 200) + '...'
        },
        { status: 502 }
      );
    }

  } catch (error) {
    // Log the endpoint if params was resolved, otherwise 'unknown'
    const endpointForErrorLog = context?.params?.endpoint || 'unknown (params not resolved)';
    console.error(`General error in /api/metra/[endpoint] route for ${endpointForErrorLog}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error while fetching Metra data', details: errorMessage },
      { status: 500 }
    );
  }
}