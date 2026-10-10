import React, { useState } from 'react';
import {
  LayoutTemplate,
  Eye,
  BarChart3,
  TableProperties,
  QrCode,
  Database,
  Share2,
  Plus,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  FileText,
  GraduationCap,
  ClipboardList,
  Pencil,
  X,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Form, AuthUser } from '../types';

interface NavbarProps {
  forms: Form[];
  currentForm: Form;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onSelectForm: (formId: string) => void;
  onRenameForm?: (newName: string) => void;
  onCreateNewForm: (type: 'course' | 'survey' | 'blank') => void;
  activeView: 'builder' | 'public' | 'analytics' | 'responses' | 'scanner' | 'schema';
  onChangeView: (view: 'builder' | 'public' | 'analytics' | 'responses' | 'scanner' | 'schema') => void;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  onChangePreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  onOpenShareModal: () => void;
  onPublishToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  forms,
  currentForm,
  currentUser,
  onLogout,
  onSelectForm,
  onRenameForm,
  onCreateNewForm,
  activeView,
  onChangeView,
  previewDevice,
  onChangePreviewDevice,
  onOpenShareModal,
  onPublishToggle,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [targetFormToRename, setTargetFormToRename] = useState<Form>(currentForm);
  const [renameInput, setRenameInput] = useState(currentForm.title);

  React.useEffect(() => {

    setRenameInput(currentForm.title);
    setTargetFormToRename(currentForm);
  }, [currentForm.title, currentForm.id]);

  const handleOpenRename = (formToRename: Form, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetFormToRename(formToRename);
    setRenameInput(formToRename.title);
    setIsRenameModalOpen(true);
    setDropdownOpen(false);
  };

