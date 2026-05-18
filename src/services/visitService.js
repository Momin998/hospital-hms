import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getVisits(patientId) {
  const snap = await getDocs(query(collection(db, 'patients', patientId, 'visits'), orderBy('date', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveVisit(patientId, visit, visitId) {
  const ref = visitId ? doc(db, 'patients', patientId, 'visits', visitId) : doc(collection(db, 'patients', patientId, 'visits'));
  await setDoc(ref, {
    ...visit,
    updated_at: serverTimestamp(),
    created_at: visitId ? visit.created_at || serverTimestamp() : serverTimestamp(),
  }, { merge: true });
  return ref.id;
}

export async function updatePatientMeta(patientId) {
  await updateDoc(doc(db, 'patients', patientId), { updated_at: serverTimestamp() });
}

export async function deleteVisit(patientId, visitId) {
  await deleteDoc(doc(db, 'patients', patientId, 'visits', visitId));
}
