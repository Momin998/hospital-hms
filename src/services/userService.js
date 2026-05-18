import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveUser(userId, payload) {
  await setDoc(doc(db, 'users', userId), {
    ...payload,
    updated_at: serverTimestamp(),
    created_at: payload.created_at || serverTimestamp(),
  }, { merge: true });
}
