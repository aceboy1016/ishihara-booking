'use client';

import React, { useState } from 'react';

interface BookingRequestProps {
  selectedSlots: Array<{ date: Date; time: string; store: 'ebisu' | 'hanzoomon' }>;
  onClearAll?: () => void;
  onRemoveSlot?: (index: number) => void;
}

const BookingRequest: React.FC<BookingRequestProps> = ({ 
  selectedSlots, 
  onClearAll,
  onRemoveSlot
}) => {
  const [copied, setCopied] = useState(false);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}/${month}/${day}(${weekday})`;
  };

  const formatTime = (time: string) => {
    return `${time}〜${parseInt(time.split(':')[0]) + 1}:${time.split(':')[1]}`;
  };

  const getStoreDisplayName = (store: 'ebisu' | 'hanzoomon') => {
    return store === 'ebisu' ? '恵比寿' : '半蔵門';
  };

  // 日付順にソートしたスロット
  const sortedSlots = [...selectedSlots].sort((a, b) => {
    const dateA = new Date(a.date.getTime());
    const dateB = new Date(b.date.getTime());
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    // 同じ日の場合は時間順
    return a.time.localeCompare(b.time);
  });

  const generateMessage = () => {
    if (sortedSlots.length === 0) return '';
    
    if (sortedSlots.length === 1) {
      const slot = sortedSlots[0];
      return `【予約希望】
${formatDate(slot.date)} ${formatTime(slot.time)} @${getStoreDisplayName(slot.store)}

上記の時間で石原トレーナーのパーソナルトレーニング予約は可能でしょうか？
よろしくお願いいたします。`;
    } else {
      const slotList = sortedSlots
        .map((slot) => `・${formatDate(slot.date)} ${formatTime(slot.time)} @${getStoreDisplayName(slot.store)}`)
        .join('\n');
      
      return `【予約希望】
${slotList}

上記候補の中で石原トレーナーのパーソナルトレーニング予約が可能な日時はございますでしょうか？
よろしくお願いいたします。`;
    }
  };

  const handleCopy = async () => {
    const message = generateMessage();
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };


  if (selectedSlots.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <h3 className="font-semibold text-blue-900">予約リクエスト</h3>
        </div>
        <p className="text-sm text-blue-700">
          カレンダーから希望の日時を選択してください。<br/>
          複数の候補日時を選択することも可能です。<br/>
          選択後、LINEで簡単に予約リクエストを送信できます。
        </p>
      </div>
    );
  }

  const message = generateMessage();

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <h3 className="font-semibold text-blue-900">予約リクエスト</h3>
      </div>

      <div className="bg-white rounded-lg p-3 mb-3 border">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-800">
            選択した日時（{selectedSlots.length}件）：
          </div>
          {onClearAll && selectedSlots.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              すべてクリア
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {sortedSlots.map((slot, sortedIndex) => {
            // 元の配列でのインデックスを見つける
            const originalIndex = selectedSlots.findIndex(s => 
              s.date.getTime() === slot.date.getTime() && 
              s.time === slot.time && 
              s.store === slot.store
            );
            const selectionOrder = selectedSlots.findIndex(s => 
              s.date.getTime() === slot.date.getTime() && 
              s.time === slot.time && 
              s.store === slot.store
            ) + 1;
            
            return (
              <div key={sortedIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {selectionOrder}
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">
                      {formatDate(slot.date)} {formatTime(slot.time)} @{getStoreDisplayName(slot.store)}
                    </div>
                  </div>
                </div>
                {onRemoveSlot && (
                  <button
                    onClick={() => onRemoveSlot(originalIndex)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                    title="この予約候補を削除"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 mb-4 border">
        <div className="text-sm font-medium text-gray-800 mb-2">LINEメッセージ内容：</div>
        <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-2 rounded border">
          {message}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleCopy}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            copied 
              ? 'bg-green-500 text-white' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {copied ? '✓ コピー完了' : '□ コピー'}
        </button>
      </div>
    </div>
  );
};

export default BookingRequest;