'use client';

import React, { useState, useEffect } from 'react';
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
  const [privateEventSettings, setPrivateEventSettings] = useState<Record<string, boolean>>({});
  const [topformHoldSettings, setTopformHoldSettings] = useState<Record<string, boolean>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // プライベート予定設定とTOPFORM枠抑え設定を取得
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('🔄 Loading event settings...');
        setSettingsLoaded(false);

        // localStorageからプライベート予定設定を読み込み
        try {
          const saved = localStorage.getItem('private-event-settings');
          if (saved) {
            const parsedSettings = JSON.parse(saved);
            setPrivateEventSettings(parsedSettings);
            console.log('✅ Private event settings loaded from localStorage:', Object.keys(parsedSettings).length, 'items');
          }
        } catch (error) {
          console.error('Failed to load private event settings from localStorage:', error);
        }

        // localStorageからTOPFORM枠抑え設定を読み込み
        try {
          const savedTopform = localStorage.getItem('topform-hold-settings');
          if (savedTopform) {
            const parsedTopformSettings = JSON.parse(savedTopform);
            setTopformHoldSettings(parsedTopformSettings);
            console.log('✅ TOPFORM hold settings loaded from localStorage:', Object.keys(parsedTopformSettings).length, 'items');
          }
        } catch (error) {
          console.error('Failed to load TOPFORM hold settings from localStorage:', error);
        }

        setSettingsLoaded(true);
        console.log('🎯 All event settings loaded successfully');
      } catch (error) {
        console.error('Failed to load event settings:', error);
        setSettingsLoaded(true); // Still allow rendering with default settings
      }
    };

    fetchSettings();

    // localStorageの変更を監視
    const handleStorageChange = () => {
      fetchSettings();
    };

    window.addEventListener('storage', handleStorageChange);
    // 同一タブ内でのlocalStorage変更も監視
    window.addEventListener('private-settings-changed', handleStorageChange);
    window.addEventListener('topform-settings-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('private-settings-changed', handleStorageChange);
      window.removeEventListener('topform-settings-changed', handleStorageChange);
    };
  }, [bookings]); // bookingsが変更されたときに設定も再取得

  // 現在日から2ヶ月先までの期間設定
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // 時刻を00:00:00にリセット
  const twoMonthsLater = new Date(today);
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

  // 当日以降から表示
  const startOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
  const endOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);

  // 表示開始日を決定（当日 or 月の1日の遅い方）
  const startDate = new Date(Math.max(todayDateOnly.getTime(), startOfMonth.getTime()));

  // 表示する日数を計算
  const totalDays = Math.ceil((endOfMonth.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
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
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
    <div className="space-y-6 font-sans">
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

      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        {/* カレンダーヘッダー */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-xl">
            <button
              onClick={goToPreviousMonth}
              disabled={!canGoPrevious()}
              className={`p-2 rounded-lg transition-all ${canGoPrevious()
                ? 'hover:bg-white hover:shadow-sm text-gray-600'
                : 'text-gray-300 cursor-not-allowed'
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="font-bold text-lg text-gray-800 min-w-[140px] text-center tracking-wide">
              {displayDate.getFullYear()}年 <span className="text-2xl">{displayDate.getMonth() + 1}</span>月
            </div>

            <button
              onClick={goToNextMonth}
              disabled={!canGoNext()}
              className={`p-2 rounded-lg transition-all ${canGoNext()
                ? 'hover:bg-white hover:shadow-sm text-gray-600'
                : 'text-gray-300 cursor-not-allowed'
                }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md shadow-blue-200"
          >
            今日へ移動
          </button>
        </div>

        {/* 凡例 (Legend) */}
        <div className="mb-6 flex flex-wrap gap-6 text-xs font-medium text-gray-600 bg-gray-50/80 p-4 rounded-xl border border-gray-100/50">
          {isAdminMode ? (
            <>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> 予約可能</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div> 予約済み</div>
              <div className="flex items-center gap-2"><svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> 移動</div>
              <div className="flex items-center gap-2"><span className="px-1 py-0.5 bg-rose-500 text-white text-[9px] rounded font-bold">FULL</span> 満室</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-500"></div> 予約不可</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-blue-400 text-blue-500 flex items-center justify-center scale-75"></div>
                <span>予約可能</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <span>予約不可</span>
              </div>
            </>
          )}
        </div>

        {/* 注意書き */}
        <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <span className="font-bold block mb-1">ご予約について</span>
            平日 9:00-22:00 / 土日祝 9:00-20:00<br />
            時間外のご希望はLINEにて直接お問い合わせください。
          </div>
        </div>

        {/* グリッド本体 */}
        <div className="overflow-auto relative max-h-[75vh] custom-scrollbar border border-gray-100 rounded-lg shadow-inner bg-gray-50/30">
          <div className={`grid text-sm min-w-max`} style={{
            gridTemplateColumns: `70px repeat(${days.length}, minmax(55px, 1fr))`
          }}>
            {/* Time column header */}
            <div className="sticky top-0 left-0 z-30 py-3 px-2 text-xs font-bold text-gray-400 bg-gray-50/90 backdrop-blur border-b border-r border-gray-200 flex items-end justify-center">TIME</div>

            {/* Date headers */}
            {days.filter(day => day >= todayDateOnly).map(day => {
              const dayOfWeek = day.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isHol = isHoliday(day);
              const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

              let headerClass = 'bg-white text-gray-800';
              let dayNameClass = 'text-gray-400';

              if (dayOfWeek === 0 || isHol) {
                headerClass = 'bg-red-50/50 text-red-600';
                dayNameClass = 'text-red-400';
              } else if (dayOfWeek === 6) {
                headerClass = 'bg-blue-50/50 text-blue-600';
                dayNameClass = 'text-blue-400';
              }

              return (
                <div key={day.toISOString()} className={`sticky top-0 z-20 py-3 px-1 text-center border-b border-gray-100 whitespace-nowrap ${headerClass}`}>
                  <div className={`text-[10px] font-bold mb-1 tracking-wider ${dayNameClass}`}>{dayNames[dayOfWeek]}</div>
                  <div className="text-xl font-bold font-mono">{day.getDate()}</div>
                </div>
              );
            })}

            {/* Time slots grid */}
            {timeLabels.map(time => (
              <React.Fragment key={time}>
                {/* Time label row */}
                <div className="sticky left-0 z-20 py-2 px-1 text-xs font-semibold text-gray-500 bg-gray-50/90 backdrop-blur border-b border-r border-gray-200 flex items-center justify-center font-mono">{time}</div>
                {/* TimeSlot components */}
                {days.filter(day => day >= todayDateOnly).map(day => {
                  const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const isSelected = isAdminMode
                    ? selectedSlot?.date.toISOString().split('T')[0] === dateStr && selectedSlot?.time === time
                    : selectedCells.some(cell => cell.date === dateStr && cell.time === time && cell.store === selectedStore);

                  return (
                    <TimeSlot
                      key={day.toISOString()}
                      date={day}
                      time={time}
                      bookings={bookings}
                      selectedStore={selectedStore}
                      isAdminMode={isAdminMode}
                      onClick={() => {
                        const slotTime = new Date(day);
                        const [h, m] = time.split(':').map(Number);
                        slotTime.setHours(h, m, 0, 0);

                        // Check availability again for click handler context if needed, 
                        // but TimeSlot component handles the click allowance based on props.
                        // We just pass the handler.
                        // But we need to know if it's available to allow click in handleSlotClick?
                        // handleSlotClick checks availability inside logic? No, it takes isAvailable arg.
                        // We need to pass isAvailable from here or calculate inside handleSlotClick.
                        // Current handleSlotClick implementation takes isAvailable as 3rd arg.
                        // Let's calculate it here properly.

                        const availabilityResult = settingsLoaded
                          ? checkAvailability(slotTime, selectedStore, bookings, privateEventSettings, topformHoldSettings)
                          : { isAvailable: false, reason: 'unavailable_block' as const };

                        handleSlotClick(day, time, availabilityResult.isAvailable);
                      }}
                      isSelected={isSelected}
                      privateEventSettings={privateEventSettings}
                      topformHoldSettings={topformHoldSettings}
                      selectedSlot={isAdminMode ? selectedSlot : null}
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
            date={selectedSlot!.date}
            time={selectedSlot!.time}
            bookings={bookings}
            selectedStore={selectedStore}
          />
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;
