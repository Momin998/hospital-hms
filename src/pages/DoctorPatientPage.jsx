import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { logAuditEvent } from '../services/auditService';
import { deleteVisit, getVisits, saveVisit, updatePatientMeta } from '../services/visitService';

export default function DoctorPatientPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingVisit, setPendingVisit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const { user, profile } = useAuth();
  const { register, control, handleSubmit, reset } = useForm({ defaultValues: { date: new Date().toISOString().slice(0, 10), medicines: [{ name: '', dosage: '', duration: '', instructions: '' }], labTests: [''], symptoms: [] } });
  const meds = useFieldArray({ control, name: 'medicines' });
  const linkedDoctorId = profile?.doctorId || '';

  const load = async () => {
    const [patientSnap, doctorSnap] = await Promise.all([
      getDoc(doc(db, 'patients', patientId)),
      linkedDoctorId ? getDoc(doc(db, 'doctors', linkedDoctorId)) : Promise.resolve(null),
    ]);
    const data = patientSnap.exists() ? patientSnap.data() : null;
    if (doctorSnap?.exists()) setDoctorInfo(doctorSnap.data());
    if (data && data.assignedDoctorId && data.assignedDoctorId !== linkedDoctorId) {
      setPatient(null);
      return;
    }
    setPatient(data);
    setVisits(await getVisits(patientId));
  };
  useEffect(() => { if (linkedDoctorId) load(); }, [patientId, linkedDoctorId]);

  const defaultVisitForm = { date: new Date().toISOString().slice(0, 10), medicines: [{ name: '', dosage: '', duration: '', instructions: '' }], labTests: [''], symptoms: [] };

  const normalizeVisit = (v) => ({
    ...v,
    symptoms: (v.symptomsText || '').split(',').map((s) => s.trim()).filter(Boolean),
    labTests: (v.labTestsText || '').split(',').map((s) => s.trim()).filter(Boolean),
    medicines: (v.medicines || []).filter((m) => m?.name),
  });

  const persistVisit = async (v) => {
    setBusy(true);
    try {
      const visitPayload = normalizeVisit(v);
      const id = await saveVisit(patientId, visitPayload, editing?.id);
      await updatePatientMeta(patientId);
      await logAuditEvent({
        action: editing ? 'visit_update' : 'visit_create',
        patientId,
        visitId: id,
        actor_uid: user?.uid || null,
        actor_name: profile?.name || user?.email || 'Unknown',
        actor_role: profile?.role || 'unknown',
        metadata: { diagnosis: visitPayload.diagnosis || null, visit_date: visitPayload.date || null },
      });
      toast.success('Visit saved');
      setEditing(null);
      setConfirmSaveOpen(false);
      setPendingVisit(null);
      reset(defaultVisitForm);
      load();
    } finally {
      setBusy(false);
    }
  };

  const submit = async (v) => {
    setPendingVisit(v);
    setConfirmSaveOpen(true);
  };

  const startEditVisit = (visit) => {
    setEditing(visit);
    reset({
      ...defaultVisitForm,
      ...visit,
      symptomsText: (visit.symptoms || []).join(', '),
      labTestsText: (visit.labTests || []).join(', '),
      medicines: visit.medicines?.length ? visit.medicines : defaultVisitForm.medicines,
    });
  };

  const printPrescription = (visit) => {
    const medsMarkup = (visit.medicines || []).map((m) => `<tr><td>${m.name || '-'}</td><td>${m.dosage || '-'}</td><td>${m.duration || '-'}</td><td>${m.instructions || '-'}</td></tr>`).join('');
    const testsMarkup = (visit.labTests || []).length ? (visit.labTests || []).join(', ') : 'None';
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) return;
    popup.document.write(`
      <html>
      <head>
        <title>Prescription - ${patient?.patientId || ''}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
          .top { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
          h1 { margin: 0; font-size: 28px; }
          .muted { color: #333; font-size: 13px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 12px 0; }
          .card { border: 1px solid #bbb; padding: 10px; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #999; padding: 6px; font-size: 12px; text-align: left; }
          .foot { margin-top: 18px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="top">
          <h1>Pakistan Care Hospital</h1>
          <div class="muted">Professional Prescription Slip</div>
        </div>
        <div class="grid">
          <div><b>Patient:</b> ${patient?.fullName || '-'}</div>
          <div><b>Patient ID:</b> ${patient?.patientId || '-'}</div>
          <div><b>Age/Gender:</b> ${patient?.age || '-'} / ${patient?.gender || '-'}</div>
          <div><b>Phone:</b> ${patient?.phone || '-'}</div>
          <div><b>Doctor:</b> ${profile?.name || '-'}</div>
          <div><b>Department:</b> ${doctorInfo?.department || patient?.department || '-'}</div>
          <div><b>Room:</b> ${doctorInfo?.roomNumber || patient?.roomNumber || '-'}</div>
          <div><b>Date:</b> ${visit?.date || '-'}</div>
        </div>
        <div class="card"><b>Diagnosis:</b> ${visit?.diagnosis || '-'}</div>
        <div class="card">
          <b>Medicines</b>
          <table>
            <thead><tr><th>Name</th><th>Dose</th><th>Days</th><th>Before/After Meal</th></tr></thead>
            <tbody>${medsMarkup || '<tr><td colspan="4">No medicines added</td></tr>'}</tbody>
          </table>
        </div>
        <div class="card"><b>Tests Ordered:</b> ${testsMarkup}</div>
        <div class="card"><b>Doctor Notes:</b> ${visit?.notes || '-'}</div>
        <div class="foot">
          <div><b>Follow Up:</b> ${visit?.followUpDate || 'Not set'}</div>
          <div><b>Consultant:</b> ${profile?.name || '-'}</div>
        </div>
      </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const handleDeleteVisit = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteVisit(patientId, deleteTarget.id);
      await updatePatientMeta(patientId);
      await logAuditEvent({
        action: 'visit_delete',
        patientId,
        visitId: deleteTarget.id,
        actor_uid: user?.uid || null,
        actor_name: profile?.name || user?.email || 'Unknown',
        actor_role: profile?.role || 'unknown',
        metadata: { diagnosis: deleteTarget.diagnosis || null, visit_date: deleteTarget.date || null },
      });
      toast.success('Visit deleted');
      setDeleteTarget(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!patient) return <div>Patient not found or not assigned to your account.</div>;

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-4 shadow">
        <h2 className="text-xl font-bold text-navy">{patient.fullName} ({patient.patientId})</h2>
        <p className="text-sm text-slate-600">Consultant: {profile?.name || user?.email}</p>
        <p>{patient.phone} | Age: {patient.age || 'N/A'} | Gender: {patient.gender || 'N/A'} | {patient.cnic || 'No CNIC'}</p>
        <p className="text-sm text-slate-600">{patient.address || '-'} | Blood Group: {patient.bloodGroup || 'N/A'}</p>
      </div>
      <form onSubmit={handleSubmit(submit)} className="space-y-2 rounded bg-white p-4 shadow">
        <h3 className="font-semibold">{editing ? 'Edit Visit' : 'Add New Visit'}</h3>
        <input type="date" className="w-full rounded border p-2" {...register('date')} />
        <input className="w-full rounded border p-2" placeholder="Chief Complaint" {...register('chiefComplaint')} />
        <input className="w-full rounded border p-2" placeholder="Diagnosis / Disease" {...register('diagnosis')} />
        <input className="w-full rounded border p-2" placeholder="Symptoms (comma separated)" {...register('symptomsText')} />
        <input className="w-full rounded border p-2" placeholder="Lab Tests (comma separated)" {...register('labTestsText')} />
        <div className="grid gap-2">
          {meds.fields.map((f, i) => (
            <div key={f.id} className="grid gap-2 md:grid-cols-4">
              <input className="rounded border p-2" placeholder="Medicine" {...register(`medicines.${i}.name`)} />
              <input className="rounded border p-2" placeholder="Dosage 1-0-1" {...register(`medicines.${i}.dosage`)} />
              <input className="rounded border p-2" placeholder="Duration days" {...register(`medicines.${i}.duration`)} />
              <input className="rounded border p-2" placeholder="Before/After meal" {...register(`medicines.${i}.instructions`)} />
            </div>
          ))}
          <button type="button" onClick={() => meds.append({ name: '', dosage: '', duration: '', instructions: '' })} className="rounded border p-2">Add Medicine</button>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <input className="rounded border p-2" placeholder="BP" {...register('bp')} />
          <input className="rounded border p-2" placeholder="Temperature" {...register('temperature')} />
          <input className="rounded border p-2" placeholder="Weight" {...register('weight')} />
          <input className="rounded border p-2" placeholder="Pulse" {...register('pulse')} />
        </div>
        <textarea className="w-full rounded border p-2" placeholder="Doctor Notes" {...register('notes')} />
        <input type="date" className="w-full rounded border p-2" {...register('followUpDate')} />
        <button className="rounded bg-navy px-4 py-2 text-white">Save Visit</button>
      </form>
      <div className="space-y-2 rounded bg-white p-4 shadow">
        <h3 className="font-semibold">Visit History ({visits.length})</h3>
        {visits.map((v) => (
          <div key={v.id} className="rounded border p-3">
            <p className="font-semibold">{v.date} - {v.diagnosis || 'No diagnosis'}</p>
            <p>{v.chiefComplaint}</p>
            <button onClick={() => startEditVisit(v)} className="mr-2 rounded border px-3 py-1">Edit</button>
            <button onClick={() => setDeleteTarget(v)} className="mr-2 rounded border px-3 py-1 text-red-700">Delete</button>
            <button onClick={() => printPrescription(v)} className="rounded border px-3 py-1">Print Prescription</button>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={confirmSaveOpen}
        title={editing ? 'Confirm visit update' : 'Confirm new visit'}
        message="Do you want to save these visit details to patient history?"
        confirmText="Yes, Save"
        busy={busy}
        onCancel={() => {
          if (!busy) {
            setConfirmSaveOpen(false);
            setPendingVisit(null);
          }
        }}
        onConfirm={() => pendingVisit && persistVisit(pendingVisit)}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete visit record"
        message="This action cannot be undone. Do you want to continue?"
        confirmText="Delete"
        busy={busy}
        onCancel={() => !busy && setDeleteTarget(null)}
        onConfirm={handleDeleteVisit}
      />
    </div>
  );
}
