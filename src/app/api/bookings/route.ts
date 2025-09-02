
import { NextResponse } from 'next/server';
import { getGoogleCalendarBookings } from '../../../lib/calendar-utils';

export const revalidate = 0; // Disable caching for this route
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET() {
  try {
    const bookings = await getGoogleCalendarBookings();
    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error fetching Google Calendar bookings:", error);
    return NextResponse.json(
      { message: "Failed to fetch data from Google Calendar.", error: error.message },
      { status: 500 }
    );
  }
}
