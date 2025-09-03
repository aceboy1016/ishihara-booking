'use client';

import React, { useState } from 'react';
import { BookingData } from '../types/booking';
import { checkAvailability } from '../lib/booking-logic';
import TimeSlot from './TimeSlot';
import TimeSlotModal from './TimeSlotModal';
import BookingRequest from './BookingRequest';

interface BookingCalendarProps {
  selectedStore: 'ebisu' | 'hanzoomon';
  currentDate: Date;
  bookings: BookingData;
  isAdminMode: boolean;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ selectedStore, currentDate, bookings, isAdminMode }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Array<{ date: string; time: string; store: 'ebisu' | 'hanzoomon' }>>([]);
  const [displayDate, setDisplayDate] = useState(currentDate);

  // 現在日から2ヶ月先までの期間設定
  const today = new Date();
  const twoMonthsLater = new Date(today);
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
  
  // displayDateの月の1日から末日まで表示
  const startOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
  const endOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);
  
  // その月の日数を取得
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    return new Date(displayDate.getFullYear(), displayDate.getMonth(), i + 1);
  });

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

  const goToPreviousMonth = () => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() - 1);
    // 今日が含まれる月より前には戻れない
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (newDate >= todayMonth) {
      setDisplayDate(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() + 1);
    // 2ヶ月先を超えては進めない
    if (newDate <= twoMonthsLater) {
      setDisplayDate(newDate);
    }
  };

  // ナビゲーションボタンの有効性をチェック
  const canGoPrevious = () => {
    const prevMonth = new Date(displayDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return prevMonth >= todayMonth;
  };

  const canGoNext = () => {
    const nextMonth = new Date(displayDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth <= twoMonthsLater;
  };

  const goToToday = () => {
    setDisplayDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  const timeLabels = Array.from({ length: (22 - 9) * 2 - 1 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const handleSlotClick = (date: Date, time: string, isAvailable: boolean) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // 閲覧者モードでは予約可能な時間帯のみ選択可能
    if (!isAdminMode && !isAvailable) {
      return;
    }
    
    if (isAdminMode) {
      setSelectedSlot({ date, time });
      setModalOpen(true);
    } else {
      // 閲覧者モードでは複数選択機能
      const isAlreadySelected = selectedCells.some(cell => 
        cell.date === dateStr && cell.time === time && cell.store === selectedStore
      );
      
      if (isAlreadySelected) {
        // 既に選択されている場合は選択解除
        setSelectedCells(prev => prev.filter(cell => 
          !(cell.date === dateStr && cell.time === time && cell.store === selectedStore)
        ));
      } else {
        // 重複チェック（同じ日時・同じ店舗の重複を防ぐ）
        const isDuplicate = selectedCells.some(cell => 
          cell.date === dateStr && cell.time === time && cell.store === selectedStore
        );
        
        if (!isDuplicate) {
          // 新規選択（選択時の店舗情報を保存）
          setSelectedCells(prev => [...prev, { date: dateStr, time, store: selectedStore }]);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 予約リクエスト欄（閲覧者モードのみ） */}
      {!isAdminMode && (
        <BookingRequest 
          selectedSlots={selectedCells.map(cell => ({
            date: new Date(cell.date),
            time: cell.time,
            store: cell.store
          }))}
          onClearAll={() => setSelectedCells([])}
          onRemoveSlot={(index) => {
            setSelectedCells(prev => prev.filter((_, i) => i !== index));
          }}
        />
      )}

      <div className="bg-white p-4 rounded-lg shadow-lg">
      {/* カレンダーナビゲーション */}
      <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <button 
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious()}
          className={`px-3 py-1 rounded transition-colors text-sm ${
            canGoPrevious() 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          ← 前月
        </button>
        
        <div className="flex items-center gap-4">
          <div className="font-semibold text-gray-800">
            {formatMonthYear(displayDate)}
          </div>
          <button 
            onClick={goToToday}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            今日
          </button>
        </div>
        
        <button 
          onClick={goToNextMonth}
          disabled={!canGoNext()}
          className={`px-3 py-1 rounded transition-colors text-sm ${
            canGoNext() 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          次月 →
        </button>
      </div>

      {/* 色分け凡例と時間外要望メッセージ */}
      <div className="mb-4 space-y-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-800">予約状況の色分け</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            {isAdminMode ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-400 rounded flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">○</div>
                  <span className="text-black">予約可能</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-400 rounded flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">■</div>
                  <span className="text-black">石原トレーナー予約済み</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-400 rounded flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">▲</div>
                  <span className="text-black">店舗間移動時間</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-rose-500 rounded flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">●</div>
                  <span className="text-black">店舗満室</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-600 rounded flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">▼</div>
                  <span className="text-black">予約不可</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-300 rounded flex items-center justify-center text-xs font-bold text-gray-700 drop-shadow-sm">-</div>
                  <span className="text-black">営業時間外</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-400 rounded flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">○</div>
                  <span className="text-black">予約可能</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-400 rounded flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">-</div>
                  <span className="text-black">予約不可</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* 時間外要望メッセージ */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-blue-900 mb-1">予約について</div>
              <div className="text-xs text-blue-800 leading-relaxed">
                ・営業時間：平日 9:00-21:30 / 土日祝 9:00-20:00<br/>
                ・予約開始：2ヶ月前の同日から予約可能<br/>
                ・時間外のご希望はLINEにて直接お問い合わせください
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-auto relative max-h-[80vh]">
        <div className={`grid text-sm min-w-max`} style={{
          gridTemplateColumns: `80px repeat(${days.length}, minmax(60px, 1fr))`
        }}>
          {/* Time column header */}
          <div className="sticky top-0 left-0 z-30 p-2 font-semibold text-center bg-white border-b border-r text-black">時間</div>
          
          {/* Date headers */}
          {days.map(day => {
            const dayOfWeek = day.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 日曜日(0) or 土曜日(6)
            const isHol = isHoliday(day);
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
            
            let dayColor = 'text-black'; // 平日
            if (dayOfWeek === 0 || isHol) dayColor = 'text-red-600'; // 日曜日・祝日
            if (dayOfWeek === 6) dayColor = 'text-blue-600'; // 土曜日
            
            return (
              <div key={day.toISOString()} className="sticky top-0 z-20 p-2 text-center bg-white border-b whitespace-nowrap">
                <div className="font-semibold text-black">{`${day.getMonth() + 1}/${day.getDate()}`}</div>
                <div className={`text-xs font-semibold ${dayColor}`}>{dayNames[dayOfWeek]}</div>
              </div>
            );
          })}

          {/* Time slots grid */}
          {timeLabels.map(time => (
            <React.Fragment key={time}>
              {/* Time label row */}
              <div className="sticky left-0 z-20 p-2 text-center bg-white border-b border-r whitespace-nowrap font-medium text-black">{time}</div>
              {/* TimeSlot components */}
              {days.map(day => {
                const dateStr = day.toISOString().split('T')[0];
                const isSelected = isAdminMode 
                  ? selectedSlot?.date.toISOString().split('T')[0] === dateStr && selectedSlot?.time === time
                  : selectedCells.some(cell => cell.date === dateStr && cell.time === time && cell.store === selectedStore);
                
                // 予約可能性をチェック
                const [hour, minute] = time.split(':').map(Number);
                const slotTime = new Date(day);
                slotTime.setHours(hour, minute, 0, 0);
                const availabilityResult = checkAvailability(slotTime, selectedStore, bookings);
                
                return (
                  <TimeSlot 
                    key={day.toISOString()}
                    date={day}
                    time={time}
                    bookings={bookings}
                    selectedStore={selectedStore}
                    isAdminMode={isAdminMode}
                    onClick={() => handleSlotClick(day, time, availabilityResult.isAvailable)}
                    isSelected={isSelected}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 詳細情報モーダル */}
      {selectedSlot && (
        <TimeSlotModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
          }}
          date={selectedSlot.date}
          time={selectedSlot.time}
          bookings={bookings}
          selectedStore={selectedStore}
        />
      )}
      </div>
    </div>
  );
};

export default BookingCalendar;
