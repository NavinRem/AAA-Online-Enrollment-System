# AAA Online Enrollment - Backend

This directory contains the Firebase configurations and Cloud Functions for the AAA Online Enrollment System.

## Structure
- **configs/**: Security rules (`firestore.rules`, `storage.rules`) and database indexes.
- **functions/**: Node.js Cloud Functions source code.

## Deployment
To deploy security rules and indexes:
```bash
firebase deploy --only firestore,storage
```

To deploy functions:
```bash
cd functions
npm run deploy
```
