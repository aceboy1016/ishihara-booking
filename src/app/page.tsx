'use client';

import { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import BookingCalendar from '../components/BookingCalendar';
import StoreFilter from '../components/StoreFilter';
import Spinner from '../components/Spinner';
import PrivateEventManager from '../components/PrivateEventManager';
import { BookingData } from '../types/booking';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<'ebisu' | 'hanzoomon'>('ebisu');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [apiStatus, setApiStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [apiErrorLog, setApiErrorLog] = useState<string[]>([]);

  useEffect(() => {
    // 閲覧者モードは常に認証済み
    setIsAuthenticated(true);
    
    const adminAuth = sessionStorage.getItem('isAdminAuthenticated');
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const fetchBookingData = async () => {
    try {
      setApiStatus('loading');
      const res = await fetch(`/api/bookings?t=${Date.now()}&r=${Math.random()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch booking data`);
      }
      const data = await res.json();
      setBookingData(data);
      setApiStatus('success');
      setLastRefreshTime(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setApiStatus('error');
      setApiErrorLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${errorMessage}`]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookingData();
    }
  }, [isAuthenticated]);

  // 5分おきの自動更新
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchBookingData();
    }, 5 * 60 * 1000); // 5分 = 300,000ミリ秒

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchBookingData();
    setIsRefreshing(false);
  };

  const handleForceReload = () => {
    window.location.reload();
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleAdminToggle = async () => {
    if (!isAdminAuthenticated) {
      const password = prompt('管理者パスワードを入力してください:');
      if (password) {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.isAdmin) {
              sessionStorage.setItem('isAdminAuthenticated', 'true');
              setIsAdminAuthenticated(true);
              setIsAdminMode(true);
            }
          } else {
            alert('パスワードが間違っています');
          }
        } catch (error) {
          alert('認証中にエラーが発生しました');
        }
      }
    } else {
      setIsAdminMode(!isAdminMode);
    }
  };


  if (loading) {
    return <Spinner />;
  }

  // 閲覧者モードは常に認証済みなので、ログインフォームは不要

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">
          石原トレーナー 予約早見表
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleAdminToggle}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isAdminMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isAdminMode ? '管理者モード' : '閲覧者モード'}
          </button>
          <StoreFilter selectedStore={selectedStore} setSelectedStore={setSelectedStore} />
        </div>
      </header>
      
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md">Error: {error}</p>}

      {/* 管理者データ管理パネル */}
      {isAdminMode && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-4 text-blue-800">データ管理パネル</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* APIステータス */}
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600 mb-1">API状況</div>
              <div className={`flex items-center gap-2 ${
                apiStatus === 'success' ? 'text-green-600' :
                apiStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'success' ? 'bg-green-500' :
                  apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="font-medium">
                  {apiStatus === 'success' ? '正常' :
                   apiStatus === 'error' ? 'エラー' : '読込中'}
                </span>
              </div>
            </div>

            {/* 最終更新時刻 */}
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600 mb-1">最終更新</div>
              <div className="font-medium text-gray-800">
                {lastRefreshTime ? lastRefreshTime.toLocaleTimeString('ja-JP') : 'なし'}
              </div>
            </div>

            {/* 予約データ統計 */}
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600 mb-1">予約データ</div>
              <div className="font-medium text-gray-800">
                {bookingData ? 
                  `石原: ${bookingData.ishihara.length}件` : 
                  'なし'
                }
              </div>
            </div>

            {/* 手動更新ボタン */}
            <div className="bg-white p-3 rounded border space-y-2">
              <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`w-full px-3 py-2 rounded font-medium transition-colors ${
                  isRefreshing 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRefreshing ? '更新中...' : 'データ更新'}
              </button>
              <button 
                onClick={handleForceReload}
                className="w-full px-3 py-2 rounded font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                🔄 強制リロード
              </button>
            </div>
          </div>

          {/* エラーログ */}
          {apiErrorLog.length > 0 && (
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600 mb-2">エラーログ (最新10件)</div>
              <div className="max-h-32 overflow-y-auto">
                {apiErrorLog.slice(-10).reverse().map((log, index) => (
                  <div key={index} className="text-xs text-red-600 mb-1 font-mono">
                    {log}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setApiErrorLog([])}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                ログをクリア
              </button>
            </div>
          )}
        </div>
      )}

      {/* プライベート予定管理（管理者モードのみ） */}
      {isAdminMode && bookingData && (
        <div className="mb-6">
          <PrivateEventManager 
            bookingData={bookingData}
            onRefresh={handleManualRefresh}
          />
        </div>
      )}
      
      {bookingData ? (
        <BookingCalendar 
          selectedStore={selectedStore} 
          currentDate={new Date()} 
          bookings={bookingData}
          isAdminMode={isAdminMode}
        />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
          <p className="ml-4">Loading booking data...</p>
        </div>
      )}

      <footer className="text-center text-gray-500 mt-8">
        <p>最終更新: {bookingData ? new Date(bookingData.lastUpdate).toLocaleString('ja-JP') : 'N/A'}</p>
      </footer>
    </main>
  );
}
