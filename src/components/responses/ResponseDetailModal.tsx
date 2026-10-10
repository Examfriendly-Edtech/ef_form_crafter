import React from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Calendar,
  CheckCircle2,
  FileText,
  User,
  Shield,
  Tag,
} from 'lucide-react';
import { Submission, Form } from '../../types';

interface ResponseDetailModalProps {
  submission: Submission;
  form: Form;
  isOpen?: boolean;
  onClose: () => void;
  onUpdateStatus: (submissionId: string, newStatus: Submission['status']) => void;
}

export const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  submission,
  form,
  onClose,
  onUpdateStatus,
}) => {
  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                {submission.ticketCode}
              </span>
              <span className="text-xs text-slate-400">ID: {submission.id}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Submission Record Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Payment Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Submission Status
              </span>
              <div>
                <select
                  value={submission.status}
                  onChange={(e) =>
                    onUpdateStatus(submission.id, e.target.value as Submission['status'])
                  }
                  className="w-full text-xs font-bold rounded-lg border border-slate-300 bg-white p-1"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Approved">Approved</option>
                  <option value="Checked-in">Checked-in</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Payment Info
              </span>
              <div className="text-xs font-bold text-slate-900">
                {submission.payment ? (
                  <span className="text-emerald-700">
                    ${submission.payment.amount} ({submission.payment.paymentMethod.toUpperCase()})
                  </span>
                ) : (
                  <span className="text-slate-500">Free / None</span>
                )}
              </div>
              {submission.payment && (
                <div className="text-[10px] text-slate-400 truncate">
                  TX: {submission.payment.transactionId}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Check-in Status
              </span>
              <div className="text-xs font-bold text-slate-900">
                {submission.checkIn?.isCheckedIn ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                  </span>
                ) : (
                  <span className="text-slate-400">Not checked in</span>
                )}
              </div>
            </div>
          </div>

          {/* Form Answers */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Submitted Answers
            </h3>

            <div className="space-y-2.5">
              {form.fields.map((field) => {
                const answer = submission.answers[field.id];
                if (answer === undefined || answer === null || answer === '') return null;

                return (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                  >
                    <div className="font-semibold text-slate-500">{field.label}</div>
                    <div className="font-bold text-slate-900">
                      {typeof answer === 'object' ? (
                        <pre className="text-[11px] font-mono bg-white p-2 rounded-lg border border-slate-200 whitespace-pre-wrap">
                          {JSON.stringify(answer, null, 2)}
                        </pre>
                      ) : (
                        String(answer)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uploaded Files */}
          {submission.files && submission.files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Attached Files
              </h3>
              <div className="space-y-1.5">
                {submission.files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-slate-800">{file.name}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 space-y-1">
            <div>Submitted at: {new Date(submission.submittedAt).toLocaleString()}</div>
            {submission.userIp && <div>IP Address: {submission.userIp}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
