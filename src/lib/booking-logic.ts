
import { Booking, BookingData } from '../types/booking';

export interface AvailabilityCheck {
  isAvailable: boolean;
  reason?: 'trainer_busy' | 'store_full' | 'travel_conflict' | 'outside_hours' | 'unavailable_block';
}

const ISHIHARA_SESSION_DURATION = 60; // minutes
const TRAVEL_TIME = 60; // minutes

// 祝日判定（簡易版）
const isHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 2024年の主要祝日
  const holidays2024 = [
    '2024-1-1', '2024-1-8', '2024-2-11', '2024-2-12', '2024-2-23',
    '2024-3-20', '2024-4-29', '2024-5-3', '2024-5-4', '2024-5-5',
    '2024-7-15', '2024-8-11', '2024-8-12', '2024-9-16', '2024-9-22',
    '2024-9-23', '2024-10-14', '2024-11-3', '2024-11-4', '2024-11-23'
  ];
  
  // 2025年の主要祝日
  const holidays2025 = [
    '2025-1-1', '2025-1-13', '2025-2-11', '2025-2-23', '2025-2-24',
    '2025-3-20', '2025-4-29', '2025-5-3', '2025-5-4', '2025-5-5',
    '2025-5-6', '2025-7-21', '2025-8-11', '2025-9-15', '2025-9-23',
    '2025-10-13', '2025-11-3', '2025-11-23', '2025-11-24'
  ];
  
  const dateStr = `${year}-${month}-${day}`;
  return holidays2024.includes(dateStr) || holidays2025.includes(dateStr);
};


// 1. Check if Ishihara is busy
const isTrainerBusy = (slotTime: Date, ishiharaBookings: Booking[]): boolean => {
  const slotEndTime = new Date(slotTime.getTime() + ISHIHARA_SESSION_DURATION * 60000);
  
  return ishiharaBookings.some(booking => {
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    // Check for any overlap between the potential slot and existing bookings
    return slotTime < bookingEnd && slotEndTime > bookingStart;
  });
};

// 2. Check for travel time conflicts
const hasTravelConflict = (slotTime: Date, store: 'ebisu' | 'hanzoomon', ishiharaBookings: Booking[]): boolean => {
  const travelWindowStart = new Date(slotTime.getTime() - TRAVEL_TIME * 60000);
  const travelWindowEnd = new Date(slotTime.getTime() + (ISHIHARA_SESSION_DURATION + TRAVEL_TIME) * 60000);

  return ishiharaBookings.some(booking => {
    if (booking.store === store) {
      return false; // No travel conflict if it's in the same store
    }
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    // Check if any booking at the *other* store falls within the travel window
    return bookingStart < travelWindowEnd && bookingEnd > travelWindowStart;
  });
};

// Helper function to check if an event is a TOPFORM Ishihara facility hold and should be ignored
const isTOPFORMIshiharaHold = (
  booking: Booking, 
  slotTime: Date, 
  allBookings: BookingData,
  topformHoldSettings: Record<string, boolean> = {}
): boolean => {
  // Check if this is a TOPFORM Ishihara facility hold
  const title = booking.title || '';
  if (!title.includes('TOPFORM') || !title.includes('石原') || !title.includes('淳哉')) {
    return false;
  }

  // Debug logging for TOPFORM holds
  console.log(`🔍 TOPFORM Hold Detected: "${title}" at ${slotTime.toISOString()}`);
  console.log(`📋 Booking ID: ${booking.id}, Settings:`, topformHoldSettings[booking.id]);
  console.log(`📅 All topformHoldSettings:`, topformHoldSettings);

  // Check if this specific hold is set to be ignored (always ignore)
  if (topformHoldSettings[booking.id] === true) {
    console.log(`✅ Hold ${booking.id} set to ALWAYS IGNORE`);
    return true; // Always ignore this hold
  }

  // Default behavior: Check if Ishihara has any real booking at the same time in his work calendar
  const slotEndTime = new Date(slotTime.getTime() + ISHIHARA_SESSION_DURATION * 60000);
  
  const hasRealIshiharaBooking = allBookings.ishihara.some(ishiharaBooking => {
    if (ishiharaBooking.source !== 'work') return false; // Only check work calendar
    
    const bookingStart = new Date(ishiharaBooking.start);
    const bookingEnd = new Date(ishiharaBooking.end);
    
    // Check for any overlap between the slot and Ishihara's real booking
    const hasOverlap = slotTime < bookingEnd && slotEndTime > bookingStart;
    if (hasOverlap) {
      console.log(`📅 Found overlapping Ishihara work booking: "${ishiharaBooking.title}" ${bookingStart.toISOString()} - ${bookingEnd.toISOString()}`);
    }
    return hasOverlap;
  });

  // If Ishihara doesn't have a real booking, this facility hold should be ignored
  const shouldIgnore = !hasRealIshiharaBooking;
  console.log(`🎯 Hold "${title}" - hasRealBooking: ${hasRealIshiharaBooking}, shouldIgnore: ${shouldIgnore}`);
  
  return shouldIgnore;
};

