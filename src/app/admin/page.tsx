'use client';

import { useState, useEffect } from 'react';
import Spinner from '../../components/Spinner';
import LoginForm from '../../components/LoginForm';
import AdminPanel from '../../components/AdminPanel';

interface BookingData {
  lastUpdate: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('isAuthenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetch(`/api/bookings?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
        .then(res => res.json())
        .then(data => setBookingData(data));
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  if (loading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      {bookingData ? (
        <AdminPanel lastUpdate={bookingData.lastUpdate} />
      ) : (
        <Spinner />
      )}
    </main>
  );
}
