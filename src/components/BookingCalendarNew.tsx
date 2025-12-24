'use client';

import React, { useState, useEffect } from 'react';
import { BookingData } from '../types/booking';
import { checkAvailability } from '../lib/booking-logic';
import TimeSlotNew from './TimeSlotNew';
import TimeSlotModal from './TimeSlotModal';
import BookingRequest from './BookingRequest';

interface BookingCalendarProps {
  selectedStore: 'ebisu' | 'hanzoomon';
  currentDate: Date;
  bookings: BookingData;
  isAdminMode: boolean;
}

const BookingCalendarNew: React.FC<BookingCalendarProps> = ({ selectedStore, currentDate, bookings, isAdminMode }) => {
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

  // 日付を月ごとにグループ化
  const groupedDays = days
    .filter(day => day >= todayDateOnly)
    .reduce((acc, day) => {
      const key = `${day.getFullYear()}年 ${day.getMonth() + 1}月`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(day);
      return acc;
    }, {} as Record<string, Date[]>);

  return (
    <div className="space-y-4 font-sans text-gray-600 bg-slate-50/50 p-1 md:p-8 rounded-2xl md:rounded-[3rem]">
      {/* 予約リクエスト欄（閲覧者モードのみ） */}
      {!isAdminMode && (
        <div className="bg-white/80 backdrop-blur rounded-[2rem] shadow-sm p-6 border border-white">
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
        </div>
      )}

      <div className="bg-white p-2 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-blue-100/50 border border-white">
        {/* カレンダーヘッダー */}
        <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-6">

          <div className="flex items-center gap-6">
            <button
              onClick={goToPreviousMonth}
              disabled={!canGoPrevious()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${canGoPrevious()
                ? 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 hover:scale-110 shadow-sm'
                : 'text-gray-200 cursor-not-allowed'
                }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-2">
                <span className="font-sans text-2xl">
                  {displayDate.getFullYear()}年 {displayDate.getMonth() + 1}月
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 tracking-widest uppercase mt-1">
                Ishihara Booking System
              </div>
            </div>

            <button
              onClick={goToNextMonth}
              disabled={!canGoNext()}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${canGoNext()
                ? 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 hover:scale-110 shadow-sm'
                : 'text-gray-200 cursor-not-allowed'
                }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-6 py-2.5 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all text-sm font-bold shadow-lg shadow-slate-200 hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Today
            </button>
          </div>
        </div>

        {/* 凡例 (Legend) - Wellness Style */}
        <div className="mb-4 flex flex-wrap gap-3 text-xs font-bold text-slate-700 bg-slate-50/80 p-2 rounded-2xl border border-slate-200 w-fit mx-auto md:mx-0">
          {isAdminMode ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm"><div className="w-3 h-3 rounded-md bg-emerald-500"></div> Available</div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm"><div className="w-3 h-3 rounded-full bg-amber-400"></div> Booked</div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm"><svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Travel</div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm"><span className="text-[10px] text-rose-500 font-extrabold tracking-wider">FULL</span> Full</div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm"><div className="w-2 h-2 rounded-full bg-gray-400"></div> N/A</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="w-4 h-4 rounded-md border-2 border-dashed border-blue-400 text-blue-600 flex items-center justify-center scale-90"></div>
                <span className="text-slate-800">予約可能</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                <span className="text-slate-800">予約不可</span>
              </div>
            </>
          )}
        </div>

        {/* 注意書き */}
        <div className="mb-4 p-5 bg-blue-50/40 rounded-2xl text-xs text-blue-800/80 leading-relaxed flex items-start gap-3 border border-blue-50">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <span className="font-bold block mb-1 text-blue-900">Information</span>
            営業時間: 平日 9:00-22:00 / 土日祝 9:00-20:00<br />
            ※ 時間外のご希望はLINEにて直接お問い合わせください。
          </div>
        </div>

        {/* グリッド本体 */}
        <div className="space-y-12">
          {Object.entries(groupedDays).map(([monthLabel, monthDays]) => (
            <div key={monthLabel} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-slate-800 mb-4 ml-1 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-sm shadow-blue-200"></span>
                {monthLabel}
              </h3>

              <div className="overflow-auto relative max-h-[85vh] custom-scrollbar rounded-2xl bg-white shadow-sm border border-slate-100">
                <div className={`grid text-sm min-w-max pb-4`} style={{
                  gridTemplateColumns: `70px repeat(${monthDays.length}, minmax(55px, 1fr))`,
                  gap: '1px' // グリッドの隙間を作る
                }}>
                  {/* Time column header */}
                  <div className="sticky top-0 left-0 z-30 py-4 px-2 text-[10px] font-bold text-slate-800 bg-white/95 backdrop-blur flex items-end justify-center tracking-widest uppercase rounded-tl-2xl border-b border-r border-slate-100">TIME</div>

                  {/* Date headers */}
                  {monthDays.map(day => {
                    const dayOfWeek = day.getDay();
                    const isHol = isHoliday(day);
                    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

                    const isDateActive = isAdminMode
                      ? selectedSlot?.date.toISOString().split('T')[0] === dateStr
                      : selectedCells.some(cell => cell.date === dateStr);

                    let headerClass = 'bg-white text-slate-600';
                    let dayNameClass = 'text-slate-400';
                    let dateNumClass = 'text-slate-800';

                    if (isDateActive) {
                      headerClass = 'bg-blue-500 text-white rounded-t-xl shadow-md z-30 transform scale-105 transition-all';
                      dayNameClass = 'text-blue-100';
                      dateNumClass = 'text-white';
                    } else if (dayOfWeek === 0 || isHol) {
                      headerClass = 'bg-rose-50/50 text-rose-600 rounded-t-xl';
                      dayNameClass = 'text-rose-600';
                    } else if (dayOfWeek === 6) {
                      headerClass = 'bg-blue-50/50 text-blue-600 rounded-t-xl';
                      dayNameClass = 'text-blue-600';
                    }

                    return (
                      <div key={day.toISOString()} className={`sticky top-0 z-20 py-3 px-1 text-center whitespace-nowrap transition-colors duration-200 ${headerClass}`}>
                        <div className={`text-[10px] font-bold mb-1 tracking-wider ${dayNameClass}`}>{dayNames[dayOfWeek]}</div>
                        <div className={`text-xl font-bold font-mono tracking-tight ${dateNumClass}`}>{day.getDate()}</div>
                      </div>
                    );
                  })}

                  {/* Time slots grid */}
                  {timeLabels.map(time => {
                    const isTimeActive = isAdminMode
                      ? selectedSlot?.time === time
                      : selectedCells.some(cell =>
                        cell.time === time &&
                        monthDays.some(d => {
                          const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          return dStr === cell.date;
                        })
                      );

                    const timeClass = isTimeActive
                      ? "bg-blue-500 text-white shadow-md scale-105 z-30 rounded-r-lg"
                      : "bg-white text-slate-800";

                    return (
                      <React.Fragment key={time}>
                        {/* Time label row */}
                        <div className={`sticky left-0 z-20 py-2 px-1 text-sm font-bold flex items-center justify-center font-mono transition-all duration-200 ${timeClass}`}>{time}</div>
                        {/* TimeSlot components */}
                        {monthDays.map(day => {
                          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                          const isSelected = isAdminMode
                            ? selectedSlot?.date.toISOString().split('T')[0] === dateStr && selectedSlot?.time === time
                            : selectedCells.some(cell => cell.date === dateStr && cell.time === time && cell.store === selectedStore);

                          return (
                            <TimeSlotNew
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
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
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

export default BookingCalendarNew;
