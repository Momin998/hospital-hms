import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { BLOOD_GROUPS, DEPARTMENTS, GENDERS } from '../utils/constants';
import { registerPatient } from '../services/patientService';
import { db } from '../firebase/config';

const phonePk = /^((\+92)|(0))3[0-9]{9}$/;

export default function ReceptionRegisterPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [slip, setSlip] = useState(null);
  const { register, watch, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const selectedDepartment = watch('department');
  const selectedDoctorId = watch('assignedDoctorId');

  useEffect(() => {
    if (!selectedDepartment) {
      setDoctors([]);
      setSelectedDoctor(null);
      setValue('assignedDoctorId', '');
      return;
    }
    const loadDepartmentDoctors = async () => {
      const doctorsRef = collection(db, 'doctors');
      const q = query(
        doctorsRef,
        where('department', '==', selectedDepartment),
        where('active', '==', true),
      );
      const snap = await getDocs(q);
      setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadDepartmentDoctors();
  }, [selectedDepartment, setValue]);

  useEffect(() => {
    const doctor = doctors.find((d) => d.id === selectedDoctorId) || null;
    setSelectedDoctor(doctor);
    setValue('assignedDoctor', doctor?.name || '');
    setValue('assignedDoctorName', doctor?.name || '');
    setValue('roomNumber', doctor?.roomNumber || '');
    setValue('consultationFee', doctor?.consultationFee || 0);
  }, [doctors, selectedDoctorId, setValue]);

  const onSubmit = async (values) => {
    try {
      setBusy(true);
      const patientId = await registerPatient({
        ...values,
        assignedDoctorId: selectedDoctor?.id || '',
        assignedDoctorName: selectedDoctor?.name || '',
        assignedDoctor: selectedDoctor?.name || '',
      });
      setSlip({ ...values, patientId, timestamp: new Date().toLocaleString(), selectedDoctor });
      toast.success('Patient registered successfully');
      reset();
    } catch {
      toast.error('Save failed / ????? ???? ???');
    } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="no-print space-y-2 rounded bg-white p-4 shadow">
        <h2 className="text-xl font-bold text-navy">Patient Registration</h2>
        <input className="w-full rounded border p-2" placeholder="Full Name" {...register('fullName', { required: 'Required / ?????' })} />
        <p className="text-sm text-red-600">{errors.fullName?.message}</p>
        <input type="number" className="w-full rounded border p-2" placeholder="Age" {...register('age', { required: 'Required / ?????', min: 0 })} />
        <select className="w-full rounded border p-2" {...register('gender')}><option value="">Gender</option>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select>
        <input className="w-full rounded border p-2" placeholder="Phone (03xxxxxxxxx)" {...register('phone', { required: 'Required / ?????', pattern: { value: phonePk, message: 'Invalid PK format / ??? ??? ????' } })} />
        <p className="text-sm text-red-600">{errors.phone?.message}</p>
        <input className="w-full rounded border p-2" placeholder="CNIC" {...register('cnic')} />
        <input className="w-full rounded border p-2" placeholder="Address / City" {...register('address')} />
        <select className="w-full rounded border p-2" {...register('bloodGroup')}><option value="">Blood Group</option>{BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}</select>
        <input className="w-full rounded border p-2" placeholder="Emergency Contact Name" {...register('emergencyName')} />
        <input className="w-full rounded border p-2" placeholder="Emergency Contact Phone" {...register('emergencyPhone')} />
        <select className="w-full rounded border p-2" {...register('department')}><option value="">Department</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
        <select className="w-full rounded border p-2" {...register('assignedDoctorId')} disabled={!selectedDepartment}>
          <option value="">{selectedDepartment ? 'Select Doctor' : 'Select Department First'}</option>
          {selectedDepartment && doctors.length === 0 ? (
            <option value="" disabled>No doctors available in this department</option>
          ) : null}
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {`${d.name} - ${d.roomNumber || 'Room N/A'} - Rs. ${d.consultationFee || 0}`}
            </option>
          ))}
        </select>
        <input className="w-full rounded border bg-slate-50 p-2" placeholder="Room Number" readOnly {...register('roomNumber')} />
        <input className="w-full rounded border bg-slate-50 p-2" placeholder="Consultation Fee" readOnly {...register('consultationFee')} />
        <button disabled={busy} className="w-full rounded bg-navy p-2 text-white">{busy ? 'Saving...' : 'Register Patient'}</button>
      </form>

      <div className="no-print rounded bg-white p-4 shadow">
        <h3 className="text-lg font-bold text-navy">Printable Slip</h3>
        {slip ? (
          <div>
            <p>Hospital: Pakistan Care Hospital</p><p>Date/Time: {slip.timestamp}</p><p>Patient ID: <b>{slip.patientId}</b></p>
            <p>Name: {slip.fullName}</p><p>Doctor: {slip.assignedDoctor || 'N/A'}</p><p>Department: {slip.department || 'N/A'}</p>
            <p>Room: {slip.roomNumber || 'N/A'} | Fee: Rs. {slip.consultationFee || 0}</p><p>Phone: {slip.phone}</p>
            <p className="font-mono">|| ||| | || {slip.patientId} ||| ||</p>
            <button onClick={() => window.print()} className="mt-3 rounded bg-navy px-3 py-2 text-white">Print Slip</button>
          </div>
        ) : <p className="text-slate-600">Slip will appear after registration.</p>}
      </div>
      {slip ? (
        <div className="print-only">
          <div className="print-slip">
            <h1 className="print-hospital">Pakistan Care Hospital</h1>
            <p className="print-subtitle">Patient Registration Slip</p>
            <div className="print-divider" />
            <p className="print-patient-id">{slip.patientId}</p>
            <div className="print-grid">
              <p><span>Name:</span> {slip.fullName || 'N/A'}</p>
              <p><span>Age:</span> {slip.age || 'N/A'}</p>
              <p><span>Gender:</span> {slip.gender || 'N/A'}</p>
              <p><span>Doctor:</span> {slip.assignedDoctor || 'N/A'}</p>
              <p><span>Department:</span> {slip.department || 'N/A'}</p>
              <p><span>Room Number:</span> {slip.roomNumber || 'N/A'}</p>
              <p><span>Consultation Fee:</span> Rs. {slip.consultationFee || 0}</p>
              <p><span>Date & Time:</span> {slip.timestamp}</p>
            </div>
            <div className="print-divider" />
            <p className="print-footer">Please keep this slip safe</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
