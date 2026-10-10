/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Form, Submission, AuthUser } from './types';
import { initialForms, initialSubmissions } from './data/mockForms';
import { Navbar } from './components/Navbar';
import { FormBuilder } from './components/builder/FormBuilder';
import { PublicFormRenderer } from './components/public/PublicFormRenderer';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { ResponsesTable } from './components/responses/ResponsesTable';
import { TicketScanner } from './components/scanner/TicketScanner';
import { SupabaseSchemaView } from './components/supabase/SupabaseSchemaView';
import { ShareModal } from './components/share/ShareModal';
import { LoginView } from './components/auth/LoginView';
import { safeFetchJson } from './lib/api';
import {
  Eye,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';

export default function App() {
  const [forms, setForms] = useState<Form[]>(initialForms);
  const [currentFormId, setCurrentFormId] = useState<string>(initialForms[0].id);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [activeView, setActiveView] = useState<
    'builder' | 'public' | 'analytics' | 'responses' | 'scanner' | 'schema'
  >('builder');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPreviewLink, setCopiedPreviewLink] = useState(false);

  // Authentication state for authorized accounts
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('formcraft_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('formcraft_auth_token') || null;
  });

  // Check URL parameters for shared public mode
  const searchParams = new URLSearchParams(window.location.search);
  const isSharedPublicMode = searchParams.get('mode') === 'public';
  const paramFormId = searchParams.get('formId');

  useEffect(() => {
    if (paramFormId) {
      setCurrentFormId(paramFormId);
    }
    if (isSharedPublicMode) {
      setActiveView('public');
    }
  }, [paramFormId, isSharedPublicMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Fetch live forms & submissions from Express backend
  const loadBackendData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const formsRes = await safeFetchJson<Form[]>('/api/forms', { headers });
      if (formsRes.ok && Array.isArray(formsRes.data) && formsRes.data.length > 0) {
        setForms(formsRes.data);
      }

      // Fetch all submissions for current form
      if (currentFormId) {
        const subRes = await safeFetchJson<Submission[]>(
          `/api/forms/${currentFormId}/submissions`,
          { headers }
        );
        if (subRes.ok && Array.isArray(subRes.data)) {
          // Merge with any existing in memory
          setSubmissions((prev) => {
            const others = prev.filter((s) => s.formId !== currentFormId);
            return [...(subRes.data || []), ...others];
          });
        }
      }
    } catch (e) {
      console.warn('Backend API sync notice:', e);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, [currentFormId, authToken]);

  const currentForm = forms.find((f) => f.id === currentFormId) || forms[0];

  // Auth Handlers
  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem('formcraft_auth_user', JSON.stringify(user));
      localStorage.setItem('formcraft_auth_token', token);
    } catch (e) {
      console.error('Failed to save session to storage', e);
    }
    showToast(`Welcome back, ${user.displayName}! Authorized access granted.`);
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await safeFetchJson('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch (e) {
      console.error('Logout error', e);
    }
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('formcraft_auth_user');
    localStorage.removeItem('formcraft_auth_token');
    showToast('Signed out of administrative session.');
  };

  // Update Form handler (supports form title/name editing)
  const handleUpdateForm = async (updated: Form, notifyMessage?: string) => {
    setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    showToast(notifyMessage || 'Form updated successfully');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      await safeFetchJson(`/api/forms/${updated.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('Failed to sync form update to backend', e);
    }
  };

  // Create New Form Template
  const handleCreateNewForm = async (type: 'course' | 'survey' | 'blank') => {
    const newId = `form-${Date.now()}`;
    let newForm: Form;

    if (type === 'course') {
      newForm = {
        id: newId,
        title: 'New Course Registration Cohort',
        description: 'Register for our upcoming session. Limited seats available.',
        category: 'course_registration',
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [
          { id: 'p1', title: 'Attendee Info' },
          { id: 'p2', title: 'Track & Payment' },
        ],
        fields: [
          { id: `f-${Date.now()}-1`, pageIndex: 0, type: 'text', label: 'Full Name', required: true },
          { id: `f-${Date.now()}-2`, pageIndex: 0, type: 'text', label: 'Email Address', required: true },
          {
            id: `f-${Date.now()}-3`,
            pageIndex: 1,
            type: 'course_slot',
            label: 'Select Class Slot',
            required: true,
            options: [
              { label: 'Morning Session (09:00 AM)', value: 'morning', price: 99, maxCapacity: 20, currentBookings: 0 },
              { label: 'Evening Session (06:00 PM)', value: 'evening', price: 99, maxCapacity: 20, currentBookings: 0 },
            ],
          },
        ],
        logicRules: [],
        theme: {
          primaryColor: '#4f46e5',
          backgroundColor: '#f8fafc',
          cardBackground: '#ffffff',
          textColor: '#0f172a',
          fontFamily: 'Inter',
          borderRadius: 'lg',
        },
        settings: {
          isCourseRegistration: true,
          courseFeeType: 'fixed',
          fixedFeeAmount: 99,
          currency: 'USD',
          isSurvey: false,
          isAnonymous: false,
          randomizeQuestions: false,
          randomizeChoices: false,
          enableCaptcha: true,
          requireGdpr: true,
          gdprText: 'I agree to the enrollment and refund terms.',
          confirmationEmailSubject: 'Registration Confirmed',
          confirmationEmailBody: 'Your ticket and calendar invite are attached.',
        },
      };
    } else if (type === 'survey') {
      newForm = {
        id: newId,
        title: 'New Feedback & Satisfaction Survey',
        description: 'Help us improve by providing anonymous feedback.',
        category: 'survey',
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [{ id: 'p1', title: 'Survey Questions' }],
        fields: [
          {
            id: `f-${Date.now()}-1`,
            pageIndex: 0,
            type: 'rating',
            label: 'Overall Experience Rating',
            required: true,
            ratingMax: 5,
            ratingType: 'star',
          },
          {
            id: `f-${Date.now()}-2`,
            pageIndex: 0,
            type: 'matrix',
            label: 'Detailed Likert Assessment',
            required: true,
            matrixRows: ['Clarity of Content', 'Pacing', 'Value for Time'],
            matrixColumns: ['Poor', 'Average', 'Good', 'Exceptional'],
          },
          { id: `f-${Date.now()}-3`, pageIndex: 0, type: 'textarea', label: 'Additional Comments', required: false },
        ],
        logicRules: [],
        theme: {
          primaryColor: '#059669',
          backgroundColor: '#f0fdf4',
          cardBackground: '#ffffff',
          textColor: '#0f172a',
          fontFamily: 'Inter',
          borderRadius: 'xl',
        },
        settings: {
          isCourseRegistration: false,
          courseFeeType: 'free',
          fixedFeeAmount: 0,
          currency: 'USD',
          isSurvey: true,
          isAnonymous: true,
          randomizeQuestions: false,
          randomizeChoices: false,
          enableCaptcha: false,
          requireGdpr: false,
          gdprText: '',
          confirmationEmailSubject: 'Survey Received',
          confirmationEmailBody: 'Thank you for your valuable response.',
        },
      };
    } else {
      newForm = {
        id: newId,
        title: 'Untitled Dynamic Form',
        description: 'Build your custom form with dynamic fields and conditional rules.',
        category: 'custom',
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [{ id: 'p1', title: 'Page 1' }],
        fields: [
          { id: `f-${Date.now()}-1`, pageIndex: 0, type: 'text', label: 'Your Name', required: true },
        ],
        logicRules: [],
        theme: {
          primaryColor: '#4f46e5',
          backgroundColor: '#f8fafc',
          cardBackground: '#ffffff',
          textColor: '#0f172a',
          fontFamily: 'Inter',
          borderRadius: 'md',
        },
        settings: {
          isCourseRegistration: false,
          courseFeeType: 'free',
          fixedFeeAmount: 0,
          currency: 'USD',
          isSurvey: false,
          isAnonymous: false,
          randomizeQuestions: false,
          randomizeChoices: false,
          enableCaptcha: false,
          requireGdpr: false,
          gdprText: '',
          confirmationEmailSubject: 'Submission Confirmed',
          confirmationEmailBody: 'We have received your response.',
        },
      };
    }

    setForms([newForm, ...forms]);
    setCurrentFormId(newForm.id);
    setActiveView('builder');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      await safeFetchJson('/api/forms', {
        method: 'POST',
        headers,
        body: JSON.stringify(newForm),
      });
    } catch (e) {
      console.error('Failed to create new form on server', e);
    }
  };

  // Toggle publish
  const handlePublishToggle = () => {
    const updatedStatus = currentForm.status === 'published' ? 'draft' : 'published';
    handleUpdateForm({
      ...currentForm,
      status: updatedStatus,
    });
  };

  // Update submission status
  const handleUpdateSubmissionStatus = async (subId: string, status: Submission['status']) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status } : s))
    );
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      await safeFetchJson(`/api/submissions/${subId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error('Failed to update submission status', e);
    }
  };

  // Submission added from public view
  const handleSubmissionAdded = (newSub: Submission) => {
    setSubmissions((prev) => [newSub, ...prev]);
    // Also reload form to pick up updated slot capacities
    loadBackendData();
  };

  // =========================================================================
  // SCENARIO 1: PURE PUBLIC SHARED FORM VIEW
  // "When the link of the form is shared, it should not show these all admin specific things to users.
  // Also make the form responsive to screen."
  // =========================================================================
  if (isSharedPublicMode) {
    const publicUrl = window.location.href;
    const isClosedOrDraft = currentForm.status === 'closed';

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {/* Main Public Form Responsive Container */}
        <main className="flex-1 w-full max-w-full">
          {isClosedOrDraft ? (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 max-w-md w-full text-center shadow-lg space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Registration Closed</h2>
                <p className="text-slate-600 text-sm">
                  This form is currently not accepting new submissions or has been closed by the organizer.
                </p>
              </div>
            </div>
          ) : (
            <PublicFormRenderer
              form={currentForm}
              onSubmitSuccess={handleSubmissionAdded}
              previewDevice="desktop"
            />
          )}
        </main>

        {/* Minimal clean footer (Zero admin controls) */}
        <footer className="py-6 border-t border-slate-200/60 bg-white/60 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
          <span>Powered by FormCraft &bull; Secure Registration System</span>
          <span className="hidden sm:inline">&bull;</span>
          <a
            href="/"
            className="text-slate-400 hover:text-indigo-600 transition-colors text-[11px] underline underline-offset-2"
          >
            Organizer Portal
          </a>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // SCENARIO 2: UNAUTHENTICATED ADMIN ACCESS
  // "This form web app can be only used by 'authorized accounts' ...
  // if a user tries to access the app , he has to sign in. to create forms and see responses and stats."
  // =========================================================================
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        publicFormAvailable={forms.length > 0}
        onGoToPublicForm={() => {
          window.location.href = `/?formId=${currentForm.id}&mode=public`;
        }}
      />
    );
  }

  // =========================================================================
  // SCENARIO 3: AUTHORIZED ADMIN STUDIO
  // Full dashboard access with Navbar, Builder, Analytics, Responses, Scanner, Supabase SQL
  // =========================================================================
  const directShareUrl = `${window.location.origin}/?formId=${currentForm.id}&mode=public`;

  const handleCopyPreviewLink = () => {
    navigator.clipboard.writeText(directShareUrl);
    setCopiedPreviewLink(true);
    setTimeout(() => setCopiedPreviewLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        forms={forms}
        currentForm={currentForm}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSelectForm={(id) => setCurrentFormId(id)}
        onRenameForm={(newName) => handleUpdateForm({ ...currentForm, title: newName }, `Form renamed to "${newName}"`)}
        onCreateNewForm={handleCreateNewForm}
        activeView={activeView}
        onChangeView={(v) => setActiveView(v)}
        previewDevice={previewDevice}
        onChangePreviewDevice={(d) => setPreviewDevice(d)}
        onOpenShareModal={() => setShareModalOpen(true)}
        onPublishToggle={handlePublishToggle}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'builder' && (
          <FormBuilder
            form={currentForm}
            onUpdateForm={handleUpdateForm}
            previewDevice={previewDevice}
          />
        )}

        {/* In-Studio Preview View with Admin Banner */}
        {activeView === 'public' && (
          <div className="flex flex-col">
            {/* Top Admin Preview Banner */}
            <div className="bg-indigo-950 text-white px-4 py-2.5 border-b border-indigo-900 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-800 text-indigo-200 font-bold uppercase tracking-wider text-[10px]">
                  <Eye className="w-3 h-3" /> Admin Preview Mode
                </span>
                <span className="text-slate-300 hidden md:inline">
                  Testing respondent flow for <strong className="text-white font-bold">{currentForm.title}</strong>
                </span>
              </div>

              {/* Center device controls */}
              <div className="flex items-center bg-indigo-900/80 p-0.5 rounded-lg text-indigo-200">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    previewDevice === 'desktop' ? 'bg-indigo-700 text-white font-bold' : 'hover:text-white'
                  }`}
                  title="Desktop View (Full Width)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    previewDevice === 'tablet' ? 'bg-indigo-700 text-white font-bold' : 'hover:text-white'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Tablet</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    previewDevice === 'mobile' ? 'bg-indigo-700 text-white font-bold' : 'hover:text-white'
                  }`}
                  title="Mobile View (390px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Mobile</span>
                </button>
              </div>

              {/* Right action controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPreviewLink}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
                  title="Copy direct share link for external respondents"
                >
                  {copiedPreviewLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPreviewLink ? 'Copied Public Link!' : 'Copy Share Link'}</span>
                </button>
                <a
                  href={directShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
                  title="Open isolated public respondent view in new tab"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Open Clean Shared Link</span>
                </a>
                <button
                  onClick={() => setActiveView('builder')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Builder</span>
                </button>
              </div>
            </div>

            {/* Embedded Public Form Preview */}
            <PublicFormRenderer
              form={currentForm}
              onSubmitSuccess={handleSubmissionAdded}
              previewDevice={previewDevice}
            />
          </div>
        )}

        {activeView === 'scanner' && (
          <TicketScanner
            forms={forms}
            submissions={submissions}
            onRefreshData={loadBackendData}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsDashboard
            form={currentForm}
            submissions={submissions}
          />
        )}

        {activeView === 'responses' && (
          <ResponsesTable
            form={currentForm}
            submissions={submissions}
            onUpdateStatus={handleUpdateSubmissionStatus}
          />
        )}

        {activeView === 'schema' && <SupabaseSchemaView />}
      </main>

      {/* Publish & Share Modal */}
      {shareModalOpen && (
        <ShareModal
          form={currentForm}
          onClose={() => setShareModalOpen(false)}
          onOpenPublicView={() => setActiveView('public')}
        />
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
