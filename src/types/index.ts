export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'datetime'
  | 'file'
  | 'rating'
  | 'matrix'
  | 'course_slot';

export interface FieldOption {
  label: string;
  value: string;
  price?: number;
  maxCapacity?: number;
  currentBookings?: number;
}

export interface FormField {
  id: string;
  pageIndex: number;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
  matrixRows?: string[];
  matrixColumns?: string[];
  ratingMax?: number;
  ratingType?: 'star' | 'numeric';
  fileTypes?: string[];
  maxFiles?: number;
  defaultValue?: any;
}

export type LogicAction = 'show' | 'hide' | 'skip_to_page';
export type LogicOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'is_checked' | 'is_empty';

export interface LogicRule {
  id: string;
  action: LogicAction;
  targetFieldId?: string;
  targetPageIndex?: number;
  condition: {
    fieldId: string;
    operator: LogicOperator;
    value: any;
  };
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  headerBannerUrl?: string;
  logoUrl?: string;
  customCss?: string;
}

export interface FormSettings {
  isCourseRegistration: boolean;
  courseFeeType: 'free' | 'fixed' | 'tiered';
  fixedFeeAmount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  isSurvey: boolean;
  isAnonymous: boolean;
  randomizeQuestions: boolean;
  randomizeChoices: boolean;
  maxResponses?: number;
  openDate?: string;
  closeDate?: string;
  enableCaptcha: boolean;
  requireGdpr: boolean;
  gdprText: string;
  confirmationEmailSubject: string;
  confirmationEmailBody: string;
  courseStartDate?: string;
  courseEndDate?: string;
  courseLocation?: string;
  webhookUrl?: string;
  googleSheetsWebhook?: string;
}

export interface FormPage {
  id: string;
  title: string;
  description?: string;
}

export interface Form {
  id: string;
  title: string;
  description: string;
  category: 'course_registration' | 'survey' | 'custom';
  pages: FormPage[];
  fields: FormField[];
  logicRules: LogicRule[];
  theme: FormTheme;
  settings: FormSettings;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'free';
  paymentMethod: 'stripe' | 'paypal' | 'free';
  transactionId: string;
  paidAt: string;
}

export interface CheckInRecord {
  isCheckedIn: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  notes?: string;
}

export interface Submission {
  id: string;
  formId: string;
  ticketCode: string;
  submittedAt: string;
  status: 'Pending' | 'Paid' | 'Approved' | 'Checked-in' | 'Rejected';
  answers: Record<string, any>;
  userIp?: string;
  payment?: PaymentRecord;
  checkIn?: CheckInRecord;
  files?: { name: string; size: number; url: string }[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'creator';
}
