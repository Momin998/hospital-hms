import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getUsers, saveUser } from '../services/userService';

const defaultUser = { uid: '', name: '', email: '', role: 'receptionist', active: true, doctorId: '' };

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: defaultUser });

  const load = async () => setUsers(await getUsers());
  useEffect(() => { load(); }, []);

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      if (!values.uid.trim()) {
        toast.error('UID is required');
        return;
      }
      await saveUser(values.uid.trim(), {
        name: values.name,
        email: values.email,
        role: values.role,
        active: values.active,
        doctorId: values.role === 'doctor' ? values.doctorId : '',
      });
      toast.success('User saved');
      reset(defaultUser);
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 rounded bg-white p-4 shadow">
        <h2 className="text-xl font-bold text-navy">User Management</h2>
        <input className="w-full rounded border p-2" placeholder="Firebase Auth UID" {...register('uid')} />
        <input className="w-full rounded border p-2" placeholder="Name" {...register('name', { required: true })} />
        <input className="w-full rounded border p-2" placeholder="Email" {...register('email', { required: true })} />
        <select className="w-full rounded border p-2" {...register('role')}>
          <option value="receptionist">Receptionist</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
        <input className="w-full rounded border p-2" placeholder="Doctor ID (only for doctor role)" {...register('doctorId')} />
        <label className="flex items-center gap-2"><input type="checkbox" {...register('active')} /> Active</label>
        <button disabled={busy} className="w-full rounded bg-navy p-2 text-white">{busy ? 'Saving...' : 'Save User'}</button>
      </form>
      <div className="space-y-2 rounded bg-white p-4 shadow">
        <h3 className="font-semibold">Existing Users</h3>
        {users.map((u) => (
          <div key={u.id} className="rounded border p-2 text-sm">
            <p className="font-semibold">{u.name} ({u.role})</p>
            <p>{u.email}</p>
            <p>UID: {u.id}</p>
            <p>Status: {u.active === false ? 'Inactive' : 'Active'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
