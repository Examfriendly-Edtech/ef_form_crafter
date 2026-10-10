import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Settings,
  GitBranch,
  Star,
  Users,
  FileText,
  Check,
} from 'lucide-react';
import { FormField, LogicRule } from '../../types';

interface FieldEditorCardProps {
  field: FormField;
  index: number;
  totalFields: number;
  isSelected: boolean;
  logicRules: LogicRule[];
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenConfig: () => void;
  onUpdateField?: (updated: FormField) => void;
}

export const FieldEditorCard: React.FC<FieldEditorCardProps> = ({
  field,
  index,
  totalFields,
  isSelected,
  logicRules,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onOpenConfig,
  onUpdateField,
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [localLabel, setLocalLabel] = useState(field.label);

  const hasRules = logicRules.some(
    (r) => r.targetFieldId === field.id || r.condition.fieldId === field.id
  );

  const handleSaveInlineLabel = () => {
    setIsEditingLabel(false);
    if (onUpdateField && localLabel.trim()) {
      onUpdateField({ ...field, label: localLabel.trim() });
    }
  };

  const handleToggleRequired = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateField) {
      onUpdateField({ ...field, required: !field.required });
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border transition-all duration-200 p-5 relative group cursor-pointer ${
        isSelected
          ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-500/10'
          : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-xs'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Left: Reorder arrows & Unboxed clean metadata */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center bg-slate-100 rounded-lg p-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              disabled={index === 0}
              onClick={onMoveUp}
              className={`p-1 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer ${
                index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white'
              }`}
              title="Move Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={index === totalFields - 1}
              onClick={onMoveDown}
              className={`p-1 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer ${
                index === totalFields - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white'
              }`}
              title="Move Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean unboxed metadata (anti-pill discipline) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="capitalize text-slate-800 font-semibold">
              {field.type.replace('_', ' ')}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono tabular-nums text-[11px]">#{index + 1}</span>

            {hasRules && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                  <GitBranch className="w-3 h-3" /> Branch Rule
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Required Switch & Action Toolbar */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Required toggle */}
          <button
            onClick={handleToggleRequired}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              field.required
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Required"
          >
            <span>{field.required ? 'Required' : 'Optional'}</span>
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onOpenConfig}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              title="Configure options, matrix, limits"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDuplicate}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Duplicate Field"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Remove Field"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Field Label and Description (with direct inline edit support) */}
      <div className="mb-3.5" onClick={(e) => e.stopPropagation()}>
        {isEditingLabel ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveInlineLabel();
                if (e.key === 'Escape') setIsEditingLabel(false);
              }}
              onBlur={handleSaveInlineLabel}
              className="w-full text-sm font-bold text-slate-900 px-2 py-1 rounded-lg border border-indigo-400 focus:outline-hidden ring-2 ring-indigo-100"
            />
            <button
              onClick={handleSaveInlineLabel}
              className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingLabel(true)}
            className="group/label flex items-baseline gap-1.5 cursor-text"
            title="Click to edit label directly"
          >
            <label className="text-sm font-bold text-slate-900 group-hover/label:text-indigo-600 transition-colors">
              {field.label || 'Untitled Field'}
              {field.required && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <span className="text-[10px] text-slate-300 opacity-0 group-hover/label:opacity-100 transition-opacity">
              Edit
            </span>
          </div>
        )}

        {field.description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{field.description}</p>
        )}
      </div>

      {/* Live Interactive Preview based on Field Type */}
      <div className="pointer-events-none opacity-90">
        {/* Short Text */}
        {field.type === 'text' && (
          <input
            type="text"
            readOnly
            placeholder={field.placeholder || 'Enter text here...'}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-400"
          />
        )}

        {/* Long Text */}
        {field.type === 'textarea' && (
          <textarea
            readOnly
            rows={2}
            placeholder={field.placeholder || 'Enter paragraph...'}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-400 resize-none"
          />
        )}

        {/* Dropdown Select */}
        {field.type === 'select' && (
          <select
            disabled
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
          >
            <option>Select an option...</option>
            {field.options?.map((opt, i) => (
              <option key={i}>{opt.label}</option>
            ))}
          </select>
        )}

        {/* Radio Choices */}
        {field.type === 'radio' && (
          <div className="space-y-1.5">
            {field.options?.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 bg-slate-50/60 text-xs text-slate-700"
              >
                <input type="radio" disabled name={field.id} className="text-indigo-600" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Checkboxes */}
        {field.type === 'checkbox' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {field.options?.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 bg-slate-50/60 text-xs text-slate-700"
              >
                <input type="checkbox" disabled className="rounded text-indigo-600" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Date Time Picker */}
        {field.type === 'datetime' && (
          <input
            type="datetime-local"
            readOnly
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono"
          />
        )}

        {/* File Upload */}
        {field.type === 'file' && (
          <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
            <FileText className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <div className="text-xs font-semibold text-slate-700">
              Drop files here or click to browse
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {field.fileTypes?.join(', ') || 'Any file'} (Max {field.maxFiles || 1} files)
            </div>
          </div>
        )}

        {/* Rating Field */}
        {field.type === 'rating' && (
          <div className="flex items-center gap-1.5 py-1">
            {Array.from({ length: field.ratingMax || 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500"
              >
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
              </div>
            ))}
            <span className="text-xs text-slate-400 ml-2 font-mono tabular-nums">
              ({field.ratingMax || 5} Stars Scale)
            </span>
          </div>
        )}

        {/* Matrix Likert Scale */}
        {field.type === 'matrix' && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70">
                  <th className="p-2.5 text-left font-semibold text-slate-700">Topic Dimension</th>
                  {field.matrixColumns?.map((col, idx) => (
                    <th key={idx} className="p-2.5 text-center font-semibold text-slate-700">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {field.matrixRows?.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-100 last:border-0">
                    <td className="p-2.5 font-medium text-slate-800">{row}</td>
                    {field.matrixColumns?.map((_, cIdx) => (
                      <td key={cIdx} className="p-2.5 text-center">
                        <input type="radio" disabled className="text-indigo-600" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Course Slot Capacity Selector */}
        {field.type === 'course_slot' && (
          <div className="space-y-2">
            {field.options?.map((opt, i) => {
              const max = opt.maxCapacity ?? 20;
              const booked = opt.currentBookings ?? 0;
              const remaining = Math.max(0, max - booked);
              const isFull = remaining === 0;

              return (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isFull
                      ? 'bg-slate-100 border-slate-200 opacity-60'
                      : 'bg-emerald-50/30 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input type="radio" disabled className="text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                      {opt.price ? (
                        <div className="text-[11px] font-mono font-bold text-emerald-800">
                          ${opt.price} Registration Fee
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    {isFull ? (
                      <span className="text-xs font-bold text-rose-600">Sold Out</span>
                    ) : (
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-800 tabular-nums">
                          {remaining} / {max} seats left
                        </span>
                        <div className="w-20 bg-emerald-200/80 h-1 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${(booked / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
