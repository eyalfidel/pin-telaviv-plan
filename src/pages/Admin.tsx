import Header from '@/components/Header';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { useAdminStore } from '@/store/adminStore';

export default function Admin() {
  const { isAuthenticated } = useAdminStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {isAuthenticated ? <AdminDashboard /> : <AdminLogin />}
    </div>
  );
}
