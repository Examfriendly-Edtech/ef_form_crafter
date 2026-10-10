import React, { useState } from 'react';
import { X, Palette, Check, Image, Sparkles } from 'lucide-react';
import { FormTheme } from '../../types';

interface ThemeDesignerModalProps {
  theme: FormTheme;
  isOpen?: boolean;
  onClose: () => void;
  onSaveTheme: (theme: FormTheme) => void;
}

export const ThemeDesignerModal: React.FC<ThemeDesignerModalProps> = ({
  theme,
  onClose,
  onSaveTheme,
}) => {
  const [currentTheme, setCurrentTheme] = useState<FormTheme>({ ...theme });

  React.useEffect(() => {
    setCurrentTheme({ ...theme });
  }, [theme]);


  const colorPresets = [
    { label: 'Indigo / Tech', primary: '#4f46e5', bg: '#f8fafc' },
    { label: 'Emerald / Growth', primary: '#059669', bg: '#f0fdf4' },
    { label: 'Violet / Modern', primary: '#7c3aed', bg: '#faf5ff' },
    { label: 'Rose / Creative', primary: '#e11d48', bg: '#fff1f2' },
    { label: 'Amber / Warm', primary: '#d97706', bg: '#fffbeb' },
    { label: 'Slate / Minimal', primary: '#0f172a', bg: '#f8fafc' },
  ];

  const fontPresets = ['Inter', 'Roboto', 'Outfit', 'Plus Jakarta Sans', 'Playfair Display'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Styling & Brand Theming</h2>
              <p className="text-xs text-slate-500">
                Personalize accent palettes, typography, corner radius, and headers
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Presets */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Color Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {colorPresets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setCurrentTheme({
                      ...currentTheme,
                      primaryColor: preset.primary,
                      backgroundColor: preset.bg,
                    })
                  }
                  className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-indigo-400 text-left transition-colors text-xs font-medium"
                >
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span className="truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hex Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Primary Brand Accent
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.primaryColor}
                  onChange={(e) =>
                    setCurrentTheme({ ...currentTheme, primaryColor: e.target.value })
                  }
                  className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={currentTheme.primaryColor}
                  onChange={(e) =>
                    setCurrentTheme({ ...currentTheme, primaryColor: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Page Background Tint
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTheme.backgroundColor}
                  onChange={(e) =>
                    setCurrentTheme({ ...currentTheme, backgroundColor: e.target.value })
                  }
                  className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={currentTheme.backgroundColor}
                  onChange={(e) =>
                    setCurrentTheme({ ...currentTheme, backgroundColor: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Typography & Corner Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Font Family</label>
              <select
                value={currentTheme.fontFamily}
                onChange={(e) => setCurrentTheme({ ...currentTheme, fontFamily: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {fontPresets.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Card Corner Radius
              </label>
              <select
                value={currentTheme.borderRadius}
                onChange={(e) =>
                  setCurrentTheme({ ...currentTheme, borderRadius: e.target.value as any })
                }
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="none">Sharp (Square / 0px)</option>
                <option value="sm">Subtle (4px)</option>
                <option value="md">Rounded (8px)</option>
                <option value="lg">Curved (12px)</option>
                <option value="xl">Pill Smooth (16px)</option>
              </select>
            </div>
          </div>

          {/* Header Banner & Logo URLs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-slate-500" /> Header Cover Banner Image URL
              </label>
              <input
                type="text"
                value={currentTheme.headerBannerUrl || ''}
                onChange={(e) =>
                  setCurrentTheme({ ...currentTheme, headerBannerUrl: e.target.value })
                }
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* Custom CSS Injection Box */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Custom CSS Overrides (Advanced)
            </label>
            <textarea
              rows={3}
              value={currentTheme.customCss || ''}
              onChange={(e) => setCurrentTheme({ ...currentTheme, customCss: e.target.value })}
              placeholder=".form-card { box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono resize-none"
            />
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
              onSaveTheme(currentTheme);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" /> Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
};
