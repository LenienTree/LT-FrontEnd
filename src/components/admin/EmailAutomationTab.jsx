import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail, Send, Eye, Save, RotateCcw, Lock, Loader2, X, Pencil,
  RefreshCw, ChevronLeft, ChevronRight, Users, Tag, FileText, FlaskConical,
} from 'lucide-react';
import { admin, events as eventsApi } from '../../services/api';
import { fmtDateTime } from './AdminHelpers';

const CATEGORY_ORDER = ['Auth', 'Events', 'Gamification', 'Reports', 'Admin'];

// ─────────────────────────────────────────────────────────────────────────────
// Template editor modal
// ─────────────────────────────────────────────────────────────────────────────
const EditorModal = ({ name, adminEmail, showToast, onClose, onSaved }) => {
  const [detail, setDetail] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await admin.email.getTemplate(name);
        setDetail(d);
        setSubject(d.effectiveSubject || '');
        setBody(d.effectiveBody || '');
      } catch (e) {
        showToast?.(e.message || 'Failed to load template', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [name]);

  const insertVar = (v) => {
    const token = `{{${v}}}`;
    const el = bodyRef.current;
    if (el && typeof el.selectionStart === 'number') {
      const s = el.selectionStart, e = el.selectionEnd;
      const next = body.slice(0, s) + token + body.slice(e);
      setBody(next);
      requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = s + token.length; });
    } else {
      setBody((b) => b + token);
    }
  };

  const doPreview = async () => {
    setPreviewing(true);
    try {
      const res = await admin.email.previewTemplate(name, { subject, bodyHtml: body });
      setPreviewHtml(res.html || '');
    } catch (e) {
      showToast?.(e.message || 'Preview failed', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await admin.email.updateTemplate(name, { subject, bodyHtml: body });
      showToast?.('Template saved.');
      onSaved?.();
      onClose();
    } catch (e) {
      showToast?.(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const doReset = async () => {
    if (!window.confirm('Reset this template to the built-in default? Your customizations will be removed.')) return;
    setSaving(true);
    try {
      await admin.email.resetTemplate(name);
      showToast?.('Reverted to default.');
      onSaved?.();
      onClose();
    } catch (e) {
      showToast?.(e.message || 'Reset failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const doTest = async () => {
    const to = window.prompt('Send a test email to:', adminEmail || '');
    if (!to) return;
    try {
      await admin.email.testTemplate(name, { to, subject, bodyHtml: body });
      showToast?.(`Test email sent to ${to}.`);
    } catch (e) {
      showToast?.(e.message || 'Test send failed', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-[#0a1f1f] border border-[#1a4d4d] rounded-2xl w-full max-w-5xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a4d4d]">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#00ff88]" /> Edit template: {name}
            </h3>
            {detail && <p className="text-gray-500 text-xs mt-0.5">{detail.description}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>
        ) : (
          <div className="p-6 space-y-4">
            {detail?.critical && (
              <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-2">
                <Lock className="w-3.5 h-3.5" /> Critical transactional email — it can be edited but never disabled.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: editor */}
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Body (HTML + Handlebars)</label>
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    spellCheck={false}
                    className="w-full h-72 bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#00ff88]/50 resize-y"
                  />
                </div>
                {detail?.variables?.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-[11px] mb-1">Variables (click to insert):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.variables.map((v) => (
                        <button key={v} onClick={() => insertVar(v)}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#061818] border border-[#1a4d4d] text-[#00ff88] hover:border-[#00ff88]/50">
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-gray-400 text-xs">Preview</label>
                  <button onClick={doPreview} disabled={previewing}
                    className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-[#00ff88] border border-[#1a4d4d] hover:border-[#00ff88]/50 rounded-lg px-2.5 py-1 disabled:opacity-50">
                    {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Render
                  </button>
                </div>
                <iframe
                  title="preview"
                  sandbox=""
                  srcDoc={previewHtml || '<div style="color:#64748b;font-family:sans-serif;padding:24px">Click “Render” to preview with sample data.</div>'}
                  className="w-full h-[360px] bg-white rounded-xl border border-[#1a4d4d]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1a4d4d]/60">
              <button onClick={doSave} disabled={saving}
                className="flex items-center gap-1.5 bg-[#00b36b] hover:bg-[#00c878] text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={doTest}
                className="flex items-center gap-1.5 border border-[#1a4d4d] hover:border-[#00ff88]/50 text-gray-300 hover:text-[#00ff88] text-sm px-4 py-2 rounded-xl">
                <FlaskConical className="w-4 h-4" /> Send test
              </button>
              <button onClick={doReset} disabled={saving || !detail?.override}
                className="flex items-center gap-1.5 border border-red-500/40 text-red-400 hover:bg-red-900/20 text-sm px-4 py-2 rounded-xl ml-auto disabled:opacity-40">
                <RotateCcw className="w-4 h-4" /> Reset to default
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Templates list
// ─────────────────────────────────────────────────────────────────────────────
const TemplatesView = ({ showToast, adminEmail }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [togglingName, setTogglingName] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await admin.email.listTemplates());
    } catch (e) {
      showToast?.(e.message || 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (t) => {
    if (t.critical) return;
    setTogglingName(t.name);
    try {
      await admin.email.updateTemplate(t.name, { enabled: !t.enabled });
      setTemplates((prev) => prev.map((x) => (x.name === t.name ? { ...x, enabled: !x.enabled } : x)));
    } catch (e) {
      showToast?.(e.message || 'Failed to update', 'error');
    } finally {
      setTogglingName(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>;

  const grouped = CATEGORY_ORDER.map((cat) => ({ cat, items: templates.filter((t) => t.category === cat) })).filter((g) => g.items.length);

  return (
    <div className="space-y-6">
      {grouped.map(({ cat, items }) => (
        <div key={cat}>
          <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">{cat}</h3>
          <div className="space-y-2">
            {items.map((t) => (
              <div key={t.name} className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">{t.name}</span>
                    {t.customized && <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[#00ff88]/40 text-[#00ff88] bg-[#00ff88]/10">customized</span>}
                    {t.critical && <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/40 text-amber-400 bg-amber-900/20 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> critical</span>}
                    {!t.enabled && <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-red-500/40 text-red-400 bg-red-900/20">paused</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{t.description}</p>
                  <p className="text-gray-600 text-[11px] mt-0.5 truncate">Subject: <span className="text-gray-400">{t.subject}</span></p>
                </div>
                {/* enable toggle */}
                <button
                  onClick={() => toggle(t)}
                  disabled={t.critical || togglingName === t.name}
                  title={t.critical ? 'Critical email — always on' : (t.enabled ? 'Disable this automation' : 'Enable this automation')}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${t.enabled ? 'bg-[#00b36b]' : 'bg-gray-600'} ${t.critical ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${t.enabled ? 'translate-x-5' : ''}`} />
                </button>
                <button onClick={() => setEditing(t.name)}
                  className="flex items-center gap-1.5 text-xs border border-[#1a4d4d] hover:border-[#00ff88]/50 text-gray-300 hover:text-[#00ff88] rounded-lg px-3 py-1.5 flex-shrink-0">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editing && (
        <EditorModal name={editing} adminEmail={adminEmail} showToast={showToast}
          onClose={() => setEditing(null)} onSaved={load} />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Compose custom email
// ─────────────────────────────────────────────────────────────────────────────
const ComposeView = ({ showToast }) => {
  const [mode, setMode] = useState('manual');
  const [emailsText, setEmailsText] = useState('');
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState('');
  const [interest, setInterest] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [count, setCount] = useState(null);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await admin.getAllEvents({ limit: 1000 });
        setEvents(res?.data || res || []);
      } catch { /* non-fatal */ }
    })();
  }, []);

  const manualEmails = emailsText.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
  useEffect(() => { setCount(null); }, [mode, emailsText, eventId, status, interest]);

  const checkCount = async () => {
    if (mode === 'manual') { setCount(manualEmails.length); return; }
    setChecking(true);
    try {
      const res = await admin.email.recipientCount({ mode, eventId, status, interest });
      setCount(res.count ?? 0);
    } catch (e) {
      showToast?.(e.message || 'Failed to count recipients', 'error');
    } finally {
      setChecking(false);
    }
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { showToast?.('Subject and body are required.', 'error'); return; }
    const n = mode === 'manual' ? manualEmails.length : count;
    const label = n == null ? 'the selected audience' : `${n} recipient${n === 1 ? '' : 's'}`;
    if (!window.confirm(`Send this email to ${label}? This cannot be undone.`)) return;
    setSending(true);
    try {
      const payload = { mode, subject, html: body };
      if (mode === 'manual') payload.emails = manualEmails;
      if (mode === 'event') { payload.eventId = eventId; if (status) payload.status = status; }
      if (mode === 'interest') payload.interest = interest;
      const res = await admin.email.sendCustom(payload);
      showToast?.(`Queued ${res.queued} email${res.queued === 1 ? '' : 's'} for delivery.`);
      setSubject(''); setBody(''); setEmailsText(''); setCount(null);
    } catch (e) {
      showToast?.(e.message || 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const modes = [
    { id: 'manual', label: 'Manual list', icon: FileText },
    { id: 'all', label: 'All users', icon: Users },
    { id: 'event', label: 'Event participants', icon: Users },
    { id: 'interest', label: 'By interest', icon: Tag },
  ];

  return (
    <div className="max-w-3xl space-y-5">
      {/* Audience */}
      <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4 space-y-3">
        <p className="text-gray-400 text-xs">Audience</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${mode === m.id ? 'border-[#00ff88]/60 bg-[#00ff88]/10 text-[#00ff88]' : 'border-[#1a4d4d] text-gray-400 hover:text-white'}`}>
              <m.icon className="w-4 h-4" /> {m.label}
            </button>
          ))}
        </div>

        {mode === 'manual' && (
          <textarea value={emailsText} onChange={(e) => setEmailsText(e.target.value)}
            placeholder="Enter emails separated by commas, spaces or new lines"
            className="w-full h-24 bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50" />
        )}
        {mode === 'event' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}
              className="bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50">
              <option value="">— Choose event —</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50">
              <option value="">All statuses</option>
              {['PENDING', 'PAYMENT_PENDING', 'APPROVED', 'ATTENDED', 'REJECTED'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        )}
        {mode === 'interest' && (
          <input value={interest} onChange={(e) => setInterest(e.target.value)}
            placeholder="Interest tag (e.g. AI, Web Development)"
            className="w-full bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50" />
        )}

        <div className="flex items-center gap-3">
          <button onClick={checkCount} disabled={checking}
            className="flex items-center gap-1.5 text-xs border border-[#1a4d4d] hover:border-[#00ff88]/50 text-gray-300 hover:text-[#00ff88] rounded-lg px-3 py-1.5 disabled:opacity-50">
            {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />} Check recipients
          </button>
          {count != null && <span className="text-sm text-[#00ff88] font-semibold">{count} recipient{count === 1 ? '' : 's'}</span>}
        </div>
      </div>

      {/* Message */}
      <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4 space-y-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff88]/50" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-gray-400 text-xs">Body (HTML)</label>
            <button onClick={() => setShowPreview((s) => !s)} className="text-xs text-gray-400 hover:text-[#00ff88] flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Hide' : 'Preview'}
            </button>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} spellCheck={false}
            placeholder="<p>Hi there!</p>"
            className="w-full h-48 bg-[#061818] border border-[#1a4d4d] rounded-xl px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#00ff88]/50 resize-y" />
          {showPreview && (
            <iframe title="compose-preview" sandbox="" srcDoc={body || '<div style="color:#64748b;font-family:sans-serif;padding:16px">Nothing to preview.</div>'}
              className="w-full h-64 bg-white rounded-xl border border-[#1a4d4d] mt-2" />
          )}
          <p className="text-gray-600 text-[11px] mt-1">The final email is wrapped in the LenientTree branded layout automatically.</p>
        </div>
        <button onClick={send} disabled={sending}
          className="flex items-center gap-2 bg-[#00b36b] hover:bg-[#00c878] text-white text-sm font-medium px-5 py-2.5 rounded-xl disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send email
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Email logs
// ─────────────────────────────────────────────────────────────────────────────
const LogsView = ({ showToast }) => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await admin.email.getLogs(p, 20);
      setLogs(res?.data || []);
      setMeta(res?.meta || null);
    } catch (e) {
      showToast?.(e.message || 'Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(page); }, [page, load]);

  const totalPages = meta?.totalPages || 1;

  if (loading && logs.length === 0) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" /></div>;

  return (
    <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl overflow-hidden">
      <div className="flex justify-end px-4 py-2 border-b border-[#1a4d4d]">
        <button onClick={() => load(page)} className="text-gray-400 hover:text-[#00ff88] p-1.5"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-[#1a4d4d]">
              <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">To / Detail</th>
              <th className="px-4 py-3 font-medium">Subject</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => {
              const nv = l.newValue || {};
              return (
                <tr key={l.id} className="border-b border-[#1a4d4d]/50 hover:bg-[#061818]/40">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#1a4d4d] text-gray-300">{l.action}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {nv.to || nv.template || (nv.recipients != null ? `${nv.recipients} recipients (${nv.mode || ''})` : '—')}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs truncate max-w-[280px]">{nv.subject || '—'}</td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No email activity yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#1a4d4d]">
        <span className="text-gray-500 text-xs">Page {meta?.page || page} of {totalPages}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={(meta?.page || page) <= 1}
            className="p-1.5 rounded-lg border border-[#1a4d4d] text-gray-400 hover:text-[#00ff88] disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={(meta?.page || page) >= totalPages}
            className="p-1.5 rounded-lg border border-[#1a4d4d] text-gray-400 hover:text-[#00ff88] disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab shell
// ─────────────────────────────────────────────────────────────────────────────
const EmailAutomationTab = ({ showToast, adminEmail }) => {
  const [view, setView] = useState('templates');
  const tabs = [
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'logs', label: 'Logs', icon: Mail },
  ];
  return (
    <div>
      <h2 className="text-white text-lg font-semibold flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-[#00ff88]" /> Email Automation
      </h2>
      <div className="flex gap-2 mb-5 border-b border-[#1a4d4d]">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${view === t.id ? 'border-[#00ff88] text-[#00ff88]' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>
      {view === 'templates' && <TemplatesView showToast={showToast} adminEmail={adminEmail} />}
      {view === 'compose' && <ComposeView showToast={showToast} />}
      {view === 'logs' && <LogsView showToast={showToast} />}
    </div>
  );
};

export default EmailAutomationTab;
