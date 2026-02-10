import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminProfilePage from './pages/admin/ProfilePage';
import AdminCustomersPage from './pages/admin/CustomersPage';
import AdminProjectsPage from './pages/admin/ProjectsPage';
import AdminTasksPage from './pages/admin/TasksPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import AdminBackupPage from './pages/admin/BackupPage';

// Customer Pages
import CustomerDashboardPage from './pages/customer/DashboardPage';
import CustomerProjectsPage from './pages/customer/ProjectsPage';
import CustomerTasksPage from './pages/customer/TasksPage';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'customer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
}) => {
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
              <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />

              {/* Main Application Routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<></>} />

                {/* Admin Routes */}
                <Route path="admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/customers" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminCustomersPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/projects" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminProjectsPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/tasks" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminTasksPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/reports" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/backup" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminBackupPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/profile" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminProfilePage />
                  </ProtectedRoute>
                } />

                {/* Customer Routes */}
                <Route path="customer" element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="customer/projects" element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerProjectsPage />
                  </ProtectedRoute>
                } />
                <Route path="customer/tasks" element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerTasksPage />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
