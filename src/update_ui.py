import os

path = r'c:\Users\adith\OneDrive\Desktop\Code\Leninet Tree\lt-react\lt-react\src\components\Admin.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # 1. Add viewOrgModal state
    if 'const [loadingOrg, setLoadingOrg] = useState(false);' in line:
        new_lines.append(line)
        new_lines.append('  const [viewOrgModal, setViewOrgModal] = useState(null);\n')
        continue

    # 2. Add onClick to All Events card
    if 'className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-[#00ff88]/40 transition-all"' in line and '{allEvents.map((ev)' in ''.join(new_lines[-10:]):
        new_lines.append(line.replace('className="bg-[#0d2f2f]', 'onClick={() => navigate(`/event/${ev.id}`)} className="cursor-pointer bg-[#0d2f2f]'))
        continue

    # 3. Add onClick to Pending Events card
    if 'className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-[#00ff88]/40 transition-all"' in line and '{pendingEvents.map((ev)' in ''.join(new_lines[-10:]):
        new_lines.append(line.replace('className="bg-[#0d2f2f]', 'onClick={() => navigate(`/event/${ev.id}`)} className="cursor-pointer bg-[#0d2f2f]'))
        continue

    # 4. Stop propagation on Edit button (All Events)
    if 'onClick={() => setEditingEvent(ev)}' in line:
        new_lines.append(line.replace('() => setEditingEvent(ev)', '(e) => { e.stopPropagation(); setEditingEvent(ev); }'))
        continue

    # 5. Stop propagation on Approve button (Pending Events)
    if 'onClick={() => handleApproveEvent(ev.id)}' in line:
        new_lines.append(line.replace('() => handleApproveEvent(ev.id)', '(e) => { e.stopPropagation(); handleApproveEvent(ev.id); }'))
        continue

    # 6. Stop propagation on Reject button (Pending Events)
    if 'onClick={() => setRejectModal({ id: ev.id, title: ev.title })}' in line:
        new_lines.append(line.replace('() => setRejectModal', '(e) => { e.stopPropagation(); setRejectModal'))
        continue

    # 7. Add onClick to Organizer Request card
    if 'className="bg-[#0d2f2f] border border-[#1a4d4d] rounded-2xl p-5 hover:border-purple-500/40 transition-all"' in line:
        new_lines.append(line.replace('className="bg-[#0d2f2f]', 'onClick={() => setViewOrgModal(log)} className="cursor-pointer bg-[#0d2f2f]'))
        continue

    # 8. Stop propagation on Approve Organizer button
    if 'onClick={() => handleApproveOrganizer(log.userId)}' in line:
        new_lines.append(line.replace('() => handleApproveOrganizer(log.userId)', '(e) => { e.stopPropagation(); handleApproveOrganizer(log.userId); }'))
        continue

    # 9. Add Organizer Modal UI right before View User Modal
    if '{/* ── View User Modal ── */}' in line:
        modal_ui = """
              {/* ── View Org Modal ── */}
              {viewOrgModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                  <div className="w-full max-w-md bg-[#0d2f2f] border-2 border-[#1a4d4d] rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-semibold text-lg">Organizer Details</h3>
                      <button onClick={() => setViewOrgModal(null)} className="text-gray-400 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4 text-sm text-gray-300">
                      <div><span className="text-gray-500 block text-xs">User Name</span>{viewOrgModal.user?.name || viewOrgModal.user?.email || 'Unknown'}</div>
                      <div><span className="text-gray-500 block text-xs">User Email</span>{viewOrgModal.user?.email}</div>
                      <div><span className="text-gray-500 block text-xs">Organization Name</span>{viewOrgModal.newValue?.orgName || '—'}</div>
                      <div><span className="text-gray-500 block text-xs">Organization Email</span>{viewOrgModal.newValue?.orgEmail || '—'}</div>
                      <div><span className="text-gray-500 block text-xs">First Event</span>{viewOrgModal.newValue?.eventName || '—'}</div>
                      <div><span className="text-gray-500 block text-xs">Requested At</span>{fmtDateTime(viewOrgModal.createdAt)}</div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setViewOrgModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#1a4d4d] text-gray-400 hover:text-white transition-all">
                        Close
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleApproveOrganizer(viewOrgModal.userId); setViewOrgModal(null); }} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all">
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}
"""
        new_lines.append(modal_ui)
        new_lines.append(line)
        continue

    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
