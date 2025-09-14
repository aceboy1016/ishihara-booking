'use client';

import React, { useState, useEffect } from 'react';
import PrivateEventManager from './PrivateEventManager';
import TOPFORMHoldManager from './TOPFORMHoldManager';

interface AdminPanelProps {
  lastUpdate: string;
  // In the future, we can pass more props like sync status, errors, etc.
}

const AdminPanel: React.FC<AdminPanelProps> = ({ lastUpdate }) => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 予約データを取得
  useEffect(() => {
    fetchBookingData();
  }, []);

  const fetchBookingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      setBookingData(data);
    } catch (error) {
      console.error('Failed to fetch booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = () => {
    alert('手動更新機能は現在開発中です。');
  };

  const handlePasswordChange = () => {
    alert('パスワード変更機能は現在開発中です。');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">管理画面</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">システムの稼働状況を確認し、設定を変更します。</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-600">
          <dl>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">最終更新時刻</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {new Date(lastUpdate).toLocaleString('ja-JP')}
              </dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">カレンダー同期</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  正常 (モックデータ)
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">システム稼働状況</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  正常
                </span>
              </dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 items-center">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">手動更新</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <button onClick={handleManualUpdate} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  今すぐ更新
                </button>
              </dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 items-center">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">パスワード</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <button onClick={handlePasswordChange} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  パスワード変更
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 予約データが読み込まれた場合のみ管理機能を表示 */}
      {bookingData && (
        <div className="mt-6 space-y-6">
          <PrivateEventManager 
            bookingData={bookingData} 
            onRefresh={fetchBookingData}
          />
          <TOPFORMHoldManager 
            bookingData={bookingData} 
            onRefresh={fetchBookingData}
          />
        </div>
      )}

      {/* ローディング状態の表示 */}
      {loading && (
        <div className="mt-6 text-center text-gray-500">
          データを読み込み中...
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
