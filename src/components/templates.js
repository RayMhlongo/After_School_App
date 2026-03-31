import { availableActivityIcons, icon } from './icons.js';
import { createTranslator, getActivityName, getMealLabel, getWeekdayLabel } from '../services/i18n.js';
import {
  buildExportRows,
  getDashboardSummary,
  getMealSummaryForDate,
  getSchedulesForDate,
  getWeekSchedule
} from '../services/planner.js';
import {
  formatDisplayDate,
  formatDisplayTime,
  formatDurationLabel,
  parseDateInput
} from '../services/time.js';
import { DEFAULT_ACTIVITY_COLORS } from '../state/schema.js';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function navItem(id, label, iconName, active) {
  return `
    <button class="bottom-nav__item ${active ? 'is-active' : ''}" data-action="set-screen" data-screen="${id}">
      ${icon(iconName)}
      <span>${label}</span>
    </button>
  `;
}

function statCard(label, value, accent = '') {
  return `
    <article class="stat-card ${accent}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function activityChip(activity, language) {
  return `
    <span class="chip" style="--chip:${escapeHtml(activity.color)};">
      ${icon(activity.icon, 'chip__icon')}
      ${escapeHtml(getActivityName(activity, language))}
    </span>
  `;
}

function listEmpty(message) {
  return `<div class="empty-card">${message}</div>`;
}

function childCard(child, schedules, language, t) {
  return `
    <article class="list-card">
      <div class="list-card__top">
        <div>
          <h3>${escapeHtml(child.name)}</h3>
          <p>${escapeHtml([child.grade, child.group].filter(Boolean).join(' • ') || t('kidsListTitle'))}</p>
        </div>
        <div class="list-card__actions">
          <button class="icon-button" data-action="edit-child" data-id="${child.id}">${icon('edit')}</button>
          <button class="icon-button danger" data-action="delete-child" data-id="${child.id}">${icon('trash')}</button>
        </div>
      </div>
      <div class="meta-row">
        <span>${t('activityReminderLabel')}</span>
        <strong>${child.remindersEnabled ? t('permissionGranted') : t('notifyOff')}</strong>
      </div>
      <div class="card-tags">
        ${schedules
          .slice(0, 3)
          .map((schedule) => activityChip(schedule.activity, language))
          .join('') || `<span class="muted">${t('noSchedulesToday')}</span>`}
      </div>
      ${child.allergies ? `<p class="note-line">${t('allergies')}: ${escapeHtml(child.allergies)}</p>` : ''}
      ${child.pickupNotes ? `<p class="note-line">${t('pickupNotes')}: ${escapeHtml(child.pickupNotes)}</p>` : ''}
    </article>
  `;
}

function activityCard(activity, scheduleCount, language, t) {
  return `
    <article class="list-card">
      <div class="list-card__top">
        <div class="activity-head">
          <span class="activity-swatch" style="--swatch:${escapeHtml(activity.color)};"></span>
          <div>
            <h3>${escapeHtml(getActivityName(activity, language))}</h3>
            <p>${scheduleCount} ${t('schedule').toLowerCase()}</p>
          </div>
        </div>
        <div class="list-card__actions">
          <button class="icon-button" data-action="edit-activity" data-id="${activity.id}">${icon('edit')}</button>
          <button class="icon-button danger" data-action="delete-activity" data-id="${activity.id}">${icon('trash')}</button>
        </div>
      </div>
      <div class="card-tags">
        ${activityChip(activity, language)}
        <span class="pill">${activity.remindersEnabled ? t('notifications') : t('notifyOff')}</span>
      </div>
    </article>
  `;
}

function scheduleCard(schedule, language, t) {
  return `
    <article class="list-card schedule-card">
      <div class="list-card__top">
        <div>
          <h3>${escapeHtml(schedule.child.name)}</h3>
          <p>${escapeHtml(getActivityName(schedule.activity, language))}</p>
        </div>
        <div class="list-card__actions">
          <button class="icon-button" data-action="edit-schedule" data-id="${schedule.id}">${icon('edit')}</button>
          <button class="icon-button danger" data-action="delete-schedule" data-id="${schedule.id}">${icon('trash')}</button>
        </div>
      </div>
      <div class="meta-row">
        <span>${t('dayOfWeek')}</span>
        <strong>${getWeekdayLabel(schedule.dayOfWeek, language)}</strong>
      </div>
      <div class="meta-row">
        <span>${t('startTime')}</span>
        <strong>${formatDurationLabel(schedule.startTime, schedule.computedEndTime, language)}</strong>
      </div>
      <div class="card-tags">
        ${activityChip(schedule.activity, language)}
        ${(schedule.reminderMinutes || []).map((minutes) => `<span class="pill">${minutes}m</span>`).join('')}
        ${schedule.exactReminderTime ? `<span class="pill">${schedule.exactReminderTime}</span>` : ''}
      </div>
      ${schedule.notes ? `<p class="note-line">${escapeHtml(schedule.notes)}</p>` : ''}
    </article>
  `;
}

function mealCard(meal, language, t) {
  const countLabel =
    meal.awayCount === 1
      ? t('saveFoodForCountSingle')
      : t('saveFoodForCount', { count: meal.awayCount });

  return `
    <article class="list-card">
      <div class="list-card__top">
        <div>
          <h3>${escapeHtml(getMealLabel(meal, language))}</h3>
          <p>${formatDisplayTime(meal.time, language)}</p>
        </div>
        <div class="list-card__actions">
          <button class="icon-button" data-action="edit-meal" data-id="${meal.id}">${icon('edit')}</button>
          <button class="icon-button danger" data-action="delete-meal" data-id="${meal.id}">${icon('trash')}</button>
        </div>
      </div>
      <div class="meta-row">
        <span>${t('mealsToSave')}</span>
        <strong>${meal.awayCount}</strong>
      </div>
      <p class="note-line">${countLabel}</p>
      <p class="note-line">${meal.awayChildren.map((child) => child.name).join(', ') || t('noMealConflicts')}</p>
    </article>
  `;
}

function reminderPreview(preview, language, t) {
  if (!preview.length) {
    return listEmpty(t('noNotifications'));
  }

  return preview
    .map(
      (item) => `
        <article class="mini-card">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.body)}</p>
          </div>
          <span>${formatDisplayDate(item.at, language)}<br />${formatDisplayTime(
            `${String(item.at.getHours()).padStart(2, '0')}:${String(item.at.getMinutes()).padStart(2, '0')}`,
            language
          )}</span>
        </article>
      `
    )
    .join('');
}

function renderDashboard(state, t, language) {
  const date = parseDateInput(state.ui.selectedDate);
  const summary = getDashboardSummary(state.snapshot, date, language);
  const upcoming = state.notificationPreview.slice(0, 4);

  return `
    <section class="screen ${state.ui.activeScreen === 'dashboard' ? 'is-active' : ''}" data-screen="dashboard">
      <div class="hero-card">
        <div>
          <p class="eyebrow">${formatDisplayDate(date, language, { weekday: 'long', month: 'long', year: true })}</p>
          <h2>${t('introTitle')}</h2>
          <p>${t('introText')}</p>
        </div>
        <div class="hero-actions">
          <button class="action-pill" data-action="open-modal" data-modal="child">${icon('plus')}${t('addChild')}</button>
          <button class="action-pill" data-action="open-modal" data-modal="schedule">${icon('calendar')}${t('addSchedule')}</button>
          <button class="action-pill" data-action="switch-more" data-tab="exports">${icon('pdf')}${t('exportPdf')}</button>
        </div>
      </div>
      <div class="stats-grid">
        ${statCard(t('today'), summary.todayCount, 'glow')}
        ${statCard(t('kidsOut'), summary.kidsOutNow)}
        ${statCard(t('mealsToSave'), summary.mealsToSave)}
        ${statCard(t('upcomingReminders'), upcoming.length)}
      </div>
      <section class="panel">
        <div class="section-title">
          <h3>${t('today')}</h3>
          <span>${summary.todayCount}</span>
        </div>
        ${summary.todaySchedules.length
          ? summary.todaySchedules.map((schedule) => scheduleCard(schedule, language, t)).join('')
          : listEmpty(t('noSchedulesToday'))}
      </section>
      <section class="panel">
        <div class="section-title">
          <h3>${t('upcomingReminders')}</h3>
          <span>${t('ownerControls')}</span>
        </div>
        ${reminderPreview(upcoming, language, t)}
      </section>
    </section>
  `;
}

function renderKids(state, t, language) {
  const query = state.ui.childSearch.trim().toLowerCase();
  const children = state.snapshot.children.filter((child) =>
    !query ? true : child.name.toLowerCase().includes(query)
  );

  return `
    <section class="screen ${state.ui.activeScreen === 'kids' ? 'is-active' : ''}" data-screen="kids">
      <section class="panel">
        <div class="toolbar">
          <input class="search-input" type="search" name="childSearch" value="${escapeHtml(
            state.ui.childSearch
          )}" placeholder="${t('searchKids')}" />
          <button class="primary-button compact" data-action="open-modal" data-modal="child">${icon('plus')}${t('addChild')}</button>
        </div>
        <div class="card-stack">
          ${children.length
            ? children
                .map((child) =>
                  childCard(
                    child,
                    state.snapshot.schedules
                      .filter((schedule) => schedule.childId === child.id)
                      .map((schedule) => ({
                        ...schedule,
                        activity: state.snapshot.activities.find((activity) => activity.id === schedule.activityId)
                      }))
                      .filter((schedule) => schedule.activity),
                    language,
                    t
                  )
                )
                .join('')
            : listEmpty(t('noKidsYet'))}
        </div>
      </section>
    </section>
  `;
}

function renderWeekView(state, t, language) {
  const weekSchedule = getWeekSchedule(state.snapshot, parseDateInput(state.ui.selectedDate));
  return weekSchedule
    .map(
      (day) => `
        <article class="accordion-card">
          <div class="accordion-card__head">
            <div>
              <h4>${getWeekdayLabel(day.dayOfWeek, language)}</h4>
              <p>${formatDisplayDate(day.date, language)}</p>
            </div>
            <span class="pill">${day.items.length}</span>
          </div>
          ${day.items.length
            ? day.items.map((schedule) => scheduleCard(schedule, language, t)).join('')
            : `<p class="muted">${t('noSchedulesToday')}</p>`}
        </article>
      `
    )
    .join('');
}

function renderDayView(state, t, language) {
  const schedules = getSchedulesForDate(state.snapshot, parseDateInput(state.ui.selectedDate));
  return schedules.length
    ? schedules.map((schedule) => scheduleCard(schedule, language, t)).join('')
    : listEmpty(t('noSchedulesToday'));
}

function renderChildView(state, t, language) {
  const childId = state.ui.filterChildId || state.snapshot.children[0]?.id || '';
  const rows = buildExportRows(state.snapshot, language, { type: 'child', childId });

  return childId && rows.length
    ? rows
        .map(
          (row) => `
            <article class="mini-card">
              <div>
                <strong>${escapeHtml(row.activity)}</strong>
                <p>${escapeHtml(row.day)}</p>
              </div>
              <span>${escapeHtml(row.time)}</span>
            </article>
          `
        )
        .join('')
    : listEmpty(t('noItemsForFilter'));
}

function renderActivityView(state, t, language) {
  const activityId = state.ui.filterActivityId || state.snapshot.activities[0]?.id || '';
  const rows = buildExportRows(state.snapshot, language, { type: 'activity', activityId });

  return activityId && rows.length
    ? rows
        .map(
          (row) => `
            <article class="mini-card">
              <div>
                <strong>${escapeHtml(row.child)}</strong>
                <p>${escapeHtml(row.day)}</p>
              </div>
              <span>${escapeHtml(row.time)}</span>
            </article>
          `
        )
        .join('')
    : listEmpty(t('noItemsForFilter'));
}

function renderSchedule(state, t, language) {
  return `
    <section class="screen ${state.ui.activeScreen === 'schedule' ? 'is-active' : ''}" data-screen="schedule">
      <section class="panel">
        <div class="section-title">
          <h3>${t('timetable')}</h3>
          <button class="primary-button compact" data-action="open-modal" data-modal="schedule">${icon('plus')}${t('addSchedule')}</button>
        </div>
        <div class="toolbar stack-on-mobile">
          <div class="segmented-control">
            ${['week', 'day', 'child', 'activity']
              .map(
                (view) => `
                  <button class="${state.ui.scheduleView === view ? 'is-active' : ''}" data-action="set-schedule-view" data-view="${view}">
                    ${t(view === 'week' ? 'byWeek' : view === 'day' ? 'byDay' : view === 'child' ? 'byChild' : 'byActivity')}
                  </button>
                `
              )
              .join('')}
          </div>
          <input class="search-input" type="date" name="selectedDate" value="${state.ui.selectedDate}" />
        </div>
        ${state.ui.scheduleView === 'child'
          ? `
            <select class="select-input" name="filterChildId">
              ${state.snapshot.children
                .map(
                  (child) => `
                    <option value="${child.id}" ${child.id === state.ui.filterChildId ? 'selected' : ''}>${escapeHtml(child.name)}</option>
                  `
                )
                .join('')}
            </select>
          `
          : ''}
        ${state.ui.scheduleView === 'activity'
          ? `
            <select class="select-input" name="filterActivityId">
              ${state.snapshot.activities
                .map(
                  (activity) => `
                    <option value="${activity.id}" ${activity.id === state.ui.filterActivityId ? 'selected' : ''}>${escapeHtml(getActivityName(activity, language))}</option>
                  `
                )
                .join('')}
            </select>
          `
          : ''}
        <div class="card-stack">
          ${state.ui.scheduleView === 'week'
            ? renderWeekView(state, t, language)
            : state.ui.scheduleView === 'day'
              ? renderDayView(state, t, language)
              : state.ui.scheduleView === 'child'
                ? renderChildView(state, t, language)
                : renderActivityView(state, t, language)}
        </div>
      </section>
    </section>
  `;
}

function renderFood(state, t, language) {
  const meals = getMealSummaryForDate(state.snapshot, parseDateInput(state.ui.selectedDate), language);

  return `
    <section class="screen ${state.ui.activeScreen === 'food' ? 'is-active' : ''}" data-screen="food">
      <section class="panel">
        <div class="section-title">
          <div>
            <h3>${t('mealPlanner')}</h3>
            <p>${t('foodSummaryTitle')}</p>
          </div>
          <button class="primary-button compact" data-action="open-modal" data-modal="meal">${icon('plus')}${t('addMeal')}</button>
        </div>
        <div class="toolbar">
          <input class="search-input" type="date" name="selectedDate" value="${state.ui.selectedDate}" />
        </div>
        <div class="card-stack">
          ${meals.length ? meals.map((meal) => mealCard(meal, language, t)).join('') : listEmpty(t('noMealConflicts'))}
        </div>
      </section>
    </section>
  `;
}

function renderActivitiesPanel(state, t, language) {
  return `
    <div class="card-stack">
      <div class="section-title">
        <div>
          <h3>${t('manageActivities')}</h3>
          <p>${t('customActivities')}</p>
        </div>
        <button class="primary-button compact" data-action="open-modal" data-modal="activity">${icon('plus')}${t('addActivity')}</button>
      </div>
      ${state.snapshot.activities.length
        ? state.snapshot.activities
            .map((activity) =>
              activityCard(
                activity,
                state.snapshot.schedules.filter((schedule) => schedule.activityId === activity.id).length,
                language,
                t
              )
            )
            .join('')
        : listEmpty(t('noActivitiesYet'))}
    </div>
  `;
}

function renderNotificationsPanel(state, t, language) {
  return `
    <div class="card-stack">
      <article class="list-card">
        <div class="list-card__top">
          <div>
            <h3>${t('notificationSettings')}</h3>
            <p>${t('exactTiming')}</p>
          </div>
          <span class="pill">${escapeHtml(state.permissionStatusLabel)}</span>
        </div>
        <button class="primary-button" data-action="request-permission">${icon('bell')}${t('requestPermission')}</button>
      </article>
      <section class="panel subtle">
        <div class="section-title">
          <h3>${t('nextReminders')}</h3>
          <span>${state.notificationPreview.length}</span>
        </div>
        ${reminderPreview(state.notificationPreview.slice(0, 8), language, t)}
      </section>
    </div>
  `;
}

function renderExportPanel(state, t) {
  const childOptions = state.snapshot.children
    .map(
      (child) => `
        <option value="${child.id}" ${child.id === state.ui.exportChildId ? 'selected' : ''}>${escapeHtml(child.name)}</option>
      `
    )
    .join('');

  return `
    <div class="card-stack">
      <article class="list-card">
        <h3>${t('exportTools')}</h3>
        <p>${t('printReady')}</p>
        <div class="action-grid">
          <button class="secondary-button" data-action="export-pdf" data-export="weekly">${icon('pdf')}${t('exportWeekly')}</button>
          <button class="secondary-button" data-action="export-pdf" data-export="day">${icon('pdf')}${t('exportDay')}</button>
          <button class="secondary-button" data-action="export-pdf" data-export="food">${icon('pdf')}${t('exportFood')}</button>
        </div>
      </article>
      <article class="list-card">
        <label class="field">
          <span>${t('pickChild')}</span>
          <select class="select-input" name="exportChildId">${childOptions}</select>
        </label>
        <label class="field">
          <span>${t('viewByDate')}</span>
          <input class="search-input" type="date" name="exportDate" value="${state.ui.exportDate}" />
        </label>
        <button class="primary-button" data-action="export-pdf" data-export="child">${icon('pdf')}${t('exportChild')}</button>
      </article>
      ${state.exportStatus ? `<div class="status-banner">${escapeHtml(state.exportStatus)}</div>` : ''}
    </div>
  `;
}

function renderSettingsPanel(state, t) {
  return `
    <form class="form-card" id="settings-form">
      <div class="section-title">
        <div>
          <h3>${t('appPreferences')}</h3>
          <p>${t('versionLabel')}</p>
        </div>
      </div>
      <label class="field">
        <span>${t('language')}</span>
        <select class="select-input" name="language">
          <option value="en" ${state.snapshot.appSettings.language === 'en' ? 'selected' : ''}>${t('english')}</option>
          <option value="af" ${state.snapshot.appSettings.language === 'af' ? 'selected' : ''}>${t('afrikaans')}</option>
        </select>
      </label>
      <label class="field">
        <span>${t('defaultDuration')}</span>
        <input class="search-input" type="number" name="defaultDurationMinutes" min="30" max="360" value="${state.snapshot.appSettings.defaultDurationMinutes}" />
      </label>
      <label class="field">
        <span>${t('dailySummaryTime')}</span>
        <input class="search-input" type="time" name="dailySummaryTime" value="${state.snapshot.appSettings.dailySummaryTime}" />
      </label>
      <label class="toggle-field">
        <span>${t('dailySummary')}</span>
        <input type="checkbox" name="dailySummaryEnabled" ${state.snapshot.appSettings.dailySummaryEnabled ? 'checked' : ''} />
      </label>
      <label class="field">
        <span>${t('reminderWindow')}</span>
        <input class="search-input" type="number" name="notificationWindowDays" min="1" max="21" value="${state.snapshot.appSettings.notificationWindowDays}" />
      </label>
      <div class="action-grid">
        <button class="primary-button" type="submit">${icon('settings')}${t('settings')}</button>
        <button class="secondary-button danger-outline" type="button" data-action="reset-demo">${icon('trash')}${t('resetDemo')}</button>
      </div>
    </form>
  `;
}

function renderMore(state, t, language) {
  const tabs = ['activities', 'notifications', 'exports', 'settings'];

  return `
    <section class="screen ${state.ui.activeScreen === 'more' ? 'is-active' : ''}" data-screen="more">
      <section class="panel">
        <div class="segmented-control">
          ${tabs
            .map(
              (tab) => `
                <button class="${state.ui.moreTab === tab ? 'is-active' : ''}" data-action="switch-more" data-tab="${tab}">
                  ${t(tab)}
                </button>
              `
            )
            .join('')}
        </div>
        <div class="panel-body">
          ${state.ui.moreTab === 'activities'
            ? renderActivitiesPanel(state, t, language)
            : state.ui.moreTab === 'notifications'
              ? renderNotificationsPanel(state, t, language)
              : state.ui.moreTab === 'exports'
                ? renderExportPanel(state, t)
                : renderSettingsPanel(state, t)}
        </div>
      </section>
    </section>
  `;
}

function renderReminderOptions(record = {}, t) {
  const selected = new Set(record.reminderMinutes || []);
  const options = [
    [120, 'reminder2h'],
    [60, 'reminder1h'],
    [30, 'reminder30m'],
    [15, 'reminder15m']
  ];

  return options
    .map(
      ([value, label]) => `
        <label class="check-pill">
          <input type="checkbox" name="reminderMinutes" value="${value}" ${selected.has(value) ? 'checked' : ''} />
          <span>${t(label)}</span>
        </label>
      `
    )
    .join('');
}

function renderModal(state, t, language) {
  if (!state.ui.modal) {
    return '';
  }

  const modal = state.ui.modal;
  const record = modal.record || {};
  const titleMap = {
    child: t('addChild'),
    activity: t('addActivity'),
    schedule: t('addSchedule'),
    meal: t('addMeal')
  };

  const body =
    modal.type === 'child'
      ? `
        <form class="sheet-form" id="child-form" data-mode="${record.id ? 'edit' : 'create'}" data-id="${record.id || ''}">
          <label class="field"><span>${t('childName')}</span><input class="search-input" name="name" required value="${escapeHtml(record.name || '')}" /></label>
          <label class="field"><span>${t('grade')}</span><input class="search-input" name="grade" value="${escapeHtml(record.grade || '')}" /></label>
          <label class="field"><span>${t('group')}</span><input class="search-input" name="group" value="${escapeHtml(record.group || '')}" /></label>
          <label class="field"><span>${t('pickupNotes')}</span><textarea class="textarea-input" name="pickupNotes">${escapeHtml(record.pickupNotes || '')}</textarea></label>
          <label class="field"><span>${t('allergies')}</span><input class="search-input" name="allergies" value="${escapeHtml(record.allergies || '')}" /></label>
          <label class="field"><span>${t('transportNote')}</span><textarea class="textarea-input" name="transportNote">${escapeHtml(record.transportNote || '')}</textarea></label>
          <label class="field"><span>${t('notes')}</span><textarea class="textarea-input" name="notes">${escapeHtml(record.notes || '')}</textarea></label>
          <label class="toggle-field"><span>${t('remindersEnabled')}</span><input type="checkbox" name="remindersEnabled" ${record.remindersEnabled ?? true ? 'checked' : ''} /></label>
          <button class="primary-button" type="submit">${icon('plus')}${t('saveChild')}</button>
        </form>
      `
      : modal.type === 'activity'
        ? `
          <form class="sheet-form" id="activity-form" data-mode="${record.id ? 'edit' : 'create'}" data-id="${record.id || ''}">
            <label class="field"><span>${t('activityNameEn')}</span><input class="search-input" name="nameEn" required value="${escapeHtml(record.nameEn || '')}" /></label>
            <label class="field"><span>${t('activityNameAf')}</span><input class="search-input" name="nameAf" value="${escapeHtml(record.nameAf || '')}" /></label>
            <label class="field"><span>${t('colorTag')}</span><select class="select-input" name="color">${DEFAULT_ACTIVITY_COLORS
              .map((color) => `<option value="${color}" ${color === record.color ? 'selected' : ''}>${color}</option>`)
              .join('')}</select></label>
            <label class="field"><span>${t('icon')}</span><select class="select-input" name="icon">${availableActivityIcons()
              .map((name) => `<option value="${name}" ${name === record.icon ? 'selected' : ''}>${name}</option>`)
              .join('')}</select></label>
            <label class="toggle-field"><span>${t('remindersEnabled')}</span><input type="checkbox" name="remindersEnabled" ${record.remindersEnabled ?? true ? 'checked' : ''} /></label>
            <button class="primary-button" type="submit">${icon('plus')}${t('saveActivity')}</button>
          </form>
        `
        : modal.type === 'schedule'
          ? `
            <form class="sheet-form" id="schedule-form" data-mode="${record.id ? 'edit' : 'create'}" data-id="${record.id || ''}">
              <label class="field"><span>${t('child')}</span><select class="select-input" name="childId" required>${state.snapshot.children
                .map(
                  (child) => `<option value="${child.id}" ${child.id === record.childId ? 'selected' : ''}>${escapeHtml(child.name)}</option>`
                )
                .join('')}</select></label>
              <label class="field"><span>${t('activity')}</span><select class="select-input" name="activityId" required>${state.snapshot.activities
                .map(
                  (activity) => `<option value="${activity.id}" ${activity.id === record.activityId ? 'selected' : ''}>${escapeHtml(getActivityName(activity, language))}</option>`
                )
                .join('')}</select></label>
              <label class="field"><span>${t('dayOfWeek')}</span><select class="select-input" name="dayOfWeek">${Array.from({ length: 7 }, (_, index) => index + 1)
                .map(
                  (day) => `<option value="${day}" ${day === record.dayOfWeek ? 'selected' : ''}>${getWeekdayLabel(day, language)}</option>`
                )
                .join('')}</select></label>
              <div class="double-field">
                <label class="field"><span>${t('startTime')}</span><input class="search-input" type="time" name="startTime" required value="${record.startTime || '16:00'}" /></label>
                <label class="field"><span>${t('endTime')}</span><input class="search-input" type="time" name="endTime" value="${record.endTime || ''}" /></label>
              </div>
              <label class="field"><span>${t('exactReminderTime')}</span><input class="search-input" type="time" name="exactReminderTime" value="${record.exactReminderTime || ''}" /></label>
              <div class="field">
                <span>${t('relativeReminders')}</span>
                <div class="reminder-grid">${renderReminderOptions(record, t)}</div>
              </div>
              <label class="field"><span>${t('notes')}</span><textarea class="textarea-input" name="notes">${escapeHtml(record.notes || '')}</textarea></label>
              <button class="primary-button" type="submit">${icon('plus')}${t('saveSchedule')}</button>
            </form>
          `
          : `
            <form class="sheet-form" id="meal-form" data-mode="${record.id ? 'edit' : 'create'}" data-id="${record.id || ''}">
              <label class="field"><span>${t('mealNameEn')}</span><input class="search-input" name="labelEn" required value="${escapeHtml(record.labelEn || '')}" /></label>
              <label class="field"><span>${t('mealNameAf')}</span><input class="search-input" name="labelAf" value="${escapeHtml(record.labelAf || '')}" /></label>
              <label class="field"><span>${t('mealTime')}</span><input class="search-input" type="time" name="time" required value="${record.time || '17:30'}" /></label>
              <label class="toggle-field"><span>${t('mealReminder')}</span><input type="checkbox" name="reminderEnabled" ${record.reminderEnabled ?? true ? 'checked' : ''} /></label>
              <button class="primary-button" type="submit">${icon('plus')}${t('saveMeal')}</button>
            </form>
          `;

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="sheet" role="dialog" aria-modal="true">
        <header class="sheet__header">
          <div>
            <p class="eyebrow">${t('appName')}</p>
            <h3>${titleMap[modal.type]}</h3>
          </div>
          <button class="icon-button" data-action="close-modal">${icon('close')}</button>
        </header>
        <div class="sheet__body">
          ${body}
        </div>
      </section>
    </div>
  `;
}

