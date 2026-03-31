import { renderApp } from './components/templates.js';
import { createTranslator } from './services/i18n.js';
import { buildNotificationPlan, checkNotificationPermission, requestNotificationPermission, syncNotifications } from './services/notifications.js';
import { exportPdf } from './services/pdf.js';
import { loadSnapshot, putRecord, deleteActivity, deleteChild, deleteMeal, deleteSchedule, resetDemoData, saveSettings } from './state/store.js';
import { createId } from './state/schema.js';
import { formatDateInput } from './services/time.js';

function boolFromForm(formData, name) {
  return formData.get(name) === 'on';
}

function textFromForm(formData, name) {
  return String(formData.get(name) || '').trim();
}

export class PlannerApp {
  constructor(root) {
    this.root = root;
    const today = formatDateInput(new Date());
    this.state = {
      snapshot: {
        children: [],
        activities: [],
        schedules: [],
        mealSettings: [],
        appSettings: {}
      },
      ui: {
        activeScreen: 'dashboard',
        moreTab: 'activities',
        scheduleView: 'week',
        selectedDate: today,
        exportDate: today,
        filterChildId: '',
        filterActivityId: '',
        exportChildId: '',
        childSearch: '',
        modal: null
      },
      notificationPreview: [],
      permissionStatus: 'prompt',
      permissionStatusLabel: '',
      exportStatus: '',
      toast: ''
    };
    this.toastTimer = null;
  }

  async init() {
    await this.refresh();
    this.root.addEventListener('click', (event) => this.handleClick(event));
    this.root.addEventListener('submit', (event) => this.handleSubmit(event));
    this.root.addEventListener('change', (event) => this.handleChange(event));
    this.root.addEventListener('input', (event) => this.handleInput(event));
  }

  get t() {
    return createTranslator(this.state.snapshot.appSettings.language || 'en');
  }

  async refresh(options = {}) {
    this.state.snapshot = await loadSnapshot();
    this.ensureUiSelections();
    this.state.permissionStatus = await checkNotificationPermission();
    const planned = options.skipSchedule
      ? buildNotificationPlan(this.state.snapshot)
      : await syncNotifications(this.state.snapshot);
    this.state.notificationPreview = planned.slice(0, 10);
    this.state.permissionStatusLabel = this.describePermission();
    this.render();
  }

  ensureUiSelections() {
    this.state.ui.filterChildId ||= this.state.snapshot.children[0]?.id || '';
    this.state.ui.exportChildId ||= this.state.snapshot.children[0]?.id || '';
    this.state.ui.filterActivityId ||= this.state.snapshot.activities[0]?.id || '';

    if (
      this.state.ui.filterChildId &&
      !this.state.snapshot.children.some((child) => child.id === this.state.ui.filterChildId)
    ) {
      this.state.ui.filterChildId = this.state.snapshot.children[0]?.id || '';
    }

    if (
      this.state.ui.exportChildId &&
      !this.state.snapshot.children.some((child) => child.id === this.state.ui.exportChildId)
    ) {
      this.state.ui.exportChildId = this.state.snapshot.children[0]?.id || '';
    }

    if (
      this.state.ui.filterActivityId &&
      !this.state.snapshot.activities.some((activity) => activity.id === this.state.ui.filterActivityId)
    ) {
      this.state.ui.filterActivityId = this.state.snapshot.activities[0]?.id || '';
    }
  }

  describePermission() {
    if (this.state.permissionStatus === 'granted') {
      return this.t('permissionGranted');
    }

    if (this.state.permissionStatus === 'web') {
      return 'Web preview';
    }

    return this.t('permissionUnknown');
  }

  render() {
    this.root.innerHTML = renderApp(this.state);
  }

  setToast(message) {
    window.clearTimeout(this.toastTimer);
    this.state.toast = message;
    this.render();
    this.toastTimer = window.setTimeout(() => {
      this.state.toast = '';
      this.render();
    }, 2800);
  }

