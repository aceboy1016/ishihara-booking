'use client';

import React from 'react';
import { BookingData } from '../types/booking';
import { checkAvailability } from '../lib/booking-logic';

interface TimeSlotProps {
  date: Date;
  time: string; // e.g., "07:30"
  bookings: BookingData;
  selectedStore: 'ebisu' | 'hanzoomon';
  isAdminMode: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ date, time, bookings, selectedStore, isAdminMode, onClick, isSelected = false }) => {
  const [hour, minute] = time.split(':').map(Number);
  const slotTime = new Date(date);
  slotTime.setHours(hour, minute, 0, 0);


  let status: {
    className: string;
    title: string;
  } = { className: '', title: '' };

  const result = checkAvailability(slotTime, selectedStore, bookings);
  
  if (isAdminMode) {
    // 管理者モード：詳細な状況表示
    if (result.isAvailable) {
      status = { className: 'bg-emerald-400', title: `予約可能です` };
    } else {
      switch (result.reason) {
        case 'trainer_busy':
          status = { className: 'bg-amber-400', title: 'トレーナーが予約済みです' };
          break;
        case 'travel_conflict':
          status = { className: 'bg-blue-400', title: '店舗間の移動時間が必要です' };
          break;
        case 'store_full':
          status = { className: 'bg-rose-500', title: '満室です' };
          break;
        case 'unavailable_block':
          status = { className: 'bg-gray-600', title: '予約不可時間帯です' };
          break;
        default:
          status = { className: 'bg-slate-300', title: '営業時間外です' };
      }
    }
  } else {
    // 閲覧者モード：シンプルに予約可能/不可のみ
    if (result.isAvailable) {
      status = { className: 'bg-emerald-400', title: '予約可能' };
    } else {
      status = { className: 'bg-slate-400', title: '予約不可' };
    }
  }

  const getSymbol = () => {
    if (isAdminMode) {
      // 管理者モードでは詳細な記号
      if (result.isAvailable) {
        return '○';
      } else {
        switch (result.reason) {
          case 'trainer_busy':
            return '■';
          case 'travel_conflict':
            return '▲';
          case 'store_full':
            return '●';
          case 'unavailable_block':
            return '▼';
          default:
            return '-';
        }
      }
    } else {
      // 閲覧者モードではシンプルに○-のみ
      return result.isAvailable ? '○' : '-';
    }
  };

  return (
    <div 
      className={`h-8 transition-colors duration-200 ${
        isSelected && !isAdminMode
          ? 'bg-blue-600 border-2 border-blue-800' 
          : `${status.className} border-b border-r`
      } ${
        (isAdminMode || result.isAvailable) ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
      } flex items-center justify-center relative z-10`} 
      title={status.title}
      onClick={onClick}
    >
      <span className={`text-sm font-bold ${
        isSelected 
          ? 'text-white drop-shadow-sm' 
          : 'text-white drop-shadow-md'
      }`}>
        {getSymbol()}
      </span>
    </div>
  );
};

export default TimeSlot;