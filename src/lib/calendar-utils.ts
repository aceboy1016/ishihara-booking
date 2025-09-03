
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
  
  console.log('DEBUG: Raw credentials length:', credentialsString.length);
  console.log('DEBUG: First 50 chars:', credentialsString.substring(0, 50));
  
  // Check if the credentials are base64 encoded
  try {
    // If the string doesn't start with {, it's likely base64 encoded
    if (!credentialsString.startsWith('{')) {
      console.log('DEBUG: String does not start with {, attempting base64 decode');
      const decoded = Buffer.from(credentialsString, 'base64').toString('utf-8');
      console.log('DEBUG: Decoded length:', decoded.length);
      console.log('DEBUG: Decoded first 50 chars:', decoded.substring(0, 50));
      console.log('DEBUG: Decoded last 50 chars:', decoded.substring(decoded.length - 50));
      
      if (decoded.startsWith('{') && decoded.endsWith('}')) {
        credentialsString = decoded;
        console.log('DEBUG: Successfully decoded base64 credentials');
      } else {
        console.log('DEBUG: Decoded string is not valid JSON format');
        console.log('DEBUG: String starts with {:', decoded.startsWith('{'));
        console.log('DEBUG: String ends with }:', decoded.endsWith('}'));
        // Force use the decoded string anyway for debugging
        credentialsString = decoded;
        console.log('DEBUG: Using decoded string anyway for debugging');
      }
    } else {
      console.log('DEBUG: String starts with {, using as-is');
    }
  } catch {
    console.log('DEBUG: Base64 decode failed, using original');
  }
  
  let credentials;
  try {
    credentials = JSON.parse(credentialsString);
    console.log('DEBUG: JSON parse successful, project_id:', credentials.project_id);
  } catch (parseError: unknown) {
    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    console.error('DEBUG: JSON parse error:', errorMessage);
    console.error('DEBUG: String around error position:', credentialsString.substring(70, 90));
    throw parseError;
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
    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items || [];
  } catch (error: unknown) {
    console.error(`Failed to fetch events for ${calendarId}:`, error instanceof Error ? error.message : 'Unknown error');
    return []; // Return empty array on error
  }
};

// Main function to get all bookings from Google Calendar
export const getGoogleCalendarBookings = async (): Promise<BookingData> => {
  const calendar = getCalendarClient();
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + (61 * 24 * 60 * 60 * 1000)).toISOString(); // 61 days from now

  // Fetch all calendars in parallel
  const [ishiharaWorkEvents, ishiharaPrivateEvents, ebisuEvents, hanzomonEvents] = await Promise.all([
    fetchEvents(calendar, CALENDAR_IDS.ishihara_work, timeMin, timeMax),
    fetchEvents(calendar, CALENDAR_IDS.ishihara_private, timeMin, timeMax),
    fetchEvents(calendar, CALENDAR_IDS.ebisu, timeMin, timeMax),
    fetchEvents(calendar, CALENDAR_IDS.hanzoomon, timeMin, timeMax),
  ]);

  // Helper to transform Google Calendar events to our Booking type
  const transformEvent = (event: calendar_v3.Schema$Event): Booking => {
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
    };
  };

  // Combine work and private events for the trainer, but exclude customer events and non-business all-day events
  const ishiharaWorkFiltered = ishiharaWorkEvents.filter(event => {
    const title = event.summary || '';
    // Exclude customer events (ending with "さん")
    if (title.endsWith('さん')) return false;
    
    // Exclude non-business all-day events (birthdays, personal events, etc.)
    if (event.start?.date && event.end?.date) { // This is an all-day event
      if (title.includes('誕生日') || 
          title.includes('SQUARE') || 
          title.includes('請求書') || 
          title.includes('海外') || 
          title.includes('hacomono') ||
          title.includes('データ出力')) {
        return false;
      }
    }
    
    return true;
  });
  
  const ishiharaPrivateFiltered = ishiharaPrivateEvents.filter(event => {
    const title = event.summary || '';
    // Exclude customer events (ending with "さん")
    if (title.endsWith('さん')) return false;
    
    // Exclude non-business all-day events
    if (event.start?.date && event.end?.date) { // This is an all-day event
      if (title.includes('誕生日') || 
          title.includes('SQUARE') || 
          title.includes('請求書') || 
          title.includes('海外') || 
          title.includes('hacomono') ||
          title.includes('データ出力')) {
        return false;
      }
    }
    
    return true;
  });
  
  const ishiharaBookings = [...ishiharaWorkFiltered.map(transformEvent), ...ishiharaPrivateFiltered.map(transformEvent)];
  const ebisuBookings = ebisuEvents.map(transformEvent);
  const hanzomonBookings = hanzomonEvents.map(transformEvent);

  // Add store and room info based on the booking title
  ishiharaBookings.forEach(b => {
      if (b.title?.includes('(半)') || b.title?.includes('（半）') || b.title?.startsWith('半 ')) {
          b.store = 'hanzoomon';
      } else if (b.title?.includes('(恵)') || b.title?.includes('（恵）') || b.title?.startsWith('恵 ')) {
          b.store = 'ebisu';
      }
  });

  ebisuBookings.forEach(b => {
      b.store = 'ebisu';
      if (b.title?.includes('A')) b.room = 'A';
      if (b.title?.includes('B')) b.room = 'B';
  });

  hanzomonBookings.forEach(b => {
      b.store = 'hanzoomon';
  });

  return {
    ishihara: ishiharaBookings,
    ebisu: ebisuBookings,
    hanzoomon: hanzomonBookings,
    lastUpdate: new Date().toISOString(),
  };
};
