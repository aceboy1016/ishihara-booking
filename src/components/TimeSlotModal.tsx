'use client';

import React from 'react';
import { BookingData } from '../types/booking';
import { checkAvailability } from '../lib/booking-logic';

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  time: string;
  bookings: BookingData;
  selectedStore: 'ebisu' | 'hanzoomon';
}

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({ 
  isOpen, 
  onClose, 
  date, 
  time, 
  bookings, 
  selectedStore 
}) => {
  if (!isOpen) return null;

  const [hour, minute] = time.split(':').map(Number);
  const slotTime = new Date(date);
  slotTime.setHours(hour, minute, 0, 0);
  const slotEndTime = new Date(slotTime.getTime() + 60 * 60000);

  const result = checkAvailability(slotTime, selectedStore, bookings);

  // 石原の予約をチェック
  const conflictingIshiharaBookings = bookings.ishihara.filter(booking => {
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    return slotTime < bookingEnd && slotEndTime > bookingStart;
  });

  // 店舗の予約をチェック
  const storeBookings = selectedStore === 'ebisu' ? bookings.ebisu : bookings.hanzoomon;
  const conflictingStoreBookings = storeBookings.filter(booking => {
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    return slotTime < bookingEnd && slotEndTime > bookingStart;
  });

  // 移動時間制約をチェック
  const travelConflicts = bookings.ishihara.filter(booking => {
    if (!booking.store || booking.store === selectedStore) return false;
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    const travelWindowStart = new Date(slotTime.getTime() - 60 * 60000);
    const travelWindowEnd = new Date(slotTime.getTime() + 120 * 60000);
    return bookingStart < travelWindowEnd && bookingEnd > travelWindowStart;
  });

  // 予約不可ブロックをチェック
  const unavailableBlocks = bookings.ishihara.filter(booking => {
    if (!booking.title || !booking.title.includes('予約不可')) return false;
    const bookingStart = new Date(booking.start);
    const bookingEnd = new Date(booking.end);
    return slotTime < bookingEnd && slotEndTime > bookingStart;
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {formatDate(date)} {time} の詳細情報
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* 予約可能性 */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-800">予約状況</h3>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${
                result.isAvailable 
                  ? 'bg-emerald-400' 
                  : result.reason === 'trainer_busy' 
                    ? 'bg-amber-400'
                    : result.reason === 'travel_conflict'
                    ? 'bg-blue-400'
                    : result.reason === 'store_full'
                    ? 'bg-rose-500'
                    : result.reason === 'unavailable_block'
                    ? 'bg-gray-600'
                    : 'bg-slate-300'
              }`}></div>
              <span className="font-medium text-black">
                {result.isAvailable ? '予約可能' : '予約不可'}
              </span>
              {!result.isAvailable && (
                <span className="text-sm text-gray-600">
                  - {result.reason === 'trainer_busy' && '石原トレーナー予約済み'}
                  {result.reason === 'travel_conflict' && '店舗間移動時間'}
                  {result.reason === 'store_full' && '店舗満室'}
                  {result.reason === 'unavailable_block' && '予約不可時間帯'}
                  {result.reason === 'outside_hours' && '営業時間外'}
                </span>
              )}
            </div>
          </div>

          {/* 石原トレーナーの予約 */}
          {conflictingIshiharaBookings.length > 0 && (
            <div className="p-4 border rounded-lg bg-amber-50">
              <h3 className="font-semibold mb-2 text-gray-800">石原トレーナーの予約</h3>
              {conflictingIshiharaBookings.map((booking, index) => (
                <div key={index} className="mb-2 p-2 bg-white rounded border">
                  <div className="font-medium text-black">{booking.title}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(new Date(booking.start))} - {formatTime(new Date(booking.end))}
                    {booking.store && (
                      <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
                        {booking.store === 'ebisu' ? '恵比寿店' : '半蔵門店'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 予約不可ブロック */}
          {unavailableBlocks.length > 0 && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-2 text-gray-800">予約不可時間帯</h3>
              <p className="text-sm text-gray-600 mb-2">
                以下の理由により予約を受け付けることができません：
              </p>
              {unavailableBlocks.map((booking, index) => (
                <div key={index} className="mb-2 p-2 bg-white rounded border">
                  <div className="font-medium text-black">{booking.title}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(new Date(booking.start))} - {formatTime(new Date(booking.end))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 移動時間制約 */}
          {travelConflicts.length > 0 && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-2 text-gray-800">店舗間移動時間制約</h3>
              <p className="text-sm text-gray-600 mb-2">
                以下の予約により、店舗間の移動時間（60分）が必要です：
              </p>
              {travelConflicts.map((booking, index) => (
                <div key={index} className="mb-2 p-2 bg-white rounded border">
                  <div className="font-medium text-black">{booking.title}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(new Date(booking.start))} - {formatTime(new Date(booking.end))}
                    <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
                      {booking.store === 'ebisu' ? '恵比寿店' : '半蔵門店'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 店舗の予約状況 */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-800">
              {selectedStore === 'ebisu' ? '恵比寿店' : '半蔵門店'}の予約状況
            </h3>
            
            {selectedStore === 'ebisu' && (
              <div className="mb-2">
                <div className="text-sm text-gray-600">
                  個室A: {conflictingStoreBookings.some(b => b.room === 'A') ? '予約済み' : '空き'}
                  　個室B: {conflictingStoreBookings.some(b => b.room === 'B') ? '予約済み' : '空き'}
                </div>
              </div>
            )}

            {selectedStore === 'hanzoomon' && (
              <div className="mb-2">
                <div className="text-sm text-gray-600">
                  利用状況: {conflictingStoreBookings.length}/3枠
                </div>
              </div>
            )}

            {conflictingStoreBookings.length > 0 ? (
              conflictingStoreBookings.map((booking, index) => (
                <div key={index} className="mb-2 p-2 bg-gray-50 rounded border">
                  <div className="font-medium text-black">{booking.title}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(new Date(booking.start))} - {formatTime(new Date(booking.end))}
                    {booking.room && (
                      <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
                        {booking.room}室
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">この時間帯に予約はありません</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotModal;