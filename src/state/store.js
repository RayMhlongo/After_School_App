import { DEFAULT_SETTINGS, buildSeedData } from './schema.js';
import { getDb } from './db.js';

const STORES = ['children', 'activities', 'schedules', 'mealSettings', 'appSettings'];

function sortByLabel(items, key) {
  return [...items].sort((a, b) => String(a[key] || '').localeCompare(String(b[key] || '')));
}

export async function ensureSeeded() {
  const db = await getDb();
  const childCount = await db.count('children');
  if (childCount > 0) {
    return;
  }

  const seed = buildSeedData();
  const tx = db.transaction(STORES, 'readwrite');
  seed.children.forEach((item) => tx.objectStore('children').put(item));
  seed.activities.forEach((item) => tx.objectStore('activities').put(item));
  seed.schedules.forEach((item) => tx.objectStore('schedules').put(item));
  seed.mealSettings.forEach((item) => tx.objectStore('mealSettings').put(item));
  tx.objectStore('appSettings').put(seed.appSettings);
  await tx.done;
}

export async function loadSnapshot() {
  await ensureSeeded();
  const db = await getDb();
  const [children, activities, schedules, mealSettings, appSettings] = await Promise.all([
    db.getAll('children'),
    db.getAll('activities'),
    db.getAll('schedules'),
    db.getAll('mealSettings'),
    db.get('appSettings', 'app')
  ]);

  return {
    children: sortByLabel(children, 'name'),
    activities: sortByLabel(activities, 'nameEn'),
    schedules: [...schedules],
    mealSettings: sortByLabel(mealSettings, 'time'),
    appSettings: appSettings || { ...DEFAULT_SETTINGS }
  };
}

export async function putRecord(storeName, record) {
  const db = await getDb();
  await db.put(storeName, record);
}

export async function deleteChild(id) {
  const db = await getDb();
  const tx = db.transaction(['children', 'schedules'], 'readwrite');
  await tx.objectStore('children').delete(id);
  const schedules = await tx.objectStore('schedules').getAll();
  schedules
    .filter((schedule) => schedule.childId === id)
    .forEach((schedule) => tx.objectStore('schedules').delete(schedule.id));
  await tx.done;
}

export async function deleteActivity(id) {
  const db = await getDb();
  const tx = db.transaction(['activities', 'schedules'], 'readwrite');
  await tx.objectStore('activities').delete(id);
  const schedules = await tx.objectStore('schedules').getAll();
  schedules
    .filter((schedule) => schedule.activityId === id)
    .forEach((schedule) => tx.objectStore('schedules').delete(schedule.id));
  await tx.done;
}

export async function deleteSchedule(id) {
  const db = await getDb();
  await db.delete('schedules', id);
}

export async function deleteMeal(id) {
  const db = await getDb();
  await db.delete('mealSettings', id);
}

export async function saveSettings(settings) {
  const db = await getDb();
  await db.put('appSettings', settings);
}

export async function resetDemoData() {
  const db = await getDb();
  const tx = db.transaction(STORES, 'readwrite');
  await Promise.all(
    STORES.map((storeName) => tx.objectStore(storeName).clear())
  );
  const seed = buildSeedData();
  seed.children.forEach((item) => tx.objectStore('children').put(item));
  seed.activities.forEach((item) => tx.objectStore('activities').put(item));
  seed.schedules.forEach((item) => tx.objectStore('schedules').put(item));
  seed.mealSettings.forEach((item) => tx.objectStore('mealSettings').put(item));
  tx.objectStore('appSettings').put(seed.appSettings);
  await tx.done;
}
