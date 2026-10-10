import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Users,
  DollarSign,
} from 'lucide-react';
import { FormField, FieldOption } from '../../types';

interface FieldConfigDrawerProps {
  field: FormField;
  isOpen?: boolean;
  onClose: () => void;
  onUpdateField: (updated: FormField) => void;
}

export const FieldConfigDrawer: React.FC<FieldConfigDrawerProps> = ({
  field,
  onClose,
  onUpdateField,
}) => {
  const [label, setLabel] = useState(field.label || '');
  const [description, setDescription] = useState(field.description || '');
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [required, setRequired] = useState(field.required || false);
  const [options, setOptions] = useState<FieldOption[]>(field.options ? [...field.options] : []);
  const [matrixRows, setMatrixRows] = useState<string[]>(field.matrixRows ? [...field.matrixRows] : []);
  const [matrixColumns, setMatrixColumns] = useState<string[]>(field.matrixColumns ? [...field.matrixColumns] : []);
  const [ratingMax, setRatingMax] = useState(field.ratingMax || 5);
  const [ratingType, setRatingType] = useState<'star' | 'numeric'>(field.ratingType || 'star');
  const [maxFiles, setMaxFiles] = useState(field.maxFiles || 2);

  // Sync internal state whenever the target field changes
  React.useEffect(() => {
    setLabel(field.label || '');
    setDescription(field.description || '');
    setPlaceholder(field.placeholder || '');
    setRequired(field.required || false);
    setOptions(field.options ? [...field.options] : []);
    setMatrixRows(field.matrixRows ? [...field.matrixRows] : []);
    setMatrixColumns(field.matrixColumns ? [...field.matrixColumns] : []);
    setRatingMax(field.ratingMax || 5);
    setRatingType(field.ratingType || 'star');
    setMaxFiles(field.maxFiles || 2);
  }, [field]);


  const handleSave = () => {
    onUpdateField({
      ...field,
      label,
      description,
      placeholder,
      required,
      options,
      matrixRows,
      matrixColumns,
      ratingMax,
      ratingType,
      maxFiles,
    });
    onClose();
  };

  const handleAddOption = () => {
    const nextIdx = options.length + 1;
    setOptions([
      ...options,
      {
        label: `Option ${nextIdx}`,
        value: `opt_${Date.now()}`,
        price: field.type === 'course_slot' ? 99 : undefined,
        maxCapacity: field.type === 'course_slot' ? 20 : undefined,
        currentBookings: 0,
      },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (index: number, key: keyof FieldOption, val: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [key]: val };
    setOptions(updated);
  };

  const handleAddRow = () => {
    setMatrixRows([...matrixRows, `Topic ${matrixRows.length + 1}`]);
  };

  const handleRemoveRow = (index: number) => {
    setMatrixRows(matrixRows.filter((_, i) => i !== index));
  };

  const handleAddCol = () => {
    setMatrixColumns([...matrixColumns, `Scale ${matrixColumns.length + 1}`]);
  };

  const handleRemoveCol = (index: number) => {
    setMatrixColumns(matrixColumns.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Field Inspector
            </span>
            <h2 className="text-base font-bold text-slate-900 capitalize">
              Configure {field.type.replace('_', ' ')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Field Question / Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
              placeholder="e.g. Full Legal Name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Subtext / Helper Instructions
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
              placeholder="e.g. Please enter as printed on government ID"
            />
          </div>

          {/* Placeholder for text inputs */}
          {(field.type === 'text' || field.type === 'textarea') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Placeholder Hint
              </label>
              <input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                placeholder="e.g. John Doe"
              />
            </div>
          )}

          {/* Required Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Required Field</div>
              <div className="text-[11px] text-slate-500">
                User cannot proceed or submit without answering
              </div>
            </div>
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {/* Options Management for Select, Radio, Checkbox, Course Slot */}
          {(field.type === 'select' ||
            field.type === 'radio' ||
            field.type === 'checkbox' ||
            field.type === 'course_slot') && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Choice Options & Slots
                  </h3>
                  {field.type === 'course_slot' && (
                    <p className="text-[11px] text-emerald-600">
                      Configure capacity caps & registration fees per slot
                    </p>
                  )}
                </div>
                <button
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Choice
                </button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => handleUpdateOption(i, 'label', e.target.value)}
                        placeholder="Option Label"
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                      <button
                        onClick={() => handleRemoveOption(i)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove Option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Capacity & Price controls for course_slot */}
                    {field.type === 'course_slot' && (
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/80">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Users className="w-3 h-3" /> Max Capacity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={opt.maxCapacity ?? 20}
                            onChange={(e) =>
                              handleUpdateOption(i, 'maxCapacity', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Current Booked
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={opt.currentBookings ?? 0}
                            onChange={(e) =>
                              handleUpdateOption(i, 'currentBookings', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Fee ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={opt.price ?? 99}
                            onChange={(e) =>
                              handleUpdateOption(i, 'price', Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matrix Likert Configuration */}
          {field.type === 'matrix' && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {/* Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Matrix Rows (Questions / Topics)
                  </span>
                  <button
                    onClick={handleAddRow}
                    className="text-xs font-bold text-indigo-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
                <div className="space-y-1.5">
                  {matrixRows.map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row}
                        onChange={(e) => {
                          const updated = [...matrixRows];
                          updated[rIdx] = e.target.value;
                          setMatrixRows(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                      <button
                        onClick={() => handleRemoveRow(rIdx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columns */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Matrix Columns (Likert Scale Options)
                  </span>
                  <button
                    onClick={handleAddCol}
                    className="text-xs font-bold text-indigo-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Column
                  </button>
                </div>
                <div className="space-y-1.5">
                  {matrixColumns.map((col, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => {
                          const updated = [...matrixColumns];
                          updated[cIdx] = e.target.value;
                          setMatrixColumns(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                      />
                      <button
                        onClick={() => handleRemoveCol(cIdx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rating Scale configuration */}
          {field.type === 'rating' && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Rating Configuration
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Rating Type
                  </label>
                  <select
                    value={ratingType}
                    onChange={(e) => setRatingType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                  >
                    <option value="star">Star Rating (★)</option>
                    <option value="numeric">Numeric Scale (1 - N)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Max Score
                  </label>
                  <select
                    value={ratingMax}
                    onChange={(e) => setRatingMax(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                  >
                    <option value={5}>5 Points</option>
                    <option value={7}>7 Points</option>
                    <option value={10}>10 Points</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* File Upload configuration */}
          {field.type === 'file' && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                File Constraints
              </span>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Maximum Number of Files
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={maxFiles}
                  onChange={(e) => setMaxFiles(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
