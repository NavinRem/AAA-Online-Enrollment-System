# AAA Online Enrollment System

A robust, full-stack enrollment solution featuring a responsive Web dashboard for administrators and a Progressive Web App (PWA) for parents. This project utilizes a serverless architecture to provide real-time data synchronization and secure user management.

---

## Platforms

- **Admin Dashboard:** Built with **Vue.js + Tailwind CSS** for administrative control and desktop users.
- **Parent Portal (PWA):** Built with **Vue.js + Vite PWA** for a seamless, installable mobile experience on any device.
- **Backend:** Powered by **Firebase** (Cloud Functions, Firestore, Auth, Storage) for real-time database, authentication, and hosting.

---

## Key Features

- **Real-time Sync:** Instant data updates across all platforms via Cloud Firestore.
- **Secure Auth:** Robust user authentication (Email/Password, Phone/Telegram login).
- **Online Payments:** KHQR, Card, and Bank Transfer support with proof verification.
- **Self-Enrollment:** Parents can browse and enroll children with automatic conflict prevention.
- **Performance Tracking:** Exam scores, evaluations, and report cards visible to parents.
- **Attendance Monitoring:** Session-by-session check-in history and attendance rates.
- **Installable PWA:** Parent portal works offline-first and can be installed on any mobile device.

---

## Project Structure

```text
AAA-Online-Enrollment-System/
├── frontend/      # Vue.js Admin Dashboard (Web)
├── pwa/           # Vue.js Parent Portal (Progressive Web App)
└── backend/       # Firebase Cloud Functions & Configurations
    ├── configs/   # Security rules and indexes
    └── src/       # Express.js API source (17 domain modules)
```

---

## Setup and Installation

### Firebase

Ensure you have the Firebase CLI installed.

```bash
firebase login
firebase init
```

### Admin Dashboard (Vue.js)

```bash
cd frontend
npm install
npm run dev
```

### Parent Portal (PWA)

```bash
cd pwa
npm install
npm run dev
```

### Backend (Firebase Functions)

```bash
cd backend
npm install
npm run serve
```

---

## Project Contributor

```text
Rem Sonavin
```