// 3. Check if the store is full
const isStoreFull = (
  slotTime: Date, 
  store: 'ebisu' | 'hanzoomon', 
  allBookings: BookingData,
  topformHoldSettings: Record<string, boolean> = {}
): boolean => {
  const slotEndTime = new Date(slotTime.getTime() + ISHIHARA_SESSION_DURATION * 60000);

  if (store === 'ebisu') {
    const ebisuBookings = allBookings.ebisu;
    console.log(`🏪 Checking Ebisu store availability for ${slotTime.toISOString()}`);
    console.log(`📋 Total Ebisu bookings in period: ${ebisuBookings.length}`);
    
    const bookingsInSlot = ebisuBookings.filter(b => {
        const bookingStart = new Date(b.start);
        const bookingEnd = new Date(b.end);
        const hasOverlap = slotTime < bookingEnd && slotEndTime > bookingStart;
        
        if (hasOverlap) {
          console.log(`⏰ Overlapping booking: "${b.title}" (${b.room || 'No room'}) ${bookingStart.toISOString()} - ${bookingEnd.toISOString()}`);
        }
        
        // If this overlaps and is a TOPFORM Ishihara hold without real booking, ignore it
        if (hasOverlap && isTOPFORMIshiharaHold(b, slotTime, allBookings, topformHoldSettings)) {
          console.log(`🚫 Ignoring TOPFORM hold: "${b.title}"`);
          return false;
        }
        
        return hasOverlap;
    });
    
    console.log(`📊 Bookings after filtering: ${bookingsInSlot.length}`);
    bookingsInSlot.forEach(b => console.log(`  - "${b.title}" (Room: ${b.room || 'No room'})`));
    
    const roomA_booked = bookingsInSlot.some(b => b.room === 'A');
    const roomB_booked = bookingsInSlot.some(b => b.room === 'B');
    
    console.log(`🚪 Room status - A: ${roomA_booked ? 'BOOKED' : 'FREE'}, B: ${roomB_booked ? 'BOOKED' : 'FREE'}`);
    console.log(`🎯 Store full result: ${roomA_booked && roomB_booked}`);
    
    return roomA_booked && roomB_booked;
  } else { // hanzoomon
    const hanzomonBookings = allBookings.hanzoomon;
    const bookingsInSlot = hanzomonBookings.filter(b => {
        const bookingStart = new Date(b.start);
        const bookingEnd = new Date(b.end);
        const hasOverlap = slotTime < bookingEnd && slotEndTime > bookingStart;
        
        // If this overlaps and is a TOPFORM Ishihara hold without real booking, ignore it
        if (hasOverlap && isTOPFORMIshiharaHold(b, slotTime, allBookings, topformHoldSettings)) {
          return false;
        }
        
        return hasOverlap;
    });
    return bookingsInSlot.length >= 3;
  }
};

// Check if the trainer has an all-day event (休日)
const hasAllDayEvent = (slotTime: Date, ishiharaBookings: Booking[]): boolean => {
  const slotDate = slotTime.toISOString().split('T')[0]; // Get YYYY-MM-DD
  
  return ishiharaBookings.some(booking => {
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    const bookingStartDate = bookingStart.toISOString().split('T')[0];
    
    // Check if this is an all-day event that covers the slot date
    // All-day events typically start at 00:00 and end at 23:59 on the same day
    const isAllDay = bookingStart.getHours() === 0 && bookingStart.getMinutes() === 0 &&
                    bookingEnd.getHours() === 23 && bookingEnd.getMinutes() === 59;
    
    return isAllDay && bookingStartDate === slotDate;
  });
};

