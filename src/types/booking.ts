
export interface Booking {
  id: string;
  start: string; // ISO string
  end: string;   // ISO string
  title?: string;
  store?: 'ebisu' | 'hanzoomon';
  room?: 'A' | 'B'; // 恵比寿店のみ
}

export interface BookingData {
  ishihara: Booking[];
  ebisu: Booking[];
  hanzoomon: Booking[];
  lastUpdate: string;
}

export interface StoreCapacity {
  ebisu: {
    roomA: boolean;
    roomB: boolean;
  };
  hanzoomon: {
    current: number;
    max: 3;
  };
}
