

import { google } from 'googleapis';
import { calendar_v3 } from 'googleapis';
import { Booking, BookingData } from '../types/booking';

// The calendar IDs provided by the user
const CALENDAR_IDS = {
  ishihara_work: 'j.ishihara@topform.jp',
  ishihara_private: 'junnya1995@gmail.com',
  ebisu: 'ebisu@topform.jp',
  hanzoomon: 'light@topform.jp',
};

// Function to get the authenticated Google Calendar client
const getCalendarClient = () => {
  if (!process.env.GOOGLE_CREDENTIALS_JSON) {
    throw new Error('GOOGLE_CREDENTIALS_JSON environment variable is not set.');
  }
  
  let credentialsString = process.env.GOOGLE_CREDENTIALS_JSON;
  
  // Decode if base64
  if (!credentialsString.startsWith('{')) {
    credentialsString = Buffer.from(credentialsString, 'base64').toString('utf-8');
  }

  let credentials;
  try {
    // This regex specifically finds the private_key value and escapes the newlines *only* within that value.
    // This makes the entire string safe for JSON.parse, regardless of pretty-printing.
    const fixedJson = credentialsString.replace(
      /("private_key":\s*)"((?:\\.|[^"\\])*)"/,
      (match, keyPart, valuePart) => {
        const escapedValue = valuePart.replace(/\n/g, '\\n');
        return keyPart + '"' + escapedValue + '"';
      }
    );
    credentials = JSON.parse(fixedJson);
    console.log('DEBUG: Successfully parsed credentials with targeted newline escaping.');
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown parse error';
    console.error('DEBUG: Failed to process credentials:', errorMessage);
    throw new Error(`Failed to process credentials: ${errorMessage}`);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  return google.calendar({ version: 'v3', auth });
};

// Function to fetch events from a single calendar
const fetchEvents = async (calendar: ReturnType<typeof google.calendar>, calendarId: string, timeMin: string, timeMax: string): Promise<calendar_v3.Schema$Event[]> => {
  try {
    console.log(`🔍 Fetching events for calendar: ${calendarId}`);
    console.log(`   - Range: ${timeMin} to ${timeMax}`);

    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500, // Increase limit to ensure we get all events
    });

    const eventCount = res.data.items?.length || 0;
    console.log(`✅ Successfully fetched ${eventCount} events from ${calendarId}`);

    if (calendarId === 'ebisu@topform.jp' && eventCount > 0) {
      console.log(`📋 Sample events from ebisu calendar:`);
      res.data.items?.slice(0, 5).forEach((event, index) => {
        const title = event.summary || 'No title';
        const startTime = event.start?.dateTime || event.start?.date || 'No time';
        console.log(`   ${index + 1}. "${title}" at ${startTime}`);
      });

      // 11/16以降のイベントを特に確認
      const nov16AndLater = res.data.items?.filter(event => {
        const startTime = event.start?.dateTime || event.start?.date;
        return startTime && startTime >= '2025-11-16';
      });
      console.log(`📅 Events from Nov 16 onwards: ${nov16AndLater?.length || 0}`);

      // 山副さんの予約を特に確認
      const yamazoeEvents = res.data.items?.filter(event =>
        event.summary?.includes('山副')
      );
      console.log(`🏮 Yamazoe events: ${yamazoeEvents?.length || 0}`);
      if (yamazoeEvents && yamazoeEvents.length > 0) {
        yamazoeEvents.slice(0, 3).forEach((event, index) => {
          const title = event.summary || 'No title';
          const startTime = event.start?.dateTime || event.start?.date || 'No time';
          console.log(`     🏮 ${index + 1}. "${title}" at ${startTime}`);
        });
      }
    }

    return res.data.items || [];
  } catch (error: unknown) {
    console.error(`❌ Failed to fetch events for ${calendarId}:`, error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error) {
      console.error(`   - Error details:`, error);
    }
    return []; // Return empty array on error
  }
};

