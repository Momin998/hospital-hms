import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function logAuditEvent(event) {
  await addDoc(collection(db, 'audit_logs'), {
    ...event,
    created_at: serverTimestamp(),
  });
}
