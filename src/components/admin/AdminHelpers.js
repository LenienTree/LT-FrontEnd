// Exact counts with Indian digit grouping (1,273 · 12,34,567) — admins need the
// real number, not "1.3K".
export const fmtNum = (n) => {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v.toLocaleString('en-IN') : '0';
};

// Rupee amounts, exact, Indian grouping.
export const fmtINR = (n) => `₹${fmtNum(Math.round(Number(n ?? 0)))}`;

// The analytics API sends calendar days as "YYYY-MM-DD" (India time). Parsing
// that with new Date(str) means UTC midnight, which renders as the PREVIOUS day
// anywhere west of UTC — so read it as a local date instead.
export const parseDay = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date(s);
};

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', '') : '—';

// Build a CSV string (RFC-4180 quoting) and trigger a browser download. `headers`
// is an array of column titles; `rows` is an array of arrays of cell values.
export const downloadCsv = (filename, headers, rows) => {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  // Prepend a BOM so Excel reads UTF-8 (names/emails) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
