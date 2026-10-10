import React, { useState } from 'react';
import {
  Plus,
  GitBranch,
  Palette,
  Sliders,
  Trash2,
  FilePlus,
  Layers,
  Sparkles,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Form, FormField, FieldType, LogicRule, FormTheme, FormSettings } from '../../types';
import { FieldPalette } from './FieldPalette';
import { FieldEditorCard } from './FieldEditorCard';
import { FieldConfigDrawer } from './FieldConfigDrawer';
import { LogicRuleModal } from './LogicRuleModal';
import { ThemeDesignerModal } from './ThemeDesignerModal';
import { SettingsModal } from './SettingsModal';

interface FormBuilderProps {
  form: Form;
  onUpdateForm: (updated: Form) => void;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  form,
  onUpdateForm,
  previewDevice,
}) => {
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  // Form Title & Description Inline Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(form.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(form.description);

  React.useEffect(() => {
    setTitleInput(form.title);
    setDescInput(form.description);
  }, [form.title, form.description]);

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateForm({ ...form, title: titleInput.trim() });
    } else {
      setTitleInput(form.title);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    onUpdateForm({ ...form, description: descInput.trim() });
    setIsEditingDesc(false);
  };

  // Modals
  const [logicModalOpen, setLogicModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Filter fields for current page
  const pageFields = form.fields.filter((f) => f.pageIndex === activePageIndex);

  // Page management
  const handleAddPage = () => {
    const nextIdx = form.pages.length + 1;
    const newPage = {
      id: `page-${Date.now()}`,
      title: `Step ${nextIdx}: Untitled Section`,
      description: 'Section details and guidelines',
    };
    onUpdateForm({
      ...form,
      pages: [...form.pages, newPage],
    });
    setActivePageIndex(form.pages.length);
  };

  const handleDeletePage = (indexToDelete: number) => {
    if (form.pages.length <= 1) {
      alert('A form must have at least one step/page.');
      return;
    }
    const newPages = form.pages.filter((_, i) => i !== indexToDelete);
    // Shift fields belonging to deleted page or subsequent pages
    const updatedFields = form.fields
      .filter((f) => f.pageIndex !== indexToDelete)
      .map((f) => ({
        ...f,
        pageIndex: f.pageIndex > indexToDelete ? f.pageIndex - 1 : f.pageIndex,
      }));

    onUpdateForm({
      ...form,
      pages: newPages,
      fields: updatedFields,
    });
    setActivePageIndex(Math.max(0, indexToDelete - 1));
  };

  const handleUpdatePageTitle = (index: number, newTitle: string) => {
    const updatedPages = [...form.pages];
    updatedPages[index] = { ...updatedPages[index], title: newTitle };
    onUpdateForm({ ...form, pages: updatedPages });
  };

  // Add field to current page
  const handleAddField = (type: FieldType) => {
    const newId = `f-${Date.now()}`;
    let newField: FormField = {
      id: newId,
      pageIndex: activePageIndex,
      type,
      label: type === 'course_slot' ? 'Select Course Cohort Track' : `New ${type.replace('_', ' ')} Question`,
      required: false,
    };

    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = [
        { label: 'Option 1', value: 'opt_1' },
        { label: 'Option 2', value: 'opt_2' },
        { label: 'Option 3', value: 'opt_3' },
      ];
    } else if (type === 'course_slot') {
      newField.options = [
        { label: 'Cohort Track A: Fundamentals', value: 'track_a', price: 99, maxCapacity: 25, currentBookings: 12 },
        { label: 'Cohort Track B: Advanced System Architecture', value: 'track_b', price: 149, maxCapacity: 20, currentBookings: 19 },
      ];
    } else if (type === 'matrix') {
      newField.matrixRows = ['Ease of Use', 'Performance', 'Documentation Quality'];
      newField.matrixColumns = ['Poor', 'Fair', 'Good', 'Excellent'];
    } else if (type === 'rating') {
      newField.ratingMax = 5;
      newField.ratingType = 'star';
    } else if (type === 'file') {
      newField.fileTypes = ['application/pdf', 'image/*'];
      newField.maxFiles = 2;
    }

    onUpdateForm({
      ...form,
      fields: [...form.fields, newField],
    });
    setSelectedFieldId(newId);
  };

  // Field reordering within the active page
  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentList = [...form.fields];
    const indexInAll = currentList.findIndex((f) => f.id === fieldId);
    if (indexInAll === -1) return;

    // Find the adjacent index among the same page fields
    const targetPageIndex = currentList[indexInAll].pageIndex;
    const samePageIndices = currentList
      .map((f, i) => (f.pageIndex === targetPageIndex ? i : -1))
      .filter((i) => i !== -1);

    const relativePos = samePageIndices.indexOf(indexInAll);
    const swapRelativePos = direction === 'up' ? relativePos - 1 : relativePos + 1;

    if (swapRelativePos < 0 || swapRelativePos >= samePageIndices.length) return;

    const swapActualIndex = samePageIndices[swapRelativePos];
    const temp = currentList[indexInAll];
    currentList[indexInAll] = currentList[swapActualIndex];
    currentList[swapActualIndex] = temp;

    onUpdateForm({ ...form, fields: currentList });
  };

  const handleDuplicateField = (field: FormField) => {
    const duplicated: FormField = {
      ...JSON.parse(JSON.stringify(field)),
      id: `f-${Date.now()}`,
      label: `${field.label} (Copy)`,
    };
    const index = form.fields.findIndex((f) => f.id === field.id);
    const updated = [...form.fields];
    updated.splice(index + 1, 0, duplicated);
    onUpdateForm({ ...form, fields: updated });
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = form.fields.filter((f) => f.id !== fieldId);
    const updatedRules = form.logicRules.filter(
      (r) => r.targetFieldId !== fieldId && r.condition.fieldId !== fieldId
    );
    onUpdateForm({ ...form, fields: updatedFields, logicRules: updatedRules });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleUpdateField = (updatedField: FormField) => {
    const updatedFields = form.fields.map((f) =>
      f.id === updatedField.id ? updatedField : f
    );
    onUpdateForm({ ...form, fields: updatedFields });
  };

  // Viewport width styling
  const getContainerWidth = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-[420px]';
      case 'tablet':
        return 'max-w-[780px]';
      case 'desktop':
      default:
        return 'max-w-4xl';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Builder Top Bar: Logic, Theme, Settings quick buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Form Name / Title & Subtitle editing area */}
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Form Name
            </span>
            {!isEditingTitle && (
              <span className="text-[10px] text-slate-400">(Click name or pencil to edit)</span>
            )}
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-2 max-w-xl">
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitleInput(form.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="flex-1 text-base font-bold text-slate-900 px-3 py-1.5 rounded-xl border border-indigo-500 ring-2 ring-indigo-100 outline-hidden bg-white shadow-xs"
                placeholder="Enter form name..."
              />
              <button
                onClick={handleSaveTitle}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs transition-colors shrink-0"
                title="Save form name"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTitleInput(form.title);
                  setIsEditingTitle(false);
                }}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title">
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight cursor-pointer hover:text-indigo-600 transition-colors"
                title="Click to edit form name"
              >
                {form.title}
              </h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                title="Edit form name"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form Description */}
          {isEditingDesc ? (
            <div className="flex items-start gap-2 mt-2 max-w-xl">
              <textarea
                rows={2}
                autoFocus
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveDesc();
                  }
                  if (e.key === 'Escape') {
                    setDescInput(form.description);
                    setIsEditingDesc(false);
                  }
                }}
                className="flex-1 text-xs text-slate-700 px-3 py-1.5 rounded-xl border border-indigo-500 ring-2 ring-indigo-100 outline-hidden bg-white resize-none"
                placeholder="Enter form description..."
              />
              <button
                onClick={handleSaveDesc}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs transition-colors shrink-0 mt-1"
                title="Save description"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setDescInput(form.description);
                  setIsEditingDesc(false);
                }}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors shrink-0 mt-1"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-0.5 group/desc">
              <p
                onClick={() => setIsEditingDesc(true)}
                className="text-xs text-slate-500 max-w-xl truncate cursor-pointer hover:text-slate-700"
                title="Click to edit description"
              >
                {form.description || 'No description provided. Click to add one.'}
              </p>
              <button
                onClick={() => setIsEditingDesc(true)}
                className="opacity-0 group-hover/desc:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 transition-opacity cursor-pointer"
                title="Edit description"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setLogicModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-xs font-semibold text-slate-700 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
            <span>Conditional Logic</span>
            {form.logicRules.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {form.logicRules.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-purple-600" />
            <span>Theme & Style</span>
          </button>

          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Settings & Payments</span>
          </button>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Field Palette */}
        <div className="lg:col-span-3">
          <FieldPalette onAddField={handleAddField} />
        </div>

        {/* Center Canvas: Multi-page Steps & Stage */}
        <div className="lg:col-span-9 flex justify-center">
          <div className={`w-full ${getContainerWidth()} transition-all duration-300 space-y-4`}>
            {/* Multi-Step Pages Navigation Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Pages
                </span>
                {form.pages.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePageIndex(i)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activePageIndex === i
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>
                      {i + 1}. {p.title.length > 18 ? p.title.slice(0, 18) + '...' : p.title}
                    </span>
                    {form.pages.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(i);
                        }}
                        className={`hover:text-rose-300 p-0.5 rounded ${
                          activePageIndex === i ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                        title="Delete this page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}

                <button
                  onClick={handleAddPage}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-slate-600 text-xs font-semibold transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>
            </div>

            {/* Current Page Title & Header Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Page {activePageIndex + 1} of {form.pages.length}
                </span>
              </div>
              <input
                type="text"
                value={form.pages[activePageIndex]?.title || ''}
                onChange={(e) => handleUpdatePageTitle(activePageIndex, e.target.value)}
                placeholder="Enter Page Title..."
                className="w-full text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-hidden py-1"
              />
            </div>

            {/* Field Stage */}
            <div className="space-y-3">
              {pageFields.length === 0 ? (
                <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-3xl p-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    This step is currently empty
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Choose components from the left palette to build this section of your form.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => handleAddField('text')}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      + Short Text
                    </button>
                    <button
                      onClick={() => handleAddField('course_slot')}
                      className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      + Course Slot
                    </button>
                    <button
                      onClick={() => handleAddField('matrix')}
                      className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-800 hover:bg-purple-100"
                    >
                      + Likert Matrix
                    </button>
                  </div>
                </div>
              ) : (
                pageFields.map((field, idx) => (
                  <FieldEditorCard
                    key={field.id}
                    field={field}
                    index={idx}
                    totalFields={pageFields.length}
                    isSelected={selectedFieldId === field.id}
                    logicRules={form.logicRules}
                    onSelect={() => setSelectedFieldId(field.id)}
                    onMoveUp={() => handleMoveField(field.id, 'up')}
                    onMoveDown={() => handleMoveField(field.id, 'down')}
                    onDuplicate={() => handleDuplicateField(field)}
                    onDelete={() => handleDeleteField(field.id)}
                    onOpenConfig={() => {
                      setEditingField(field);
                      setConfigDrawerOpen(true);
                    }}
                    onUpdateField={handleUpdateField}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Field Configuration Drawer */}
      {configDrawerOpen && editingField && (
        <FieldConfigDrawer
          field={editingField}
          onClose={() => {
            setConfigDrawerOpen(false);
            setEditingField(null);
          }}
          onUpdateField={handleUpdateField}
        />
      )}

      {/* Logic Rule Modal */}
      {logicModalOpen && (
        <LogicRuleModal
          form={form}
          onClose={() => setLogicModalOpen(false)}
          onUpdateRules={(rules: LogicRule[]) => onUpdateForm({ ...form, logicRules: rules })}
        />
      )}

      {/* Theme Designer Modal */}
      {themeModalOpen && (
        <ThemeDesignerModal
          theme={form.theme}
          onClose={() => setThemeModalOpen(false)}
          onSaveTheme={(theme: FormTheme) => onUpdateForm({ ...form, theme })}
        />
      )}

      {/* Form Settings Modal */}
      {settingsModalOpen && (
        <SettingsModal
          settings={form.settings}
          title={form.title}
          description={form.description}
          onClose={() => setSettingsModalOpen(false)}
          onSaveSettings={(settings: FormSettings, updatedTitle?: string, updatedDesc?: string) =>
            onUpdateForm({
              ...form,
              settings,
              title: updatedTitle?.trim() || form.title,
              description: updatedDesc !== undefined ? updatedDesc.trim() : form.description,
            })
          }
        />
      )}
    </div>
  );
};

