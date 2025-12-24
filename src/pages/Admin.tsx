import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SecureAdminDashboard from '@/components/SecureAdminDashboard';
import { useAuth } from '@/hooks/useAuth';

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SecureAdminDashboard />
    </div>
  );
}