  openModal(type, record = null) {
    this.state.ui.modal = { type, record };
    this.render();
  }

  closeModal() {
    this.state.ui.modal = null;
    this.render();
  }

  async handleClick(event) {
    if (event.target.classList.contains('modal-backdrop')) {
      this.closeModal();
      return;
    }

    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    const action = button.dataset.action;

    if (action === 'set-screen') {
      this.state.ui.activeScreen = button.dataset.screen;
      this.render();
      return;
    }

    if (action === 'switch-more') {
      this.state.ui.activeScreen = 'more';
      this.state.ui.moreTab = button.dataset.tab;
      this.render();
      return;
    }

    if (action === 'set-schedule-view') {
      this.state.ui.scheduleView = button.dataset.view;
      this.render();
      return;
    }

    if (action === 'open-modal') {
      this.openModal(button.dataset.modal);
      return;
    }

    if (action === 'close-modal') {
      this.closeModal();
      return;
    }

    if (action === 'toggle-language') {
      const nextLanguage = this.state.snapshot.appSettings.language === 'af' ? 'en' : 'af';
      await saveSettings({
        ...this.state.snapshot.appSettings,
        language: nextLanguage
      });
      await this.refresh();
      return;
    }

    if (action === 'edit-child') {
      this.openModal(
        'child',
        this.state.snapshot.children.find((child) => child.id === button.dataset.id)
      );
      return;
    }

    if (action === 'edit-activity') {
      this.openModal(
        'activity',
        this.state.snapshot.activities.find((activity) => activity.id === button.dataset.id)
      );
      return;
    }

    if (action === 'edit-schedule') {
      this.openModal(
        'schedule',
        this.state.snapshot.schedules.find((schedule) => schedule.id === button.dataset.id)
      );
      return;
    }

    if (action === 'edit-meal') {
      this.openModal(
        'meal',
        this.state.snapshot.mealSettings.find((meal) => meal.id === button.dataset.id)
      );
      return;
    }

    if (action === 'delete-child') {
      if (window.confirm(this.t('confirmDeleteChild'))) {
        await deleteChild(button.dataset.id);
        await this.refresh();
        this.setToast(this.t('scheduleDeleted'));
      }
      return;
    }

    if (action === 'delete-activity') {
      if (window.confirm(this.t('confirmDeleteActivity'))) {
        await deleteActivity(button.dataset.id);
        await this.refresh();
        this.setToast(this.t('scheduleDeleted'));
      }
      return;
    }

    if (action === 'delete-schedule') {
      if (window.confirm(this.t('confirmDeleteSchedule'))) {
        await deleteSchedule(button.dataset.id);
        await this.refresh();
        this.setToast(this.t('scheduleDeleted'));
      }
      return;
    }

    if (action === 'delete-meal') {
      if (window.confirm(this.t('confirmDeleteMeal'))) {
        await deleteMeal(button.dataset.id);
        await this.refresh();
        this.setToast(this.t('mealSaved'));
      }
      return;
    }

    if (action === 'request-permission') {
      await requestNotificationPermission();
      await this.refresh();
      return;
    }

    if (action === 'export-pdf') {
      const type = button.dataset.export;
      const result = await exportPdf(this.state.snapshot, {
        type,
        childId: this.state.ui.exportChildId,
        date: this.state.ui.exportDate
      });
      this.state.exportStatus = result.saved
        ? this.t('exportedTo', { path: result.path })
        : this.t('downloadedPdf');
      this.render();
      this.setToast(this.state.exportStatus);
      return;
    }

    if (action === 'reset-demo') {
      if (window.confirm(this.t('resetDemo'))) {
        await resetDemoData();
        await this.refresh();
        this.setToast(this.t('dataReset'));
      }
    }
  }

  handleInput(event) {
    const element = event.target;
    if (element.name === 'childSearch') {
      this.state.ui.childSearch = element.value;
      this.render();
    }
  }