  const handleConfirmRename = () => {
    if (renameInput.trim() && onRenameForm) {
      if (targetFormToRename.id === currentForm.id) {
        onRenameForm(renameInput.trim());
      } else {
        // If renaming an inactive form, select it or update it
        onSelectForm(targetFormToRename.id);
        onRenameForm(renameInput.trim());
      }
    }
    setIsRenameModalOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        {/* Zone 1: Brand & Form Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              FormCraft
            </span>
            <span className="text-slate-300 font-normal">/</span>
          </div>

          {/* Form Switcher Dropdown & Rename trigger */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setNewMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-800 text-xs font-semibold transition-all max-w-[230px] truncate cursor-pointer shadow-2xs group"
              title="Click to switch forms"
            >
              <span className="truncate">{currentForm.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform" />
            </button>

            {/* Quick Rename Button */}
            <button
              onClick={(e) => handleOpenRename(currentForm, e)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer text-xs font-medium"
              title="Rename active form"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline text-[11px] font-semibold">Rename</span>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 top-full w-84 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Your Forms ({forms.length})</span>
                  <button
                    onClick={(e) => handleOpenRename(currentForm, e)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer font-bold tracking-normal uppercase"
                  >
                    <Pencil className="w-3 h-3" /> Rename Active
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-1">
                  {forms.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        onSelectForm(f.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group/row ${
                        f.id === currentForm.id
                          ? 'text-indigo-600 font-bold bg-indigo-50/50'
                          : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate mr-2 flex-1">
                        <div className="truncate font-semibold flex items-center gap-1.5">
                          <span>{f.title}</span>
                          {f.id === currentForm.id && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-normal">
                          <span className="capitalize">{f.category.replace('_', ' ')}</span>
                          <span>·</span>
                          <span className="capitalize">{f.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Inline rename button inside dropdown row */}
                        <button
                          onClick={(e) => handleOpenRename(f, e)}
                          className="opacity-0 group-hover/row:opacity-100 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200 transition-all cursor-pointer"
                          title={`Rename "${f.title}"`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {f.id === currentForm.id && (
                          <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            )}
          </div>

          {/* New Form Button */}
          <div className="relative">
            <button
              onClick={() => {
                setNewMenuOpen(!newMenuOpen);
                setDropdownOpen(false);
              }}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Create new template"
            >
              <Plus className="w-4 h-4" />
            </button>

            {newMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1 space-y-1">
                <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  New Form Template
                </div>
                <button
                  onClick={() => {
                    onCreateNewForm('course');
                    setNewMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Course Registration</span>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      Slot caps, payments & QR passes
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onCreateNewForm('survey');
                    setNewMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Survey Benchmark</span>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      Likert matrix, ratings & anonymity
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onCreateNewForm('blank');
                    setNewMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group border-t border-slate-100"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Blank Canvas</span>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      Start from empty canvas
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation segmented tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
          <button
            onClick={() => onChangeView('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeView === 'builder'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Builder</span>
          </button>
          <button
            onClick={() => onChangeView('public')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeView === 'public'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Public View</span>
          </button>
          <button
            onClick={() => onChangeView('scanner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeView === 'scanner'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Door Scanner</span>
          </button>
          <button
            onClick={() => onChangeView('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeView === 'analytics'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => onChangeView('responses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeView === 'responses'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Responses</span>
          </button>
          <button
            onClick={() => onChangeView('schema')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeView === 'schema'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase SQL</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Viewport controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Viewport switch for builder & public mode */}
          {(activeView === 'builder' || activeView === 'public') && (
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg text-slate-600">
              <button
                onClick={() => onChangePreviewDevice('desktop')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
                title="Desktop (Full)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangePreviewDevice('tablet')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  previewDevice === 'tablet'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
                title="Tablet (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangePreviewDevice('mobile')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
                title="Mobile (390px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Status switch */}
          <button
            onClick={onPublishToggle}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentForm.status === 'published'
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to toggle status"
          >
            <span>Status:</span>
            <span className="capitalize font-bold">
              {currentForm.status === 'published' ? 'Active' : 'Draft'}
            </span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share & Embed</span>
          </button>

          {/* Authorized User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                title={`Signed in as ${currentUser.username} (${currentUser.role})`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold text-slate-900">{currentUser.username}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Sign out of administrative session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Responsive mobile sub-navigation */}
      <div className="lg:hidden flex items-center overflow-x-auto gap-1 px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs">
        <button
          onClick={() => onChangeView('builder')}
          className={`px-3 py-1 rounded-lg font-semibold shrink-0 cursor-pointer ${
            activeView === 'builder' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Builder
        </button>
        <button
          onClick={() => onChangeView('public')}
          className={`px-3 py-1 rounded-lg font-semibold shrink-0 cursor-pointer ${
            activeView === 'public' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Public View
        </button>
        <button
          onClick={() => onChangeView('scanner')}
          className={`px-3 py-1 rounded-lg font-semibold shrink-0 cursor-pointer ${
            activeView === 'scanner' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Scanner
        </button>
        <button
          onClick={() => onChangeView('analytics')}
          className={`px-3 py-1 rounded-lg font-semibold shrink-0 cursor-pointer ${
            activeView === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => onChangeView('responses')}
          className={`px-3 py-1 rounded-lg font-semibold shrink-0 cursor-pointer ${
            activeView === 'responses' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Responses
        </button>
        <button
          onClick={() => onChangeView('schema')}
          className={`px-3 py-1 rounded-lg font-semibold shrink-0 cursor-pointer ${
            activeView === 'schema' ? 'bg-emerald-700 text-white' : 'text-slate-600'
          }`}
        >
          Supabase SQL
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="ml-auto px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold shrink-0 cursor-pointer flex items-center gap-1 border border-rose-200"
          >
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        )}
      </div>

      {/* Quick Rename Form Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Rename Form</h3>
              </div>
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Form Title
              </label>
              <input
                type="text"
                autoFocus
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') setIsRenameModalOpen(false);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:border-indigo-500 ring-2 focus:ring-indigo-100 outline-hidden"
                placeholder="Enter new form title..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
