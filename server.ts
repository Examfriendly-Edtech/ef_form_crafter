import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Form, Submission } from './src/types';
import { initialForms, initialSubmissions } from './src/data/mockForms';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory data store initialized with rich starter templates
let forms: Form[] = [...initialForms];
let submissions: Submission[] = [...initialSubmissions];

// Webhook log history
const webhookLogs: Array<{ id: string; url: string; timestamp: string; status: number; payload: any }> = [];

// Database of authorized accounts (Created for schema "registrations")
// Account seeded: username: 'admin', password verification for 'EFAdmin@123'
interface AuthorizedAccount {
  id: string;
  username: string;
  passwordHash: string; // Plain/hashed comparison
  displayName: string;
  role: 'admin' | 'creator';
}

const authorizedAccounts: AuthorizedAccount[] = [
  {
    id: 'acc-admin-01',
    username: 'admin',
    passwordHash: 'EFAdmin@123',
    displayName: 'Administrator',
    role: 'admin',
  },
];

// Active admin sessions mapping: token -> AuthorizedAccount
const activeSessions = new Map<string, AuthorizedAccount>();

// Auth middleware helper
const getSessionUser = (req: Request): AuthorizedAccount | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return activeSessions.get(token) || null;
};

// API ROUTES - AUTHENTICATION
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const account = authorizedAccounts.find(
    (acc) => acc.username.toLowerCase() === String(username).trim().toLowerCase()
  );

  if (!account || account.passwordHash !== String(password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = `fc_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
  activeSessions.set(token, account);

  return res.json({
    success: true,
    token,
    user: {
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      role: account.role,
    },
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ authenticated: false, error: 'Unauthorized session' });
  }
  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// 1. Get all forms
app.get('/api/forms', (_req: Request, res: Response) => {
  const summaries = forms.map((f) => {
    const subCount = submissions.filter((s) => s.formId === f.id).length;
    const paidRevenue = submissions
      .filter((s) => s.formId === f.id && s.payment?.status === 'completed')
      .reduce((acc, curr) => acc + (curr.payment?.amount || 0), 0);
    return {
      ...f,
      submissionCount: subCount,
      totalRevenue: paidRevenue,
    };
  });
  res.json(summaries);
});

// 2. Get specific form
app.get('/api/forms/:id', (req: Request, res: Response) => {
  const form = forms.find((f) => f.id === req.params.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }
  res.json(form);
});

// 3. Create new form
app.post('/api/forms', (req: Request, res: Response) => {
  const newForm: Form = {
    ...req.body,
    id: req.body.id || `form-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  forms.unshift(newForm);
  res.status(201).json(newForm);
});

// 4. Update form
app.put('/api/forms/:id', (req: Request, res: Response) => {
  const index = forms.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Form not found' });
  }
  const updated: Form = {
    ...forms[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };
  forms[index] = updated;
  res.json(updated);
});

// 5. Delete form
app.delete('/api/forms/:id', (req: Request, res: Response) => {
  forms = forms.filter((f) => f.id !== req.params.id);
  submissions = submissions.filter((s) => s.formId !== req.params.id);
  res.json({ success: true, message: 'Form and related submissions deleted' });
});

