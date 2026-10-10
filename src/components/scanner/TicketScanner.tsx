import React, { useState } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Submission, Form } from '../../types';
import { safeFetchJson } from '../../lib/api';

interface TicketScannerProps {
  forms: Form[];
  submissions: Submission[];
  onRefreshData?: () => void;
}

export const TicketScanner: React.FC<TicketScannerProps> = ({
  forms,
  submissions,
  onRefreshData,
}) => {
  const [ticketInput, setTicketInput] = useState('');
  const [verifiedSub, setVerifiedSub] = useState<Submission | null>(null);
  const [verifiedFormTitle, setVerifiedFormTitle] = useState('');
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLookup = async (codeToSearch?: string) => {
    const query = (codeToSearch || ticketInput).trim();
    if (!query) return;

    setErrorMessage('');
    setSuccessMessage('');
    setIsSearching(true);

    try {
      const result = await safeFetchJson<{
        valid: boolean;
        submission: Submission;
        formTitle: string;
        alreadyCheckedIn: boolean;
        checkedInAt?: string;
        message?: string;
      }>('/api/check-in/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: query }),
      });

      if (!result.ok || !result.data?.valid) {
        // Also check if found in client submissions
        const localMatch = submissions.find(
          (s) =>
            s.ticketCode.toUpperCase() === query.toUpperCase() ||
            s.id.toUpperCase() === query.toUpperCase()
        );
        if (localMatch) {
          const form = forms.find((f) => f.id === localMatch.formId);
          setVerifiedSub(localMatch);
          setVerifiedFormTitle(form?.title || 'Course Registration');
          setAlreadyCheckedIn(localMatch.checkIn?.isCheckedIn || false);
          setCheckedInAt(localMatch.checkIn?.checkedInAt);
        } else {
          setErrorMessage(result.error || result.data?.message || 'Ticket code not found.');
          setVerifiedSub(null);
        }
      } else {
        setVerifiedSub(result.data.submission);
        setVerifiedFormTitle(result.data.formTitle);
        setAlreadyCheckedIn(result.data.alreadyCheckedIn);
        setCheckedInAt(result.data.checkedInAt);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error verifying ticket pass');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!verifiedSub) return;
    setIsConfirming(true);

    try {
      const result = await safeFetchJson<{
        success: boolean;
        checkIn: { checkedInAt: string; checkedInBy: string; notes: string };
        error?: string;
      }>('/api/check-in/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: verifiedSub.ticketCode,
          notes: 'Verified at physical event station',
          checkedInBy: 'Lead Instructor / Gate Check',
        }),
      });

      const checkedTime = result.data?.checkIn?.checkedInAt || new Date().toISOString();
      setSuccessMessage(`Success! ${verifiedSub.ticketCode} is checked in.`);
      setAlreadyCheckedIn(true);
      setCheckedInAt(checkedTime);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing check-in');
    } finally {
      setIsConfirming(false);
    }
  };

  // Recent check-ins list
  const checkedInList = submissions.filter((s) => s.checkIn?.isCheckedIn);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <QrCode className="w-4 h-4" /> Organizer Door Operations
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Attendee Check-in & Ticket Pass Verification
        </h1>
        <p className="text-sm text-slate-500">
          Scan QR codes on attendee devices or look up unique ticket pass strings to record attendance in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code Lookup Box */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600" /> Ticket Lookup / Scanner
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Enter Ticket Pass (e.g. TKT-8842-CA)..."
                className="flex-1 px-4 py-2.5 text-sm font-mono uppercase rounded-2xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-4 h-4" />
                {isSearching ? 'Verifying...' : 'Verify Pass'}
              </button>
            </form>

            {/* Quick Test Demo Chips */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Quick Demo Passes:</span>
              {submissions.slice(0, 3).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setTicketInput(sub.ticketCode);
                    handleLookup(sub.ticketCode);
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 transition-colors"
                >
                  {sub.ticketCode}
                </button>
              ))}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* Verification Result Card */}
          {verifiedSub && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-md space-y-5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    PASS VERIFICATION
                  </span>
                  <h3 className="text-xl font-black text-slate-900 font-mono">
                    {verifiedSub.ticketCode}
                  </h3>
                </div>

                <div className="text-right">
                  {alreadyCheckedIn ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Already Checked In
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Valid & Ready
                    </span>
                  )}
                </div>
              </div>

              {/* Attendee Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Attendee Name</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {verifiedSub.answers['f-name'] ||
                      verifiedSub.answers['name'] ||
                      'Alex Morgan'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Email Address</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {verifiedSub.answers['f-email'] ||
                      verifiedSub.answers['email'] ||
                      'student@example.com'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Event / Course</span>
                  <span className="font-semibold text-slate-800">{verifiedFormTitle}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Tuition / Payment</span>
                  <span className="font-bold text-emerald-700">
                    {verifiedSub.payment
                      ? `$${verifiedSub.payment.amount} (${verifiedSub.payment.paymentMethod.toUpperCase()})`
                      : 'Free Registration'}
                  </span>
                </div>
              </div>

              {alreadyCheckedIn && checkedInAt && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  Checked in at: <strong>{new Date(checkedInAt).toLocaleString()}</strong>
                </div>
              )}

              {/* Confirm Check-in Button */}
              <button
                onClick={handleConfirmCheckIn}
                disabled={isConfirming || alreadyCheckedIn}
                className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  alreadyCheckedIn
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                {alreadyCheckedIn
                  ? 'Attendee Checked In'
                  : isConfirming
                  ? 'Recording Check-in...'
                  : 'Confirm Attendee Entrance'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Attendance Activity Stream */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Checked-in Attendees
            </h2>
            <span className="font-mono tabular-nums text-xs font-semibold text-slate-500">
              {checkedInList.length} Verified
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {checkedInList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No attendees checked in yet today.
              </div>
            ) : (
              checkedInList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {item.answers['f-name'] || item.answers['name'] || 'Attendee'}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {item.ticketCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">
                      {item.checkIn?.checkedInAt
                        ? new Date(item.checkIn.checkedInAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Checked in'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">Verified</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
