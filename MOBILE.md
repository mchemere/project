# RentKe — Mobile App (Capacitor / Android)

This guide explains how to run and build the RentKe mobile app (Android) from the existing
web-based house rental marketplace in this repository.

## Current stack (unchanged)

- Frontend: HTML5 + CSS3 + vanilla JavaScript (no framework)
- Backend: Go (`backend-go/main.go`) — serves both the REST API and the static web app
  - API base: `http://localhost:8080`
  - Key endpoints: `GET /api/health`, `POST /api/register`, `POST /api/login`,
    `GET /api/properties`, `GET /api/properties/{id}`, `POST/PUT/DELETE /api/properties`,
    `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/{propertyID}`,
    `POST/GET /api/inquiries`, `POST/GET /api/reports`,
    `GET /api/users`, `GET /api/admin/stats`
- Database: in-memory store in the Go backend (data resets on restart)
  - The Express backend (`backend/`) uses a JSON file store in `backend/data/users.json`.

## Prerequisites

- Node.js 18+
- npm
- Android Studio (JDK 17, Android SDK, Android Emulator or a physical device)
- Backend running (see below)

## 1. Backend

The Go backend serves the static frontend and the REST API from the same port.

```bash
cd /home/mchemere/project
go run backend-go/main.go
```

The server listens on `http://localhost:8080` by default and serves the web app from the
project root (override with `RENTKE_STATIC_DIR`).

For Android emulator use the host loopback alias:

```
http://10.0.2.2:8080
```

For a physical device, use your machine's LAN IP, e.g. `http://192.168.1.20:8080`.

## 2. Frontend dependencies

```bash
cd /home/mchemere/project
npm install
```

## 3. Capacitor setup (first time)

```bash
npx cap add android
npx cap sync android
npx cap open android
```

`capacitor.config.json` is already configured with:

```json
{
  "appId": "com.rentke.app",
  "appName": "RentKe",
  "webDir": ".",
  "server": {
    "url": "http://10.0.2.2:8080",
    "cleartext": true
  },
  "android": {
    "backgroundColor": "#ffffff"
  }
}
```

- `appId`: `com.rentke.app`
- `appName`: `RentKe`
- `webDir`: project root (contains `index.html`)
- `server.url`: `http://10.0.2.2:8080` for the Android emulator (host machine backend)
- `cleartext`: allows http:// during development

## 4. Run on Android

1. Start the backend (see above).
2. Start the Android emulator (or connect a device).
3. `npx cap run android`

Or open the project in Android Studio:

```bash
npx cap open android
```

Then run from Android Studio.

## 5. Build distributable APK

```bash
npx cap build android
```

- Debug APK: `npx cap build android` (then build via Android Studio / Gradle as usual).
- Release APK: build a release signing config in Android Studio and run
  `npx cap build android` followed by the Gradle release build.

## 6. Mobile-specific behavior implemented

- Responsive off-canvas sidebar navigation for the tenant and landlord dashboards
  (hamburger toggle + overlay), matching the admin dashboard pattern.
- Offline awareness: API layer (`js/properties.js`) checks `navigator.onLine` and
  surfaces a friendly error before requests are made.
- Shared backend between web and mobile: both use the same REST API and data store.

## 7. Notes / known limitations

- The Go backend keeps data in memory; it resets on restart.
- The Express backend (`backend/`) is not the source of the mobile API surface yet
  (missing several endpoints the web app expects).
- API requests from the app go to the backend server URL configured in
  `capacitor.config.json`.

## 8. Install from the browser (PWA)

The app is now installable as a Progressive Web App (PWA) from the browser on Android:

- `manifest.json` — web app manifest (name, icons, theme color, standalone display).
- `service-worker.js` — service worker with a small cache-first strategy for the app shell.
- `icon-192.png`, `icon-512.png`, `icon.png`, `splash.png` — generated icons.
- `index.html` — PWA meta tags (`manifest`, `theme-color`, `mobile-web-app-capable`, Apple tags).
- `js/main.js` — registers `/service-worker.js`.

### How to install via browser on Android

1. Serve the app over HTTP(S), e.g. start the backend:
   ```bash
   go run backend-go/main.go
   ```
   The app is then available at `http://localhost:8080` (emulator) or the LAN IP (physical device).
2. Open the app URL in **Chrome** on Android.
3. Chrome offers the install option (e.g. via the browser menu / address bar install badge) when
   the PWA criteria are met; if no prompt appears automatically, use Chrome's install flow.
4. The installed app runs standalone (full-screen, no browser UI).

### Notes

- Installability is best tested on a public HTTPS origin; on `http://localhost` some browsers
  restrict installability, though Chrome may still allow it for local testing.
- The Capacitor-based APK remains the native install path (`npx cap build android` → APK).
