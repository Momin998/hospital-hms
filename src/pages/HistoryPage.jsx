import { useEffect, useMemo, useState } from 'react';
import { searchPatients } from '../services/patientService';
import { getVisits } from '../services/visitService';

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({ q: '', doctor: '', department: '' });
  const [printData, setPrintData] = useState(null);

  useEffect(() => { searchPatients('').then(setRows); }, []);

  const handlePrint = async (p) => {
    const visits = await getVisits(p.patientId);
    setPrintData({ patient: p, visits });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  useEffect(() => {
    const afterPrint = () => setPrintData(null);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  const filtered = useMemo(() => rows.filter((p) => {
    const q = filter.q.toLowerCase();
    return (!q || [p.patientId, p.fullName, p.phone, p.cnic].some((v) => (v || '').toLowerCase().includes(q)))
      && (!filter.doctor || p.assignedDoctor === filter.doctor)
      && (!filter.department || p.department === filter.department);
  }), [rows, filter]);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; margin: 0; padding: 0; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      {printData && (
        <div className="print-only p-8 text-black">
          <div className="mb-6 text-center border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold uppercase">Pakistan Care Hospital</h1>
            <p className="text-gray-600 text-lg">Patient Medical History</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div><b>Patient Name:</b> {printData.patient.fullName || '-'}</div>
            <div><b>Patient ID:</b> {printData.patient.patientId || '-'}</div>
            <div><b>Age / Gender:</b> {printData.patient.age || '-'} / {printData.patient.gender || '-'}</div>
            <div><b>Phone:</b> {printData.patient.phone || '-'}</div>
            <div><b>Blood Group:</b> {printData.patient.bloodGroup || '-'}</div>
            <div><b>Address:</b> {printData.patient.address || '-'}</div>
            <div><b>Assigned Doctor:</b> {printData.patient.assignedDoctor || '-'}</div>
            <div><b>Department:</b> {printData.patient.department || '-'}</div>
          </div>

          <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Visit History</h2>
          
          {printData.visits.length === 0 ? (
            <p>No visits found.</p>
          ) : (
            <div className="space-y-6">
              {printData.visits.map((v) => (
                <div key={v.id} className="border border-gray-400 p-4 rounded mb-4 break-inside-avoid">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div><b>Date:</b> {v.date || '-'}</div>
                    <div><b>Follow-up Date:</b> {v.followUpDate || '-'}</div>
                  </div>
                  <div className="mb-2"><b>Chief Complaint:</b> {v.chiefComplaint || '-'}</div>
                  <div className="mb-3"><b>Diagnosis:</b> {v.diagnosis || '-'}</div>
                  
                  <div className="mb-3 bg-gray-50 p-2 border border-gray-200 rounded">
                    <b className="block mb-1">Vitals:</b>
                    <span className="mr-4">BP: {v.bp || '-'}</span>
                    <span className="mr-4">Temp: {v.temperature || '-'}</span>
                    <span className="mr-4">Weight: {v.weight || '-'}</span>
                    <span>Pulse: {v.pulse || '-'}</span>
                  </div>

                  {v.medicines && v.medicines.length > 0 && (
                    <div className="mb-3">
                      <b className="block mb-1">Medicines:</b>
                      <table className="w-full text-left border-collapse border border-gray-400 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-400 px-2 py-1">Name</th>
                            <th className="border border-gray-400 px-2 py-1">Dose</th>
                            <th className="border border-gray-400 px-2 py-1">Days</th>
                            <th className="border border-gray-400 px-2 py-1">Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {v.medicines.map((m, i) => (
                            <tr key={i}>
                              <td className="border border-gray-400 px-2 py-1">{m.name || '-'}</td>
                              <td className="border border-gray-400 px-2 py-1">{m.dosage || '-'}</td>
                              <td className="border border-gray-400 px-2 py-1">{m.duration || '-'}</td>
                              <td className="border border-gray-400 px-2 py-1">{m.instructions || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mb-2"><b>Lab Tests Ordered:</b> {(v.labTests || []).join(', ') || '-'}</div>
                  <div><b>Doctor Notes:</b> {v.notes || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 no-print">
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
          <button onClick={() => handlePrint(p)} className="mt-2 rounded border px-3 py-1 bg-gray-50">Print History</button>
        </details>
      ))}
      </div>
    </>
  );
}
