const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateInput(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function weekdayFromDate(date) {
  return date.getDay() === 0 ? 7 : date.getDay();
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * ONE_DAY_MS);
}

export function getStartOfWeek(input = new Date()) {
  const date = new Date(input.getFullYear(), input.getMonth(), input.getDate());
  const offset = weekdayFromDate(date) - 1;
  return addDays(date, -offset);
}

export function timeToMinutes(value) {
  if (!value) {
    return 0;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
}

export function minutesToTime(totalMinutes) {
  const safeMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

export function combineDateAndTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export function formatDisplayDate(date, language = 'en', options = {}) {
  return new Intl.DateTimeFormat(language === 'af' ? 'af-ZA' : 'en-ZA', {
    weekday: options.weekday ?? 'short',
    day: 'numeric',
    month: options.month ?? 'short',
    ...(options.year ? { year: options.year } : {})
  }).format(date);
}

export function formatDisplayTime(time, language = 'en') {
  return new Intl.DateTimeFormat(language === 'af' ? 'af-ZA' : 'en-ZA', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(combineDateAndTime(new Date(), time));
}

export function getScheduleEndTime(schedule, settings) {
  if (schedule.endTime) {
    return schedule.endTime;
  }

  return minutesToTime(
    timeToMinutes(schedule.startTime) + (settings.defaultDurationMinutes || 90)
  );
}

export function getDateForWeekday(weekStart, dayOfWeek) {
  return addDays(weekStart, dayOfWeek - 1);
}

export function isTimeWithinRange(time, start, end) {
  const current = timeToMinutes(time);
  return current >= timeToMinutes(start) && current <= timeToMinutes(end);
}

export function sortByTime(items) {
  return [...items].sort((a, b) => {
    const primary = timeToMinutes(a.startTime || a.time) - timeToMinutes(b.startTime || b.time);
    if (primary !== 0) {
      return primary;
    }

    return String(a.name || a.id).localeCompare(String(b.name || b.id));
  });
}

export function formatDurationLabel(startTime, endTime, language = 'en') {
  const from = formatDisplayTime(startTime, language);
  if (!endTime) {
    return from;
  }

  return `${from} - ${formatDisplayTime(endTime, language)}`;
}
