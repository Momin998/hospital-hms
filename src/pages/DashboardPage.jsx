import { useEffect, useState } from 'react';
import { getDashboardCounts } from '../services/patientService';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState({ today: 0, month: 0, doctors: 0, users: 0, recent: [], total: 0, todayPatients: [] });
  const isDoctor = profile?.role === 'doctor';

  useEffect(() => {
    getDashboardCounts({
      role: profile?.role || '',
      doctorId: profile?.doctorId || '',
    }).then(setData);
  }, [profile?.role, profile?.doctorId]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-navy">{isDoctor ? `Welcome Dr. ${profile?.name || ''}` : 'Dashboard'}</h2>
      {isDoctor ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded bg-white p-4 shadow">Today's Patients: <b>{data.today}</b></div>
            <div className="rounded bg-white p-4 shadow">Total Assigned Patients: <b>{data.total}</b></div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <h3 className="mb-2 font-semibold">Today's Patients List</h3>
            {data.todayPatients.length === 0 ? <p className="text-slate-600">No patients assigned today.</p> : null}
            {data.todayPatients.map((p) => <p key={p.patientId}>{p.patientId} - {p.fullName} - {p.phone}</p>)}
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded bg-white p-4 shadow">Today Patients: <b>{data.today}</b></div>
            <div className="rounded bg-white p-4 shadow">This Month: <b>{data.month}</b></div>
            <div className="rounded bg-white p-4 shadow">Total Doctors: <b>{data.doctors}</b></div>
            <div className="rounded bg-white p-4 shadow">System Users: <b>{data.users}</b></div>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <h3 className="mb-2 font-semibold">Recent Registrations</h3>
            {data.recent.map((p) => <p key={p.patientId}>{p.patientId} - {p.fullName} - {p.phone}</p>)}
          </div>
        </>
      )}
    </div>
  );
}
