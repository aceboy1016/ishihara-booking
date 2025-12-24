'use client';

import { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import BookingCalendarNew from '../components/BookingCalendarNew';
import StoreFilter from '../components/StoreFilter';
import Spinner from '../components/Spinner';
import PrivateEventManager from '../components/PrivateEventManager';
import TOPFORMHoldManager from '../components/TOPFORMHoldManager';
import { BookingData } from '../types/booking';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<'ebisu' | 'hanzoomon'>('ebisu');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string, role: string, loginTime: string } | null>(null);
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

    const userData = sessionStorage.getItem('adminUser');
    if (userData) {
      try {
        setAdminUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse admin user data:', error);
      }
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

  const handleLoginSuccess = (userData?: { name: string, role: string, loginTime: string }) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    if (userData) {
      sessionStorage.setItem('adminUser', JSON.stringify(userData));
      setAdminUser(userData);
    }
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
              if (data.user) {
                sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                setAdminUser(data.user);
              }
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
      // 管理者モードを終了
      if (isAdminMode) {
        sessionStorage.removeItem('isAdminAuthenticated');
        sessionStorage.removeItem('adminUser');
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      }
      setIsAdminMode(!isAdminMode);
    }
  };


  if (loading) {
    return <Spinner />;
  }

  return (
    <main className="container mx-auto px-1 md:px-4 py-4 md:py-8 bg-slate-50 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-4 sm:mb-0">
          予約早見表（石原）
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleAdminToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${isAdminMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
            >
              {isAdminMode ? '管理者モード' : '閲覧者モード'}
            </button>
            {isAdminMode && adminUser && (
              <div className="text-xs text-center">
                <div className="text-blue-600 font-medium">👤 {adminUser.name} ({adminUser.role})</div>
                <div className="text-gray-500">
                  {new Date(adminUser.loginTime).toLocaleString('ja-JP')}
                </div>
              </div>
            )}
          </div>
          <StoreFilter selectedStore={selectedStore} setSelectedStore={setSelectedStore} />
        </div>
      </header>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md">Error: {error}</p>}

      {/* 管理者データ管理パネル */}
      {isAdminMode && (
        <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold mb-4 text-slate-700">データ管理パネル</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* APIステータス */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">API Status</div>
              <div className={`flex items-center gap-2 ${apiStatus === 'success' ? 'text-emerald-600' :
                apiStatus === 'error' ? 'text-rose-600' : 'text-amber-600'
                }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${apiStatus === 'success' ? 'bg-emerald-500' :
                  apiStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}></div>
                <span className="font-bold text-lg">
                  {apiStatus === 'success' ? 'Running' :
                    apiStatus === 'error' ? 'Error' : 'Loading...'}
                </span>
              </div>
            </div>

            {/* 最終更新時刻 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Last Update</div>
              <div className="font-bold text-lg text-slate-700">
                {lastRefreshTime ? lastRefreshTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </div>
            </div>

            {/* 予約データ統計 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Bookings</div>
              <div className="font-bold text-lg text-slate-700">
                {bookingData ?
                  `${bookingData.ishihara.length}` :
                  '0'
                } <span className="text-xs font-normal text-slate-400">items</span>
              </div>
            </div>

            {/* 手動更新ボタン */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`w-full px-3 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${isRefreshing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
                  }`}
              >
                {isRefreshing ? 'Updating...' : 'Refresh Data'}
              </button>
            </div>

            {/* データデバッグ (Ishihara Calendar) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-2">
              <details className="bg-slate-50 p-4 rounded-xl border border-slate-100 group">
                <summary className="font-bold text-slate-700 cursor-pointer list-none flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs">DEBUG</span>
                  カレンダーデータ確認
                  <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-4 max-h-96 overflow-auto text-xs font-mono bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
                  <p className="mb-2 text-slate-400">※ 直近の石原カレンダー予定 (Private/Work)</p>
                  {bookingData?.ishihara
                    .filter(b => new Date(b.start) >= new Date()) // 未来のみ
                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                    .slice(0, 50) // 最大50件
                    .map(b => (
                      <div key={b.id} className="border-b border-gray-100 py-2 hover:bg-slate-50">
                        <span className="text-blue-600 font-bold">[{new Date(b.start).toLocaleDateString()} {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                        <span className="ml-2 font-bold text-slate-700">{b.title || '(No Title)'}</span>
                        <span className="ml-2 text-gray-400 text-[10px] bg-gray-100 px-1 rounded">{b.source}</span>
                      </div>
                    ))
                  }
                  {(!bookingData?.ishihara || bookingData.ishihara.length === 0) && (
                    <div className="text-gray-400 italic">No data available</div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* プライベート予定管理（管理者モードのみ） */}
      {isAdminMode && bookingData && (
        <div className="mb-8 space-y-6">
          <PrivateEventManager
            bookingData={bookingData}
            onRefresh={handleManualRefresh}
          />
          <TOPFORMHoldManager
            bookingData={bookingData}
            onRefresh={handleManualRefresh}
          />
        </div>
      )}

      {bookingData ? (
        <BookingCalendarNew
          selectedStore={selectedStore}
          currentDate={new Date()}
          bookings={bookingData}
          isAdminMode={isAdminMode}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Spinner />
          <p className="text-slate-400 animate-pulse font-medium">Loading Schedule...</p>
        </div>
      )}

      <footer className="text-center text-slate-400 mt-12 mb-8 text-sm">
        <p>Last Sync: {bookingData ? new Date(bookingData.lastUpdate).toLocaleString('ja-JP') : 'N/A'}</p>
      </footer>
    </main>
  );
}
