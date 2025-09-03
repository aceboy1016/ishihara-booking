'use client';

import { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import BookingCalendar from '../components/BookingCalendar';
import StoreFilter from '../components/StoreFilter';
import Spinner from '../components/Spinner';
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
    const sessionAuth = sessionStorage.getItem('isAuthenticated');
    const adminAuth = sessionStorage.getItem('isAdminAuthenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const fetchBookingData = async () => {
    try {
      setApiStatus('loading');
      const res = await fetch('/api/bookings', { cache: 'no-store' });
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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchBookingData();
    setIsRefreshing(false);
  };

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleAdminToggle = () => {
    if (!isAdminAuthenticated) {
      const password = prompt('管理者パスワードを入力してください:');
      if (password === '1234') {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        setIsAdminAuthenticated(true);
        setIsAdminMode(true);
      } else if (password !== null) {
        alert('パスワードが間違っています');
      }
    } else {
      setIsAdminMode(!isAdminMode);
    }
  };


  if (loading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

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
            <div className="bg-white p-3 rounded border">
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
