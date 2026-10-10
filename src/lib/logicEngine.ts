import { FormField, LogicRule } from '../types';

export function evaluateCondition(
  rule: LogicRule,
  answers: Record<string, any>
): boolean {
  const { fieldId, operator, value } = rule.condition;
  const answer = answers[fieldId];

  switch (operator) {
    case 'equals':
      return String(answer ?? '').toLowerCase() === String(value ?? '').toLowerCase();
    case 'not_equals':
      return String(answer ?? '').toLowerCase() !== String(value ?? '').toLowerCase();
    case 'contains':
      if (Array.isArray(answer)) {
        return answer.includes(value);
      }
      return String(answer ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());
    case 'greater_than':
      return Number(answer ?? 0) > Number(value ?? 0);
    case 'is_checked':
      if (Array.isArray(answer)) {
        return answer.includes(value);
      }
      return Boolean(answer);
    case 'is_empty':
      return answer === undefined || answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0);
    default:
      return false;
  }
}

export function isFieldVisible(
  field: FormField,
  rules: LogicRule[],
  answers: Record<string, any>
): boolean {
  const fieldRules = rules.filter((r) => r.targetFieldId === field.id);
  if (fieldRules.length === 0) return true;

  // Check show rules
  const showRules = fieldRules.filter((r) => r.action === 'show');
  if (showRules.length > 0) {
    // If any show rule is satisfied, it's visible
    const meetsShow = showRules.some((r) => evaluateCondition(r, answers));
    if (!meetsShow) return false;
  }

  // Check hide rules
  const hideRules = fieldRules.filter((r) => r.action === 'hide');
  if (hideRules.length > 0) {
    // If any hide rule is satisfied, it becomes hidden
    const meetsHide = hideRules.some((r) => evaluateCondition(r, answers));
    if (meetsHide) return false;
  }

  return true;
}

export function getNextPageIndex(
  currentPageIndex: number,
  rules: LogicRule[],
  answers: Record<string, any>,
  totalPages: number
): number {
  const skipRules = rules.filter(
    (r) => r.action === 'skip_to_page' && typeof r.targetPageIndex === 'number'
  );

  for (const rule of skipRules) {
    if (evaluateCondition(rule, answers)) {
      if (rule.targetPageIndex !== undefined && rule.targetPageIndex > currentPageIndex && rule.targetPageIndex < totalPages) {
        return rule.targetPageIndex;
      }
    }
  }

  return Math.min(currentPageIndex + 1, totalPages - 1);
}
