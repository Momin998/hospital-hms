# Hospital Patient Management System (HMS)

Production-ready React + Firebase Hospital Management System for Pakistan hospitals.

## Tech Stack
- React 18 + Vite
- Firebase Authentication
- Firebase Firestore
- React Router v6
- TailwindCSS
- React Hook Form
- React Hot Toast
- Lucide React

## Features
- Role-based login (`receptionist`, `doctor`)
- Reception registration with PK phone validation and generated patient ID (`PT-YYYY-XXXX`)
- Firestore counter-based unique patient IDs
- Doctor real-time patient search and profile view
- Visit add/edit with vitals, medicines, notes, follow-up
- Modal confirmations for sensitive actions (save updates, delete visit)
- Visit edit/delete audit trail in `/audit_logs`
- Shared dashboard stats and global history search
- Print patient slip, prescription/history layouts
- Offline-friendly Firestore persistence (IndexedDB cache)
- Route-level lazy loading + vendor chunk splitting for better performance

## Project Setup
1. Install dependencies:
```bash
npm install
```
2. Create `.env` from `.env.example` and fill Firebase values.
3. Run app:
```bash
npm run dev
```
4. Build production:
```bash
npm run build
```

## Firebase Configuration
1. Create Firebase project.
2. Enable Authentication -> Email/Password.
3. Create Firestore database in production mode.
4. Add web app config values to `.env`.
5. Create collections:
- `/users/{uid}`: `{ name, role }`
- `/doctors/{doctorId}`: `{ name, department }`
- `/patients/{patientId}`: patient info
- `/patients/{patientId}/visits/{visitId}`: visit records
- `/counters/patients_YYYY`: `{ value }`
- `/audit_logs/{logId}`: immutable action logs

6. Deploy Firestore rules/indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Firestore Rules (starter)
Use role-based rules by reading `/users/{uid}` document role.
- Receptionist: can create/read patients.
- Doctor: can read patients and read/write visits.
- Restrict writes to proper roles only.

## Create First Admin/User
1. In Firebase Auth, create user with email/password.
2. Copy UID from Authentication.
3. Create `/users/{uid}` doc in Firestore with:
```json
{
  "name": "Front Desk User",
  "role": "receptionist"
}
```
For doctor account:
```json
{
  "name": "Dr. Ahmed",
  "role": "doctor"
}
```

## Deployment on Vercel
1. Push code to GitHub.
2. Import repo on Vercel.
3. Add all `VITE_FIREBASE_*` environment variables.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

## Notes for Production Hardening
- Add Firestore composite indexes for advanced queries.
- Add audit logging collection for clinical/legal traceability.
- Add strict schema validation via Cloud Functions.
- Add PDF print templates and QR generation library.
- Add explicit delete confirmations where delete actions are introduced.
