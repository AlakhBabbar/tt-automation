import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '9:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-1:00',
  '1:00-2:00',
  '2:00-3:00',
  '3:00-4:00',
  '4:00-5:00'
];

/**
 * Format timetable data into a table structure for PDF
 */
const formatTimetableForPDF = (timetable) => {
  const tableData = [];
  
  TIME_SLOTS.forEach(timeSlot => {
    const row = [timeSlot];
    
    WEEKDAYS.forEach(day => {
      const dayKey = day.toLowerCase();
      const slotData = timetable[dayKey]?.[timeSlot];
      
      if (slotData && (slotData.course || slotData.teacher || slotData.room)) {
        const cellContent = [
          slotData.course || '',
          slotData.teacher || '',
          slotData.room || ''
        ].filter(Boolean).join('\n');
        row.push(cellContent);
      } else {
        row.push('');
      }
    });
    
    tableData.push(row);
  });
  
  return tableData;
};

/**
 * Export a single timetable to PDF
 */
export const exportSingleTimetableToPDF = (timetable) => {
  const doc = new jsPDF('landscape');
  
  // Title
  const title = `${timetable.program} - ${timetable.branch} - Semester ${timetable.semester}`;
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  const subtitle = `${timetable.type === 'full-time' ? 'Full Time' : 'Part Time'}${timetable.batch ? ' - Batch ' + timetable.batch : ''}`;
  doc.text(subtitle, doc.internal.pageSize.width / 2, 22, { align: 'center' });
  
  // Table
  const tableData = formatTimetableForPDF(timetable);
  const headers = ['Time', ...WEEKDAYS];
  
  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
      halign: 'center',
      lineWidth: 0.5,
      lineColor: [200, 200, 200]
    },
    headStyles: {
      fillColor: [79, 70, 229], // Indigo
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 },
      5: { cellWidth: 40 },
      6: { cellWidth: 40 }
    },
    didDrawCell: (data) => {
      // Add subtle background for time column
      if (data.column.index === 0 && data.section === 'body') {
        doc.setFillColor(248, 250, 252);
      }
    }
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Generate filename
  const filename = `${timetable.program}_${timetable.branch}_Sem${timetable.semester}${timetable.batch ? '_' + timetable.batch : ''}.pdf`;
  
  doc.save(filename);
};

/**
 * Export all timetables to a single PDF
 */
export const exportAllTimetablesToPDF = (timetables) => {
  if (!timetables || timetables.length === 0) {
    alert('No timetables to export');
    return;
  }
  
  const doc = new jsPDF('landscape');
  
  // Cover page
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('All Timetables', doc.internal.pageSize.width / 2, 40, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100);
  doc.text(`Total: ${timetables.length} timetable(s)`, doc.internal.pageSize.width / 2, 50, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width / 2, 58, { align: 'center' });
  
  // Add each timetable
  timetables.forEach((timetable, index) => {
    if (index > 0) {
      doc.addPage();
    } else {
      doc.addPage();
    }
    
    // Title for this timetable
    const title = `${timetable.program} - ${timetable.branch} - Semester ${timetable.semester}`;
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const subtitle = `${timetable.type === 'full-time' ? 'Full Time' : 'Part Time'}${timetable.batch ? ' - Batch ' + timetable.batch : ''}`;
    doc.text(subtitle, doc.internal.pageSize.width / 2, 22, { align: 'center' });
    
    // Table
    const tableData = formatTimetableForPDF(timetable);
    const headers = ['Time', ...WEEKDAYS];
    
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [79, 70, 229], // Indigo
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 40 },
        6: { cellWidth: 40 }
      }
    });
  });
  
  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  const filename = `All_Timetables_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
