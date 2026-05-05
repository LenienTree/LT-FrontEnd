import React from "react";
import { TrendingUp } from 'lucide-react';
import { fmtNum } from "./AdminHelpers";

const StatCard = ({ label, value, change, icon: Icon, iconBg }) => (
  <div className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 flex items-center justify-between hover:border-[#00ff88]/50 transition-all duration-300 group">
    <div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-3xl font-bold tracking-tight">{fmtNum(value)}</p>
      {change != null && (
        <p className="text-[#00ff88] text-xs mt-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {change}% from last month
        </p>
      )}
    </div>
    <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
  </div>
);

export default StatCard;
