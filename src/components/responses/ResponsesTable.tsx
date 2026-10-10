import React, { useState } from 'react';
import {
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { Form, Submission } from '../../types';
import { exportSubmissionsToCsv, exportSubmissionsToJson } from '../../lib/export';
import { ResponseDetailModal } from './ResponseDetailModal';

interface ResponsesTableProps {
  form: Form;
  submissions: Submission[];
  onUpdateStatus: (submissionId: string, newStatus: Submission['status']) => void;
}

export const ResponsesTable: React.FC<ResponsesTableProps> = ({
  form,
  submissions,
  onUpdateStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const formSubmissions = submissions.filter((s) => s.formId === form.id);

  // Filtered submissions
  const filtered = formSubmissions.filter((sub) => {
    // Status filter
    if (statusFilter !== 'all' && sub.status !== statusFilter) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTicket = sub.ticketCode.toLowerCase().includes(q);
      const matchAnswers = Object.values(sub.answers).some((val) =>
        String(val).toLowerCase().includes(q)
      );
      return matchTicket || matchAnswers;
    }

    return true;
  });

  const getStatusBadgeClass = (status: Submission['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Approved':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Checked-in':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Response Ledger
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Submissions & Records: {form.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {formSubmissions.length} recorded entries
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSubmissionsToCsv(form, filtered)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => exportSubmissionsToJson(form, filtered)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-indigo-600" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search responses by name, email, or ticket pass code..."
            className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses ({formSubmissions.length})</option>
            <option value="Paid">Paid</option>
            <option value="Approved">Approved</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider">
                  Ticket Code
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider">
                  Participant / Key Info
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider">
                  Submitted At
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider">
                  Status Flag
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider">
                  Payment
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No submissions matched your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const name =
                    sub.answers['f-name'] ||
                    sub.answers['name'] ||
                    sub.answers['s-role'] ||
                    'Anonymous Participant';

                  const email = sub.answers['f-email'] || sub.answers['email'] || '';

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setDetailModalOpen(true);
                      }}
                    >
                      {/* Ticket Code */}
                      <td className="p-4 font-mono font-bold text-indigo-700">
                        {sub.ticketCode}
                      </td>

                      {/* Participant */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{name}</div>
                        {email && <div className="text-slate-400 text-[11px]">{email}</div>}
                      </td>

                      {/* Submitted At */}
                      <td className="p-4 text-slate-600">
                        {new Date(sub.submittedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={sub.status}
                          onChange={(e) =>
                            onUpdateStatus(sub.id, e.target.value as Submission['status'])
                          }
                          className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${getStatusBadgeClass(
                            sub.status
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Approved">Approved</option>
                          <option value="Checked-in">Checked-in</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Payment */}
                      <td className="p-4">
                        {sub.payment ? (
                          <div>
                            <span className="font-bold text-emerald-700">
                              ${sub.payment.amount} {sub.payment.currency}
                            </span>
                            <span className="text-[10px] text-slate-400 block uppercase">
                              {sub.payment.paymentMethod}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Free</span>
                        )}
                      </td>

                      {/* Attendance */}
                      <td className="p-4">
                        {sub.checkIn?.isCheckedIn ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> Checked In
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unchecked</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(sub);
                            setDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && selectedSubmission && (
        <ResponseDetailModal
          submission={selectedSubmission}
          form={form}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedSubmission(null);
          }}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
};

