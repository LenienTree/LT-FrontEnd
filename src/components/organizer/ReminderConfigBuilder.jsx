import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, Edit3, RotateCcw, Save, Loader2, AlertTriangle, CheckCircle, Clock, Info, Mail
} from 'lucide-react';
import { events as eventsApi } from '../../services/api';

const INTERVAL_LABELS = {
  "7d": "7 Days Before Event",
  "5d": "5 Days Before Event",
  "3d": "3 Days Before Event",
  "2d": "2 Days Before Event",
  "1d": "1 Day Before Event (24 Hours)",
  "12h": "12 Hours Before Event",
  "6h": "6 Hours Before Event",
  "live": "Event Is Now Live 🎉"
};

const ReminderConfigBuilder = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [enabledIntervals, setEnabledIntervals] = useState([]);
  const [templates, setTemplates] = useState({});
  const [defaults, setDefaults] = useState({});
  const [presetIntervals, setPresetIntervals] = useState(["7d", "5d", "3d", "2d", "1d", "12h", "6h", "live"]);

  // Active editing interval state
  const [editingInterval, setEditingInterval] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    if (eventId) fetchConfig();
  }, [eventId]);

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await eventsApi.getReminderConfig(eventId);
      const data = res?.data || res;
      if (data) {
        const configData = data.config || {};
        setEnabledIntervals(Array.isArray(configData.enabledIntervals) ? configData.enabledIntervals : []);
        setTemplates(configData.templates && typeof configData.templates === 'object' ? configData.templates : {});
        if (data.defaults) setDefaults(data.defaults);
        if (Array.isArray(data.presetIntervals)) setPresetIntervals(data.presetIntervals);
      }
    } catch (err) {
      console.error('Failed to fetch reminder config:', err);
      setError(err.message || 'Failed to fetch reminder configuration.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterval = (interval) => {
    setEnabledIntervals(prev => 
      prev.includes(interval) ? prev.filter(i => i !== interval) : [...prev, interval]
    );
  };

  const handleOpenEditor = (interval) => {
    setEditingInterval(interval);
    const existingOverride = templates[interval];
    const defaultTpl = defaults[interval] || { subject: '', body: '' };
    setEditSubject(existingOverride?.subject ?? defaultTpl.subject);
    setEditBody(existingOverride?.body ?? defaultTpl.body);
  };

  const handleSaveTemplateOverride = () => {
    if (!editingInterval) return;
    setTemplates(prev => ({
      ...prev,
      [editingInterval]: {
        subject: editSubject,
        body: editBody
      }
    }));
    setEditingInterval(null);
  };

  const handleResetToDefault = (interval) => {
    setTemplates(prev => {
      const copy = { ...prev };
      delete copy[interval];
      return copy;
    });
    if (editingInterval === interval) {
      const defaultTpl = defaults[interval] || { subject: '', body: '' };
      setEditSubject(defaultTpl.subject);
      setEditBody(defaultTpl.body);
    }
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await eventsApi.saveReminderConfig(eventId, {
        enabledIntervals,
        templates
      });
      setSuccess('Event reminder configuration saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to save reminder config:', err);
      setError(err.message || 'Failed to save reminder configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
        <p className="text-gray-400 text-sm">Loading reminder configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-white">
      {/* Header Banner */}
      <div className="bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-[#00ff88]" />
          <div>
            <h2 className="text-xl font-bold text-white">Automated Event Reminders</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Enable notification intervals and customize email content for registered participants.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Reminder Config
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center gap-3 text-[#00ff88] text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Interval Checklist & Template Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Intervals List */}
        <div className="lg:col-span-5 bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00ff88]" /> Active Reminder Intervals
            </h3>
            <span className="text-xs text-[#00ff88] font-semibold">
              {enabledIntervals.length} / {presetIntervals.length} Active
            </span>
          </div>

          <div className="space-y-2.5">
            {presetIntervals.map((interval) => {
              const isEnabled = enabledIntervals.includes(interval);
              const isOverridden = !!templates[interval];
              const isEditing = editingInterval === interval;

              return (
                <div
                  key={interval}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isEditing
                      ? 'bg-[#00ff88]/10 border-[#00ff88]'
                      : isEnabled
                      ? 'bg-[#142929] border-[#1a4d4d]'
                      : 'bg-[#0c1e1e] border-[#1a4d4d]/50 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-grow select-none">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleInterval(interval)}
                      className="w-4 h-4 accent-[#00ff88] rounded cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {INTERVAL_LABELS[interval] || interval}
                      </span>
                      {isOverridden ? (
                        <span className="text-[10px] text-amber-400 font-semibold block">Custom Template Active</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 block">Default Template</span>
                      )}
                    </div>
                  </label>

                  <div className="flex items-center gap-1.5">
                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => handleResetToDefault(interval)}
                        title="Reset to default template"
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEditor(interval)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        isEditing
                          ? 'bg-[#00ff88] text-black border-[#00ff88]'
                          : 'bg-[#0c1e1e] text-[#00ff88] border-[#00ff88]/40 hover:bg-[#00ff88]/10'
                      }`}
                    >
                      <Edit3 className="w-3 h-3 inline mr-1" />
                      Edit Email
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Template Content Panel */}
        <div className="lg:col-span-7 bg-[#0c1e1e] border border-[#1a4d4d] rounded-2xl p-6 space-y-6">
          {editingInterval ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#1a4d4d] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#00ff88]" />
                    <span>Email Template: {INTERVAL_LABELS[editingInterval] || editingInterval}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Variables available: <code className="text-[#00ff88] font-mono">&#123;&#123;name&#125;&#125;</code>, <code className="text-[#00ff88] font-mono">&#123;&#123;eventTitle&#125;&#125;</code>, <code className="text-[#00ff88] font-mono">&#123;&#123;startDate&#125;&#125;</code>, <code className="text-[#00ff88] font-mono">&#123;&#123;venue&#125;&#125;</code>, <code className="text-[#00ff88] font-mono">&#123;&#123;eventUrl&#125;&#125;</code>
                  </p>
                </div>
                {templates[editingInterval] && (
                  <button
                    type="button"
                    onClick={() => handleResetToDefault(editingInterval)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Default
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block uppercase tracking-wider">Email Subject Line</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Enter email subject line..."
                  className="w-full bg-[#142929] border border-[#1a4d4d] focus:border-[#00ff88] text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block uppercase tracking-wider">Email Body Content</label>
                <textarea
                  rows={10}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Enter email body text..."
                  className="w-full bg-[#142929] border border-[#1a4d4d] focus:border-[#00ff88] text-white p-4 rounded-xl text-xs focus:outline-none leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1a4d4d]">
                <button
                  type="button"
                  onClick={() => setEditingInterval(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-[#142929] border border-[#1a4d4d]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplateOverride}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00ff88] text-black hover:bg-[#00cc6a] transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Apply Template Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <Mail className="w-10 h-10 text-gray-600 mx-auto" />
              <h4 className="text-base font-bold text-white">Select a Reminder Interval to Edit</h4>
              <p className="text-xs max-w-sm mx-auto text-gray-400">
                Click "Edit Email" on any interval to customize the subject line and email body sent to participants. Unedited intervals use system defaults.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderConfigBuilder;
