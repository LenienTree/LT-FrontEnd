import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, GraduationCap, Briefcase, Sparkles, Target,
  Download, Loader2, RefreshCw, Wallet, UserX, Bookmark, Clock, Building2, Link2, Award,
} from 'lucide-react';
import { admin } from '../../services/api';
import { fmtNum, fmtDate, downloadCsv } from './AdminHelpers';

const PALETTE = ['#00ff88', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#ec4899', '#84cc16', '#f97316', '#06b6d4'];
const TOOLTIP = { backgroundColor: '#061818', border: '1px solid #1a4d4d', borderRadius: 12, color: '#fff' };

// Horizontal "bar list" leaderboard — proportional bars, theme-matched.
const BarList = ({ items, valueKey = 'count', labelKey = 'label', color = '#00ff88', empty = 'No data yet.' }) => {
  if (!items || items.length === 0) return <p className="text-gray-600 text-xs py-4">{empty}</p>;
  const max = Math.max(...items.map((i) => i[valueKey] || 0), 1);
  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-32 sm:w-40 shrink-0 text-xs text-gray-300 truncate" title={String(it[labelKey])}>{it[labelKey] || '—'}</div>
          <div className="flex-1 h-5 bg-[#061818] rounded-md overflow-hidden">
            <div className="h-full rounded-md transition-all" style={{ width: `${((it[valueKey] || 0) / max) * 100}%`, backgroundColor: color, opacity: 0.85 }} />
          </div>
          <div className="w-10 text-right text-xs font-semibold text-white tabular-nums">{fmtNum(it[valueKey] || 0)}</div>
        </div>
      ))}
    </div>
  );
};

const Panel = ({ title, icon: Icon, children, action }) => (
  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-white text-sm font-bold flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#00ff88]" />} {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const StatTile = ({ label, value, sub, icon: Icon, accent = '#00ff88', trend }) => (
  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-4">
    <div className="flex items-center justify-between">
      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">{label}</p>
      {Icon && <Icon className="w-4 h-4" style={{ color: accent }} />}
    </div>
    <p className="text-2xl font-extrabold mt-2" style={{ color: accent }}>{value}</p>
    <div className="flex items-center gap-1.5 mt-1 min-h-[16px]">
      {trend != null && (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${trend >= 0 ? 'text-[#00ff88]' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(trend)}%
        </span>
      )}
      {sub && <span className="text-[11px] text-gray-500">{sub}</span>}
    </div>
  </div>
);