// Main function to get all bookings from Google Calendar
export const getGoogleCalendarBookings = async (): Promise<BookingData> => {
  const calendar = getCalendarClient();
  const now = new Date();

  // 今日の00:00:00から開始（確実に今日以降のデータを取得）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timeMin = today.toISOString();
  const timeMax = new Date(now.getTime() + (61 * 24 * 60 * 60 * 1000)).toISOString(); // 61 days from now

  console.log(`🕐 Data fetch range:`);
  console.log(`  - timeMin: ${timeMin}`);
  console.log(`  - timeMax: ${timeMax}`);

  // Fetch all calendars in parallel
  const [ishiharaWorkEvents, ishiharaPrivateEvents, ebisuEvents, hanzomonEvents] = await Promise.all([
    fetchEvents(calendar, CALENDAR_IDS.ishihara_work, timeMin, timeMax),
    fetchEvents(calendar, CALENDAR_IDS.ishihara_private, timeMin, timeMax),
    fetchEvents(calendar, CALENDAR_IDS.ebisu, timeMin, timeMax),
    fetchEvents(calendar, CALENDAR_IDS.hanzoomon, timeMin, timeMax),
  ]);

  console.log(`📊 Calendar data fetched:`);
  console.log(`  - Ishihara Work: ${ishiharaWorkEvents.length} events`);
  console.log(`  - Ishihara Private: ${ishiharaPrivateEvents.length} events`);
  console.log(`  - Ebisu: ${ebisuEvents.length} events`);
  console.log(`  - Hanzoomon: ${hanzomonEvents.length} events`);

  // Helper to transform Google Calendar events to our Booking type
  const transformEvent = (event: calendar_v3.Schema$Event, source: 'work' | 'private' | 'ebisu' | 'hanzoomon' = 'work'): Booking => {
    let start: string;
    let end: string;

    if (event.start?.dateTime) {
      // Timed event - use as-is
      start = event.start.dateTime;
    } else if (event.start?.date) {
      // All-day event - convert to start of day in JST
      start = event.start.date + 'T00:00:00+09:00';
    } else {
      throw new Error(`Event ${event.id} has no start time`);
    }

    if (event.end?.dateTime) {
      // Timed event - use as-is
      end = event.end.dateTime;
    } else if (event.end?.date) {
      // All-day event - convert to end of previous day in JST (Google's all-day events end at midnight of the next day)
      const endDate = new Date(event.end.date);
      endDate.setDate(endDate.getDate() - 1);
      end = endDate.toISOString().split('T')[0] + 'T23:59:59+09:00';
    } else {
      throw new Error(`Event ${event.id} has no end time`);
    }

    return {
      id: event.id!,
      start,
      end,
      title: event.summary || undefined,
      source,
    };
  };

  // Combine work and private events for the trainer
  const ishiharaWorkFiltered = ishiharaWorkEvents;
  const ishiharaPrivateFiltered = ishiharaPrivateEvents;
  
  const ishiharaBookings = [
    ...ishiharaWorkFiltered.map(event => transformEvent(event, 'work')),
    ...ishiharaPrivateFiltered.map(event => transformEvent(event, 'private'))
  ];

  // 🚀 FIX: Add store info to Ishihara bookings BEFORE extracting store bookings
  ishiharaBookings.forEach(b => {
      if (b.title?.includes('(半)') || b.title?.includes('（半）') || b.title?.startsWith('半 ')) {
          b.store = 'hanzoomon';
      } else if (b.title?.includes('(恵)') || b.title?.includes('（恵）') || b.title?.startsWith('恵 ')) {
          b.store = 'ebisu';
      }
  });

  const ebisuBookings = ebisuEvents.map(event => transformEvent(event, 'ebisu'));
  const hanzomonBookings = hanzomonEvents.map(event => transformEvent(event, 'hanzoomon'));

  // 🚀 FIX: Extract store-specific bookings from Ishihara's calendar
  const ishiharaEbisuBookings = ishiharaBookings
    .filter(booking => booking.store === 'ebisu')
    .map(booking => ({ ...booking, source: 'ebisu' as const }));

  const ishiharaHanzomonBookings = ishiharaBookings
    .filter(booking => booking.store === 'hanzoomon')
    .map(booking => ({ ...booking, source: 'hanzoomon' as const }));

  console.log(`🔧 Adding Ishihara store bookings:`);
  console.log(`  - Adding ${ishiharaEbisuBookings.length} Ebisu bookings from Ishihara calendar`);
  console.log(`  - Adding ${ishiharaHanzomonBookings.length} Hanzoomon bookings from Ishihara calendar`);

  // Merge with existing store bookings (avoid duplicates by ID)
  const allEbisuBookings = [...ebisuBookings];
  ishiharaEbisuBookings.forEach(booking => {
    if (!allEbisuBookings.find(existing => existing.id === booking.id)) {
      allEbisuBookings.push(booking);
    }
  });

  const allHanzomonBookings = [...hanzomonBookings];
  ishiharaHanzomonBookings.forEach(booking => {
    if (!allHanzomonBookings.find(existing => existing.id === booking.id)) {
      allHanzomonBookings.push(booking);
    }
  });

  // Store info is already added above, now just add room info

  allEbisuBookings.forEach(b => {
      b.store = 'ebisu';
      if (b.title?.includes('A')) b.room = 'A';
      if (b.title?.includes('B')) b.room = 'B';
  });

  allHanzomonBookings.forEach(b => {
      b.store = 'hanzoomon';
  });

  console.log(`📊 Final booking counts:`);
  console.log(`  - Ishihara: ${ishiharaBookings.length} bookings`);
  console.log(`  - Ebisu: ${allEbisuBookings.length} bookings (was ${ebisuBookings.length})`);
  console.log(`  - Hanzoomon: ${allHanzomonBookings.length} bookings (was ${hanzomonBookings.length})`);

  return {
    ishihara: ishiharaBookings,
    ebisu: allEbisuBookings,
    hanzoomon: allHanzomonBookings,
    lastUpdate: new Date().toISOString(),
  };
};
