import { useEffect, useMemo, useState } from 'react';
import { searchPatients } from '../services/patientService';

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({ q: '', doctor: '', department: '' });

  useEffect(() => { searchPatients('').then(setRows); }, []);

  const filtered = useMemo(() => rows.filter((p) => {
    const q = filter.q.toLowerCase();
    return (!q || [p.patientId, p.fullName, p.phone, p.cnic].some((v) => (v || '').toLowerCase().includes(q)))
      && (!filter.doctor || p.assignedDoctor === filter.doctor)
      && (!filter.department || p.department === filter.department);
  }), [rows, filter]);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-navy">Global Patient History</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <input onChange={(e) => setFilter((s) => ({ ...s, q: e.target.value }))} className="rounded border p-2" placeholder="Search" />
        <input onChange={(e) => setFilter((s) => ({ ...s, doctor: e.target.value }))} className="rounded border p-2" placeholder="Doctor" />
        <input onChange={(e) => setFilter((s) => ({ ...s, department: e.target.value }))} className="rounded border p-2" placeholder="Department" />
      </div>
      {filtered.map((p) => (
        <details key={p.patientId} className="rounded bg-white p-3 shadow">
          <summary className="cursor-pointer font-semibold">{p.patientId} - {p.fullName} ({p.department || 'N/A'})</summary>
          <p>Phone: {p.phone} | Doctor: {p.assignedDoctor || 'N/A'} | Address: {p.address || '-'}</p>
          <button onClick={() => window.print()} className="mt-2 rounded border px-3 py-1">Print History</button>
        </details>
      ))}
    </div>
  );
}
