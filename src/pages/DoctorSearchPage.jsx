import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchPatients } from '../services/patientService';
import { useAuth } from '../context/AuthContext';

export default function DoctorSearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const { user, profile } = useAuth();
  const linkedDoctorId = profile?.doctorId || '';

  useEffect(() => {
    console.log('[DoctorSearch] profile.doctorId:', profile?.doctorId, 'user.uid:', user?.uid);
    if (!linkedDoctorId) {
      setResults([]);
      return undefined;
    }
    const t = setTimeout(() => {
      console.log('[DoctorSearch] executing query: where("assignedDoctorId", "==", profile.doctorId)');
      searchPatients(q, linkedDoctorId).then((rows) => {
        console.log('[DoctorSearch] rows after service:', rows);
        setResults(rows);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [q, linkedDoctorId, profile?.doctorId, user?.uid]);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-navy">Patient Search</h2>
      <p className="text-sm text-slate-600">Doctor: <b>{profile?.name || user?.email}</b></p>
      <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded border p-2" placeholder="Patient ID, Name, Phone" />
      <div className="grid gap-3">
        {results.map((p) => (
          <Link key={p.patientId} to={`/doctor/patient/${p.patientId}`} className="rounded bg-white p-3 shadow">
            <p className="font-semibold">{p.patientId} - {p.fullName}</p>
            <p>{p.phone} | {p.department || 'N/A'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
