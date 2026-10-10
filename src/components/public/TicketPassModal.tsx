import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Calendar,
  Download,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Receipt,
  QrCode,
  MapPin,
} from 'lucide-react';
import { Submission, Form } from '../../types';
import { generateQrDataUrl } from '../../lib/qr';
import { generateIcsFile, downloadFile } from '../../lib/calendar';

interface TicketPassModalProps {
  submission: Submission;
  form: Form;
  isOpen?: boolean;
  onClose: () => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  submission,
  form,
  onClose,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    generateQrDataUrl(submission.ticketCode).then((url) => {
      if (isMounted) {
        setQrUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [submission.ticketCode]);


  const handleDownloadCalendar = () => {
    const icsContent = generateIcsFile({
      title: form.title,
      description: form.description,
      location: form.settings.courseLocation || 'Campus & Zoom',
      startDate: form.settings.courseStartDate,
      endDate: form.settings.courseEndDate,
      ticketCode: submission.ticketCode,
    });
    downloadFile(
      icsContent,
      `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_event.ics`,
      'text/calendar;charset=utf-8;'
    );
  };

  const handleDownloadReceipt = () => {
    const receiptText = [
      '==================================================',
      `OFFICIAL REGISTRATION RECEIPT & ATTENDEE PASS`,
      '==================================================',
      `Event: ${form.title}`,
      `Ticket Code: ${submission.ticketCode}`,
      `Submission ID: ${submission.id}`,
      `Date Issued: ${new Date(submission.submittedAt).toLocaleString()}`,
      `Status: ${submission.status}`,
      `Amount Paid: ${submission.payment ? `$${submission.payment.amount} ${submission.payment.currency}` : 'Free'}`,
      `Payment Method: ${submission.payment?.paymentMethod?.toUpperCase() || 'N/A'}`,
      `Transaction ID: ${submission.payment?.transactionId || 'N/A'}`,
      `Location: ${form.settings.courseLocation || 'Online'}`,
      '==================================================',
      'Please present this ticket or the attached QR code upon entrance.',
    ].join('\r\n');

    downloadFile(
      receiptText,
      `Receipt_${submission.ticketCode}.txt`,
      'text/plain;charset=utf-8;'
    );
  };

  const attendeeName =
    submission.answers['f-name'] ||
    submission.answers['name'] ||
    submission.answers['full_name'] ||
    'Attendee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Pass Header Banner */}
        <div className="bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            {form.settings.isCourseRegistration
              ? 'Registration Confirmed & Verified'
              : 'Survey Response Recorded'}
          </div>
          <h2 className="text-xl font-bold tracking-tight">{form.title}</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Official pass issued to <strong className="text-white">{attendeeName}</strong>
          </p>
        </div>

        {/* Pass Body with Scannable QR Code */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card Ticket Graphic */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-white text-center shadow-xs relative">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Digital Check-in Pass
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-3">
              {qrUrl ? (
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
                  <img
                    src={qrUrl}
                    alt={`QR Code for ${submission.ticketCode}`}
                    className="w-48 h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="font-mono text-xl font-black text-slate-900 tracking-wider">
              {submission.ticketCode}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Present this scannable QR code or code string at the check-in desk
            </div>

            {/* Status Pill */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                Status: {submission.status}
              </span>
              {submission.payment && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  Paid ${submission.payment.amount} {submission.payment.currency}
                </span>
              )}
            </div>
          </div>

          {/* Event details */}
          {form.settings.isCourseRegistration && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              {form.settings.courseLocation && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Venue:</strong> {form.settings.courseLocation}
                  </span>
                </div>
              )}
              {form.settings.courseStartDate && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Start Date:</strong>{' '}
                    {new Date(form.settings.courseStartDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Confirmation email dispatched with transactional attachments.</span>
              </div>
            </div>
          )}

          {/* Action Download Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {form.settings.isCourseRegistration && (
              <button
                onClick={handleDownloadCalendar}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>.ICS Invite</span>
              </button>
            )}
            <button
              onClick={handleDownloadReceipt}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Receipt</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Print Pass</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
          >
            Done & Return
          </button>
        </div>
      </div>
    </div>
  );
};
