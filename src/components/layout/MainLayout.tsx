import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from './AdminLayout';
import CustomerLayout from './CustomerLayout';
import AuthLayout from './AuthLayout';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading, isAdmin, isCustomer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && location.pathname === '/') {
      if (isAdmin) {
        navigate('/admin');
      } else if (isCustomer) {
        navigate('/customer');
      }
    } else if (!loading && !user && location.pathname !== '/login' && location.pathname !== '/forgot-password') {
      navigate('/login');
    }
  }, [loading, user, isAdmin, isCustomer, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthLayout>
        <Outlet />
      </AuthLayout>
    );
  }

  if (user.role && user.role.toLowerCase() === 'admin') {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    );
  }

  return (
    <CustomerLayout>
      <Outlet />
    </CustomerLayout>
  );
};

export default MainLayout;