// 6. Duplicate form
app.post('/api/forms/:id/duplicate', (req: Request, res: Response) => {
  const source = forms.find((f) => f.id === req.params.id);
  if (!source) {
    return res.status(404).json({ error: 'Source form not found' });
  }
  const newId = `form-${Date.now()}`;
  const duplicated: Form = {
    ...JSON.parse(JSON.stringify(source)),
    id: newId,
    title: `${source.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  forms.unshift(duplicated);
  res.status(201).json(duplicated);
});

// 7. Submit form response (Handles capacity decrement, payments, ticket generation)
app.post('/api/forms/:id/submit', (req: Request, res: Response) => {
  const form = forms.find((f) => f.id === req.params.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  // Check form expiration or maximum submissions
  if (form.settings.maxResponses) {
    const existingCount = submissions.filter((s) => s.formId === form.id).length;
    if (existingCount >= form.settings.maxResponses) {
      return res.status(400).json({ error: 'This form has reached its maximum response capacity limit.' });
    }
  }

  const { answers, paymentDetails, files } = req.body;

  // Capacity check & atomic reservation for course_slot or select options
  for (const field of form.fields) {
    if ((field.type === 'course_slot' || field.type === 'select') && field.options) {
      const selectedValue = answers[field.id];
      if (selectedValue) {
        const option = field.options.find((o) => o.value === selectedValue);
        if (option && option.maxCapacity !== undefined) {
          const current = option.currentBookings || 0;
          if (current >= option.maxCapacity) {
            return res.status(400).json({
              error: `The slot "${option.label}" is currently sold out! Please select another option.`,
            });
          }
          // Increment bookings
          option.currentBookings = current + 1;
        }
      }
    }
  }

  // Generate unique Ticket / Pass Code
  const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ticketCode = form.settings.isCourseRegistration
    ? `TKT-${Math.floor(1000 + Math.random() * 9000)}-${randCode}`
    : `SRV-${Math.floor(1000 + Math.random() * 9000)}-${form.settings.isAnonymous ? 'ANON' : randCode}`;

  const submissionId = `sub-${Date.now()}`;
  const clientIp = form.settings.isAnonymous ? undefined : (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

  const newSubmission: Submission = {
    id: submissionId,
    formId: form.id,
    ticketCode,
    submittedAt: new Date().toISOString(),
    status: paymentDetails?.amount > 0 ? 'Paid' : 'Approved',
    answers,
    userIp: clientIp,
    payment: paymentDetails?.amount > 0 ? {
      amount: paymentDetails.amount,
      currency: form.settings.currency || 'USD',
      status: 'completed',
      paymentMethod: paymentDetails.method || 'stripe',
      transactionId: paymentDetails.transactionId || `tx_${Math.random().toString(36).substring(2, 10)}`,
      paidAt: new Date().toISOString(),
    } : undefined,
    checkIn: {
      isCheckedIn: false,
    },
    files: files || [],
  };

  submissions.unshift(newSubmission);

  // If webhook is configured, dispatch simulated notification
  if (form.settings.webhookUrl) {
    webhookLogs.unshift({
      id: `wh-${Date.now()}`,
      url: form.settings.webhookUrl,
      timestamp: new Date().toISOString(),
      status: 200,
      payload: { event: 'form.submitted', submissionId, ticketCode },
    });
  }

  res.status(201).json({
    success: true,
    submission: newSubmission,
    message: form.settings.isCourseRegistration
      ? 'Registration complete! Your course ticket and QR pass have been generated.'
      : 'Thank you! Your survey response has been successfully recorded.',
  });
});

// 8. Get submissions for form
app.get('/api/forms/:id/submissions', (req: Request, res: Response) => {
  const formSubs = submissions.filter((s) => s.formId === req.params.id);
  res.json(formSubs);
});

// 9. Update submission status (e.g. Paid, Approved, Checked-in)
app.patch('/api/submissions/:id/status', (req: Request, res: Response) => {
  const sub = submissions.find((s) => s.id === req.params.id);
  if (!sub) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  if (req.body.status) {
    sub.status = req.body.status;
  }
  res.json(sub);
});

// 10. Check-in Ticket Verification (For Door / Organizer Scanner)
app.post('/api/check-in/verify', (req: Request, res: Response) => {
  const { ticketCode } = req.body;
  if (!ticketCode) {
    return res.status(400).json({ error: 'Ticket code is required' });
  }
  const cleanCode = ticketCode.trim().toUpperCase();
  const sub = submissions.find(
    (s) => s.ticketCode.toUpperCase() === cleanCode || s.id.toUpperCase() === cleanCode
  );

  if (!sub) {
    return res.status(404).json({ valid: false, message: 'Invalid ticket pass code or not found.' });
  }

  const form = forms.find((f) => f.id === sub.formId);

  res.json({
    valid: true,
    submission: sub,
    formTitle: form?.title || 'Unknown Event',
    alreadyCheckedIn: sub.checkIn?.isCheckedIn || false,
    checkedInAt: sub.checkIn?.checkedInAt,
  });
});

// 11. Confirm Check-in
app.post('/api/check-in/confirm', (req: Request, res: Response) => {
  const { ticketCode, notes, checkedInBy } = req.body;
  const cleanCode = (ticketCode || '').trim().toUpperCase();
  const sub = submissions.find(
    (s) => s.ticketCode.toUpperCase() === cleanCode || s.id.toUpperCase() === cleanCode
  );

  if (!sub) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  sub.checkIn = {
    isCheckedIn: true,
    checkedInAt: new Date().toISOString(),
    checkedInBy: checkedInBy || 'Organizer Check-in Station',
    notes: notes || 'Verified at entrance',
  };
  sub.status = 'Checked-in';

  res.json({
    success: true,
    message: `Attendee ${ticketCode} checked in successfully!`,
    checkIn: sub.checkIn,
  });
});

// 12. Test Webhook
app.post('/api/webhooks/test', (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Target URL is required' });
  }
  const log = {
    id: `wh-${Date.now()}`,
    url,
    timestamp: new Date().toISOString(),
    status: 200,
    payload: {
      test: true,
      event: 'webhook.ping',
      timestamp: new Date().toISOString(),
      message: 'Connection successfully established from FormCraft & CourseFlow Studio.',
    },
  };
  webhookLogs.unshift(log);
  res.json({ success: true, log });
});

// 13. Serve Supabase SQL Script Content
app.get('/api/schema/sql', (_req: Request, res: Response) => {
  const sqlPath = path.join(__dirname, 'supabase_schema.sql');
  if (fs.existsSync(sqlPath)) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(fs.readFileSync(sqlPath, 'utf8'));
  } else {
    res.status(404).send('-- Schema file not found');
  }
});

// 14. Explicit 404 Catch-All for API Routes (Guarantees JSON is always returned for /api/*)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API endpoint ${req.method} ${req.path} not found.`,
  });
});

// API Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  if (req.path.startsWith('/api')) {
    console.error('API Error handler:', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error occurred.',
    });
  }
  next(err);
});

// VITE MIDDLEWARE SETUP
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
