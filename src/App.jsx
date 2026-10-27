import React from 'react';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-950';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300';
const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';
const dangerButton = 'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40';

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function strongPassword(value) {
  return String(value || '').length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value);
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value, currency) {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || 'USD'} ${amount.toFixed(2)}`;
  }
}

function calculateInvoice(invoice) {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);
  const taxAmount = items.reduce((sum, item) => {
    return sum +
      (Number(item.quantity) || 0) *
      (Number(item.unitPrice) || 0) *
      ((Number(item.taxRate) || 0) / 100);
  }, 0);
  const discountValue = Math.max(0, Number(invoice.discountValue) || 0);
  const discountAmount = invoice.discountType === 'percent'
    ? subtotal * Math.min(100, discountValue) / 100
    : Math.min(subtotal, discountValue);
  return {
    subtotal,
    taxAmount,
    discountAmount,
    grandTotal: Math.max(0, subtotal - discountAmount + taxAmount),
  };
}

function getStatus(invoice) {
  if (invoice.status === 'Paid' || invoice.status === 'Draft') return invoice.status;
  if (invoice.status === 'Overdue') return 'Overdue';
  if (invoice.dueDate && invoice.dueDate < todayISO()) return 'Overdue';
  return invoice.status || 'Draft';
}

function dateLabel(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function readPreferences() {
  try {
    const raw = window.localStorage.getItem('user_preferences');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePreferences(preferences) {
  try {
    window.localStorage.setItem('user_preferences', JSON.stringify(preferences));
  } catch {
    // Preferences are optional; the app remains usable when storage is unavailable.
  }
}

function StatusBadge({ status }) {
  const style = status === 'Paid'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-950/40 dark:text-emerald-300'
    : status === 'Overdue'
      ? 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-950/40 dark:text-rose-300'
      : status === 'Sent'
        ? 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-950/40 dark:text-blue-300'
        : 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}>{status}</span>;
}

function InvoicePaper({ invoice, client, businessName, currency }) {
  const totals = calculateInvoice(invoice || {});
  const address = client?.billingAddress || {};
  const fullAddress = [address.street, [address.city, address.state, address.zip].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-700">
      <div className="bg-slate-900 px-6 py-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Invoice</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{invoice.invoiceNumber || 'New invoice'}</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{businessName || 'Your business'}</p>
            <p className="mt-2 text-xs text-slate-300">Issued {dateLabel(invoice.issueDate)}</p>
            <p className="text-xs text-slate-300">Due {dateLabel(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
            <p className="mt-2 font-semibold text-slate-900">{client?.name || 'Select a client'}</p>
            {client?.company && <p className="text-sm text-slate-600">{client.company}</p>}
            {fullAddress && <p className="mt-1 text-sm text-slate-600">{fullAddress}</p>}
            {client?.email && <p className="mt-1 text-sm text-slate-600">{client.email}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
            <div className="mt-2"><StatusBadge status={getStatus(invoice)} /></div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-y border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-3 font-semibold">Description</th>
                <th className="px-2 py-3 text-right font-semibold">Qty</th>
                <th className="px-2 py-3 text-right font-semibold">Price</th>
                <th className="px-2 py-3 text-right font-semibold">Tax</th>
                <th className="py-3 pl-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, index) => {
                const line = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <tr key={item.itemId || index} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 pr-3 font-medium">{item.description || 'Item'}</td>
                    <td className="px-2 py-3 text-right">{Number(item.quantity) || 0}</td>
                    <td className="px-2 py-3 text-right">{formatMoney(item.unitPrice, currency)}</td>
                    <td className="px-2 py-3 text-right">{Number(item.taxRate) || 0}%</td>
                    <td className="py-3 pl-2 text-right font-medium">{formatMoney(line, currency)}</td>
                  </tr>
                );
              })}
              {(!invoice.items || invoice.items.length === 0) && (
                <tr><td colSpan="5" className="py-8 text-center text-sm text-slate-400">Add line items to preview your invoice.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-5 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(totals.subtotal, currency)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatMoney(totals.taxAmount, currency)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Discount</span><span>−{formatMoney(totals.discountAmount, currency)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
            <span>Total due</span><span>{formatMoney(totals.grandTotal, currency)}</span>
          </div>
        </div>
        {invoice.notes && <div className="mt-6 border-t border-slate-200 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{invoice.notes}</p></div>}
      </div>
    </div>
  );
}

function createInvoicePdf(invoice, client, businessName, currency) {
  const ascii = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?');
  const esc = (value) => ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const text = (x, y, size, value, color = '0.12 0.18 0.25 rg') =>
    `${color}\nBT /F1 ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET\n`;
  const line = (x1, y1, x2, y2, color = '0.86 0.89 0.92 RG') =>
    `${color}\n0.7 w ${x1} ${y1} m ${x2} ${y2} l S\n`;
  const money = (amount) => `${currency || 'USD'} ${(Number(amount) || 0).toFixed(2)}`;
  const address = client?.billingAddress || {};
  const addressLine = [address.street, [address.city, address.state, address.zip].filter(Boolean).join(', ')]
    .filter(Boolean).join(' | ');
  const items = invoice.items || [];
  const pages = [];
  const pageSize = 14;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const totals = calculateInvoice(invoice);

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    let stream = '';
    stream += '0.08 0.18 0.31 rg 0 700 612 92 re f\n';
    stream += text(48, 750, 23, 'INVOICE', '1 1 1 rg');
    stream += text(48, 722, 11, businessName || 'Your business', '0.83 0.89 0.96 rg');
    stream += text(440, 748, 15, invoice.invoiceNumber || 'Invoice', '1 1 1 rg');
    stream += text(440, 725, 9, `Page ${pageIndex + 1} of ${pageCount}`, '0.83 0.89 0.96 rg');

    if (pageIndex === 0) {
      stream += text(48, 673, 9, 'BILL TO', '0.38 0.43 0.49 rg');
      stream += text(48, 655, 12, client?.name || 'Client');
      if (client?.company) stream += text(48, 638, 10, client.company);
      if (addressLine) stream += text(48, 622, 9, addressLine);
      if (client?.email) stream += text(48, 607, 9, client.email);
      stream += text(382, 673, 9, 'ISSUE DATE', '0.38 0.43 0.49 rg');
      stream += text(382, 655, 10, invoice.issueDate || '—');
      stream += text(382, 632, 9, 'DUE DATE', '0.38 0.43 0.49 rg');
      stream += text(382, 614, 10, invoice.dueDate || '—');
      stream += text(48, 574, 9, 'DESCRIPTION', '0.38 0.43 0.49 rg');
      stream += text(340, 574, 9, 'QTY', '0.38 0.43 0.49 rg');
      stream += text(390, 574, 9, 'PRICE', '0.38 0.43 0.49 rg');
      stream += text(470, 574, 9, 'TAX', '0.38 0.43 0.49 rg');
      stream += text(525, 574, 9, 'AMOUNT', '0.38 0.43 0.49 rg');
      stream += line(48, 563, 564, 563);
    } else {
      stream += text(48, 673, 9, 'DESCRIPTION', '0.38 0.43 0.49 rg');
      stream += text(340, 673, 9, 'QTY', '0.38 0.43 0.49 rg');
      stream += text(390, 673, 9, 'PRICE', '0.38 0.43 0.49 rg');
      stream += text(470, 673, 9, 'TAX', '0.38 0.43 0.49 rg');
      stream += text(525, 673, 9, 'AMOUNT', '0.38 0.43 0.49 rg');
      stream += line(48, 662, 564, 662);
    }

    const start = pageIndex * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    let y = pageIndex === 0 ? 540 : 639;
    pageItems.forEach((item) => {
      const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      stream += text(48, y, 9, String(item.description || 'Item').slice(0, 44));
      stream += text(340, y, 9, String(Number(item.quantity) || 0));
      stream += text(390, y, 9, money(item.unitPrice));
      stream += text(470, y, 9, `${Number(item.taxRate) || 0}%`);
      stream += text(525, y, 9, money(amount));
      stream += line(48, y - 9, 564, y - 9, '0.92 0.93 0.95 RG');
      y -= 25;
    });

    if (pageIndex === pageCount - 1) {
      const totalY = Math.max(105, y - 18);
      stream += text(390, totalY + 60, 10, 'Subtotal');
      stream += text(490, totalY + 60, 10, money(totals.subtotal));
      stream += text(390, totalY + 42, 10, 'Tax');
      stream += text(490, totalY + 42, 10, money(totals.taxAmount));
      stream += text(390, totalY + 24, 10, 'Discount');
      stream += text(490, totalY + 24, 10, `-${money(totals.discountAmount)}`);
      stream += line(390, totalY + 14, 564, totalY + 14);
      stream += text(390, totalY - 4, 12, 'TOTAL DUE', '0.08 0.18 0.31 rg');
      stream += text(490, totalY - 4, 12, money(totals.grandTotal), '0.08 0.18 0.31 rg');
      if (invoice.notes) stream += text(48, 92, 9, `Notes: ${String(invoice.notes).slice(0, 90)}`, '0.38 0.43 0.49 rg');
      stream += text(48, 40, 8, 'Thank you for your business.', '0.48 0.53 0.58 rg');
    }
    pages.push(stream);
  }

  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pages.forEach((stream, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(invoice.invoiceNumber || 'invoice').replace(/[^a-z0-9-_]/gi, '-')}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const preferences = readPreferences();
  const [theme, setTheme] = React.useState(preferences.theme === 'dark' ? 'dark' : 'light');
  const [currency, setCurrency] = React.useState(preferences.currency || 'USD');
  const [user, setUser] = React.useState(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('signin');
  const [authBusy, setAuthBusy] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [authNotice, setAuthNotice] = React.useState('');
  const [authForm, setAuthForm] = React.useState({ email: '', password: '', businessName: '' });
  const [screen, setScreen] = React.useState('dashboard');
  const [invoices, setInvoices] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [dataLoading, setDataLoading] = React.useState(false);
  const [dataError, setDataError] = React.useState('');
  const [toast, setToast] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [clientDraft, setClientDraft] = React.useState(null);
  const [clientForm, setClientForm] = React.useState({
    name: '', company: '', street: '', city: '', state: '', zip: '', email: '',
  });
  const [clientSaving, setClientSaving] = React.useState(false);
  const [clientErrors, setClientErrors] = React.useState({});
  const [invoiceDraft, setInvoiceDraft] = React.useState(null);
  const [editingInvoiceId, setEditingInvoiceId] = React.useState(null);
  const [invoiceErrors, setInvoiceErrors] = React.useState({});
  const [invoiceSaving, setInvoiceSaving] = React.useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = React.useState(null);
  const [adminUsers, setAdminUsers] = React.useState([]);
  const [resetRequests, setResetRequests] = React.useState([]);
  const [adminLoading, setAdminLoading] = React.useState(false);
  const [adminError, setAdminError] = React.useState('');
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetPassword, setResetPassword] = React.useState('');
  const [resetResult, setResetResult] = React.useState('');

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const changePreference = (key, value) => {
    const next = { ...readPreferences(), [key]: value };
    writePreferences(next);
    if (key === 'theme') setTheme(value);
    if (key === 'currency') setCurrency(value);
  };

  React.useEffect(() => {
    let alive = true;
    const initialize = async () => {
      let attempts = 0;
      while (!window.VPAuth && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        attempts += 1;
      }
      if (!window.VPAuth) {
        if (alive) {
          setAuthError('Sign-in services are not available right now. Please refresh and try again.');
          setAuthReady(true);
        }
        return;
      }
      try {
        const socialPromise = typeof window.VPAuth.socialComplete === 'function'
          ? Promise.resolve().then(() => window.VPAuth.socialComplete()).catch(() => null)
          : Promise.resolve(null);
        const currentUser = await window.VPAuth.me();
        const socialResult = await socialPromise;
        if (alive) {
          setUser(socialResult && !socialResult.error ? socialResult : currentUser || null);
          if (socialResult?.error) {
            setAuthError(typeof socialResult.error === 'string' ? socialResult.error : 'Google or GitHub sign-in could not be completed. Please try again.');
          }
        }
      } catch {
        if (alive) setAuthError('We could not verify your session. Please sign in again.');
      } finally {
        if (alive) setAuthReady(true);
      }
    };
    initialize();
    return () => { alive = false; };
  }, []);

  const refreshData = React.useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setDataError('');
    try {
      if (!window.VPData) throw new Error('Shared data services are unavailable.');
      const [clientRows, invoiceRows] = await Promise.all([
        window.VPData.list('clients', { mine: true }),
        window.VPData.list('invoices', { mine: true }),
      ]);
      setClients((clientRows || []).map((row) => ({ id: row.id, ...row.data })));
      setInvoices((invoiceRows || []).map((row) => ({ id: row.id, ...row.data })));
    } catch {
      setDataError('We couldn’t load your business data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) refreshData();
    else {
      setInvoices([]);
      setClients([]);
      setDataLoading(false);
    }
  }, [user, refreshData]);

  const setAuthField = (field, value) => {
    setAuthForm((previous) => ({ ...previous, [field]: value }));
    setAuthError('');
    setAuthNotice('');
  };

  const startSocialSignIn = async (provider) => {
    setAuthError('');
    setAuthNotice('');
    setAuthBusy(true);
    try {
      const url = await window.VPAuth.socialUrl(provider);
      if (!url) throw new Error('Sign-in URL unavailable.');
      window.location.href = url;
    } catch {
      setAuthError('Social sign-in is available on the published app. Please try again there.');
    } finally {
      setAuthBusy(false);
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');
    const email = authForm.email.trim().toLowerCase();
    if (!validEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (authMode === 'forgot') {
      setAuthBusy(true);
      try {
        await window.VPAuth.requestReset(email);
      } catch {
        // The same confirmation is intentionally shown whether or not the account exists.
      } finally {
        setAuthBusy(false);
        setAuthNotice('If an account exists for this email, a reset request has been sent. A workspace owner can fulfill it from Admin → Pending reset requests.');
      }
      return;
    }
    if (!authForm.password) {
      setAuthError('Please enter your password.');
      return;
    }
    if (authMode === 'signup') {
      if (!authForm.businessName.trim()) {
        setAuthError('Please enter your business name.');
        return;
      }
      if (!strongPassword(authForm.password)) {
        setAuthError('Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.');
        return;
      }
    }

    setAuthBusy(true);
    try {
      let response;
      if (authMode === 'signup') {
        response = await window.VPAuth.register(email, authForm.password, authForm.businessName.trim());
      } else {
        response = await window.VPAuth.login(email, authForm.password);
      }
      let currentUser = null;
      try {
        currentUser = await window.VPAuth.me();
      } catch {
        currentUser = null;
      }
      setUser(currentUser || response || null);
      setScreen('dashboard');
      setAuthForm({ email: '', password: '', businessName: '' });
    } catch (error) {
      setAuthError(error?.message || (authMode === 'signup'
        ? 'We couldn’t create your account. Please check your details and try again.'
        : 'Invalid email or password. Please try again.'));
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await window.VPAuth.logout();
    } catch {
      // Clear the local view even if a remote logout request fails.
    }
    setUser(null);
    setScreen('dashboard');
    setAuthMode('signin');
    setAuthNotice('');
    setAuthError('');
  };

  const resetClientForm = () => {
    setClientForm({ name: '', company: '', street: '', city: '', state: '', zip: '', email: '' });
    setClientDraft(null);
    setClientErrors({});
  };

  const editClient = (client) => {
    setClientDraft(client);
    const address = client.billingAddress || {};
    setClientForm({
      name: client.name || '',
      company: client.company || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
      email: client.email || '',
    });
    setClientErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveClient = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!clientForm.name.trim()) errors.name = 'Enter a client name.';
    if (!validEmail(clientForm.email)) errors.email = 'Enter a valid email address.';
    setClientErrors(errors);
    if (Object.keys(errors).length) return;

    setClientSaving(true);
    const id = clientDraft?.id || makeId();
    const record = {
      clientId: id,
      userId: user.id,
      name: clientForm.name.trim(),
      company: clientForm.company.trim(),
      billingAddress: {
        street: clientForm.street.trim(),
        city: clientForm.city.trim(),
        state: clientForm.state.trim(),
        zip: clientForm.zip.trim(),
      },
      email: clientForm.email.trim().toLowerCase(),
    };
    try {
      if (clientDraft) await window.VPData.update('clients', id, record);
      else await window.VPData.add('clients', record, id);
      await refreshData();
      resetClientForm();
      notify(clientDraft ? 'Client updated.' : 'Client added.');
    } catch {
      notify('We couldn’t save this client. Please try again.');
    } finally {
      setClientSaving(false);
    }
  };

  const removeClient = async (client) => {
    if (invoices.some((invoice) => invoice.clientId === client.id)) {
      notify('This client is linked to an invoice and can’t be deleted.');
      return;
    }
    if (!window.confirm(`Delete ${client.name}? This action cannot be undone.`)) return;
    try {
      await window.VPData.remove('clients', client.id);
      await refreshData();
      notify('Client deleted.');
    } catch {
      notify('We couldn’t delete this client. Please try again.');
    }
  };

  const makeNewInvoice = () => {
    const nextNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    setInvoiceDraft({
      invoiceNumber: nextNumber,
      issueDate: todayISO(),
      dueDate: todayISO(),
      clientId: '',
      status: 'Draft',
      items: [{ itemId: makeId(), description: '', quantity: 1, unitPrice: 0, taxRate: 0 }],
      discountType: 'percent',
      discountValue: 0,
      notes: '',
    });
    setEditingInvoiceId(null);
    setInvoiceErrors({});
    setScreen('editor');
  };

  const editInvoice = (invoice) => {
    setInvoiceDraft({
      ...invoice,
      items: (invoice.items || []).map((item) => ({ ...item, itemId: item.itemId || makeId() })),
      discountType: invoice.discountType || 'percent',
      discountValue: Number(invoice.discountValue) || 0,
      notes: invoice.notes || '',
    });
    setEditingInvoiceId(invoice.id);
    setInvoiceErrors({});
    setScreen('editor');
  };

  const updateInvoiceDraft = (field, value) => {
    setInvoiceDraft((previous) => ({ ...previous, [field]: value }));
    setInvoiceErrors((previous) => ({ ...previous, [field]: '' }));
  };

  const updateItem = (index, field, value) => {
    setInvoiceDraft((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item),
    }));
    setInvoiceErrors((previous) => ({ ...previous, [`item_${index}_${field}`]: '' }));
  };

  const validateInvoice = (draft) => {
    const errors = {};
    if (!draft.invoiceNumber?.trim()) errors.invoiceNumber = 'Enter an invoice number.';
    if (invoices.some((invoice) =>
      invoice.invoiceNumber?.toLowerCase() === draft.invoiceNumber?.trim().toLowerCase() &&
      invoice.id !== editingInvoiceId)) {
      errors.invoiceNumber = 'This invoice number is already in use.';
    }
    if (!draft.issueDate) errors.issueDate = 'Choose an issue date.';
    if (!draft.dueDate) errors.dueDate = 'Choose a due date.';
    if (draft.dueDate && draft.issueDate && draft.dueDate < draft.issueDate) {
      errors.dueDate = 'Due date must be on or after the issue date.';
    }
    if (!draft.clientId) errors.clientId = 'Choose a client.';
    if (!draft.items?.length) errors.items = 'Add at least one line item.';
    (draft.items || []).forEach((item, index) => {
      if (!item.description?.trim()) errors[`item_${index}_description`] = 'Enter a description.';
      if (!(Number(item.quantity) > 0)) errors[`item_${index}_quantity`] = 'Quantity must be above 0.';
      if (!(Number(item.unitPrice) >= 0)) errors[`item_${index}_unitPrice`] = 'Enter a valid price.';
      if (!(Number(item.taxRate) >= 0 && Number(item.taxRate) <= 100)) errors[`item_${index}_taxRate`] = 'Use a rate from 0 to 100.';
    });
    if (Number(draft.discountValue) < 0) errors.discountValue = 'Discount cannot be negative.';
    if (draft.discountType === 'percent' && Number(draft.discountValue) > 100) {
      errors.discountValue = 'Percentage discount cannot exceed 100%.';
    }
    return errors;
  };

  const saveInvoice = async (statusOverride, downloadAfterSave = false) => {
    const draft = { ...invoiceDraft, status: statusOverride || invoiceDraft.status };
    const errors = validateInvoice(draft);
    setInvoiceErrors(errors);
    if (Object.keys(errors).length) {
      notify('Please fix the highlighted invoice fields.');
      return;
    }

    setInvoiceSaving(true);
    const id = editingInvoiceId || makeId();
    const totals = calculateInvoice(draft);
    const record = {
      invoiceId: id,
      userId: user.id,
      clientId: draft.clientId,
      invoiceNumber: draft.invoiceNumber.trim(),
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      status: draft.status,
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue) || 0,
      notes: draft.notes || '',
      ...totals,
      items: draft.items.map((item) => ({
        ...item,
        itemId: item.itemId || makeId(),
        invoiceId: id,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate) || 0,
      })),
    };
    try {
      if (editingInvoiceId) await window.VPData.update('invoices', id, record);
      else await window.VPData.add('invoices', record, id);
      await refreshData();
      setInvoiceDraft(record);
      setEditingInvoiceId(id);
      if (downloadAfterSave) {
        createInvoicePdf(record, clients.find((client) => client.id === record.clientId), user.name, currency);
        notify('Invoice saved and PDF downloaded.');
      } else {
        notify(editingInvoiceId ? 'Invoice updated.' : 'Invoice saved.');
        setScreen('invoices');
      }
    } catch {
      notify('We couldn’t save this invoice. Please try again.');
    } finally {
      setInvoiceSaving(false);
    }
  };

  const deleteInvoice = async (invoice) => {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) return;
    try {
      await window.VPData.remove('invoices', invoice.id);
      await refreshData();
      if (activeInvoiceId === invoice.id) setActiveInvoiceId(null);
      notify('Invoice deleted.');
    } catch {
      notify('We couldn’t delete this invoice. Please try again.');
    }
  };

  const loadAdminData = async () => {
    setAdminLoading(true);
    setAdminError('');
    try {
      const [users, requests] = await Promise.all([
        window.VPAuth.adminListUsers(),
        window.VPAuth.adminListResetRequests(),
      ]);
      setAdminUsers(Array.isArray(users) ? users : []);
      setResetRequests(Array.isArray(requests) ? requests : []);
    } catch {
      setAdminError('Admin information could not be loaded. Please retry.');
    } finally {
      setAdminLoading(false);
    }
  };

  const saveAdminPassword = async (event) => {
    event.preventDefault();
    setResetResult('');
    if (!validEmail(resetEmail)) {
      setResetResult('Enter a valid account email.');
      return;
    }
    if (!strongPassword(resetPassword)) {
      setResetResult('Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.');
      return;
    }
    try {
      const result = await window.VPAuth.adminResetPassword(resetEmail.trim().toLowerCase(), resetPassword);
      setResetResult(result?.emailSent
        ? `Password reset complete. A new password was emailed to ${result.email || resetEmail}.`
        : 'Password reset complete, but the email could not be sent. Share the new password securely.');
      setResetPassword('');
      await loadAdminData();
    } catch (error) {
      setResetResult(error?.message || 'We couldn’t reset this password. Check the email and try again.');
    }
  };

  const getClient = (clientId) => clients.find((client) => client.id === clientId);
  const sortedInvoices = [...invoices].sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
  const recentInvoices = sortedInvoices.slice(0, 5);
  const filteredInvoices = sortedInvoices.filter((invoice) => {
    const clientName = getClient(invoice.clientId)?.name || '';
    const matchesSearch = `${invoice.invoiceNumber} ${clientName}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || getStatus(invoice) === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const outstanding = invoices
    .filter((invoice) => !['Paid', 'Draft'].includes(getStatus(invoice)))
    .reduce((sum, invoice) => sum + (Number(invoice.grandTotal) || calculateInvoice(invoice).grandTotal), 0);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
          <span className="text-sm font-medium">Preparing your workspace…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
          <div className="w-full max-w-md">
            <div className="mb-7 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-lg font-bold text-white shadow-lg shadow-blue-900/20">L</div>
              <div>
                <p className="text-xl font-bold tracking-tight">Ledgerly</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Simple, thoughtful invoicing</p>
              </div>
            </div>
            <div className={`${cardClass} p-6 sm:p-8`}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                    {authMode === 'signup' ? 'Get started' : authMode === 'forgot' ? 'Account recovery' : 'Welcome back'}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight">
                    {authMode === 'signup' ? 'Create your workspace' : authMode === 'forgot' ? 'Reset your password' : 'Sign in to Ledgerly'}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => changePreference('theme', theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
              <form onSubmit={submitAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className={labelClass} htmlFor="business-name">Business name</label>
                    <input id="business-name" className={inputClass} value={authForm.businessName} onChange={(event) => setAuthField('businessName', event.target.value)} placeholder="e.g. Northstar Studio" autoComplete="organization" />
                  </div>
                )}
                <div>
                  <label className={labelClass} htmlFor="auth-email">Email address</label>
                  <input id="auth-email" type="email" className={inputClass} value={authForm.email} onChange={(event) => setAuthField('email', event.target.value)} placeholder="you@business.com" autoComplete="email" />
                </div>
                {authMode !== 'forgot' && (
                  <div>
                    <label className={labelClass} htmlFor="auth-password">Password</label>
                    <input id="auth-password" type="password" className={inputClass} value={authForm.password} onChange={(event) => setAuthField('password', event.target.value)} placeholder="Enter your password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} />
                    {authMode === 'signup' && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">At least 8 characters, including uppercase, lowercase, and a number.</p>}
                  </div>
                )}
                {authError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{authError}</p>}
                {authNotice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{authNotice}</p>}
                <button type="submit" className={`${primaryButton} w-full py-3`} disabled={authBusy}>
                  {authBusy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                  {authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : authMode === 'forgot' ? 'Request reset link' : 'Sign in'}
                </button>
              </form>
              {authMode === 'signin' && (
                <div className="mt-5 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                    <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 dark:bg-slate-900">or continue with</span></div>
                  </div>
                  <button type="button" onClick={() => startSocialSignIn('google')} disabled={authBusy} className={`${secondaryButton} w-full py-3`}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-blue-700 dark:border-slate-700 dark:text-blue-300">G</span>
                    Continue with Google
                  </button>
                  <button type="button" onClick={() => startSocialSignIn('github')} disabled={authBusy} className={`${secondaryButton} w-full py-3`}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.31-3.76-1.31-.5-1.29-1.24-1.63-1.24-1.63-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1 .1.77 2.1 3.56 1.5.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.61 5.23-5.1 5.51.4.35.75 1.03.75 2.08v3.1c0 .3.2.65.76.54A11.1 11.1 0 0 0 12 .9Z" />
                    </svg>
                    Continue with GitHub
                  </button>
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                {authMode === 'signin' ? (
                  <>
                    <button type="button" onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthNotice(''); }} className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300">Forgot password?</button>
                    <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthNotice(''); }} className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300">Create an account</button>
                  </>
                ) : (
                  <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthNotice(''); }} className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300">← Back to sign in</button>
                )}
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-slate-400">Your business data is private to your account.</p>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = screen === 'dashboard' ? 'Dashboard'
    : screen === 'invoices' ? 'Invoices'
      : screen === 'clients' ? 'Clients'
        : screen === 'editor' ? (editingInvoiceId ? 'Edit invoice' : 'New invoice')
          : screen === 'preview' ? 'Invoice details'
            : 'Admin tools';

  const openInvoice = (invoice) => {
    setActiveInvoiceId(invoice.id);
    setScreen('preview');
  };

  const renderInvoiceCard = (invoice, showActions = false) => {
    const client = getClient(invoice.clientId);
    const status = getStatus(invoice);
    return (
      <div key={invoice.id} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button type="button" onClick={() => openInvoice(invoice)} className="truncate text-left font-semibold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-300">{invoice.invoiceNumber}</button>
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{client?.name || 'Client unavailable'}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p>Issued {dateLabel(invoice.issueDate)}</p>
            <p className="mt-1">Due {dateLabel(invoice.dueDate)}</p>
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">{formatMoney(invoice.grandTotal ?? calculateInvoice(invoice).grandTotal, currency)}</p>
        </div>
        {showActions && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button type="button" onClick={() => openInvoice(invoice)} className="text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300">View</button>
            <button type="button" onClick={() => editInvoice(invoice)} className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300">Edit</button>
            <button type="button" onClick={() => deleteInvoice(invoice)} className="text-xs font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400">Delete</button>
          </div>
        )}
      </div>
    );
  };

  const activeInvoice = invoices.find((invoice) => invoice.id === activeInvoiceId);
  const draftTotals = invoiceDraft ? calculateInvoice(invoiceDraft) : null;
  const selectedClient = invoiceDraft ? getClient(invoiceDraft.clientId) : null;

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
        {toast && (
          <div role="status" className="fixed right-4 top-4 z-50 max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl dark:bg-slate-100 dark:text-slate-900">
            {toast}
          </div>
        )}
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button type="button" onClick={() => setScreen('dashboard')} className="flex items-center gap-3 text-left">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-base font-bold text-white">L</span>
                <span>
                  <span className="block text-lg font-bold leading-tight tracking-tight">Ledgerly</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{user.name || user.email}</span>
                </span>
              </button>
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="currency-select">Currency</label>
                <select id="currency-select" aria-label="Currency" value={currency} onChange={(event) => changePreference('currency', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((code) => <option key={code} value={code}>{code}</option>)}
                </select>
                <button type="button" onClick={() => changePreference('theme', theme === 'dark' ? 'light' : 'dark')} className={secondaryButton + ' !px-3 !py-2 text-xs'}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
                <button type="button" onClick={signOut} className={secondaryButton + ' !px-3 !py-2 text-xs'}>Sign out</button>
              </div>
            </div>
            <nav aria-label="Main navigation" className="mt-4 flex gap-1 overflow-x-auto border-t border-slate-100 pt-3 dark:border-slate-800">
              {[
                ['dashboard', 'Dashboard'],
                ['invoices', 'Invoices'],
                ['clients', 'Clients'],
                ...(user.isOwner ? [['admin', 'Admin']] : []),
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setScreen(key);
                    if (key === 'admin') loadAdminData();
                  }}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${screen === key ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Workspace</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{pageTitle}</h1>
            </div>
            {(screen === 'dashboard' || screen === 'invoices') && (
              <button type="button" onClick={makeNewInvoice} className={primaryButton}>＋ New invoice</button>
            )}
          </div>

          {dataError && screen !== 'admin' && (
            <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
              <span>{dataError}</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={refreshData} className="font-semibold underline underline-offset-2">Retry</button>
                <button type="button" onClick={() => setDataError('')} aria-label="Dismiss error" className="text-lg leading-none">×</button>
              </div>
            </div>
          )}

          {screen === 'dashboard' && (
            <div className="space-y-6">
              {dataLoading && invoices.length === 0 ? (
                <div className={`${cardClass} flex items-center gap-3 text-sm text-slate-500`}>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" /> Loading your dashboard…
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className={cardClass}>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Invoices generated</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{invoices.length}</p>
                      <p className="mt-1 text-xs text-slate-400">Across your workspace</p>
                    </div>
                    <div className={cardClass}>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding balance</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{formatMoney(outstanding, currency)}</p>
                      <p className="mt-1 text-xs text-slate-400">Sent or overdue invoices</p>
                    </div>
                    <div className={cardClass}>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Clients</p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{clients.length}</p>
                      <p className="mt-1 text-xs text-slate-400">In your client book</p>
                    </div>
                  </div>
                  <section className={cardClass}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent invoices</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A quick look at your latest billing activity.</p>
                      </div>
                      <button type="button" onClick={() => setScreen('invoices')} className="text-sm font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300">View all</button>
                    </div>
                    {recentInvoices.length ? (
                      <div className="space-y-3">{recentInvoices.map((invoice) => renderInvoiceCard(invoice))}</div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">↗</div>
                        <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">No invoices yet</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">You haven't generated any invoices yet. Click the '+' button to create your first invoice!</p>
                        <button type="button" onClick={makeNewInvoice} className={`${primaryButton} mt-5`}>＋ Create your first invoice</button>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          )}

          {screen === 'invoices' && (
            <section className={cardClass}>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label className="sr-only" htmlFor="invoice-search">Search invoices</label>
                  <input id="invoice-search" className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by invoice number or client…" />
                </div>
                <div className="sm:w-48">
                  <label className="sr-only" htmlFor="status-filter">Filter by status</label>
                  <select id="status-filter" className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map((status) => <option key={status} value={status}>{status === 'All' ? 'All statuses' : status}</option>)}
                  </select>
                </div>
              </div>
              {dataLoading && invoices.length === 0 ? (
                <div className="flex items-center gap-3 py-10 text-sm text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" /> Loading invoices…</div>
              ) : filteredInvoices.length ? (
                <div className="space-y-3">{filteredInvoices.map((invoice) => renderInvoiceCard(invoice, true))}</div>
              ) : (
                <div className="py-10 text-center">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{invoices.length ? 'No matching invoices' : 'Your invoice list is ready'}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{invoices.length ? 'Try changing your search or status filter.' : "You haven't generated any invoices yet. Click the '+' button to create your first invoice!"}</p>
                  {!invoices.length && <button type="button" onClick={makeNewInvoice} className={`${primaryButton} mt-5`}>＋ Create invoice</button>}
                </div>
              )}
            </section>
          )}

          {screen === 'clients' && (
            <div className="space-y-6">
              <section className={cardClass}>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{clientDraft ? 'Edit client' : 'Add a client'}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep billing details handy for your next invoice.</p>
                </div>
                <form onSubmit={saveClient} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="client-name">Name <span className="text-rose-500">*</span></label>
                      <input id="client-name" className={inputClass} value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} placeholder="Client name" />
                      {clientErrors.name && <p className="mt-1 text-xs text-rose-600">{clientErrors.name}</p>}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="client-company">Company</label>
                      <input id="client-company" className={inputClass} value={clientForm.company} onChange={(event) => setClientForm({ ...clientForm, company: event.target.value })} placeholder="Company name (optional)" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="client-email">Email <span className="text-rose-500">*</span></label>
                      <input id="client-email" type="email" className={inputClass} value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} placeholder="client@example.com" />
                      {clientErrors.email && <p className="mt-1 text-xs text-rose-600">{clientErrors.email}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="client-street">Billing address</label>
                      <input id="client-street" className={inputClass} value={clientForm.street} onChange={(event) => setClientForm({ ...clientForm, street: event.target.value })} placeholder="Street address" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="client-city">City</label>
                      <input id="client-city" className={inputClass} value={clientForm.city} onChange={(event) => setClientForm({ ...clientForm, city: event.target.value })} placeholder="City" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass} htmlFor="client-state">State / region</label>
                        <input id="client-state" className={inputClass} value={clientForm.state} onChange={(event) => setClientForm({ ...clientForm, state: event.target.value })} placeholder="State" />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="client-zip">ZIP / postal</label>
                        <input id="client-zip" className={inputClass} value={clientForm.zip} onChange={(event) => setClientForm({ ...clientForm, zip: event.target.value })} placeholder="ZIP" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={clientSaving} className={primaryButton}>{clientSaving ? 'Saving…' : clientDraft ? 'Save client' : 'Add client'}</button>
                    {clientDraft && <button type="button" onClick={resetClientForm} className={secondaryButton}>Cancel</button>}
                  </div>
                </form>
              </section>

              <section className={cardClass}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Client book</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{clients.length} {clients.length === 1 ? 'client' : 'clients'}</p>
                  </div>
                </div>
                {dataLoading && clients.length === 0 ? (
                  <div className="flex items-center gap-3 py-8 text-sm text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" /> Loading clients…</div>
                ) : clients.length ? (
                  <div className="space-y-3">
                    {clients.map((client) => {
                      const address = client.billingAddress || {};
                      const addressText = [address.street, [address.city, address.state, address.zip].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
                      return (
                        <div key={client.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{client.name}</p>
                              {client.company && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{client.company}</p>}
                              <p className="mt-2 break-all text-sm text-blue-700 dark:text-blue-300">{client.email}</p>
                              {addressText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{addressText}</p>}
                            </div>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => editClient(client)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Edit</button>
                              <button type="button" onClick={() => removeClient(client)} className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40">Delete</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">No clients added yet</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add a client above to make invoice creation faster.</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {screen === 'editor' && invoiceDraft && (
            <div className="space-y-6">
              <section className={cardClass}>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Invoice details</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set the invoice number, client, dates, and status.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="invoice-number">Invoice number <span className="text-rose-500">*</span></label>
                    <input id="invoice-number" className={inputClass} value={invoiceDraft.invoiceNumber} onChange={(event) => updateInvoiceDraft('invoiceNumber', event.target.value)} />
                    {invoiceErrors.invoiceNumber && <p className="mt-1 text-xs text-rose-600">{invoiceErrors.invoiceNumber}</p>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="invoice-client">Client <span className="text-rose-500">*</span></label>
                    <select id="invoice-client" className={inputClass} value={invoiceDraft.clientId} onChange={(event) => updateInvoiceDraft('clientId', event.target.value)}>
                      <option value="">Choose a client…</option>
                      {clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ''}</option>)}
                    </select>
                    {invoiceErrors.clientId && <p className="mt-1 text-xs text-rose-600">{invoiceErrors.clientId}</p>}
                    {!clients.length && <button type="button" onClick={() => setScreen('clients')} className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300">Add a client first →</button>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="issue-date">Issue date <span className="text-rose-500">*</span></label>
                    <input id="issue-date" type="date" className={inputClass} value={invoiceDraft.issueDate} onChange={(event) => updateInvoiceDraft('issueDate', event.target.value)} />
                    {invoiceErrors.issueDate && <p className="mt-1 text-xs text-rose-600">{invoiceErrors.issueDate}</p>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="due-date">Due date <span className="text-rose-500">*</span></label>
                    <input id="due-date" type="date" className={inputClass} value={invoiceDraft.dueDate} onChange={(event) => updateInvoiceDraft('dueDate', event.target.value)} />
                    {invoiceErrors.dueDate && <p className="mt-1 text-xs text-rose-600">{invoiceErrors.dueDate}</p>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="invoice-status">Status</label>
                    <select id="invoice-status" className={inputClass} value={invoiceDraft.status} onChange={(event) => updateInvoiceDraft('status', event.target.value)}>
                      {['Draft', 'Sent', 'Paid', 'Overdue'].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              <section className={cardClass}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Line items</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Each line can have its own tax rate.</p>
                  </div>
                  <button type="button" onClick={() => setInvoiceDraft((previous) => ({ ...previous, items: [...previous.items, { itemId: makeId(), description: '', quantity: 1, unitPrice: 0, taxRate: 0 }] }))} className={secondaryButton}>＋ Add item</button>
                </div>
                {invoiceErrors.items && <p className="mb-3 text-sm text-rose-600">{invoiceErrors.items}</p>}
                <div className="space-y-4">
                  {invoiceDraft.items.map((item, index) => (
                    <div key={item.itemId || index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Item {index + 1}</p>
                        {invoiceDraft.items.length > 1 && <button type="button" onClick={() => setInvoiceDraft((previous) => ({ ...previous, items: previous.items.filter((_, itemIndex) => itemIndex !== index) }))} className="text-xs font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-400">Remove</button>}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className={labelClass} htmlFor={`item-description-${index}`}>Description</label>
                          <input id={`item-description-${index}`} className={inputClass} value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} placeholder="Design services, consultation…" />
                          {invoiceErrors[`item_${index}_description`] && <p className="mt-1 text-xs text-rose-600">{invoiceErrors[`item_${index}_description`]}</p>}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={labelClass} htmlFor={`item-qty-${index}`}>Quantity</label>
                            <input id={`item-qty-${index}`} type="number" min="0.01" step="any" className={inputClass} value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} />
                            {invoiceErrors[`item_${index}_quantity`] && <p className="mt-1 text-xs text-rose-600">{invoiceErrors[`item_${index}_quantity`]}</p>}
                          </div>
                          <div>
                            <label className={labelClass} htmlFor={`item-price-${index}`}>Unit price</label>
                            <input id={`item-price-${index}`} type="number" min="0" step="0.01" className={inputClass} value={item.unitPrice} onChange={(event) => updateItem(index, 'unitPrice', event.target.value)} />
                            {invoiceErrors[`item_${index}_unitPrice`] && <p className="mt-1 text-xs text-rose-600">{invoiceErrors[`item_${index}_unitPrice`]}</p>}
                          </div>
                          <div>
                            <label className={labelClass} htmlFor={`item-tax-${index}`}>Tax %</label>
                            <input id={`item-tax-${index}`} type="number" min="0" max="100" step="0.01" className={inputClass} value={item.taxRate} onChange={(event) => updateItem(index, 'taxRate', event.target.value)} />
                            {invoiceErrors[`item_${index}_taxRate`] && <p className="mt-1 text-xs text-rose-600">{invoiceErrors[`item_${index}_taxRate`]}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={cardClass}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Discount & notes</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="discount-type">Discount type</label>
                    <select id="discount-type" className={inputClass} value={invoiceDraft.discountType} onChange={(event) => updateInvoiceDraft('discountType', event.target.value)}>
                      <option value="percent">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="discount-value">Discount {invoiceDraft.discountType === 'percent' ? '(%)' : `(${currency})`}</label>
                    <input id="discount-value" type="number" min="0" step="0.01" max={invoiceDraft.discountType === 'percent' ? '100' : undefined} className={inputClass} value={invoiceDraft.discountValue} onChange={(event) => updateInvoiceDraft('discountValue', event.target.value)} />
                    {invoiceErrors.discountValue && <p className="mt-1 text-xs text-rose-600">{invoiceErrors.discountValue}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="invoice-notes">Notes</label>
                    <textarea id="invoice-notes" rows="3" className={inputClass} value={invoiceDraft.notes} onChange={(event) => updateInvoiceDraft('notes', event.target.value)} placeholder="Payment details, a thank-you, or other information…" />
                  </div>
                </div>
              </section>

              <section className={cardClass}>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live total</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Updates automatically as you edit line items.</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Subtotal</span><span>{formatMoney(draftTotals.subtotal, currency)}</span></div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Tax</span><span>{formatMoney(draftTotals.taxAmount, currency)}</span></div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Discount</span><span>−{formatMoney(draftTotals.discountAmount, currency)}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100"><span>Grand total</span><span>{formatMoney(draftTotals.grandTotal, currency)}</span></div>
                </div>
              </section>

              <section>
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Preview</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This is how your invoice will appear to your client.</p>
                </div>
                <InvoicePaper invoice={invoiceDraft} client={selectedClient} businessName={user.name} currency={currency} />
              </section>

              <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={invoiceSaving} onClick={() => saveInvoice('Draft')} className={secondaryButton}>{invoiceSaving ? 'Saving…' : 'Save draft'}</button>
                  <button type="button" disabled={invoiceSaving} onClick={() => saveInvoice()} className={primaryButton}>{invoiceSaving ? 'Saving…' : 'Save invoice'}</button>
                  <button type="button" disabled={invoiceSaving} onClick={() => saveInvoice(undefined, true)} className={secondaryButton}>{invoiceSaving ? 'Saving…' : 'Save & download PDF'}</button>
                  <button type="button" onClick={() => setScreen('invoices')} className="ml-auto rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {screen === 'preview' && (
            activeInvoice ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button type="button" onClick={() => setScreen('invoices')} className="text-sm font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300">← Back to invoices</button>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => editInvoice(activeInvoice)} className={secondaryButton}>Edit invoice</button>
                    <button type="button" onClick={() => { createInvoicePdf(activeInvoice, getClient(activeInvoice.clientId), user.name, currency); notify('PDF downloaded.'); }} className={primaryButton}>Download PDF</button>
                  </div>
                </div>
                <InvoicePaper invoice={activeInvoice} client={getClient(activeInvoice.clientId)} businessName={user.name} currency={currency} />
                <div className="flex justify-end">
                  <button type="button" onClick={() => deleteInvoice(activeInvoice)} className={dangerButton}>Delete invoice</button>
                </div>
              </div>
            ) : (
              <div className={cardClass}>
                <p className="text-sm text-slate-500 dark:text-slate-400">This invoice is no longer available.</p>
                <button type="button" onClick={() => setScreen('invoices')} className={`${primaryButton} mt-4`}>Return to invoices</button>
              </div>
            )
          )}

          {screen === 'admin' && user.isOwner && (
            <div className="space-y-6">
              {adminError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><span>{adminError}</span><button type="button" onClick={loadAdminData} className="font-semibold underline">Retry</button></div>}
              <section className={cardClass}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account directory</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Owner-only account support tools.</p>
                  </div>
                  <button type="button" onClick={loadAdminData} className={secondaryButton}>Refresh</button>
                </div>
                {adminLoading ? <p className="py-5 text-sm text-slate-500">Loading accounts…</p> : adminUsers.length ? (
                  <div className="space-y-2">
                    {adminUsers.map((account, index) => (
                      <div key={account.id || account.email || index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{account.name || account.email || 'Account'}</p>
                          {account.name && <p className="text-xs text-slate-500 dark:text-slate-400">{account.email}</p>}
                        </div>
                        <button type="button" onClick={() => setResetEmail(account.email || '')} className="text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300">Reset password</button>
                      </div>
                    ))}
                  </div>
                ) : <p className="py-5 text-sm text-slate-500 dark:text-slate-400">{adminError ? 'Account list unavailable.' : 'No accounts to display.'}</p>}
              </section>

              <section className={cardClass}>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pending reset requests</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fulfill a request by setting a temporary password.</p>
                </div>
                {resetRequests.length ? (
                  <div className="mb-5 space-y-2">
                    {resetRequests.map((request, index) => {
                      const email = request.email || request.userEmail || '';
                      return (
                        <div key={request.id || email || index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{email || 'Unknown account'}</p>
                            {request.createdAt && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Requested {new Date(request.createdAt).toLocaleString()}</p>}
                          </div>
                          <button type="button" onClick={() => setResetEmail(email)} className="text-xs font-semibold text-blue-700 dark:text-blue-300">Use email</button>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">No pending requests.</p>}
                <form onSubmit={saveAdminPassword} className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="admin-reset-email">Account email</label>
                    <input id="admin-reset-email" type="email" className={inputClass} value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="person@example.com" />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="admin-reset-password">Temporary password</label>
                    <input id="admin-reset-password" type="password" className={inputClass} value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} autoComplete="new-password" placeholder="Use a strong temporary password" />
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">At least 8 characters with uppercase, lowercase, and a number.</p>
                  </div>
                  {resetResult && <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{resetResult}</p>}
                  <button type="submit" className={primaryButton}>Reset password</button>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