  handleChange(event) {
    const element = event.target;
    if (element.name === 'selectedDate') {
      this.state.ui.selectedDate = element.value;
      this.render();
      return;
    }

    if (element.name === 'filterChildId') {
      this.state.ui.filterChildId = element.value;
      this.render();
      return;
    }

    if (element.name === 'filterActivityId') {
      this.state.ui.filterActivityId = element.value;
      this.render();
      return;
    }

    if (element.name === 'exportChildId') {
      this.state.ui.exportChildId = element.value;
      return;
    }

    if (element.name === 'exportDate') {
      this.state.ui.exportDate = element.value;
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    if (form.id === 'child-form') {
      const record = {
        id: form.dataset.id || createId('child'),
        name: textFromForm(formData, 'name'),
        grade: textFromForm(formData, 'grade'),
        group: textFromForm(formData, 'group'),
        pickupNotes: textFromForm(formData, 'pickupNotes'),
        allergies: textFromForm(formData, 'allergies'),
        transportNote: textFromForm(formData, 'transportNote'),
        notes: textFromForm(formData, 'notes'),
        remindersEnabled: boolFromForm(formData, 'remindersEnabled')
      };

      await putRecord('children', record);
      this.closeModal();
      await this.refresh();
      this.setToast(this.t('childSaved'));
      return;
    }

    if (form.id === 'activity-form') {
      const record = {
        id: form.dataset.id || createId('activity'),
        nameEn: textFromForm(formData, 'nameEn'),
        nameAf: textFromForm(formData, 'nameAf'),
        color: textFromForm(formData, 'color'),
        icon: textFromForm(formData, 'icon') || 'bar',
        remindersEnabled: boolFromForm(formData, 'remindersEnabled'),
        isDefault: false
      };

      await putRecord('activities', record);
      this.closeModal();
      await this.refresh();
      this.setToast(this.t('activitySaved'));
      return;
    }

    if (form.id === 'schedule-form') {
      const startTime = textFromForm(formData, 'startTime');
      const endTime = textFromForm(formData, 'endTime');

      if (endTime && endTime <= startTime) {
        this.setToast('End time must be after start time.');
        return;
      }

      const record = {
        id: form.dataset.id || createId('schedule'),
        childId: textFromForm(formData, 'childId'),
        activityId: textFromForm(formData, 'activityId'),
        dayOfWeek: Number(textFromForm(formData, 'dayOfWeek')),
        startTime,
        endTime,
        recurring: true,
        exactReminderTime: textFromForm(formData, 'exactReminderTime'),
        reminderMinutes: formData.getAll('reminderMinutes').map((value) => Number(value)).sort((a, b) => b - a),
        notes: textFromForm(formData, 'notes')
      };

      await putRecord('schedules', record);
      this.closeModal();
      await this.refresh();
      this.setToast(this.t('scheduleSaved'));
      return;
    }

    if (form.id === 'meal-form') {
      const record = {
        id: form.dataset.id || createId('meal'),
        labelEn: textFromForm(formData, 'labelEn'),
        labelAf: textFromForm(formData, 'labelAf'),
        time: textFromForm(formData, 'time'),
        reminderEnabled: boolFromForm(formData, 'reminderEnabled')
      };

      await putRecord('mealSettings', record);
      this.closeModal();
      await this.refresh();
      this.setToast(this.t('mealSaved'));
      return;
    }

    if (form.id === 'settings-form') {
      await saveSettings({
        ...this.state.snapshot.appSettings,
        language: textFromForm(formData, 'language'),
        defaultDurationMinutes: Number(textFromForm(formData, 'defaultDurationMinutes')),
        dailySummaryTime: textFromForm(formData, 'dailySummaryTime'),
        dailySummaryEnabled: boolFromForm(formData, 'dailySummaryEnabled'),
        notificationWindowDays: Number(textFromForm(formData, 'notificationWindowDays'))
      });
      await this.refresh();
      this.setToast(this.t('settingsSaved'));
    }
  }
}
