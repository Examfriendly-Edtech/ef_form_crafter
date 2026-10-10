import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Code2,
  ExternalLink,
  Send,
  Webhook,
  FileSpreadsheet,
} from 'lucide-react';
import { Form } from '../../types';
import { generateQrDataUrl } from '../../lib/qr';
import { safeFetchJson } from '../../lib/api';

interface ShareModalProps {
  form: Form;
  isOpen?: boolean;
  onClose: () => void;
  onOpenPublicView: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({

  form,
  isOpen,
  onClose,
  onOpenPublicView,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(form.settings.webhookUrl || '');
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?formId=${form.id}&mode=public`
    : `/?formId=${form.id}&mode=public`;
  const iframeSnippet = `<iframe src="${publicUrl}" width="100%" height="800" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);" allow="clipboard-write"></iframe>`;

  useEffect(() => {
    setWebhookUrl(form.settings.webhookUrl || '');
  }, [form.settings.webhookUrl]);

  useEffect(() => {
    let isMounted = true;
    generateQrDataUrl(publicUrl).then((url) => {
      if (isMounted) setQrDataUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [publicUrl]);


  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setWebhookTesting(true);
    setWebhookResult(null);

    try {
      const result = await safeFetchJson<{
        success: boolean;
        log: any;
      }>('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });

      if (result.ok) {
        setWebhookResult('Connection test succeeded! 200 OK simulated response.');
      } else {
        setWebhookResult(result.error || 'Failed to deliver webhook payload.');
      }
    } catch (e: any) {
      setWebhookResult(`Error: ${e.message}`);
    } finally {
      setWebhookTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Publish, Share & Embed</h2>
              <p className="text-xs text-slate-500">
                Distribute your course registration page or survey across web, email, and social
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Direct Public Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Direct Public Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 text-slate-700"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenPublicView();
                }}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                title="Open Public Responder Mode"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Embed snippet & QR code grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Embed HTML Snippet */}
            <div className="sm:col-span-8 space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600" /> HTML iFrame Embed Snippet
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={4}
                  value={iframeSnippet}
                  className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 text-slate-700 resize-none"
                />
                <button
                  onClick={handleCopyEmbed}
                  className="absolute right-2.5 bottom-2.5 flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEmbed ? 'Copied' : 'Copy HTML'}
                </button>
              </div>
            </div>

            {/* QR Code preview */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 border border-slate-200 rounded-2xl bg-slate-50/50 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Mobile QR Pass
              </div>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-28 h-28 object-contain p-1 bg-white border border-slate-200 rounded-xl shadow-xs"
                />
              )}
              <span className="text-[10px] text-slate-500 mt-1">Scan to test on phone</span>
            </div>
          </div>

          {/* Outbound Webhook & Google Sheets Sync */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <Webhook className="w-4 h-4 text-emerald-600" /> Integrations & Google Sheets Sync
            </span>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Live Google Sheets / CRM Webhook Sync</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Enter your Google Apps Script webhook URL or Zapier/Make endpoint to stream responses instantly into a Google Spreadsheet or external database on every submission.
              </p>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/... or https://hooks.zapier.com/..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                />
                <button
                  onClick={handleTestWebhook}
                  disabled={webhookTesting || !webhookUrl}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {webhookTesting ? 'Testing...' : 'Test Webhook'}
                </button>
              </div>

              {webhookResult && (
                <div className="text-[11px] font-semibold text-emerald-800 bg-white p-2 rounded-lg border border-emerald-200">
                  {webhookResult}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
