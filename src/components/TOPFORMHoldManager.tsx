'use client';

import React, { useState, useEffect } from 'react';
import { isTOPFORMIshiharaBooking } from '../lib/booking-logic';

interface TOPFORMHoldEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  store?: string;
  room?: string;
  isIgnored: boolean;
  hasRealBooking: boolean;
}

interface TOPFORMHoldManagerProps {
  bookingData: {
    ishihara: Array<{
      id: string;
      title?: string;
      start: string;
      end: string;
      source?: string;
    }>;
    ebisu: Array<{
      id: string;
      title?: string;
      start: string;
      end: string;
      room?: string;
    }>;
    hanzoomon: Array<{
      id: string;
      title?: string;
      start: string;
      end: string;
    }>;
  } | null;
  onRefresh: () => void;
}

const TOPFORMHoldManager: React.FC<TOPFORMHoldManagerProps> = ({ bookingData, onRefresh }) => {
  const [topformHolds, setTopformHolds] = useState<TOPFORMHoldEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSettings, setSavedSettings] = useState<Record<string, boolean>>({});

  // 保存された設定を取得（localStorage使用）
  useEffect(() => {
    try {
      const saved = localStorage.getItem('topform-hold-settings');
      if (saved) {
        setSavedSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load TOPFORM hold settings from localStorage:', error);
    }
  }, []);

  // TOPFORM枠抑え予定を抽出・分析
  useEffect(() => {
    if (bookingData && Object.keys(savedSettings).length >= 0) {
      const allFacilityBookings = [
        ...bookingData.ebisu.map(b => ({ ...b, store: 'ebisu' as const })),
        ...bookingData.hanzoomon.map(b => ({ ...b, store: 'hanzoomon' as const }))
      ];

      // TOPFORM石原関連の枠抑え予定を抽出
      const topformEvents = allFacilityBookings
        .filter((event) => {
          const title = event.title || '';
          return isTOPFORMIshiharaBooking(title);
        })
        .map((event) => {
          // 同時刻に石原の実際の予約があるかチェック
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
          const hasRealBooking = bookingData.ishihara.some(ishiharaBooking => {
            if (ishiharaBooking.source !== 'work') return false;
            
            const bookingStart = new Date(ishiharaBooking.start);
            const bookingEnd = new Date(ishiharaBooking.end);
            
            // 重複チェック
            return eventStart < bookingEnd && eventEnd > bookingStart;
          });

          return {
            id: event.id,
            title: event.title || '(タイトルなし)',
            start: event.start,
            end: event.end,
            store: event.store,
            room: 'room' in event ? event.room : undefined,
            isIgnored: savedSettings[event.id] === true, // 保存された設定を反映、未設定時は通常動作
            hasRealBooking
          };
        });
      
      setTopformHolds(topformEvents);
    }
  }, [bookingData, savedSettings]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStoreDisplay = (store?: string, room?: string) => {
    if (store === 'ebisu') {
      return room ? `恵比寿-${room}` : '恵比寿';
    } else if (store === 'hanzoomon') {
      return '半蔵門';
    }
    return '不明';
  };

  const toggleHoldIgnore = async (eventId: string) => {
    setLoading(true);
    try {
      const event = topformHolds.find(e => e.id === eventId);
      if (!event) return;

      const newIsIgnored = !event.isIgnored;

      // localStorageに設定を保存
      const newSettings = {
        ...savedSettings,
        [eventId]: newIsIgnored
      };

      localStorage.setItem('topform-hold-settings', JSON.stringify(newSettings));

      // ローカル状態を更新
      setSavedSettings(newSettings);

      // カスタムイベントを発火してカレンダーに設定変更を通知
      window.dispatchEvent(new Event('topform-settings-changed'));

      setTopformHolds(prev =>
        prev.map(event =>
          event.id === eventId
            ? { ...event, isIgnored: newIsIgnored }
            : event
        )
      );

      // データを再取得
      onRefresh();
    } catch (error) {
      console.error('Failed to update TOPFORM hold status:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (topformHolds.length === 0) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">TOPFORM枠抑え管理</h3>
        <p className="text-gray-600 text-sm">TOPFORM石原の枠抑え予定がありません</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">TOPFORM枠抑え管理</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {topformHolds.map((event) => (
          <div key={event.id} className="bg-white p-3 rounded border">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{event.title}</div>
                <div className="text-sm text-gray-600">
                  {formatDateTime(event.start)} - {formatDateTime(event.end)}
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  {getStoreDisplay(event.store, event.room)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  event.hasRealBooking 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {event.hasRealBooking ? '実予約あり' : '実予約なし'}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  event.isIgnored 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {event.isIgnored ? '無視(予約可能)' : '通常動作'}
                </span>
              </div>
              
              <button
                onClick={() => toggleHoldIgnore(event.id)}
                disabled={loading}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  event.isIgnored
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? '...' : event.isIgnored ? '通常動作にする' : '無視する'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        <p>• 通常動作: 実予約がない場合のみ予約可能として判定</p>
        <p>• 無視: この枠抑えを常に無視して予約可能として判定</p>
        <p>• 実予約ありの場合は設定に関係なく予約不可となります</p>
      </div>
    </div>
  );
};

export default TOPFORMHoldManager;