import React from "react";
import { RefreshCw } from 'lucide-react';

const SectionHeader = ({ title, count, onRefresh }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <h2 className="text-white text-lg font-semibold">{title}</h2>
      {count != null && (
        <span className="bg-[#00ff88]/20 text-[#00ff88] text-xs font-bold px-2.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
    {onRefresh && (
      <button onClick={onRefresh} className="text-gray-400 hover:text-[#00ff88] transition-colors p-1 rounded-lg hover:bg-[#1a4d4d]">
        <RefreshCw className="w-4 h-4" />
      </button>
    )}
  </div>
);

export default SectionHeader;
