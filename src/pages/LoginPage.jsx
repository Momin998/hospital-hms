import { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (values) => {
    try {
      setBusy(true);
      const credential = await login(values.email, values.password);
      const userRef = doc(db, 'users', credential.user.uid);
      const userSnap = await getDoc(userRef);
      const role = userSnap.exists() ? userSnap.data().role : null;

      toast.success('Login successful');
      if (role === 'receptionist') navigate('/reception', { replace: true });
      else if (role === 'doctor') navigate('/doctor', { replace: true });
      else if (role === 'admin') navigate('/admin', { replace: true });
      else navigate('/', { replace: true });
    } catch {
      toast.error('Login failed / ??? ??? ?????');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slatebg p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4 rounded bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-navy">Hospital HMS Login</h1>
        <input {...register('email', { required: 'Email required' })} placeholder="Email" className="w-full rounded border p-2" />
        <p className="text-sm text-red-600">{errors.email?.message}</p>
        <input type="password" {...register('password', { required: 'Password required' })} placeholder="Password" className="w-full rounded border p-2" />
        <p className="text-sm text-red-600">{errors.password?.message}</p>
        <button disabled={busy} className="w-full rounded bg-navy p-2 text-white">{busy ? 'Loading...' : 'Login'}</button>
      </form>
    </div>
  );
}
