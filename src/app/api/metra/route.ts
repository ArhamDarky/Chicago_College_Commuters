import { NextResponse } from 'next/server';

const METRA_API_BASE = 'https://gtfsapi.metrarail.com/gtfs';
const AUTH_STRING = Buffer.from('4ee4d8f78a3d15d74aba5208e0bf79ff:487f87f9276cc297d8db76bde075b35a').toString('base64');

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const endpoint = pathSegments[pathSegments.length - 1];

    console.log('Fetching from Metra API:', endpoint);

    const response = await fetch(`${METRA_API_BASE}/${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${AUTH_STRING}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      console.error(`Metra API error: ${response.status}`);
      return NextResponse.json(
        { error: `Metra API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched ${endpoint} data`);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Metra API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Metra data' },
      { status: 500 }
    );
  }
}