export function renderApp(state) {
  const language = state.snapshot.appSettings.language || 'en';
  const t = createTranslator(language);

  return `
    <div class="app-shell">
      <header class="app-header">
        <div class="brand-mark">${icon('bar')}</div>
        <div class="brand-copy">
          <p>${t('compactPlanner')}</p>
          <h1>${t('appName')}</h1>
        </div>
        <button class="lang-toggle" data-action="toggle-language">${language.toUpperCase()}</button>
      </header>
      <main class="app-main">
        ${renderDashboard(state, t, language)}
        ${renderKids(state, t, language)}
        ${renderSchedule(state, t, language)}
        ${renderFood(state, t, language)}
        ${renderMore(state, t, language)}
      </main>
      <nav class="bottom-nav">
        ${navItem('dashboard', t('dashboard'), 'grid', state.ui.activeScreen === 'dashboard')}
        ${navItem('kids', t('kids'), 'kids', state.ui.activeScreen === 'kids')}
        ${navItem('schedule', t('schedule'), 'calendar', state.ui.activeScreen === 'schedule')}
        ${navItem('food', t('food'), 'food', state.ui.activeScreen === 'food')}
        ${navItem('more', t('more'), 'settings', state.ui.activeScreen === 'more')}
      </nav>
    </div>
    ${renderModal(state, t, language)}
    ${state.toast ? `<div class="toast toast--visible">${escapeHtml(state.toast)}</div>` : '<div class="toast"></div>'}
  `;
}
