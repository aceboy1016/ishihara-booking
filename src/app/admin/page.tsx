'use client';

import Spinner from '../../components/Spinner';

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
      fetch('/api/bookings')
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
