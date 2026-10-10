import { Form, Submission } from '../types';
import { downloadFile } from './calendar';

export function exportSubmissionsToCsv(form: Form, submissions: Submission[]) {
  if (submissions.length === 0) {
    alert('No submissions available to export.');
    return;
  }

  // Header row
  const headers = [
    'Submission ID',
    'Ticket Code',
    'Submitted At',
    'Status',
    'Payment Amount',
    'Payment Method',
    'Payment Status',
    'Checked In',
    'Checked In At',
    ...form.fields.map((f) => `"${f.label.replace(/"/g, '""')}"`),
  ];

  const rows = submissions.map((sub) => {
    const rowValues = [
      sub.id,
      sub.ticketCode,
      sub.submittedAt,
      sub.status,
      sub.payment ? `${sub.payment.amount} ${sub.payment.currency}` : 'Free/N/A',
      sub.payment?.paymentMethod || 'N/A',
      sub.payment?.status || 'N/A',
      sub.checkIn?.isCheckedIn ? 'YES' : 'NO',
      sub.checkIn?.checkedInAt || 'N/A',
    ];

    for (const field of form.fields) {
      const val = sub.answers[field.id];
      if (val === undefined || val === null) {
        rowValues.push('""');
      } else if (typeof val === 'object') {
        rowValues.push(`"${JSON.stringify(val).replace(/"/g, '""')}"`);
      } else {
        rowValues.push(`"${String(val).replace(/"/g, '""')}"`);
      }
    }

    return rowValues.join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const filename = `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportSubmissionsToJson(form: Form, submissions: Submission[]) {
  const data = {
    formId: form.id,
    formTitle: form.title,
    exportedAt: new Date().toISOString(),
    totalSubmissions: submissions.length,
    submissions,
  };
  const jsonContent = JSON.stringify(data, null, 2);
  const filename = `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.json`;
  downloadFile(jsonContent, filename, 'application/json');
}
