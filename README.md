# After School Planner

Mobile-first bilingual after-school planner for Android, built with HTML, CSS, JavaScript, Vite, and Capacitor.

## Included features

- Kids management with notes, grade, allergies, pickup notes, and reminder toggles
- Default and custom activities with bilingual naming and colour tags
- Weekly schedule views by week, day, child, and activity
- Local notification planning with exact-time and relative reminders
- Meal-saving logic showing how many children are away at meal time
- English and Afrikaans language switching stored locally
- Offline-first persistence with IndexedDB seed data
- Printable PDF exports for weekly, daily, child, and food-planning views
- Android adaptive icon assets generated from the bar-chart brand symbol

## Tech stack

- Vite
- Capacitor Android
- Capacitor Local Notifications
- Capacitor Filesystem
- Capacitor Share
- IndexedDB via `idb`
- jsPDF + `jspdf-autotable`

## Run locally

```bash
npm install
npm run dev
```

## Build web bundle

```bash
npm run build
```

## Sync Android

```bash
npm run cap:sync
```

## Build APK

```bash
npm run apk:debug
```

The generated debug APK is written to:

`android/app/build/outputs/apk/debug/app-debug.apk`

## Icon generation

```bash
npm run icons
```

This regenerates the Android adaptive icon layers and the exported `public/app-icon.png`.
