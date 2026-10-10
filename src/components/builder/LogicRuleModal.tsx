import React, { useState } from 'react';
import { X, Plus, Trash2, GitBranch, ArrowRight, Check } from 'lucide-react';
import { Form, LogicRule, LogicAction, LogicOperator } from '../../types';

interface LogicRuleModalProps {
  form: Form;
  isOpen?: boolean;
  onClose: () => void;
  onUpdateRules: (rules: LogicRule[]) => void;
}

export const LogicRuleModal: React.FC<LogicRuleModalProps> = ({
  form,
  onClose,
  onUpdateRules,
}) => {
  const [rules, setRules] = useState<LogicRule[]>([...form.logicRules]);

  React.useEffect(() => {
    setRules([...form.logicRules]);
  }, [form.logicRules]);


  const handleAddRule = () => {
    const firstField = form.fields[0];
    const secondField = form.fields[1] || form.fields[0];
    const newRule: LogicRule = {
      id: `rule-${Date.now()}`,
      action: 'show',
      targetFieldId: secondField ? secondField.id : undefined,
      condition: {
        fieldId: firstField ? firstField.id : '',
        operator: 'equals',
        value: '',
      },
    };
    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (index: number, updated: Partial<LogicRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updated };
    setRules(newRules);
  };

  const handleUpdateCondition = (index: number, cond: Partial<LogicRule['condition']>) => {
    const newRules = [...rules];
    newRules[index].condition = { ...newRules[index].condition, ...cond };
    setRules(newRules);
  };

  const handleSave = () => {
    onUpdateRules(rules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Conditional Logic & Branching Engine
              </h2>
              <p className="text-xs text-slate-500">
                Create dynamic branching rules to show, hide, or skip pages based on participant answers.
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

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">No Logic Rules Defined</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Make your forms adaptive. For example, show dietary options only if attending in-person, or skip to payment if no prerequisites needed.
              </p>
              <button
                onClick={handleAddRule}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Create First Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const conditionField = form.fields.find((f) => f.id === rule.condition.fieldId);

                return (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        Rule #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveRule(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Rule sentence builder: IF [field] [operator] [value] -> THEN [action] [target] */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                      <div className="md:col-span-1 text-xs font-bold text-indigo-700">IF</div>

                      {/* Condition Source Field */}
                      <div className="md:col-span-4">
                        <select
                          value={rule.condition.fieldId}
                          onChange={(e) =>
                            handleUpdateCondition(idx, { fieldId: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          {form.fields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label.slice(0, 30)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Operator */}
                      <div className="md:col-span-3">
                        <select
                          value={rule.condition.operator}
                          onChange={(e) =>
                            handleUpdateCondition(idx, {
                              operator: e.target.value as LogicOperator,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="equals">is equal to</option>
                          <option value="not_equals">is not equal to</option>
                          <option value="contains">contains</option>
                          <option value="greater_than">greater than</option>
                          <option value="is_checked">is selected</option>
                          <option value="is_empty">is empty</option>
                        </select>
                      </div>

                      {/* Condition Value (or choice options dropdown) */}
                      <div className="md:col-span-4">
                        {conditionField?.options ? (
                          <select
                            value={rule.condition.value}
                            onChange={(e) =>
                              handleUpdateCondition(idx, { value: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="">-- Select option --</option>
                            {conditionField.options.map((opt, i) => (
                              <option key={i} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={rule.condition.value}
                            onChange={(e) =>
                              handleUpdateCondition(idx, { value: e.target.value })
                            }
                            placeholder="Value to match"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        )}
                      </div>
                    </div>

                    {/* THEN statement */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center pt-2 border-t border-slate-200/80">
                      <div className="md:col-span-1 text-xs font-bold text-emerald-700">THEN</div>

                      {/* Action */}
                      <div className="md:col-span-3">
                        <select
                          value={rule.action}
                          onChange={(e) =>
                            handleUpdateRule(idx, { action: e.target.value as LogicAction })
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                        >
                          <option value="show">SHOW Field</option>
                          <option value="hide">HIDE Field</option>
                          <option value="skip_to_page">SKIP TO Page</option>
                        </select>
                      </div>

                      {/* Target Field or Page */}
                      <div className="md:col-span-8">
                        {rule.action === 'skip_to_page' ? (
                          <select
                            value={rule.targetPageIndex ?? 0}
                            onChange={(e) =>
                              handleUpdateRule(idx, {
                                targetPageIndex: Number(e.target.value),
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          >
                            {form.pages.map((p, pIdx) => (
                              <option key={p.id} value={pIdx}>
                                Page {pIdx + 1}: {p.title}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={rule.targetFieldId || ''}
                            onChange={(e) =>
                              handleUpdateRule(idx, { targetFieldId: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          >
                            {form.fields
                              .filter((f) => f.id !== rule.condition.fieldId)
                              .map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.label.slice(0, 40)} ({f.type})
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleAddRule}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-1"
              >
                <Plus className="w-4 h-4" /> Add Another Logic Rule
              </button>
            </div>
          )}
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
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" /> Save Rules
          </button>
        </div>
      </div>
    </div>
  );
};
