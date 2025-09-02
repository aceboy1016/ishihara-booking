
import { NextResponse } from 'next/server';
import { getGoogleCalendarBookings } from '../../../lib/calendar-utils';

export const revalidate = 300; // Cache for 5 minutes
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET() {
  try {
    const startTime = Date.now();
    const bookings = await getGoogleCalendarBookings();
    const endTime = Date.now();
    
    console.log(`Calendar API fetch completed in ${endTime - startTime}ms`);
    
    return NextResponse.json(bookings, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("Error fetching Google Calendar bookings:", error);
    console.error("Stack trace:", error.stack);
    
    return NextResponse.json(
      { 
        message: "Failed to fetch data from Google Calendar.", 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
