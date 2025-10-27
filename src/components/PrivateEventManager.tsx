'use client';

import React, { useState, useEffect } from 'react';

interface PrivateEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  isBlocked: boolean;
}

interface PrivateEventManagerProps {
  bookingData: {
    ishihara: Array<{
      id: string;
      title?: string;
      start: string;
      end: string;
      source?: string;
    }>;
  } | null;
  onRefresh: () => void;
}

const PrivateEventManager: React.FC<PrivateEventManagerProps> = ({ bookingData, onRefresh }) => {
  const [privateEvents, setPrivateEvents] = useState<PrivateEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSettings, setSavedSettings] = useState<Record<string, boolean>>({});

  // 保存された設定を取得（localStorage使用）
  useEffect(() => {
    try {
      const saved = localStorage.getItem('private-event-settings');
      if (saved) {
        setSavedSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (bookingData && Object.keys(savedSettings).length >= 0) {
      // プライベートカレンダー由来のイベントを抽出
      const events = bookingData.ishihara
        .filter((event) => event.source === 'private')
        .map((event) => ({
          id: event.id,
          title: event.title || '(タイトルなし)',
          start: event.start,
          end: event.end,
          isBlocked: savedSettings[event.id] !== false // 保存された設定を反映、未設定時はブロック
        }));
      
      setPrivateEvents(events);
    }
  }, [bookingData, savedSettings]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const toggleEventBlock = async (eventId: string) => {
    setLoading(true);
    try {
      const event = privateEvents.find(e => e.id === eventId);
      if (!event) return;

      const newIsBlocked = !event.isBlocked;

      // localStorageに設定を保存
      const newSettings = {
        ...savedSettings,
        [eventId]: newIsBlocked
      };

      localStorage.setItem('private-event-settings', JSON.stringify(newSettings));

      // ローカル状態を更新
      setSavedSettings(newSettings);

      setPrivateEvents(prev =>
        prev.map(event =>
          event.id === eventId
            ? { ...event, isBlocked: newIsBlocked }
            : event
        )
      );

      // データを再取得
      onRefresh();
    } catch (error) {
      console.error('Failed to update event status:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (privateEvents.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">プライベート予定管理</h3>
        <p className="text-gray-600 text-sm">プライベート予定がありません</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">プライベート予定管理</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {privateEvents.map((event) => (
          <div key={event.id} className="bg-white p-3 rounded border flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-800">{event.title}</div>
              <div className="text-sm text-gray-600">
                {formatDateTime(event.start)} - {formatDateTime(event.end)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                event.isBlocked 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {event.isBlocked ? '予約ブロック' : '無視'}
              </span>
              <button
                onClick={() => toggleEventBlock(event.id)}
                disabled={loading}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  event.isBlocked
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? '...' : event.isBlocked ? '無視にする' : 'ブロックする'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        <p>• ブロック: この時間帯は予約不可として表示</p>
        <p>• 無視: この予定は予約可能性の判定に影響しない</p>
      </div>
    </div>
  );
};

export default PrivateEventManager;