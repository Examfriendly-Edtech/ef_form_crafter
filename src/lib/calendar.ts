export function generateIcsFile({
  title,
  description,
  location,
  startDate,
  endDate,
  ticketCode,
}: {
  title: string;
  description: string;
  location: string;
  startDate?: string;
  endDate?: string;
  ticketCode?: string;
}): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const start = startDate
    ? new Date(startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    : now;
  const end = endDate
    ? new Date(endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const cleanDesc = (description + (ticketCode ? `\\n\\nTicket Code: ${ticketCode}` : ''))
    .replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FormCraft CourseFlow//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:ticket-${ticketCode || Date.now()}@formcraft.studio`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${location || 'Online'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
