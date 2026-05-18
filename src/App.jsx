import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ReceptionRegisterPage = lazy(() => import('./pages/ReceptionRegisterPage'));
const DoctorSearchPage = lazy(() => import('./pages/DoctorSearchPage'));
const DoctorPatientPage = lazy(() => import('./pages/DoctorPatientPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AdminDoctorManagementPage = lazy(() => import('./pages/AdminDoctorManagementPage'));
const AdminUserManagementPage = lazy(() => import('./pages/AdminUserManagementPage'));

function HomeRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;
  if (profile?.role === 'receptionist') return <Navigate to="/reception" replace />;
  if (profile?.role === 'doctor') return <Navigate to="/doctor" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/doctors" element={<AdminDoctorManagementPage />} />
              <Route path="/admin/users" element={<AdminUserManagementPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['receptionist']} />}>
              <Route path="/reception" element={<Navigate to="/reception/register" replace />} />
              <Route path="/reception/register" element={<ReceptionRegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['doctor']} />}>
              <Route path="/doctor" element={<Navigate to="/doctor/search" replace />} />
              <Route path="/doctor/search" element={<DoctorSearchPage />} />
              <Route path="/doctor/patient/:patientId" element={<DoctorPatientPage />} />
            </Route>
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
