import React from "react";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fmtNum } from "./AdminHelpers";

// `trend` comes from the API as { current, previous, change }: the last N days
// against the N days before. `change` is null when the earlier window had
// nothing to compare against, so we describe the raw number instead of
// inventing a percentage.
const TrendLine = ({ trend, windowDays, format }) => {
  if (!trend) return null;
  const { current, previous, change } = trend;
  const detail = `Last ${windowDays} days: ${format(current)} · previous ${windowDays} days: ${format(previous)}`;

  if (change === null || change === undefined) {
    return current ? (
      <p className="text-[#00ff88] text-xs mt-1 flex items-center gap-1" title={detail}>
        <TrendingUp className="w-3 h-3" />
        {format(current)} new in the last {windowDays} days
      </p>
    ) : (
      <p className="text-gray-500 text-xs mt-1" title={detail}>None in the last {windowDays} days</p>
    );
  }

  const up = change > 0;
  const flat = change === 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <p className={`text-xs mt-1 flex items-center gap-1 ${flat ? 'text-gray-400' : up ? 'text-[#00ff88]' : 'text-red-400'}`} title={detail}>
      <Icon className="w-3 h-3" />
      {up ? '+' : ''}{change}% vs previous {windowDays} days
    </p>
  );
};

const StatCard = ({ label, value, trend, trendWindowDays = 30, hint, format = fmtNum, icon: Icon, iconBg }) => (
  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 flex items-center justify-between gap-3 hover:border-[#00ff88]/50 transition-all duration-300 group">
    <div className="min-w-0">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-3xl font-bold tracking-tight">{format(value)}</p>
      <TrendLine trend={trend} windowDays={trendWindowDays} format={format} />
      {hint && <p className="text-gray-500 text-[11px] mt-1 leading-snug">{hint}</p>}
    </div>
    <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
  </div>
);

export default StatCard;
