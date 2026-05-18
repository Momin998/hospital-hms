import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getAllDoctors(department = '') {
  const doctorsRef = collection(db, 'doctors');
  const q = department
    ? query(doctorsRef, where('department', '==', department), orderBy('name'))
    : query(doctorsRef, orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getActiveDoctorsByDepartment(department = '') {
  const doctorsRef = collection(db, 'doctors');
  const parts = [where('active', '==', true), orderBy('name')];
  if (department) parts.unshift(where('department', '==', department));
  const snap = await getDocs(query(doctorsRef, ...parts));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveDoctor(payload, doctorId) {
  const ref = doctorId ? doc(db, 'doctors', doctorId) : doc(collection(db, 'doctors'));
  await setDoc(ref, {
    ...payload,
    updated_at: serverTimestamp(),
    created_at: doctorId ? payload.created_at || serverTimestamp() : serverTimestamp(),
  }, { merge: true });
  return ref.id;
}

export async function setDoctorActive(doctorId, active) {
  await updateDoc(doc(db, 'doctors', doctorId), {
    active,
    updated_at: serverTimestamp(),
  });
}

export async function seedSampleDoctors() {
  const sampleDoctors = [
    {
      name: 'Dr. Muhammad Ahmed',
      specialization: 'Cardiology',
      department: 'Cardiology',
      qualification: 'MBBS, FCPS',
      experience: '10 years',
      consultationFee: 1000,
      roomNumber: 'Room 5',
      availableDays: ['Monday', 'Tuesday', 'Wednesday'],
      availableTime: '9:00 AM - 2:00 PM',
      phone: '0301-1234567',
      active: true,
    },
    {
      name: 'Dr. Ayesha Khan',
      specialization: 'Gynecology & Obstetrics',
      department: 'Gynecology & Obstetrics',
      qualification: 'MBBS, MCPS',
      experience: '8 years',
      consultationFee: 1200,
      roomNumber: 'Room 12',
      availableDays: ['Monday', 'Thursday', 'Saturday'],
      availableTime: '10:00 AM - 3:00 PM',
      phone: '0302-5551122',
      active: true,
    },
    {
      name: 'Dr. Bilal Hussain',
      specialization: 'Pediatrics',
      department: 'Pediatrics',
      qualification: 'MBBS, DCH',
      experience: '7 years',
      consultationFee: 900,
      roomNumber: 'Room 9',
      availableDays: ['Tuesday', 'Wednesday', 'Friday'],
      availableTime: '11:00 AM - 4:00 PM',
      phone: '0303-9090909',
      active: true,
    },
  ];

  const existing = await getDocs(collection(db, 'doctors'));
  if (!existing.empty) return { created: 0, skipped: true };

  await Promise.all(sampleDoctors.map((doctor) => saveDoctor(doctor)));
  return { created: sampleDoctors.length, skipped: false };
}
