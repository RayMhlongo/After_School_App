export const DEFAULT_ACTIVITY_COLORS = [
  '#1fc9d8',
  '#2d7bf4',
  '#1e90a8',
  '#39d1ff',
  '#00b8b0',
  '#4ba3ff'
];

export const DEFAULT_ACTIVITIES = [
  {
    id: 'activity-netball',
    nameEn: 'Netball',
    nameAf: 'Netbal',
    color: '#39d1ff',
    icon: 'court',
    remindersEnabled: true,
    isDefault: true
  },
  {
    id: 'activity-maths',
    nameEn: 'Tjomme met Somme',
    nameAf: 'Tjomme met Somme',
    color: '#00b8b0',
    icon: 'book',
    remindersEnabled: true,
    isDefault: true
  },
  {
    id: 'activity-rugby',
    nameEn: 'Rugby',
    nameAf: 'Rugby',
    color: '#2d7bf4',
    icon: 'ball',
    remindersEnabled: true,
    isDefault: true
  },
  {
    id: 'activity-dance',
    nameEn: 'Dance',
    nameAf: 'Dans',
    color: '#21d5ae',
    icon: 'spark',
    remindersEnabled: true,
    isDefault: true
  },
  {
    id: 'activity-swimming',
    nameEn: 'Swimming',
    nameAf: 'Swem',
    color: '#42b6ff',
    icon: 'wave',
    remindersEnabled: true,
    isDefault: true
  },
  {
    id: 'activity-computer',
    nameEn: 'Computer Class',
    nameAf: 'Rekenaarklas',
    color: '#58f0d7',
    icon: 'code',
    remindersEnabled: true,
    isDefault: true
  }
];

export const DEFAULT_SETTINGS = {
  id: 'app',
  language: 'en',
  defaultDurationMinutes: 90,
  dailySummaryEnabled: true,
  dailySummaryTime: '06:15',
  notificationWindowDays: 14,
  introComplete: false
};

export const DEMO_CHILDREN = [
  {
    id: 'child-jason',
    name: 'Jason',
    grade: 'Grade 6',
    group: 'Blue House',
    notes: 'Prefers to keep bag packed the night before.',
    pickupNotes: 'Collect from south gate if practice ends after 17:00.',
    allergies: 'Peanuts',
    transportNote: 'Lift club with Aunt Nandi on Tuesdays.',
    remindersEnabled: true
  },
  {
    id: 'child-ava',
    name: 'Ava',
    grade: 'Grade 4',
    group: 'Yellow House',
    notes: 'Dance shoes stay in the car.',
    pickupNotes: 'Needs water bottle for every activity.',
    allergies: '',
    transportNote: '',
    remindersEnabled: true
  },
  {
    id: 'child-liam',
    name: 'Liam',
    grade: 'Grade 7',
    group: 'Red House',
    notes: 'Takes laptop to computer class.',
    pickupNotes: 'Walks to coding room with supervision.',
    allergies: '',
    transportNote: 'School shuttle on Thursdays.',
    remindersEnabled: true
  },
  {
    id: 'child-zara',
    name: 'Zara',
    grade: 'Grade 3',
    group: 'Green House',
    notes: 'Needs costume bag on Fridays.',
    pickupNotes: 'Collect from studio entrance.',
    allergies: 'Dairy',
    transportNote: '',
    remindersEnabled: true
  }
];

export const DEMO_MEALS = [
  {
    id: 'meal-supper',
    labelEn: 'Supper',
    labelAf: 'Aandete',
    time: '17:30',
    reminderEnabled: true
  }
];

export const DEMO_SCHEDULES = [
  {
    id: 'schedule-1',
    childId: 'child-jason',
    activityId: 'activity-rugby',
    dayOfWeek: 2,
    startTime: '16:00',
    endTime: '17:45',
    recurring: true,
    reminderMinutes: [120, 30],
    exactReminderTime: '',
    notes: ''
  },
  {
    id: 'schedule-2',
    childId: 'child-ava',
    activityId: 'activity-netball',
    dayOfWeek: 2,
    startTime: '16:30',
    endTime: '18:00',
    recurring: true,
    reminderMinutes: [60, 15],
    exactReminderTime: '',
    notes: ''
  },
  {
    id: 'schedule-3',
    childId: 'child-liam',
    activityId: 'activity-computer',
    dayOfWeek: 4,
    startTime: '15:30',
    endTime: '17:00',
    recurring: true,
    reminderMinutes: [60],
    exactReminderTime: '14:45',
    notes: ''
  },
  {
    id: 'schedule-4',
    childId: 'child-zara',
    activityId: 'activity-dance',
    dayOfWeek: 5,
    startTime: '16:00',
    endTime: '17:30',
    recurring: true,
    reminderMinutes: [30],
    exactReminderTime: '',
    notes: ''
  },
  {
    id: 'schedule-5',
    childId: 'child-jason',
    activityId: 'activity-swimming',
    dayOfWeek: 3,
    startTime: '15:45',
    endTime: '17:10',
    recurring: true,
    reminderMinutes: [60, 15],
    exactReminderTime: '',
    notes: ''
  },
  {
    id: 'schedule-6',
    childId: 'child-ava',
    activityId: 'activity-maths',
    dayOfWeek: 1,
    startTime: '14:30',
    endTime: '15:45',
    recurring: true,
    reminderMinutes: [30],
    exactReminderTime: '',
    notes: ''
  }
];

export function buildSeedData() {
  return {
    children: [...DEMO_CHILDREN],
    activities: [...DEFAULT_ACTIVITIES],
    schedules: [...DEMO_SCHEDULES],
    mealSettings: [...DEMO_MEALS],
    appSettings: { ...DEFAULT_SETTINGS }
  };
}

export function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