const LeadAnalyticsTab = ({ showToast }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ domain: '', college: '' });
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await admin.getLeadAnalytics());
    } catch (e) {
      showToast?.(e.message || 'Failed to load lead analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const exportLeads = async () => {
    setExporting(true);
    try {
      const rows = await admin.getInternshipLeads(filter);
      downloadCsv(
        `internship-leads-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Name', 'Email', 'Phone', 'College', 'Graduation Year', 'Current Role', 'Domains', 'Signed Up'],
        (rows || []).map((r) => [
          r.name || '', r.email || '', r.phone || '', r.college || '',
          r.graduationYear || '', r.currentRole || '',
          (r.internshipDomains || []).join('; '), fmtDate(r.createdAt),
        ]),
      );
      showToast?.(`Exported ${rows?.length || 0} internship lead${rows?.length === 1 ? '' : 's'}.`);
    } catch (e) {
      showToast?.(e.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading || !data) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-10 h-10 text-[#00ff88] animate-spin" /></div>;
  }

  const { funnel, internship, topColleges, graduationYears, topInterests, topSkills, referrals, growth, segments, revenue } = data;
  const funnelMax = funnel[0]?.count || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-[#00ff88]" /> Lead &amp; Growth Analytics
        </h2>
        <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatTile label="Internship leads" value={fmtNum(internship.interestedCount)} sub={`${internship.sharePct}% of users`} icon={Briefcase} />
        <StatTile label="Signups / wk" value={fmtNum(growth.signupsThisWeek)} trend={growth.wowGrowth} icon={Users} accent="#3b82f6" />
        <StatTile label="Signups / mo" value={fmtNum(growth.signupsThisMonth)} trend={growth.momGrowth} icon={TrendingUp} accent="#a855f7" />
        <StatTile label="Referral conv." value={`${referrals.conversionRate}%`} sub={`${fmtNum(referrals.totalConversions)} conv.`} icon={Link2} accent="#f59e0b" />
        <StatTile label="Nurture leads" value={fmtNum(segments.neverRegistered)} sub="never registered" icon={UserX} accent="#ef4444" />
        <StatTile label="Recoverable" value={fmtNum(segments.paymentPending)} sub="payment pending" icon={Clock} accent="#14b8a6" />
      </div>

      {/* Funnel */}
      <Panel title="Acquisition → Activation Funnel" icon={Target}>
        <div className="space-y-2.5">
          {funnel.map((s, i) => (
            <div key={s.stage} className="flex items-center gap-3">
              <div className="w-36 shrink-0 text-xs text-gray-300">{s.stage}</div>
              <div className="flex-1 h-7 bg-[#061818] rounded-lg overflow-hidden relative">
                <div className="h-full rounded-lg flex items-center px-2" style={{ width: `${Math.max((s.count / funnelMax) * 100, 3)}%`, backgroundColor: PALETTE[i % PALETTE.length], opacity: 0.85 }}>
                  <span className="text-[11px] font-bold text-[#04110f]">{fmtNum(s.count)}</span>
                </div>
              </div>
              <div className="w-12 text-right text-xs font-semibold text-gray-400 tabular-nums">{s.pct}%</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Internship leads hero */}
      <Panel
        title="Internship Lead Demand"
        icon={Briefcase}
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <input value={filter.domain} onChange={(e) => setFilter((f) => ({ ...f, domain: e.target.value }))} placeholder="Filter domain"
              className="w-28 bg-[#061818] border border-[#1a4d4d] rounded-lg px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50" />
            <input value={filter.college} onChange={(e) => setFilter((f) => ({ ...f, college: e.target.value }))} placeholder="Filter college"
              className="w-28 bg-[#061818] border border-[#1a4d4d] rounded-lg px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]/50" />
            <button onClick={exportLeads} disabled={exporting}
              className="flex items-center gap-1.5 bg-[#00b36b] hover:bg-[#00c878] text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Export leads
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-3">Demand by domain</p>
            {internship.byDomain.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={internship.byDomain} layout="vertical" margin={{ left: 8, right: 12 }}>
                    <XAxis type="number" stroke="#888" fontSize={10} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" stroke="#888" fontSize={10} width={110} />
                    <Tooltip contentStyle={TOOLTIP} cursor={{ fill: '#ffffff08' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {internship.byDomain.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-gray-600 text-xs py-4">No internship domains recorded yet.</p>}
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">Top colleges (internship-interested)</p>
              <BarList items={internship.byCollege} labelKey="college" color="#3b82f6" empty="No college data yet." />
            </div>
            <div>
              <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">By graduation year</p>
              <BarList items={internship.byGraduationYear.map((y) => ({ label: String(y.year), count: y.count }))} color="#f59e0b" empty="No year data yet." />
            </div>
          </div>
        </div>
      </Panel>

      {/* Colleges + demand signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Most Engaged Colleges" icon={Building2}>
          <BarList items={topColleges} labelKey="college" valueKey="users" color="#00ff88" empty="No college data yet." />
        </Panel>
        <Panel title="Graduation-Year Distribution" icon={GraduationCap}>
          {graduationYears.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graduationYears}>
                  <XAxis dataKey="year" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-gray-600 text-xs py-4">No graduation-year data yet.</p>}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Top Interests (demand signal)" icon={Sparkles}>
          <BarList items={topInterests} color="#ec4899" empty="No interests recorded yet." />
        </Panel>
        <Panel title="Top Skills" icon={Award}>
          <BarList items={topSkills} color="#14b8a6" empty="No skills recorded yet." />
        </Panel>
      </div>

      {/* Referrals */}
      <Panel title="Referral Channel Performance" icon={Link2}>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-[#061818] rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold text-[#00ff88]">{fmtNum(referrals.totalClicks)}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Clicks</p>
          </div>
          <div className="bg-[#061818] rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold text-[#3b82f6]">{fmtNum(referrals.totalConversions)}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Conversions</p>
          </div>
          <div className="bg-[#061818] rounded-xl p-3 text-center">
            <p className="text-xl font-extrabold text-[#f59e0b]">{referrals.conversionRate}%</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Conv. rate</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">Top referrers</p>
            {referrals.topReferrers.length > 0 ? (
              <div className="space-y-1.5">
                {referrals.topReferrers.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-5 text-gray-600 font-bold">{i + 1}</span>
                    <span className="flex-1 text-gray-200 truncate">{r.name}{r.college ? <span className="text-gray-500"> · {r.college}</span> : null}</span>
                    <span className="text-[#00ff88] font-semibold">{r.conversions}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-600 text-xs py-4">No referral conversions yet.</p>}
          </div>
          <div>
            <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">Top colleges by referrals</p>
            <BarList items={referrals.topColleges} labelKey="college" valueKey="conversions" color="#f59e0b" empty="No referral data yet." />
          </div>
        </div>
      </Panel>

      {/* Re-engagement segments */}
      <Panel title="Re-engagement Segments (actionable lists)" icon={Users}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Never registered', value: segments.neverRegistered, icon: UserX, accent: '#ef4444', sub: 'Nurture to first event' },
            { label: 'Bookmarked, not registered', value: segments.bookmarkedNotRegistered, icon: Bookmark, accent: '#f59e0b', sub: 'High intent' },
            { label: 'Payment pending', value: segments.paymentPending, icon: Clock, accent: '#14b8a6', sub: 'Recoverable revenue' },
            { label: 'Unverified email', value: segments.unverified, icon: Users, accent: '#a855f7', sub: 'Remind to verify' },
          ].map((s) => (
            <div key={s.label} className="bg-[#061818] border border-[#1a4d4d] rounded-xl p-4">
              <s.icon className="w-4 h-4 mb-2" style={{ color: s.accent }} />
              <p className="text-2xl font-extrabold" style={{ color: s.accent }}>{fmtNum(s.value)}</p>
              <p className="text-xs text-gray-300 mt-1">{s.label}</p>
              <p className="text-[10px] text-gray-500">{s.sub}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Revenue mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Revenue by Category" icon={Wallet}>
          {revenue.byCategory.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenue.byCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                    {revenue.byCategory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-gray-600 text-xs py-4">No paid revenue yet.</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {revenue.byCategory.map((c, i) => (
              <span key={c.category} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                {c.category} · ₹{Number(c.revenue).toLocaleString()}
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="Monetization Mix" icon={Wallet}>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#061818] rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#00ff88]">{fmtNum(revenue.paidEvents)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Paid events</p>
            </div>
            <div className="bg-[#061818] rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#3b82f6]">{fmtNum(revenue.freeEvents)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Free events</p>
            </div>
            <div className="bg-[#061818] rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#f59e0b]">₹{fmtNum(revenue.avgTicketPrice)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Avg ticket</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
            Paid conversion of {revenue.paidEvents + revenue.freeEvents > 0 ? Math.round((revenue.paidEvents / (revenue.paidEvents + revenue.freeEvents)) * 100) : 0}% of
            events are monetized. Use the internship-lead export above to route high-intent students to placement partners.
          </p>
        </Panel>
      </div>
    </div>
  );
};

export default LeadAnalyticsTab;
