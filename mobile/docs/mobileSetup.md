# AAA Online Enrollment System - Mobile Parent Portal

This directory contains the Flutter mobile application codebase for parents to pay term invoices, register classes, track session attendance, and view real-time academic mastery reports.

## Directory Structure

```text
mobile/
├── docs/
│   └── mobileSetup.md             # Developer documentation
├── lib/
│   ├── main.dart                  # App bootstrap, routing, and theme
│   ├── models/
│   │   └── models.dart            # Unified strongly typed entity models
│   ├── services/
│   │   ├── apiService.dart        # Dio client with Firebase interceptors
│   │   └── authService.dart       # Firebase session & role gates
│   └── views/
│       ├── dashboardView.dart     # Parent welcome roster panel
│       ├── loginView.dart         # Material 3 login & register UI
│       └── studentDetailsView.dart# Detailed tab controls (Grades/Attendance)
├── test/
│   └── mobileTest.dart            # Models & API endpoint unit tests
└── pubspec.yaml                   # Dependency specifications
```

---

## Getting Started

### 1. Prerequisites
- Install **Flutter SDK** (`>=3.2.0`) and Dart.
- Install native compilation tools:
  - **Android SDK** (for Android testing).
  - **Xcode** (macOS only, for iOS testing).

### 2. Configure Firebase Platform Credentials
The app uses Firebase Authentication. To enable native connection:
1. **Android**: Download `google-services.json` from your Firebase console under your Android app profile and place it in `mobile/android/app/`.
2. **iOS**: Download `GoogleService-Info.plist` from your Firebase console and place it in `mobile/ios/Runner/`.

### 3. Install Dependencies
Run from the `mobile/` directory:
```bash
flutter pub get
```

### 4. Running Local Development
1. Start your local Express backend servers.
2. Build and launch the mobile application:
```bash
flutter run
```

---

## Architectural Highlight: Smart Emulator Port-Forwarding
By default, mobile emulators do not map `localhost` or `127.0.0.1` to the host machine (Android emulators map to `10.0.2.2`). 
Our `ApiService` detects the current operating platform automatically:
```dart
static String get baseUrl {
  const String defaultHost = 'http://127.0.0.1:5001/...';
  if (!kIsWeb && Platform.isAndroid) {
    return defaultHost.replaceAll('127.0.0.1', '10.0.2.2');
  }
  return defaultHost;
}
```
This guarantees local connectivity without hardcoded configuration overrides!
