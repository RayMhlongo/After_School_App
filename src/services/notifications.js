import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { createTranslator, getActivityName, getMealLabel } from './i18n.js';
import { getMealSummaryForDate, getSchedulesForDate } from './planner.js';
import { addDays, combineDateAndTime, formatDisplayDate, formatDisplayTime } from './time.js';

const CHANNEL_ID = 'planner-alerts';
const BASE_NOTIFICATION_ID = 7000;

function buildScheduleReminder(schedule, date, language, minutesBefore) {
  const t = createTranslator(language);
  const activityName = getActivityName(schedule.activity, language);
  const startsAt = combineDateAndTime(date, schedule.startTime);
  const notifyAt = new Date(startsAt.getTime() - (minutesBefore * 60 * 1000));

  return {
    at: notifyAt,
    title: activityName,
    body:
      minutesBefore === 15
        ? t('startsSoon', { activity: activityName })
        : t('childActivityReminder', {
            child: schedule.child.name,
            activity: activityName,
            time: formatDisplayTime(schedule.startTime, language)
          })
  };
}

function buildExactReminder(schedule, date, language, time) {
  const t = createTranslator(language);

  return {
    at: combineDateAndTime(date, time),
    title: getActivityName(schedule.activity, language),
    body: t('childActivityReminder', {
      child: schedule.child.name,
      activity: getActivityName(schedule.activity, language),
      time: formatDisplayTime(schedule.startTime, language)
    })
  };
}

function buildDailySummary(snapshot, date, language) {
  const t = createTranslator(language);
  const schedules = getSchedulesForDate(snapshot, date);
  const childCount = new Set(schedules.map((schedule) => schedule.childId)).size;

  if (!childCount) {
    return null;
  }

  const at = combineDateAndTime(date, snapshot.appSettings.dailySummaryTime || '06:15');
  return {
    at,
    title: formatDisplayDate(date, language, { weekday: 'long', month: 'short', year: 'numeric' }),
    body:
      childCount === 1
        ? t('notificationSummarySingle')
        : t('notificationSummary', { count: childCount })
  };
}

function buildMealReminders(snapshot, date, language) {
  const t = createTranslator(language);

  return getMealSummaryForDate(snapshot, date, language)
    .filter((meal) => meal.reminderEnabled && meal.awayCount > 0)
    .map((meal) => ({
      at: combineDateAndTime(date, meal.time),
      title: getMealLabel(meal, language),
      body:
        meal.awayCount === 1
          ? t('mealReminderTextSingle', {
              time: formatDisplayTime(meal.time, language)
            })
          : t('mealReminderText', {
              count: meal.awayCount,
              time: formatDisplayTime(meal.time, language)
            })
    }));
}

export function buildNotificationPlan(snapshot, now = new Date()) {
  const items = [];
  const language = snapshot.appSettings.language || 'en';
  const horizon = Number(snapshot.appSettings.notificationWindowDays || 14);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let dayOffset = 0; dayOffset < horizon; dayOffset += 1) {
    const date = addDays(today, dayOffset);
    const daySchedules = getSchedulesForDate(snapshot, date);

    daySchedules.forEach((schedule) => {
      if (!schedule.activity?.remindersEnabled || !schedule.child?.remindersEnabled) {
        return;
      }

      (schedule.reminderMinutes || []).forEach((minutesBefore) => {
        items.push(buildScheduleReminder(schedule, date, language, minutesBefore));
      });

      if (schedule.exactReminderTime) {
        items.push(buildExactReminder(schedule, date, language, schedule.exactReminderTime));
      }
    });

    if (snapshot.appSettings.dailySummaryEnabled) {
      const dailySummary = buildDailySummary(snapshot, date, language);
      if (dailySummary) {
        items.push(dailySummary);
      }
    }

    items.push(...buildMealReminders(snapshot, date, language));
  }

  return items
    .filter((item) => item && item.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((item, index) => ({
      ...item,
      id: BASE_NOTIFICATION_ID + index
    }));
}

export function isNativeNotificationsAvailable() {
  return Capacitor.isNativePlatform();
}

export async function checkNotificationPermission() {
  if (!isNativeNotificationsAvailable()) {
    return 'web';
  }

  const permission = await LocalNotifications.checkPermissions();
  return permission.display;
}

export async function requestNotificationPermission() {
  if (!isNativeNotificationsAvailable()) {
    return 'web';
  }

  const permission = await LocalNotifications.requestPermissions();
  return permission.display;
}

async function ensureChannel() {
  if (!isNativeNotificationsAvailable()) {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Planner reminders',
      description: 'After School Planner reminders and meal alerts',
      importance: 4,
      visibility: 1,
      sound: 'default'
    });
  } catch (error) {
    console.warn('Notification channel setup skipped', error);
  }
}

export async function syncNotifications(snapshot) {
  const plan = buildNotificationPlan(snapshot);

  if (!isNativeNotificationsAvailable()) {
    return plan;
  }

  const permission = await checkNotificationPermission();
  if (permission !== 'granted') {
    return plan;
  }

  await ensureChannel();

  const pending = await LocalNotifications.getPending();
  if (pending.notifications?.length) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((notification) => ({ id: notification.id }))
    });
  }

  await LocalNotifications.removeAllDeliveredNotifications();

  if (!plan.length) {
    return plan;
  }

  await LocalNotifications.schedule({
    notifications: plan.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      channelId: CHANNEL_ID,
      schedule: {
        at: item.at,
        allowWhileIdle: true
      }
    }))
  });

  return plan;
}
