import { NavLink, Outlet } from 'react-router-dom';
import { Activity, LayoutDashboard, LogOut, Search, Shield, Stethoscope, UserCog, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { profile, logout } = useAuth();
  const role = profile?.role || '';
  const normalizedRole = String(role).toLowerCase();
  const displayName = profile?.name || profile?.email || 'Staff User';

  const links = [
    { to: normalizedRole === 'admin' ? '/admin/dashboard' : '/', label: 'Dashboard', icon: LayoutDashboard },
    ...(normalizedRole === 'admin' ? [{ to: '/admin/doctors', label: 'Doctor Management', icon: Stethoscope }] : []),
    ...(normalizedRole === 'admin' ? [{ to: '/admin/users', label: 'User Management', icon: UserCog }] : []),
    ...(normalizedRole === 'receptionist' ? [{ to: '/reception/register', label: 'Register Patient', icon: UserPlus }] : []),
    ...(normalizedRole === 'doctor' ? [{ to: '/doctor/search', label: 'Patient Search', icon: Search }] : []),
    { to: '/history', label: 'History Search', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slatebg md:flex">
      <aside className="no-print w-full bg-navy p-4 text-white md:w-72">
        <h1 className="text-xl font-bold">Pakistan Care HMS</h1>
        <p className="mt-1 text-sm text-slate-100">{displayName}</p>
        <p className="mb-4 flex items-center gap-1 text-xs uppercase text-slate-200"><Shield size={12} /> {normalizedRole || 'staff'}</p>
        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-2 rounded p-2 ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="mt-6 flex items-center gap-2 rounded bg-white px-3 py-2 text-sm text-navy">
          <LogOut size={16} /> Logout
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
