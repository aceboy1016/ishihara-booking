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
  privateEventSettings?: Record<string, boolean>;
  topformHoldSettings?: Record<string, boolean>;
  selectedSlot?: { date: Date; time: string } | null;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ date, time, bookings, selectedStore, isAdminMode, onClick, isSelected = false, privateEventSettings = {}, topformHoldSettings = {}, selectedSlot = null }) => {
  const [hour, minute] = time.split(':').map(Number);
  const slotTime = new Date(date);
  slotTime.setHours(hour, minute, 0, 0);

  const result = checkAvailability(slotTime, selectedStore, bookings, privateEventSettings, topformHoldSettings);

  // Determine the visual state based on availability and mode
  let content = null;
  let containerClass = "bg-white border-b border-r border-gray-100";

  if (isAdminMode) {
    // === Admin Mode Visualization ===
    if (result.isAvailable) {
      // Available
      content = selectedSlot?.date.getTime() === slotTime.getTime() && selectedSlot?.time === time
        ? <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg transform scale-110 transition-transform"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
        : <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></div>;
    } else {
      // Not Available (Admin)
      let indicatorColor = "bg-gray-300";
      let icon = null;

      switch (result.reason) {
        case 'trainer_busy':
          indicatorColor = "bg-amber-400"; // Busy
          icon = <span className="text-[10px] font-bold text-amber-600">BUSY</span>;
          containerClass = "bg-amber-50/50 border-b border-r border-amber-100";
          break;
        case 'travel_conflict':
          indicatorColor = "bg-blue-400"; // Travel
          icon = <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
          break;
        case 'store_full':
          indicatorColor = "bg-rose-500"; // Full
          icon = <span className="text-[9px] font-bold text-rose-500 leading-tight">FULL</span>;
          containerClass = "bg-rose-50/50 border-b border-r border-rose-100";
          break;
        case 'unavailable_block':
          indicatorColor = "bg-gray-500";
          icon = <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>;
          containerClass = "bg-gray-50 border-b border-r border-gray-100";
          break;
        default: // outside_hours
          indicatorColor = "bg-slate-200";
          containerClass = "bg-gray-50/50 border-b border-r border-gray-100";
          break;
      }

      // If specific icon is set, use it, otherwise just a dot
      content = icon ? icon : <div className={`w-2 h-2 rounded-full ${indicatorColor}`}></div>;
    }

  } else {
    // === Guest Mode Visualization (Simpler) ===
    if (result.isAvailable) {
      if (isSelected) {
        // Selected State
        content = (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md transform scale-110 transition-all duration-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
        );
        containerClass = "bg-blue-50/30 border-b border-r border-blue-100";
      } else {
        // Available State
        content = (
          <div className="w-8 h-8 rounded-full border-2 border-blue-400 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white hover:border-transparent hover:shadow-md transition-all duration-200 group">
            <div className="w-2 h-2 rounded-full bg-current group-hover:scale-0 transition-transform"></div>
            {/* Simple Plus or Check on hover could go here, but a circle is clean */}
          </div>
        );
      }
    } else {
      // Unavailable (Guest)
      // Minimalist dot or dash
      if (result.reason === 'outside_hours') {
        content = null; // Blank for outside hours to reduce noise? Or a dash?
        containerClass = "bg-white border-b border-r border-gray-100"; // Clean look for empty times
      } else {
        content = <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>;
        containerClass = "bg-gray-50/30 border-b border-r border-gray-100 cursor-not-allowed";
      }
    }
  }

  // ツールチップ用のテキスト生成
  let titleText = '';
  if (result.isAvailable) {
    titleText = '予約可能';
  } else {
    const reasonText = result.reason === 'trainer_busy' ? 'トレーナー予約済み' :
      result.reason === 'travel_conflict' ? '移動時間' :
        result.reason === 'store_full' ? '満室' :
          result.reason === 'unavailable_block' ? '予約不可' :
            '営業時間外';
    titleText = `予約不可 - ${reasonText}`;
  }


  return (
    <div
      className={`relative h-12 flex items-center justify-center transition-colors duration-200 ${containerClass} ${(isAdminMode || result.isAvailable) ? 'cursor-pointer' : ''
        }`}
      title={titleText}
      onClick={onClick}
    >
      {content}
    </div>
  );
};

export default TimeSlot;