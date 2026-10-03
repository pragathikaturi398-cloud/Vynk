import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ComplaintDetailPage } from './pages/student/ComplaintDetailPage';
import { MaintenanceDashboard } from './pages/maintenance/MaintenanceDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ComplaintsTablePage } from './pages/admin/ComplaintsTablePage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { AuditPage } from './pages/admin/AuditPage';
import { SuperAdminPortal } from './pages/admin/SuperAdminPortal';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isAuthScreen = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {!isAuthScreen && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Complaint Details (Shared across roles) */}
          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute>
                <ComplaintDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Maintenance Staff Routes */}
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute allowedRoles={['MAINTENANCE', 'SUPERADMIN']}>
                <MaintenanceDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin & Warden Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['WARDEN', 'SUPERADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['WARDEN', 'SUPERADMIN']}>
                <ComplaintsTablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['WARDEN', 'SUPERADMIN']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['WARDEN', 'SUPERADMIN']}>
                <AuditPage />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Command Center */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                <SuperAdminPortal />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
