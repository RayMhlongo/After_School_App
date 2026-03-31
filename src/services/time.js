const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DATE_PRESETS = {
  short: { year: 'numeric', month: 'short', day: 'numeric' },
  compact: { year: 'numeric', month: '2-digit', day: '2-digit' },
  weekday: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  monthDay: { month: 'short', day: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit' }
};

function normalizeYear(value) {
  if (value === true) {
    return 'numeric';
  }

  return value === '2-digit' ? '2-digit' : value === 'numeric' ? 'numeric' : undefined;
}

function normalizeMonth(value) {
  if (value === true) {
    return 'short';
  }

  return ['numeric', '2-digit', 'long', 'short', 'narrow'].includes(value) ? value : undefined;
}

function normalizeDay(value) {
  if (value === true) {
    return 'numeric';
  }

  return value === '2-digit' ? '2-digit' : value === 'numeric' ? 'numeric' : undefined;
}

function normalizeWeekday(value) {
  return ['long', 'short', 'narrow'].includes(value) ? value : undefined;
}

function normalizeTimePart(value) {
  if (value === true) {
    return '2-digit';
  }

  return value === '2-digit' ? '2-digit' : value === 'numeric' ? 'numeric' : undefined;
}

export function getAppLocale(language = 'en') {
  if (language === 'af' || language === 'af-ZA') {
    return 'af-ZA';
  }

  if (language === 'en' || language === 'en-ZA') {
    return 'en-ZA';
  }

  return language;
}

export function normalizeDateFormatOptions(options = {}) {
  const normalized = {};

  if ('weekday' in options) {
    const weekday = normalizeWeekday(options.weekday);
    if (weekday) {
      normalized.weekday = weekday;
    }
  }

  if ('year' in options) {
    const year = normalizeYear(options.year);
    if (year) {
      normalized.year = year;
    }
  }

  if ('month' in options) {
    const month = normalizeMonth(options.month);
    if (month) {
      normalized.month = month;
    }
  }

  if ('day' in options) {
    const day = normalizeDay(options.day);
    if (day) {
      normalized.day = day;
    }
  }

  if ('hour' in options) {
    const hour = normalizeTimePart(options.hour);
    if (hour) {
      normalized.hour = hour;
    }
  }

  if ('minute' in options) {
    const minute = normalizeTimePart(options.minute);
    if (minute) {
      normalized.minute = minute;
    }
  }

  if ('hour12' in options) {
    normalized.hour12 = Boolean(options.hour12);
  }

  return Object.keys(normalized).length ? normalized : { ...DATE_PRESETS.short };
}

export function formatAppDate(date, locale = 'en-ZA', mode = 'short') {
  const value = date instanceof Date ? date : new Date(date);
  const options =
    typeof mode === 'string'
      ? normalizeDateFormatOptions(DATE_PRESETS[mode] || DATE_PRESETS.short)
      : normalizeDateFormatOptions(mode);

  return new Intl.DateTimeFormat(locale, options).format(value);
}

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
  if (typeof options === 'string') {
    return formatAppDate(date, getAppLocale(language), options);
  }

  return formatAppDate(date, getAppLocale(language), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...options
  });
}

export function formatDisplayTime(time, language = 'en') {
  return formatAppDate(combineDateAndTime(new Date(), time), getAppLocale(language), 'time');
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
