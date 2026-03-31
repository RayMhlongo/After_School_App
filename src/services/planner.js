import { getActivityName, getMealLabel, getWeekdayLabel } from './i18n.js';
import {
  addDays,
  formatDateInput,
  getDateForWeekday,
  getScheduleEndTime,
  getStartOfWeek,
  isTimeWithinRange,
  sortByTime,
  timeToMinutes,
  weekdayFromDate
} from './time.js';

function joinSchedule(schedule, snapshot) {
  const child = snapshot.children.find((entry) => entry.id === schedule.childId);
  const activity = snapshot.activities.find((entry) => entry.id === schedule.activityId);

  return {
    ...schedule,
    child,
    activity,
    computedEndTime: getScheduleEndTime(schedule, snapshot.appSettings)
  };
}

export function getJoinedSchedules(snapshot) {
  return snapshot.schedules
    .map((schedule) => joinSchedule(schedule, snapshot))
    .filter((schedule) => schedule.child && schedule.activity);
}

export function getSchedulesForDate(snapshot, date) {
  const weekday = weekdayFromDate(date);
  return sortByTime(
    getJoinedSchedules(snapshot).filter((schedule) => schedule.dayOfWeek === weekday)
  );
}

export function getWeekDays(anchorDate) {
  const weekStart = getStartOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getWeekSchedule(snapshot, anchorDate) {
  const weekStart = getStartOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      dayOfWeek: index + 1,
      items: getSchedulesForDate(snapshot, date)
    };
  });
}

export function getChildSchedule(snapshot, childId) {
  return sortByTime(
    getJoinedSchedules(snapshot).filter((schedule) => schedule.childId === childId)
  );
}

export function getActivitySchedule(snapshot, activityId) {
  return sortByTime(
    getJoinedSchedules(snapshot).filter((schedule) => schedule.activityId === activityId)
  );
}

export function getMealSummaryForDate(snapshot, date, language = 'en') {
  const schedules = getSchedulesForDate(snapshot, date);
  const meals = sortByTime(snapshot.mealSettings);

  return meals.map((meal) => {
    const awaySchedules = schedules.filter((schedule) =>
      isTimeWithinRange(meal.time, schedule.startTime, schedule.computedEndTime)
    );
    const uniqueChildren = Array.from(
      new Map(awaySchedules.map((schedule) => [schedule.childId, schedule.child])).values()
    );

    return {
      ...meal,
      label: getMealLabel(meal, language),
      awayCount: uniqueChildren.length,
      awayChildren: uniqueChildren,
      schedules: awaySchedules
    };
  });
}

export function getKidsAwayCount(snapshot, date, time) {
  const schedules = getSchedulesForDate(snapshot, date).filter((schedule) =>
    isTimeWithinRange(time, schedule.startTime, schedule.computedEndTime)
  );
  return Array.from(new Set(schedules.map((schedule) => schedule.childId))).length;
}

export function getDashboardSummary(snapshot, date = new Date(), language = 'en') {
  const todaySchedules = getSchedulesForDate(snapshot, date);
  const meals = getMealSummaryForDate(snapshot, date, language);
  const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;

  return {
    todaySchedules,
    todayCount: todaySchedules.length,
    kidsOutNow: getKidsAwayCount(snapshot, date, currentTime),
    mealsToSave: meals.reduce((total, meal) => total + meal.awayCount, 0),
    meals
  };
}

export function getUpcomingSchedules(snapshot, date = new Date(), limit = 5) {
  const weekStart = getStartOfWeek(date);
  const upcoming = [];

  for (let offset = 0; offset < 14; offset += 1) {
    const currentDate = addDays(weekStart, offset);
    const daySchedules = getSchedulesForDate(snapshot, currentDate)
      .map((schedule) => ({
        ...schedule,
        date: currentDate
      }))
      .filter((schedule) => {
        const start = new Date(currentDate);
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        start.setHours(hours, minutes, 0, 0);
        return start.getTime() >= date.getTime();
      });

    upcoming.push(...daySchedules);
    if (upcoming.length >= limit) {
      break;
    }
  }

  return upcoming.slice(0, limit);
}

export function buildExportRows(snapshot, language = 'en', options = {}) {
  const view = options.type || 'weekly';
  const date = options.date ? new Date(options.date) : new Date();
  const joined = getJoinedSchedules(snapshot);

  if (view === 'child' && options.childId) {
    return getChildSchedule(snapshot, options.childId).map((schedule) => ({
      day: getWeekdayLabel(schedule.dayOfWeek, language),
      child: schedule.child.name,
      activity: getActivityName(schedule.activity, language),
      time: `${schedule.startTime} - ${schedule.computedEndTime}`,
      note: schedule.notes || ''
    }));
  }

  if (view === 'activity' && options.activityId) {
    return getActivitySchedule(snapshot, options.activityId).map((schedule) => ({
      day: getWeekdayLabel(schedule.dayOfWeek, language),
      child: schedule.child.name,
      activity: getActivityName(schedule.activity, language),
      time: `${schedule.startTime} - ${schedule.computedEndTime}`,
      note: schedule.notes || ''
    }));
  }

  if (view === 'day') {
    return getSchedulesForDate(snapshot, date).map((schedule) => ({
      day: getWeekdayLabel(schedule.dayOfWeek, language),
      child: schedule.child.name,
      activity: getActivityName(schedule.activity, language),
      time: `${schedule.startTime} - ${schedule.computedEndTime}`,
      note: schedule.notes || ''
    }));
  }

  return sortByTime(joined).map((schedule) => ({
    day: getWeekdayLabel(schedule.dayOfWeek, language),
    child: schedule.child.name,
    activity: getActivityName(schedule.activity, language),
    time: `${schedule.startTime} - ${schedule.computedEndTime}`,
    note: schedule.notes || ''
  }));
}

export function getWeekLabel(date, language = 'en') {
  const weekStart = getStartOfWeek(date);
  return `${getWeekdayLabel(1, language)} ${formatDateInput(weekStart)}`;
}

export function getDateFromWeekday(date, dayOfWeek) {
  return getDateForWeekday(getStartOfWeek(date), dayOfWeek);
}
