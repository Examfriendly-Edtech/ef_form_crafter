import React, { useState } from 'react';
import {
  X,
  Sliders,
  DollarSign,
  Shield,
  Calendar,
  Shuffle,
  Mail,
  Webhook,
  Check,
  Users,
  FileText,
} from 'lucide-react';
import { FormSettings } from '../../types';

interface SettingsModalProps {
  settings: FormSettings;
  title?: string;
  description?: string;
  isOpen?: boolean;
  onClose: () => void;
  onSaveSettings: (settings: FormSettings, title?: string, description?: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  title = '',
  description = '',
  onClose,
  onSaveSettings,
}) => {
  const [current, setCurrent] = useState<FormSettings>({ ...settings });
  const [formTitle, setFormTitle] = useState(title);
  const [formDescription, setFormDescription] = useState(description);

  React.useEffect(() => {
    setCurrent({ ...settings });
    setFormTitle(title);
    setFormDescription(description);
  }, [settings, title, description]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Form & Workflow Settings</h2>
              <p className="text-xs text-slate-500">
                Configure form name, payment gateways, capacity limits, and survey behavior.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Tabs / Sections */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 0. Form Identity (Name & Overview) */}
          <div className="space-y-3 pb-3 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" /> Form Name & Overview
            </span>

            <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Form Name / Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Enter form title..."
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Description / Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief summary of this form for participants..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden resize-none"
                />
              </div>
            </div>
          </div>

          {/* 1. Course Registration & Payment Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Course Registration & Payments
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.isCourseRegistration}
                  onChange={(e) =>
                    setCurrent({ ...current, isCourseRegistration: e.target.checked })
                  }
                  className="rounded text-indigo-600"
                />
                Enable Course Mode
              </label>
            </div>

            {current.isCourseRegistration && (
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Fee Structure
                    </label>
                    <select
                      value={current.courseFeeType}
                      onChange={(e) =>
                        setCurrent({ ...current, courseFeeType: e.target.value as any })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="free">Free Admission</option>
                      <option value="fixed">Fixed Single Fee</option>
                      <option value="tiered">Tiered by Package / Track</option>
                    </select>
                  </div>

                  {current.courseFeeType === 'fixed' && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Amount ({current.currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={current.fixedFeeAmount}
                        onChange={(e) =>
                          setCurrent({ ...current, fixedFeeAmount: Number(e.target.value) })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Currency
                    </label>
                    <select
                      value={current.currency}
                      onChange={(e) =>
                        setCurrent({ ...current, currency: e.target.value as any })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>

                {/* Event Schedule Info for Calendar Invites */}
                <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Event Start Date
                    </label>
                    <input
                      type="date"
                      value={current.courseStartDate?.split('T')[0] || ''}
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          courseStartDate: e.target.value ? `${e.target.value}T09:00:00Z` : undefined,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Event Location / Venue
                    </label>
                    <input
                      type="text"
                      value={current.courseLocation || ''}
                      onChange={(e) => setCurrent({ ...current, courseLocation: e.target.value })}
                      placeholder="e.g. San Francisco Campus or Zoom"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Survey Controls & Bias Prevention */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shuffle className="w-4 h-4 text-purple-600" /> Survey Controls & Bias Reduction
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.isAnonymous}
                  onChange={(e) => setCurrent({ ...current, isAnonymous: e.target.checked })}
                  className="rounded text-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Strict Anonymity Mode
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    Permanently strips IP addresses and participant identifiers from submissions.
                  </span>
                </div>
              </label>

              <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.randomizeChoices}
                  onChange={(e) =>
                    setCurrent({ ...current, randomizeChoices: e.target.checked })
                  }
                  className="rounded text-indigo-600 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Randomize Choice Options
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    Mitigate order bias by shuffling choices per participant session.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Scheduling & Expiration */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" /> Scheduling & Auto-Close
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Maximum Response Cap
                </label>
                <input
                  type="number"
                  min="0"
                  value={current.maxResponses || ''}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      maxResponses: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Unlimited if empty"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Automated Close Date
                </label>
                <input
                  type="date"
                  value={current.closeDate?.split('T')[0] || ''}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      closeDate: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* 4. Automated Transactional Email Confirmation */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-600" /> Automated Confirmation Email
            </span>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={current.confirmationEmailSubject}
                  onChange={(e) =>
                    setCurrent({ ...current, confirmationEmailSubject: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Email Body Template
                </label>
                <textarea
                  rows={2}
                  value={current.confirmationEmailBody}
                  onChange={(e) =>
                    setCurrent({ ...current, confirmationEmailBody: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 5. Security, GDPR & Webhooks */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" /> Security, Privacy & Webhooks
            </span>

            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.enableCaptcha}
                  onChange={(e) => setCurrent({ ...current, enableCaptcha: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Enable Smart Spam & Bot Protection (CAPTCHA)
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.requireGdpr}
                  onChange={(e) => setCurrent({ ...current, requireGdpr: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Require Explicit GDPR / Privacy Consent Checkbox
              </label>

              {current.requireGdpr && (
                <input
                  type="text"
                  value={current.gdprText}
                  onChange={(e) => setCurrent({ ...current, gdprText: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                  placeholder="Consent disclaimer copy"
                />
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Webhook className="w-3.5 h-3.5 text-slate-500" /> Outbound Webhook URL (Google
                  Sheets / CRM Sync)
                </label>
                <input
                  type="url"
                  value={current.webhookUrl || ''}
                  onChange={(e) => setCurrent({ ...current, webhookUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/... or https://hooks.zapier.com/..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSaveSettings(current, formTitle, formDescription);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