// Check if there's a "予約不可" (unavailable) block for this time slot
const hasUnavailableBlock = (slotTime: Date, ishiharaBookings: Booking[]): boolean => {
  const slotEndTime = new Date(slotTime.getTime() + ISHIHARA_SESSION_DURATION * 60000);
  
  return ishiharaBookings.some(booking => {
    // Check if the booking title contains "予約不可"
    if (!booking.title || !booking.title.includes('予約不可')) {
      return false;
    }
    
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    // Check for any overlap between the potential slot and the unavailable block
    return slotTime < bookingEnd && slotEndTime > bookingStart;
  });
};

// Main availability check function
export const checkAvailability = (
  slotTime: Date,
  store: 'ebisu' | 'hanzoomon',
  allBookings: BookingData,
  privateEventSettings: Record<string, boolean> = {},
  topformHoldSettings: Record<string, boolean> = {}
): AvailabilityCheck => {
  const now = new Date();
  
  // Check for the 3-hour booking deadline
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  if (slotTime <= threeHoursFromNow) {
    return { isAvailable: false, reason: 'unavailable_block' };
  }

  // Check if the booking date is available based on 2-month advance rule
  // Booking becomes available 2 months before the target date
  const twoMonthsBefore = new Date(slotTime);
  twoMonthsBefore.setMonth(twoMonthsBefore.getMonth() - 2);
  
  // Only check date (ignore time) for the 2-month rule
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const twoMonthsBeforeDate = new Date(twoMonthsBefore.getFullYear(), twoMonthsBefore.getMonth(), twoMonthsBefore.getDate());
  
  if (todayDateOnly < twoMonthsBeforeDate) {
    return { isAvailable: false, reason: 'unavailable_block' };
  }

  // Check if outside business hours
  const hour = slotTime.getHours();
  const minute = slotTime.getMinutes();
  
  // Before 9:00 is outside hours
  if (hour < 9) {
    return { isAvailable: false, reason: 'outside_hours' };
  }
  
  // Check if it's weekend or holiday for shorter hours
  const dayOfWeek = slotTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday(0) or Saturday(6)
  const isHol = isHoliday(slotTime);
  
  if (isWeekend || isHol) {
    // Weekend/holiday: 9:00 - 20:00 (last booking starts at 19:00)
    if (hour > 19 || (hour === 19 && minute > 0)) {
      return { isAvailable: false, reason: 'outside_hours' };
    }
  } else {
    // Weekday: 9:00 - 22:00 (last booking starts at 21:00)
    if (hour > 21 || (hour === 21 && minute > 0)) {
      return { isAvailable: false, reason: 'outside_hours' };
    }
  }

  // Check for all-day events (休日) - these take priority over everything
  if (hasAllDayEvent(slotTime, allBookings.ishihara)) {
    return { isAvailable: false, reason: 'outside_hours' };
  }

  // Check for "予約不可" blocks - these take priority over regular bookings
  if (hasUnavailableBlock(slotTime, allBookings.ishihara)) {
    return { isAvailable: false, reason: 'unavailable_block' };
  }

  // フィルタリングされたishihara予定（無視設定されたプライベート予定を除外）
  const filteredIshiharaBookings = allBookings.ishihara.filter(booking => {
    if (booking.source === 'private' && privateEventSettings[booking.id] === false) {
      return false; // 無視設定されたプライベート予定は除外
    }
    return true;
  });

  if (isTrainerBusy(slotTime, filteredIshiharaBookings)) {
    return { isAvailable: false, reason: 'trainer_busy' };
  }

  if (hasTravelConflict(slotTime, store, filteredIshiharaBookings)) {
    return { isAvailable: false, reason: 'travel_conflict' };
  }

  if (isStoreFull(slotTime, store, allBookings, topformHoldSettings)) {
    return { isAvailable: false, reason: 'store_full' };
  }

  return { isAvailable: true };
};
