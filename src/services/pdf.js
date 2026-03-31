import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createTranslator } from './i18n.js';
import { buildExportRows, getMealSummaryForDate } from './planner.js';
import { formatDateInput, formatDisplayDate } from './time.js';

const BRAND = {
  navy: '#0b1d36',
  cyan: '#1fc9d8',
  slate: '#6d87a4',
  paperBlue: '#ebf7fb'
};

function addHeading(doc, title, subtitle) {
  doc.setFillColor(BRAND.navy);
  doc.roundedRect(32, 28, 531, 72, 18, 18, 'F');
  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, 48, 56);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#cfe5f5');
  doc.text(subtitle, 48, 78);
}

function addTable(doc, head, body, startY) {
  autoTable(doc, {
    startY,
    head: [head],
    body,
    margin: { left: 32, right: 32 },
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: '#15304d',
      lineColor: '#d7e4ef',
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: BRAND.cyan,
      textColor: '#08213a',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: BRAND.paperBlue
    }
  });
}

function buildFileName(type, date) {
  const suffix = formatDateInput(date);
  return `after-school-${type}-${suffix}.pdf`;
}

function downloadOnWeb(doc, fileName) {
  doc.save(fileName);
  return { saved: false, path: fileName, fileName };
}

async function saveOnDevice(doc, fileName) {
  const dataUri = doc.output('datauristring');
  const base64Data = dataUri.split(',')[1];
  const path = `exports/${fileName}`;
  const result = await Filesystem.writeFile({
    path,
    data: base64Data,
    directory: Directory.Documents,
    recursive: true
  });

  try {
    await Share.share({
      title: fileName,
      text: 'After School Planner export',
      url: result.uri
    });
  } catch (error) {
    console.warn('Share sheet skipped', error);
  }

  return { saved: true, path: result.uri, fileName };
}

export async function exportPdf(snapshot, options = {}) {
  const language = snapshot.appSettings.language || 'en';
  const t = createTranslator(language);
  const type = options.type || 'weekly';
  const exportDate = options.date ? new Date(options.date) : new Date();
  const rows = buildExportRows(snapshot, language, options);
  const meals = getMealSummaryForDate(snapshot, exportDate, language);
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const titleMap = {
    weekly: t('exportWeekly'),
    child: t('exportChild'),
    day: t('exportDay'),
    food: t('exportFood')
  };

  addHeading(
    doc,
    titleMap[type] || t('exportWeekly'),
    `${t('appName')} | ${t('printReady')} | ${formatDisplayDate(exportDate, language, {
      weekday: 'long',
      month: 'long',
      year: 'numeric'
    })}`
  );

  if (type === 'food') {
    const mealBody = meals.map((meal) => [
      meal.label,
      meal.time,
      String(meal.awayCount),
      meal.awayChildren.map((child) => child.name).join(', ') || '-'
    ]);
    addTable(doc, [t('mealPlanner'), t('mealTime'), t('mealsToSave'), t('namesAway')], mealBody, 120);
  } else {
    const body = rows.map((row) => [row.day, row.child, row.activity, row.time, row.note || '-']);
    addTable(doc, [t('dayOfWeek'), t('child'), t('activity'), t('startTime'), t('notes')], body, 120);

    if (type !== 'day' && meals.length) {
      const mealBody = meals.map((meal) => [
        meal.label,
        meal.time,
        String(meal.awayCount),
        meal.awayChildren.map((child) => child.name).join(', ') || '-'
      ]);
      addTable(
        doc,
        [t('mealPlanner'), t('mealTime'), t('mealsToSave'), t('namesAway')],
        mealBody,
        doc.lastAutoTable.finalY + 24
      );
    }
  }

  const fileName = buildFileName(type, exportDate);

  if (!Capacitor.isNativePlatform()) {
    return downloadOnWeb(doc, fileName);
  }

  return saveOnDevice(doc, fileName);
}
