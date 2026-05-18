import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { DEPARTMENTS } from '../utils/constants';
import { getAllDoctors, saveDoctor, seedSampleDoctors, setDoctorActive } from '../services/doctorService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyDoctor = {
  name: '',
  specialization: '',
  department: '',
  qualification: '',
  experience: '',
  consultationFee: 0,
  roomNumber: '',
  availableDays: [],
  availableTime: '',
  phone: '',
  active: true,
};

export default function AdminDoctorManagementPage() {
  const [doctors, setDoctors] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyDoctor });

  const loadDoctors = async () => setDoctors(await getAllDoctors());
  useEffect(() => { loadDoctors(); }, []);

  const filtered = useMemo(() => doctors.filter((d) => !filterDept || d.department === filterDept), [doctors, filterDept]);

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      await saveDoctor({
        ...values,
        consultationFee: Number(values.consultationFee || 0),
        availableDays: values.availableDays || [],
        active: values.active ?? true,
      }, editing?.id);
      toast.success(editing ? 'Doctor updated' : 'Doctor added');
      setEditing(null);
      reset(emptyDoctor);
      loadDoctors();
    } finally {
      setBusy(false);
    }
  };

  const editDoctor = (doctor) => {
    setEditing(doctor);
    reset({ ...emptyDoctor, ...doctor });
  };

  const toggleDoctor = async (doctor) => {
    await setDoctorActive(doctor.id, !doctor.active);
    toast.success(`Doctor ${doctor.active ? 'deactivated' : 'activated'}`);
    loadDoctors();
  };

  const runSeed = async () => {
    const result = await seedSampleDoctors();
    if (result.skipped) toast('Doctors already exist. Seed skipped.');
    else toast.success(`${result.created} sample doctors added`);
    loadDoctors();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Doctor Management</h2>
        <button type="button" onClick={runSeed} className="rounded bg-emerald-700 px-3 py-2 text-sm text-white">Seed 3 Sample Doctors</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 rounded bg-white p-4 shadow">
          <h3 className="font-semibold">{editing ? 'Edit Doctor' : 'Add New Doctor'}</h3>
          <input className="w-full rounded border p-2" placeholder="Name (Dr. Muhammad Ahmed)" {...register('name', { required: true })} />
          <input className="w-full rounded border p-2" placeholder="Specialization" {...register('specialization', { required: true })} />
          <select className="w-full rounded border p-2" {...register('department', { required: true })}>
            <option value="">Select Department</option>
            {DEPARTMENTS.map((dep) => <option key={dep}>{dep}</option>)}
          </select>
          <input className="w-full rounded border p-2" placeholder="Qualification" {...register('qualification', { required: true })} />
          <input className="w-full rounded border p-2" placeholder="Experience (e.g. 10 years)" {...register('experience', { required: true })} />
          <input type="number" className="w-full rounded border p-2" placeholder="Consultation Fee" {...register('consultationFee', { required: true, min: 0 })} />
          <input className="w-full rounded border p-2" placeholder="Room Number" {...register('roomNumber', { required: true })} />
          <div className="rounded border p-2">
            <p className="mb-2 text-sm font-medium">Available Days</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2">
                  <input type="checkbox" value={day} {...register('availableDays')} /> {day}
                </label>
              ))}
            </div>
          </div>
          <input className="w-full rounded border p-2" placeholder="Available Time (9:00 AM - 2:00 PM)" {...register('availableTime', { required: true })} />
          <input className="w-full rounded border p-2" placeholder="Phone (03xxxxxxxxx)" {...register('phone', { required: true })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('active')} /> Active
          </label>
          <button disabled={busy} className="w-full rounded bg-navy p-2 text-white">{busy ? 'Saving...' : editing ? 'Update Doctor' : 'Add Doctor'}</button>
        </form>
        <div className="space-y-3 rounded bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Doctors List</h3>
            <select className="rounded border p-2 text-sm" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dep) => <option key={dep}>{dep}</option>)}
            </select>
          </div>
          {filtered.map((doctor) => (
            <div key={doctor.id} className="rounded border p-3">
              <p className="font-semibold">{doctor.name} {!doctor.active && <span className="text-red-700">(Inactive)</span>}</p>
              <p>{doctor.qualification}</p>
              <p>{doctor.department} | {doctor.roomNumber}</p>
              <p>Fee: Rs. {doctor.consultationFee} | {doctor.availableTime}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => editDoctor(doctor)} className="rounded border px-3 py-1">Edit</button>
                <button type="button" onClick={() => toggleDoctor(doctor)} className="rounded border px-3 py-1 text-red-700">{doctor.active ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
