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

const TimeSlotNew: React.FC<TimeSlotProps> = ({ date, time, bookings, selectedStore, isAdminMode, onClick, isSelected = false, privateEventSettings = {}, topformHoldSettings = {}, selectedSlot = null }) => {
  const [hour, minute] = time.split(':').map(Number);
  const slotTime = new Date(date);
  slotTime.setHours(hour, minute, 0, 0);

  const result = checkAvailability(slotTime, selectedStore, bookings, privateEventSettings, topformHoldSettings);

  // Determine the visual state based on availability and mode
  let content = null;
  // Wellnessデザイン: ボーダーを少し薄く、背景を白に。セル自体にパディングを持たせるアプローチもアリだが、
  // グリッドの整合性を保つため、コンテナはシンプルにし、中身で丸みを表現する。
  let containerClass = "bg-white border-b border-r border-gray-200";

  if (isAdminMode) {
    // === Admin Mode Visualization ===
    if (result.isAvailable) {
      // Available (Wellness: Soft Green)
      content = selectedSlot?.date.getTime() === slotTime.getTime() && selectedSlot?.time === time
        ? <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg transform scale-105 transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
        : <div className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-sm shadow-emerald-200"></div>;
    } else {
      // Not Available (Admin)
      let indicatorColor = "bg-gray-300";
      let icon = null;

      switch (result.reason) {
        case 'trainer_busy':
          // Wellness: Amber background for the whole cell to clearly see busy times
          indicatorColor = "bg-amber-400";
          icon = <div className="w-2 h-2 rounded-full bg-amber-500"></div>;
          containerClass = "bg-amber-50/60 border-b border-r border-amber-100";
          break;
        case 'travel_conflict':
          indicatorColor = "bg-blue-400";
          icon = <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
          break;
        case 'store_full':
          indicatorColor = "bg-rose-500";
          icon = <span className="text-[9px] font-bold text-rose-400 leading-tight tracking-wider">FULL</span>;
          containerClass = "bg-rose-50/60 border-b border-r border-rose-100";
          break;
        case 'unavailable_block':
          indicatorColor = "bg-gray-400";
          icon = <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>;
          containerClass = "bg-gray-50 border-b border-r border-gray-200";
          break;
        default: // outside_hours
          indicatorColor = "bg-slate-200";
          containerClass = "bg-white border-b border-r border-gray-200"; // Clean white for outside hours
          break;
      }

      content = icon ? icon : <div className={`w-2 h-2 rounded-full ${indicatorColor}`}></div>;
    }

  } else {
    // === Guest Mode Visualization (Wellness) ===
    if (result.isAvailable) {
      if (isSelected) {
        // Selected State: Soft Blue Button
        content = (
          <div className="w-full h-full m-1 bg-blue-500 rounded-lg text-white flex items-center justify-center shadow-lg shadow-blue-200 transform scale-100 transition-all duration-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
        );
        containerClass = "bg-white border-b border-r border-gray-200 p-0.5";
      } else {
        // Available State: Round outline or soft background
        content = (
          <div className="w-full h-full m-1 rounded-lg border-2 border-dashed border-blue-400 text-blue-600 flex items-center justify-center hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all duration-200 group">
            <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div>
          </div>
        );
        containerClass = "bg-white border-b border-r border-gray-200 p-0.5";
      }
    } else {
      // Unavailable (Guest)
      if (result.reason === 'outside_hours') {
        content = null;
        containerClass = "bg-white border-b border-r border-gray-200";
      } else {
        // Minimalist dot
        content = <div className="w-1 h-1 rounded-full bg-gray-300"></div>;
        containerClass = "bg-gray-50/30 border-b border-r border-gray-200 cursor-not-allowed";
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

export default TimeSlotNew;