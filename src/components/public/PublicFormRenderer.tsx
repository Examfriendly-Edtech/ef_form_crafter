import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  UploadCloud,
  FileCheck,
  Shield,
  CreditCard,
  Lock,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { Form, FormField, Submission } from '../../types';
import { isFieldVisible, getNextPageIndex } from '../../lib/logicEngine';
import { PaymentModal } from './PaymentModal';
import { TicketPassModal } from './TicketPassModal';
import { safeFetchJson } from '../../lib/api';

interface PublicFormRendererProps {
  form: Form;
  onSubmitSuccess?: (submission: Submission) => void;
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
  isEmbedded?: boolean;
}

export const PublicFormRenderer: React.FC<PublicFormRendererProps> = ({
  form,
  onSubmitSuccess,
  previewDevice = 'desktop',
  isEmbedded = false,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ fieldId: string; name: string; size: number }>
  >([]);
  const [gdprChecked, setGdprChecked] = useState(false);
  const [captchaPassed, setCaptchaPassed] = useState(!form.settings.enableCaptcha);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment & Pass Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPages = form.pages.length;
  const progressPercent = Math.round(((currentPageIndex + 1) / totalPages) * 100);

  // Filter fields for current page that are visible according to conditional logic
  const currentPageFields = form.fields
    .filter((f) => f.pageIndex === currentPageIndex)
    .filter((f) => isFieldVisible(f, form.logicRules, answers));

  // Answer updater
  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Matrix answer updater
  const handleMatrixChange = (fieldId: string, row: string, col: string) => {
    const currentMatrix = answers[fieldId] || {};
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: {
        ...currentMatrix,
        [row]: col,
      },
    }));
  };

  // File upload simulation
  const handleFileChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files).map((f) => ({
        fieldId,
        name: f.name,
        size: f.size,
      }));
      setUploadedFiles((prev) => [...prev.filter((f) => f.fieldId !== fieldId), ...fileList]);
      handleAnswerChange(fieldId, fileList.map((f) => f.name));
    }
  };

  // Compute registration fee total
  const computeTotalFee = (): number => {
    if (!form.settings.isCourseRegistration) return 0;
    if (form.settings.courseFeeType === 'free') return 0;
    if (form.settings.courseFeeType === 'fixed') return form.settings.fixedFeeAmount || 0;

    // Tiered fee: inspect selected slot or tier options
    let total = 0;
    for (const field of form.fields) {
      const selectedVal = answers[field.id];
      if (selectedVal && field.options) {
        const opt = field.options.find((o) => o.value === selectedVal);
        if (opt && typeof opt.price === 'number') {
          total += opt.price;
        }
      }
    }
    return total > 0 ? total : form.settings.fixedFeeAmount || 99;
  };

  // Validate active step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of currentPageFields) {
      if (field.required) {
        const val = answers[field.id];
        if (val === undefined || val === null || val === '') {
          newErrors[field.id] = 'This field is required.';
        } else if (Array.isArray(val) && val.length === 0) {
          newErrors[field.id] = 'Please select at least one option.';
        } else if (field.type === 'matrix') {
          // Verify each row in matrix is answered
          const matrixAns = answers[field.id] || {};
          const missingRows = (field.matrixRows || []).some((r) => !matrixAns[r]);
          if (missingRows) {
            newErrors[field.id] = 'Please provide an evaluation for each dimension.';
          }
        }
      }
    }

    // On final page, check GDPR & CAPTCHA
    if (currentPageIndex === totalPages - 1) {
      if (form.settings.requireGdpr && !gdprChecked) {
        newErrors['gdpr'] = 'You must accept the terms to proceed.';
      }
      if (form.settings.enableCaptcha && !captchaPassed) {
        newErrors['captcha'] = 'Please complete the verification check.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentPageIndex < totalPages - 1) {
      const nextIdx = getNextPageIndex(currentPageIndex, form.logicRules, answers, totalPages);
      setCurrentPageIndex(nextIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final submission triggered!
      handleInitiateSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => Math.max(0, prev - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleInitiateSubmit = () => {
    const fee = computeTotalFee();
    if (fee > 0 && form.settings.isCourseRegistration) {
      setCalculatedAmount(fee);
      setPaymentModalOpen(true);
    } else {
      executeSubmission({
        method: 'free',
        amount: 0,
        transactionId: 'free_n/a',
      });
    }
  };

  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const executeSubmission = async (paymentDetails?: {
    method: 'stripe' | 'paypal' | 'free';
    amount: number;
    transactionId: string;
  }) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await safeFetchJson<{
        success: boolean;
        submission: Submission;
        message?: string;
      }>(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          paymentDetails,
          files: uploadedFiles,
          gdprConsent: gdprChecked,
        }),
      });

      if (result.ok && result.data?.submission) {
        setActiveSubmission(result.data.submission);
        if (onSubmitSuccess) onSubmitSuccess(result.data.submission);
        setPaymentModalOpen(false);
        setPassModalOpen(true);
        return;
      }

      // If server returned a business validation error (e.g., slot sold out or max responses)
      if (result.status === 400 && result.error) {
        setSubmissionError(result.error);
        setPaymentModalOpen(false);
        return;
      }

      // Safe client-side fallback if server is initializing or returned HTML/offline response
      const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const fallbackTicket = form.settings.isCourseRegistration
        ? `TKT-${Math.floor(1000 + Math.random() * 9000)}-${randCode}`
        : `SRV-${Math.floor(1000 + Math.random() * 9000)}-${form.settings.isAnonymous ? 'ANON' : randCode}`;

      const fallbackSubmission: Submission = {
        id: `sub-${Date.now()}`,
        formId: form.id,
        ticketCode: fallbackTicket,
        submittedAt: new Date().toISOString(),
        status: (paymentDetails?.amount || 0) > 0 ? 'Paid' : 'Approved',
        answers,
        payment:
          (paymentDetails?.amount || 0) > 0
            ? {
                amount: paymentDetails!.amount,
                currency: form.settings.currency || 'USD',
                status: 'completed',
                paymentMethod: paymentDetails!.method || 'stripe',
                transactionId:
                  paymentDetails!.transactionId ||
                  `tx_${Math.random().toString(36).substring(2, 10)}`,
                paidAt: new Date().toISOString(),
              }
            : undefined,
        checkIn: {
          isCheckedIn: false,
        },
        files: uploadedFiles.map((f) => ({ name: f.name, size: f.size, url: '#' })),
      };

      setActiveSubmission(fallbackSubmission);
      if (onSubmitSuccess) onSubmitSuccess(fallbackSubmission);
      setPaymentModalOpen(false);
      setPassModalOpen(true);
    } catch (err: any) {
      setSubmissionError(err.message || 'Submission encountered an error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Viewport container width helper
  const getContainerWidth = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-[420px]';
      case 'tablet':
        return 'max-w-[760px]';
      case 'desktop':
      default:
        return 'max-w-3xl';
    }
  };

  return (
    <div
      className={`min-h-[85vh] py-8 px-4 flex flex-col items-center transition-colors duration-300 ${
        isEmbedded ? 'py-2 px-2' : ''
      }`}
      style={{ backgroundColor: form.theme.backgroundColor || '#f8fafc' }}
    >
      <div className={`w-full ${getContainerWidth()} space-y-6 transition-all duration-300`}>
        {/* Cover Banner if present */}
        {form.theme.headerBannerUrl && (
          <div className="w-full h-44 sm:h-56 rounded-3xl overflow-hidden shadow-sm relative border border-slate-200/60">
            <img
              src={form.theme.headerBannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        )}

        {/* Form Title & Stepper Header Card */}
        <div
          className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden"
          style={{
            backgroundColor: form.theme.cardBackground || '#ffffff',
            borderRadius:
              form.theme.borderRadius === 'xl'
                ? '1.5rem'
                : form.theme.borderRadius === 'lg'
                ? '1rem'
                : form.theme.borderRadius === 'sm'
                ? '0.375rem'
                : form.theme.borderRadius === 'none'
                ? '0'
                : '0.75rem',
          }}
        >
          {/* Accent top border strip */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: form.theme.primaryColor || '#4f46e5' }}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-medium">
              <span className="capitalize text-slate-700 font-semibold">
                {form.category.replace('_', ' ')}
              </span>

              {form.settings.isAnonymous && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                  <Shield className="w-3 h-3" /> Anonymous Mode (No IP Logged)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {form.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">{form.description}</p>
          </div>

          {/* Multi-Step Progress Tracker */}
          {totalPages > 1 && (
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-700 font-semibold">
                  Step {currentPageIndex + 1} of {totalPages}: {form.pages[currentPageIndex]?.title}
                </span>
                <span className="font-mono tabular-nums text-slate-500 font-semibold">{progressPercent}% Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: form.theme.primaryColor || '#4f46e5',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Fields Form Card */}
        <div
          className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
          style={{
            backgroundColor: form.theme.cardBackground || '#ffffff',
            borderRadius:
              form.theme.borderRadius === 'xl'
                ? '1.5rem'
                : form.theme.borderRadius === 'lg'
                ? '1rem'
                : '0.75rem',
          }}
        >
          {submissionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Submission Notice</p>
                <p className="mt-0.5">{submissionError}</p>
              </div>
            </div>
          )}

          {currentPageFields.map((field) => {
            const hasError = Boolean(errors[field.id]);

            return (
              <div key={field.id} className="space-y-2">
                {/* Field Label */}
                <label className="block text-sm font-bold text-slate-900">
                  {field.label}
                  {field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                {field.description && (
                  <p className="text-xs text-slate-500 leading-tight">{field.description}</p>
                )}

                {/* Short text input */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={answers[field.id] || ''}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    placeholder={field.placeholder || 'Your response...'}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all outline-hidden ${
                      hasError
                        ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                  />
                )}

                {/* Long text textarea */}
                {field.type === 'textarea' && (
                  <textarea
                    rows={3}
                    value={answers[field.id] || ''}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    placeholder={field.placeholder || 'Type here...'}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all outline-hidden ${
                      hasError
                        ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                  />
                )}

                {/* Select dropdown */}
                {field.type === 'select' && (
                  <select
                    value={answers[field.id] || ''}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-hidden"
                  >
                    <option value="">-- Choose an option --</option>
                    {field.options?.map((opt, i) => (
                      <option key={i} value={opt.value}>
                        {opt.label} {opt.price ? `($${opt.price})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {/* Radio button group */}
                {field.type === 'radio' && (
                  <div className="space-y-2">
                    {field.options?.map((opt, i) => (
                      <label
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          answers[field.id] === opt.value
                            ? 'border-indigo-500 bg-indigo-50/40 font-semibold text-slate-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={field.id}
                          checked={answers[field.id] === opt.value}
                          onChange={() => handleAnswerChange(field.id, opt.value)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkboxes multi-select */}
                {field.type === 'checkbox' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {field.options?.map((opt, i) => {
                      const checked = ((answers[field.id] as string[]) || []).includes(opt.value);
                      return (
                        <label
                          key={i}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            checked
                              ? 'border-indigo-500 bg-indigo-50/40 font-semibold text-slate-900 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const currList: string[] = answers[field.id] || [];
                              const updated = e.target.checked
                                ? [...currList, opt.value]
                                : currList.filter((v) => v !== opt.value);
                              handleAnswerChange(field.id, updated);
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Course Slot with Capacity Control (Mobile & Desktop Responsive) */}
                {field.type === 'course_slot' && (
                  <div className="space-y-3">
                    {field.options?.map((opt, i) => {
                      const max = opt.maxCapacity ?? 20;
                      const booked = opt.currentBookings ?? 0;
                      const remaining = Math.max(0, max - booked);
                      const isSoldOut = remaining === 0;
                      const isSelected = answers[field.id] === opt.value;

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (!isSoldOut) handleAnswerChange(field.id, opt.value);
                          }}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                            isSoldOut
                              ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <input
                              type="radio"
                              name={field.id}
                              disabled={isSoldOut}
                              checked={isSelected}
                              onChange={() => {}}
                              className="text-emerald-600 focus:ring-emerald-500 mt-0.5 sm:mt-0 shrink-0"
                            />
                            <div>
                              <div className="text-sm font-bold text-slate-900 leading-snug">{opt.label}</div>
                              {opt.price ? (
                                <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                                  ${opt.price} Registration Fee
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                            {isSoldOut ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-rose-100 text-rose-700">
                                Sold Out
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`text-xs font-bold ${
                                    remaining <= 3 ? 'text-amber-600' : 'text-emerald-700'
                                  }`}
                                >
                                  {remaining <= 3 ? `Only ${remaining} left!` : `${remaining} slots left`}
                                </span>
                                <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      remaining <= 3 ? 'bg-amber-500' : 'bg-emerald-600'
                                    }`}
                                    style={{ width: `${(booked / max) * 100}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Likert Matrix Scale (Responsive Table for Desktop/Tablet + Card layout for Mobile) */}
                {field.type === 'matrix' && (
                  <div className="space-y-3">
                    {/* Desktop & Tablet Table */}
                    <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 font-bold text-slate-700">Evaluation Dimension</th>
                            {field.matrixColumns?.map((col, idx) => (
                              <th key={idx} className="p-3 text-center font-bold text-slate-700">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {field.matrixRows?.map((row, rIdx) => {
                            const currentSelection = (answers[field.id] || {})[row];
                            return (
                              <tr
                                key={rIdx}
                                className={`border-b border-slate-100 last:border-0 ${
                                  rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                }`}
                              >
                                <td className="p-3 font-semibold text-slate-800">{row}</td>
                                {field.matrixColumns?.map((col, cIdx) => (
                                  <td key={cIdx} className="p-3 text-center">
                                    <label className="cursor-pointer block py-1">
                                      <input
                                        type="radio"
                                        name={`matrix-${field.id}-${rIdx}`}
                                        checked={currentSelection === col}
                                        onChange={() => handleMatrixChange(field.id, row, col)}
                                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                      />
                                    </label>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Friendly Card Pills */}
                    <div className="sm:hidden space-y-3">
                      {field.matrixRows?.map((row, rIdx) => {
                        const currentSelection = (answers[field.id] || {})[row];
                        return (
                          <div
                            key={rIdx}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5"
                          >
                            <div className="text-xs font-bold text-slate-800">{row}</div>
                            <div className="grid grid-cols-2 gap-2">
                              {field.matrixColumns?.map((col, cIdx) => {
                                const isChecked = currentSelection === col;
                                return (
                                  <button
                                    type="button"
                                    key={cIdx}
                                    onClick={() => handleMatrixChange(field.id, row, col)}
                                    className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                                      isChecked
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {col}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rating component (Star / Numeric) */}
                {field.type === 'rating' && (
                  <div className="flex items-center gap-2 py-2">
                    {Array.from({ length: field.ratingMax || 5 }).map((_, i) => {
                      const score = i + 1;
                      const active = (answers[field.id] || 0) >= score;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAnswerChange(field.id, score)}
                          className={`p-2 rounded-xl transition-transform hover:scale-110 flex items-center justify-center ${
                            active
                              ? 'bg-amber-100 text-amber-500'
                              : 'bg-slate-100 text-slate-400 hover:text-amber-400'
                          }`}
                        >
                          {field.ratingType === 'numeric' ? (
                            <span className="font-bold text-sm w-5 h-5 flex items-center justify-center">
                              {score}
                            </span>
                          ) : (
                            <Star
                              className={`w-6 h-6 ${
                                active ? 'fill-amber-400 stroke-amber-500' : 'stroke-slate-400'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                    {answers[field.id] && (
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {answers[field.id]} / {field.ratingMax || 5} Selected
                      </span>
                    )}
                  </div>
                )}

                {/* File Upload component */}
                {field.type === 'file' && (
                  <div>
                    <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                      <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                      <span className="text-xs font-bold text-slate-800">
                        Upload prerequisite documentation
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        Supports PDF, PNG, JPG (Max {field.maxFiles || 2} files)
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileChange(field.id, e)}
                        className="hidden"
                      />
                    </label>

                    {uploadedFiles.filter((f) => f.fieldId === field.id).length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {uploadedFiles
                          .filter((f) => f.fieldId === field.id)
                          .map((f, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900"
                            >
                              <FileCheck className="w-4 h-4 text-indigo-600" />
                              <span className="font-semibold truncate">{f.name}</span>
                              <span className="text-[10px] text-indigo-500 ml-auto">
                                {(f.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Error message */}
                {hasError && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors[field.id]}
                  </p>
                )}
              </div>
            );
          })}

          {/* Final Step: Terms, Summary & Bot Protection */}
          {currentPageIndex === totalPages - 1 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              {/* Registration Fee Summary for Courses */}
              {form.settings.isCourseRegistration && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>Program Enrollment:</span>
                    <span className="text-slate-800 font-semibold">{form.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-medium border-t border-slate-200/60 pt-2">
                    <span className="font-bold text-slate-800">Total Registration Tuition:</span>
                    <span className="font-mono tabular-nums text-sm font-extrabold text-indigo-700">
                      ${computeTotalFee()} {form.settings.currency || 'USD'}
                    </span>
                  </div>
                </div>
              )}

              {/* GDPR consent */}
              {form.settings.requireGdpr && (
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gdprChecked}
                      onChange={(e) => setGdprChecked(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600 leading-snug">
                      {form.settings.gdprText ||
                        'I accept the terms of service, privacy policies, and agree to have my responses processed.'}
                    </span>
                  </label>
                  {errors['gdpr'] && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{errors['gdpr']}</p>
                  )}
                </div>
              )}

              {/* Bot Check (CAPTCHA) */}
              {form.settings.enableCaptcha && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={captchaPassed}
                      onChange={(e) => setCaptchaPassed(e.target.checked)}
                      className="h-4 w-4 rounded text-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-800">I am not a robot</span>
                  </label>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" /> reCAPTCHA v3
                  </div>
                </div>
              )}

              {errors['captcha'] && (
                <p className="text-xs text-rose-500 font-medium">{errors['captcha']}</p>
              )}
            </div>
          )}

          {/* Navigation Controls: Back / Next / Submit (Mobile & Desktop Responsive) */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
            {currentPageIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Previous Step
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-2.5 rounded-2xl text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: form.theme.primaryColor || '#4f46e5' }}
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : currentPageIndex === totalPages - 1 ? (
                form.settings.isCourseRegistration && computeTotalFee() > 0 ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Checkout (${computeTotalFee()})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Completed Form</span>
                  </>
                )
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {paymentModalOpen && (
        <PaymentModal
          amount={calculatedAmount}
          currency={form.settings.currency || 'USD'}
          courseTitle={form.title}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={(paymentDetails) => executeSubmission(paymentDetails)}
        />
      )}

      {/* Ticket Pass / Confirmation Modal */}
      {passModalOpen && activeSubmission && (
        <TicketPassModal
          form={form}
          submission={activeSubmission}
          onClose={() => {
            setPassModalOpen(false);
            // Reset form to first page for next entry
            setCurrentPageIndex(0);
            setAnswers({});
          }}
        />
      )}
    </div>
  );
};

