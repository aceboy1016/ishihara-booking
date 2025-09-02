
import { Booking, BookingData } from '../types/booking';

// Helper function to add minutes to a date
const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

// Generate a random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


const generateIshiharaBookings = (days: number, dayStartTime: number, dayEndTime: number): Booking[] => {
  const bookings: Booking[] = [];
  const now = new Date();
  const stores = ['ebisu', 'hanzoomon'] as const;

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);

    const numBookings = getRandomInt(1, 4);
    for (let j = 0; j < numBookings; j++) {
      const startHour = getRandomInt(dayStartTime, dayEndTime - 2);
      const startMinute = getRandomInt(0, 1) * 30;
      const store = stores[getRandomInt(0, 1)];

      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);

      // Ishihara's bookings are always 60 minutes
      const endDate = addMinutes(startDate, 60);
      if (endDate.getHours() >= dayEndTime && endDate.getMinutes() > 0) continue;

      bookings.push({
        id: `ishihara-${i}-${j}-${Math.random()}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        store: store,
        title: 'Ishihara Personal Training',
      });
    }
  }
  return bookings;
};

const generateEbisuBookings = (days: number, dayStartTime: number, dayEndTime: number): Booking[] => {
  const bookings: Booking[] = [];
  const now = new Date();
  const rooms = ['A', 'B'] as const;

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);

    const numBookings = getRandomInt(3, 8);
    for (let j = 0; j < numBookings; j++) {
      const startHour = getRandomInt(dayStartTime, dayEndTime - 2);
      const startMinute = getRandomInt(0, 1) * 30;
      const room = rooms[getRandomInt(0, 1)];
      const duration = [60, 90][getRandomInt(0, 1)];

      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);
      const endDate = addMinutes(startDate, duration);

      if (endDate.getHours() >= dayEndTime && endDate.getMinutes() > 0) continue;

      bookings.push({
        id: `ebisu-${i}-${j}-${Math.random()}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        store: 'ebisu',
        room: room,
        title: `Rental Gym Ebisu - Room ${room}`,
      });
    }
  }
  return bookings;
};

const generateHanzomonBookings = (days: number, dayStartTime: number, dayEndTime: number): Booking[] => {
  // In Hanzomon, multiple people can book at the same time slot up to a capacity of 3.
  // This mock will just create overlapping bookings to simulate this.
  const bookings: Booking[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);

    // Create more bookings to simulate higher traffic
    const numBookings = getRandomInt(5, 15);
    for (let j = 0; j < numBookings; j++) {
      const startHour = getRandomInt(dayStartTime, dayEndTime - 2);
      const startMinute = getRandomInt(0, 1) * 30;
      const duration = [60, 90][getRandomInt(0, 1)];

      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);
      const endDate = addMinutes(startDate, duration);

      if (endDate.getHours() >= dayEndTime && endDate.getMinutes() > 0) continue;

      bookings.push({
        id: `hanzomon-${i}-${j}-${Math.random()}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        store: 'hanzoomon',
        title: 'Rental Gym Hanzomon',
      });
    }
  }
  return bookings;
};


export const getMockData = (): BookingData => {
  const daysToGenerate = 60;
  const openingHour = 7; // 7:00
  const closingHour = 23; // 23:00

  const ishihara = generateIshiharaBookings(daysToGenerate, openingHour, closingHour);
  const ebisu = generateEbisuBookings(daysToGenerate, openingHour, closingHour);
  const hanzoomon = generateHanzomonBookings(daysToGenerate, openingHour, closingHour);

  // Simple conflict resolution for Ishihara's schedule to make it more realistic
  const cleanedIshihara = ishihara.filter((booking, index, self) => {
    const firstIndex = self.findIndex(b => new Date(b.start).getTime() === new Date(booking.start).getTime());
    return index === firstIndex;
  });

  return {
    ishihara: cleanedIshihara,
    ebisu,
    hanzoomon,
    lastUpdate: new Date().toISOString(),
  };
};
