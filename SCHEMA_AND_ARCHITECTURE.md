# FormCraft & CourseFlow Studio - System Architecture & API Specifications

## 1. Relational Database Schema (PostgreSQL / Supabase)

### Dedicated Schema: `registrations`
To ensure zero collisions with any existing tables in your Supabase project (such as existing `public` tables), FormCraft operates inside its own isolated PostgreSQL schema: **`registrations`**.

All tables, custom enums, indexes, functions, and RLS policies reside strictly within `registrations.*`.

### Entity Models:
- **`registrations.profiles`**: User accounts (Instructors, Form Creators, Attendees)
- **`registrations.forms`**: Master form records (Title, description, pages structure, category, settings JSON, theme JSON, status)
- **`registrations.form_fields`**: Modular form components (Type, labels, capacity limits, matrix rows/cols, rating options, ordering)
- **`registrations.logic_rules`**: Conditional branching rules (Show/hide fields, skip-to-page based on equality/containment/greater-than)
- **`registrations.submissions`**: Form response instances (Unique ticket_code, IP, check-in status, timestamp)
- **`registrations.submission_answers`**: Atomic answers linked to form fields
- **`registrations.payments`**: Payment processing ledger (Stripe / PayPal transaction ID, currency, amount, status)
- **`registrations.webhook_logs`**: Outbound delivery logs for external CRM, Google Sheets, or webhook consumers


---

## 2. API Endpoint Specifications

### A. Form Management
- `GET /api/forms`
  - Returns list of forms with summary counters (submissions, conversion rate).
- `GET /api/forms/:id`
  - Returns complete form metadata, ordered fields, logic rules, and themes.
- `POST /api/forms`
  - Creates a new form structure.
- `PUT /api/forms/:id`
  - Updates form details, fields, pages, rules, and theme settings.
- `DELETE /api/forms/:id`
  - Soft or permanent deletion of form and related entities.
- `POST /api/forms/:id/duplicate`
  - Clones a form template with all its fields and logic rules.

### B. Submission & Course Registration Processing
- `POST /api/forms/:id/submit`
  - **Payload**: `{ answers: Record<string, any>, paymentDetails?: { method, amount, token }, gdprConsent: boolean, captchaToken?: string }`
  - **Processing Flow**:
    1. Validates required fields and conditional logic constraints.
    2. Atomic capacity verification: Checks slot limits for `course_slot` and dropdown choices.
    3. Payment settlement (simulated Stripe PaymentIntent / PayPal Orders API).
    4. Anonymity handling: Strips user IP address if `isAnonymous === true`.
    5. Generates unique Ticket Pass Code (`TKT-XXXX-XXXX`) and encodes into QR payload.
    6. Generates iCalendar (.ics) invite file for course registrations.
    7. Dispatches asynchronous webhook payloads (e.g. to Google Sheets).
  - **Response**: `{ success: true, submissionId, ticketCode, qrCodeDataUrl, icsCalendar, receipt }`

### C. Check-In & Ticket Verification
- `POST /api/check-in/verify`
  - **Payload**: `{ ticketCode: string }`
  - **Response**: `{ valid: boolean, submission: SubmissionSummary, alreadyCheckedIn: boolean }`
- `POST /api/check-in/confirm`
  - **Payload**: `{ ticketCode: string, notes?: string }`
  - **Response**: `{ success: true, checkedInAt: string }`

### D. Analytics & Reporting
- `GET /api/forms/:id/analytics`
  - Returns:
    - Submission velocity breakdown (daily / hourly counts)
    - Categorical distribution (pie/bar data for choice and dropdown fields)
    - Matrix Likert scale average scores and satisfaction distribution
    - Star/numeric rating score distributions
    - Payment financial metrics (Gross revenue, average ticket size, checkout method breakdown)
- `GET /api/export/:formId/:format`
  - Supported formats: `csv`, `json`.
  - Streams sanitized file download.

---

## 3. UI Wireframe / Component Tree

```
App Root
├── Navigation Header
│   ├── Form Selector & Status Pill
│   ├── Main View Switcher (Builder | Public Responder | Analytics | Responses | Organizer Check-in | Supabase & API Specs)
│   └── Action Toolbar (Share / Embed, Publish Toggle, Save, Device Preview: Desktop/Tablet/Mobile)
│
├── 1. Form Builder Mode
│   ├── Left Sidebar: Field Palette
│   │   ├── Text / Input (Short, Textarea, DateTime)
│   │   ├── Choices & Grids (Radio, Checkbox, Select, Likert Matrix)
│   │   ├── Interactive (Star Rating, Multi-File Uploader)
│   │   └── Course Specific (Slot Capacity Selector, Fee Tier Picker)
│   ├── Center Canvas: Visual Form Stage
│   │   ├── Multi-Step Page Tabs (Page 1, Page 2, Add Page)
│   │   ├── Drag/Drop Field Cards (Reorder, Duplicate, Delete, Edit)
│   │   └── Live Preview Frame (Desktop / Tablet / Mobile Viewport)
│   └── Right Sidebar: Configuration Drawer
│       ├── Field Inspector (Label, Required, Options, Capacity limits)
│       ├── Conditional Logic Editor (If [Field] [Operator] [Value] -> [Action])
│       ├── Form Settings (Course Registration, Fee, Dates, Expiration, Bias Randomization)
│       └── Theme & Styling Designer (Colors, Fonts, Corner Radius, Custom CSS)
│
├── 2. Public Response View
│   ├── Header Banner & Logo Branding
│   ├── Multi-Step Progress Tracker (Step Indicator & Percentage)
│   ├── Dynamic Field Renderer (React Hook Form state + Live Conditional Rule Engine)
│   ├── Matrix Likert Grid Component
│   ├── Real-Time Slot Inventory Badges ("Only 2 seats remaining!")
│   ├── Checkout Section (Stripe & PayPal interactive payment triggers)
│   ├── Submission Success Modal / Pass Screen
│   │   ├── Confetti blast
│   │   ├── Interactive Scannable QR Code Pass
│   │   ├── Download .ICS Calendar Invite
│   │   └── Download Itemized PDF/Text Receipt
│
├── 3. Organizer Check-in / Ticket Scanner
│   ├── Real-time QR Scanner / Manual Ticket Code input
│   ├── Attendee Verification Card
│   └── One-Click Door Check-in & Timestamp Logger
│
├── 4. Analytics & Reports
│   ├── KPI Metric Cards (Total Submissions, Completion Rate, Gross Revenue, Avg Rating)
│   ├── Velocity Line Chart
│   ├── Choice Distribution Pie / Bar Charts
│   └── Matrix Likert Scale Heatmap
│
├── 5. Response Data Grid
│   ├── Search, Date Filter, Status Filter (Paid, Pending, Approved, Checked-in)
│   ├── Response Detail Modal with Raw Answers & Receipt
│   └── CSV / JSON Export Trigger
│
└── 6. Supabase & Developer Specs
    ├── Interactive Database ERD
    ├── Complete SQL Schema Viewer with 1-Click Copy
    ├── Supabase Client Config & Connection Test
    └── REST & GraphQL Specification Explorer
```
