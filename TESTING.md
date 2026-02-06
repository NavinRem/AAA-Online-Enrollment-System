# Testing Guide

This project consists of three main components, each with its own testing procedures.

## 1. Mobile App (Flutter)

Located in the `mobile/` directory.

### Running Tests

To run unit and widget tests:

```bash
cd mobile
flutter test
```

### Running the App

To run the app on a connected device or emulator:

```bash
cd mobile
flutter run
```

---

## 2. Frontend (Vue.js)

Located in the `frontend/` directory.

### Running Unit Tests

To run unit tests using Vitest:

```bash
cd frontend
npm run test:unit
```

### Running Development Server

To start the development server:

```bash
cd frontend
npm run dev
```

---

## 3. Backend (Firebase Functions)

Located in the `backend/` directory (specifically `backend/functions`).

### Running Tests

To run tests using Mocha:

```bash
cd backend/functions
npm test
```

### Running Emulators

To test functions locally using Firebase Emulators:

```bash
cd backend/functions
npm run serve
```
