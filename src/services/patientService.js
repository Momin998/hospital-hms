import { collection, doc, getCountFromServer, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';

function yearPrefix() {
  return new Date().getFullYear().toString();
}

export async function generatePatientId() {
  const id = yearPrefix();
  const counterRef = doc(db, 'counters', `patients_${id}`);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? snap.data().value : 0) + 1;
    tx.set(counterRef, { value: next, updated_at: serverTimestamp() }, { merge: true });
    return `PT-${id}-${String(next).padStart(4, '0')}`;
  });
}

export async function registerPatient(payload) {
  const patientId = await generatePatientId();
  await setDoc(doc(db, 'patients', patientId), {
    ...payload,
    patientId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return patientId;
}

export async function searchPatients(searchText, doctorId = '') {
  const patientsRef = collection(db, 'patients');
  const q = doctorId
    ? query(patientsRef, where('assignedDoctorId', '==', doctorId), limit(200))
    : query(patientsRef, orderBy('created_at', 'desc'), limit(100));
  console.log('[DoctorSearch] query constraints:', doctorId
    ? `where("assignedDoctorId","==","${doctorId}")`
    : 'orderBy("created_at","desc")');
  const snap = await getDocs(q);
  const text = searchText.trim().toLowerCase();
  const filtered = snap.docs.map((d) => d.data()).filter((p) => {
    if (!text) return true;
    return [p.patientId, p.fullName, p.phone, p.cnic].some((v) => (v || '').toLowerCase().includes(text));
  });
  console.log('[DoctorSearch] results returned:', filtered.length, filtered.map((p) => p.patientId));
  return filtered;
}

export async function getDashboardCounts(options = {}) {
  const { role = '', doctorId = '' } = options;
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const patientsRef = collection(db, 'patients');
  const doctorsRef = collection(db, 'doctors');
  const usersRef = collection(db, 'users');

  if (role === 'doctor' && doctorId) {
    const [today, total, todayList] = await Promise.all([
      getCountFromServer(query(patientsRef, where('assignedDoctorId', '==', doctorId), where('created_at', '>=', startDay))),
      getCountFromServer(query(patientsRef, where('assignedDoctorId', '==', doctorId))),
      getDocs(query(patientsRef, where('assignedDoctorId', '==', doctorId), where('created_at', '>=', startDay), orderBy('created_at', 'desc'), limit(20))),
    ]);
    return {
      today: today.data().count,
      total: total.data().count,
      todayPatients: todayList.docs.map((d) => d.data()),
      recent: [],
      doctors: 0,
      users: 0,
      month: 0,
    };
  }

  const [today, month, recent] = await Promise.all([
    getCountFromServer(query(patientsRef, where('created_at', '>=', startDay))),
    getCountFromServer(query(patientsRef, where('created_at', '>=', startMonth))),
    getDocs(query(patientsRef, orderBy('created_at', 'desc'), limit(5))),
  ]);
  const [doctorCount, userCount] = await Promise.all([
    getCountFromServer(doctorsRef),
    getCountFromServer(usersRef),
  ]);
  return {
    today: today.data().count,
    month: month.data().count,
    doctors: doctorCount.data().count,
    users: userCount.data().count,
    recent: recent.docs.map((d) => d.data()),
  };
}
