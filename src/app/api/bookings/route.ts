
import { NextResponse } from 'next/server';
import { getGoogleCalendarBookings } from '../../../lib/calendar-utils';

export const revalidate = 0; // No cache for immediate updates
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET() {
  try {
    console.log('DEBUG: API route started');
    console.log('DEBUG: Environment check:', !!process.env.GOOGLE_CREDENTIALS_JSON);

    const startTime = Date.now();
    const bookings = await getGoogleCalendarBookings();

    // 🚨 EMERGENCY FIX: Force close 2026-02-24 by injecting a dummy booking
    // This ensures the date is blocked regardless of client-side logic
    bookings.ishihara.push({
      id: 'force-close-2026-02-24',
      start: '2026-02-24T00:00:00+09:00',
      end: '2026-02-24T23:59:59+09:00',
      title: '臨時休業 (System Force Close)',
      source: 'work'
    });

    const endTime = Date.now();

    console.log(`Calendar API fetch completed in ${endTime - startTime}ms`);

    return NextResponse.json(bookings, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching Google Calendar bookings:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'Unknown error');

    // Add debug info to error response
    const debugInfo = {
      hasEnvVar: !!process.env.GOOGLE_CREDENTIALS_JSON,
      envVarLength: process.env.GOOGLE_CREDENTIALS_JSON?.length || 0,
      envVarPrefix: process.env.GOOGLE_CREDENTIALS_JSON?.substring(0, 20) || 'N/A'
    };

    return NextResponse.json(
      {
        message: "Failed to fetch data from Google Calendar.",
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: debugInfo,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
