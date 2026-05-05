import React from "react";

export const Badge = ({ status }) => {
  const map = {
    PENDING_APPROVAL: 'bg-yellow-900/40 text-yellow-400 border-yellow-500/40',
    APPROVED: 'bg-green-900/40 text-green-400 border-green-500/40',
    REJECTED: 'bg-red-900/40 text-red-400 border-red-500/40',
    DRAFT: 'bg-gray-700/60 text-gray-300 border-gray-500/40',
    ACTIVE: 'bg-green-900/40 text-green-400 border-green-500/40',
    BLOCKED: 'bg-red-900/40 text-red-400 border-red-500/40',
    ORGANIZER_REQUEST: 'bg-purple-900/40 text-purple-400 border-purple-500/40',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status] ?? 'bg-gray-700 text-gray-300 border-gray-500'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export const RoleBadge = ({ role, isOrganizer }) => {
  if (role === 'ADMIN') return (
    <span className="text-xs font-semibold px-3 py-0.5 rounded-full border border-red-500 text-red-400 bg-red-900/20">
      Admin
    </span>
  );
  if (isOrganizer) return (
    <span className="text-xs font-semibold px-3 py-0.5 rounded-full border border-purple-500 text-purple-400 bg-purple-900/20">
      Organizer
    </span>
  );
  return (
    <span className="text-xs font-semibold px-3 py-0.5 rounded-full border border-amber-500 text-amber-400 bg-amber-900/20">
      User
    </span>
  );
};
