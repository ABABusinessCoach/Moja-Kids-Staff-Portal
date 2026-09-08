import { useEffect, useMemo, useState } from 'react';
import { Download, Trash2, ArrowLeft, FileSpreadsheet, Filter, Lock, MessageSquareReply, X, CheckCircle2, Clock } from 'lucide-react';
import { loadReports, toCSV, downloadCSV, clearReports, updateReportStatus, addResponse, STATUS_OPTIONS, ReportRow, ReportStatus } from './reports';

type TypeFilter = 'all' | 'Heads Up' | 'Moja Moment' | 'Tech Issue' | 'SOS';
type StatusFilter = 'all' | ReportStatus;

const STATUS_COLORS: Record<ReportStatus, { bg: string; color: string; dot: string }> = {
  'New':               { bg: '#eef4f8', color: '#355574', dot: '#355574' },
  'Acknowledged':      { bg: '#e1eefb', color: '#1e4d8c', dot: '#3d78d6' },
  'In Progress':       { bg: '#fef3d6', color: '#8a6300', dot: '#e6a800' },
  'Awaiting Response': { bg: '#fce9df', color: '#c65423', dot: '#e66d38' },
  'Completed':         { bg: '#dff5e8', color: '#1e7a3d', dot: '#27ae60' },
};

const ADMIN_PASSCODE = 'moja2026';
const UNLOCK_KEY = 'moja_admin_unlocked_v1';
const ADMIN_NAME_KEY = 'moja_admin_name_v1';

export default function AdminReports({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [unlocked, setUnlocked] = useState<boolean>(() => sessionStorage.getItem(UNLOCK_KEY) === 'yes');
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportRow | null>(null);
  const [adminName, setAdminName] = useState<string>(() => localStorage.getItem(ADMIN_NAME_KEY) || '');

  useEffect(() => { if (unlocked) setRows(loadReports()); }, [unlocked]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (passInput.trim() === ADMIN_PASSCODE) {
      sessionStorage.setItem(UNLOCK_KEY, 'yes');
      setUnlocked(true);
      setPassError(false);
      setPassInput('');
    } else {
      setPassError(true);
    }
  }

  function handleLock() {
    sessionStorage.removeItem(UNLOCK_KEY);
    setUnlocked(false);
  }

  function handleStatusChange(id: string, status: ReportStatus) {
    const next = updateReportStatus(id, status);
    setRows(next);
    setActiveReport(prev => prev && prev.id === id ? next.find(r => r.id === id) ?? prev : prev);
  }

  function handleAddResponse(id: string, text: string, statusChange: ReportStatus | undefined, by: string) {
    const trimmedName = by.trim() || 'Admin';
    localStorage.setItem(ADMIN_NAME_KEY, trimmedName);
    setAdminName(trimmedName);
    const next = addResponse(id, text, trimmedName, statusChange);
    setRows(next);
    setActiveReport(next.find(r => r.id === id) ?? null);
  }

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (typeFilter !== 'all' && !r.submissionType.startsWith(typeFilter)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          r.staffName.toLowerCase().includes(q) ||
          r.staffEmail.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.impact.toLowerCase().includes(q) ||
          r.headsupText.toLowerCase().includes(q) ||
          r.momentText.toLowerCase().includes(q) ||
          r.involvedStaff.toLowerCase().includes(q) ||
          r.involvedClient.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, typeFilter, statusFilter, query]);

  const statusCounts = useMemo(() => {
    const c: Record<ReportStatus, number> = { 'New': 0, 'Acknowledged': 0, 'In Progress': 0, 'Awaiting Response': 0, 'Completed': 0 };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const counts = useMemo(() => {
    const c = { headsup: 0, moment: 0, tech: 0, sos: 0 };
    for (const r of rows) {
      if (r.submissionType.startsWith('Heads Up')) c.headsup++;
      else if (r.submissionType.startsWith('Moja Moment')) c.moment++;
      else if (r.submissionType.startsWith('Tech')) c.tech++;
      else if (r.submissionType.startsWith('SOS')) c.sos++;
    }
    return c;
  }, [rows]);

  function handleExport(filter: TypeFilter) {
    const list = filter === 'all' ? rows : rows.filter(r => r.submissionType.startsWith(filter));
    if (list.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const label = filter === 'all' ? 'all-reports' : filter.toLowerCase().replace(/\s+/g, '-');
    downloadCSV(`moja-${label}-${stamp}.csv`, toCSV(list));
  }

  function handleClear() {
    if (!confirm('Delete all locally-saved reports? This cannot be undone.')) return;
    clearReports();
    setRows([]);
  }

  if (!unlocked) {
    return (
      <div style={styles.gateWrap}>
        <form onSubmit={handleUnlock} style={styles.gateCard}>
          <div style={styles.gateIcon}><Lock size={26} color="#355574" /></div>
          <h1 style={styles.gateTitle}>Admin access</h1>
          <p style={styles.gateSub}>Enter the admin passcode to view the reports dashboard.</p>
          <input
            type="password"
            autoFocus
            value={passInput}
            onChange={e => { setPassInput(e.target.value); setPassError(false); }}
            placeholder="Passcode"
            style={{ ...styles.gateInput, borderColor: passError ? '#c0392b' : '#dde8e4' }}
          />
          {passError && <div style={styles.gateError}>Incorrect passcode. Try again.</div>}
          <button type="submit" style={styles.gateBtn}>Unlock</button>
          <button type="button" onClick={onBack} style={styles.gateBack}>Back to form</button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} /> Back to form
        </button>
        <div style={styles.title}>
          <FileSpreadsheet size={22} color="#355574" />
          <h1 style={styles.h1}>Reports Dashboard</h1>
        </div>
        <button onClick={handleLock} style={styles.backBtn} title="Lock dashboard">
          <Lock size={14} /> Lock
        </button>
      </div>

      <div style={styles.statsRow}>
        <StatCard label="Total" value={rows.length} tint="#355574" />
        <StatCard label="Heads Up" value={counts.headsup} tint="#e66d38" />
        <StatCard label="Moja Moments" value={counts.moment} tint="#efd35c" />
        <StatCard label="Tech Issues" value={counts.tech} tint="#6dccc2" />
        <StatCard label="SOS" value={counts.sos} tint="#c0392b" />
      </div>

      <div style={styles.controls}>
        <div style={styles.filterBox}>
          <Filter size={14} color="#7a8e97" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)} style={styles.select}>
            <option value="all">All types</option>
            <option value="Heads Up">Heads Up only</option>
            <option value="Moja Moment">Moja Moments only</option>
            <option value="Tech Issue">Tech Issues only</option>
            <option value="SOS">SOS alerts only</option>
          </select>
        </div>
        <div style={styles.filterBox}>
          <Filter size={14} color="#7a8e97" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} style={styles.select}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s} ({statusCounts[s]})</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Search staff, category, details..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={styles.search}
        />
        <button style={styles.exportBtn} onClick={() => handleExport(typeFilter)} disabled={filtered.length === 0}>
          <Download size={15} /> Export {typeFilter === 'all' ? 'all' : typeFilter} as CSV
        </button>
        <button style={styles.exportBtn} onClick={() => handleExport('Heads Up')} disabled={counts.headsup === 0}>
          <Download size={15} /> Heads Up spreadsheet
        </button>
        <button style={styles.clearBtn} onClick={handleClear} disabled={rows.length === 0}>
          <Trash2 size={14} /> Clear all
        </button>
      </div>

      <div style={styles.note}>
        Reports are saved on this device. Open this page on the device where staff submit forms to compile the spreadsheet.
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Submitted</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Staff</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Impact</th>
              <th style={styles.th}>Urgency</th>
              <th style={styles.th}>Details</th>
              <th style={styles.th}>Follow-up</th>
              <th style={styles.th}>Response</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={styles.empty}>
                  {rows.length === 0
                    ? 'No reports yet. Submissions from this device will appear here automatically.'
                    : 'No reports match the current filter.'}
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id} style={styles.tr}>
                <td style={styles.td}>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={styles.td}><StatusSelect value={r.status} onChange={s => handleStatusChange(r.id, s)} /></td>
                <td style={styles.td}><TypeBadge type={r.submissionType} /></td>
                <td style={styles.td}>{r.staffName || '—'}</td>
                <td style={styles.td}>{r.staffEmail ? <a href={`mailto:${r.staffEmail}?subject=${encodeURIComponent('Re: your ' + r.submissionType + ' submission')}`} style={{ color: '#355574', fontWeight: 600 }}>{r.staffEmail}</a> : '—'}</td>
                <td style={styles.td}>{r.category || '—'}</td>
                <td style={styles.td}>{r.impact || '—'}</td>
                <td style={styles.td}><UrgencyPill urgency={r.urgency} /></td>
                <td style={{ ...styles.td, maxWidth: 320, whiteSpace: 'pre-wrap' }}>
                  {r.submissionType.startsWith('Moja Moment') ? r.momentText : r.headsupText}
                </td>
                <td style={styles.td}>{r.followup || '—'}</td>
                <td style={styles.td}>
                  <button style={styles.respondBtn} onClick={() => setActiveReport(r)}>
                    <MessageSquareReply size={13} />
                    {r.responses.length > 0 ? `${r.responses.length} note${r.responses.length > 1 ? 's' : ''}` : 'Respond'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeReport && (
        <ResponseModal
          report={activeReport}
          defaultName={adminName}
          onClose={() => setActiveReport(null)}
          onStatusChange={s => handleStatusChange(activeReport.id, s)}
          onSubmit={(text, statusChange, by) => handleAddResponse(activeReport.id, text, statusChange, by)}
        />
      )}
    </div>
  );
}

function ResponseModal({
  report, defaultName, onClose, onSubmit, onStatusChange,
}: {
  report: ReportRow;
  defaultName: string;
  onClose: () => void;
  onSubmit: (text: string, statusChange: ReportStatus | undefined, by: string) => void;
  onStatusChange: (s: ReportStatus) => void;
}) {
  const [text, setText] = useState('');
  const [by, setBy] = useState(defaultName);
  const [newStatus, setNewStatus] = useState<ReportStatus>(report.status === 'New' ? 'Acknowledged' : report.status);
  const [changeStatus, setChangeStatus] = useState<boolean>(report.status === 'New');
  const [saveError, setSaveError] = useState<string>('');
  const [saved, setSaved] = useState<boolean>(false);

  const isMoment = report.submissionType.startsWith('Moja Moment');
  const detailText = isMoment ? report.momentText : report.headsupText;

  function flashSavedThenClose() {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  }

  function quick(msg: string, status?: ReportStatus) {
    try {
      onSubmit(msg, status, by);
      setText('');
      setSaveError('');
      flashSavedThenClose();
    } catch (err) {
      setSaveError((err as Error).message || 'Could not save. Please try again.');
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    const statusChanged = changeStatus && newStatus !== report.status;
    if (!trimmed && !statusChanged) return;
    try {
      onSubmit(trimmed || `Status updated to ${newStatus}.`, statusChanged ? newStatus : undefined, by);
      setText('');
      setSaveError('');
      flashSavedThenClose();
    } catch (err) {
      setSaveError((err as Error).message || 'Could not save. Please try again.');
    }
  }

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <div>
            <div style={styles.modalKicker}>Respond to {report.submissionType}</div>
            <div style={styles.modalTitle}>{report.staffName || 'Unnamed submitter'} — {new Date(report.createdAt).toLocaleString()}</div>
            {report.staffEmail && <div style={{ fontSize: 12, color: '#355574', marginTop: 4 }}><a href={`mailto:${report.staffEmail}?subject=${encodeURIComponent('Re: your ' + report.submissionType + ' submission')}`} style={{ color: '#355574' }}>{report.staffEmail}</a></div>}
          </div>
          <button onClick={onClose} style={styles.modalClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.modalMeta}>
            {report.category && <MetaChip label="Category" value={report.category} />}
            {report.impact && <MetaChip label="Impact" value={report.impact} />}
            {report.urgency && <MetaChip label="Urgency" value={report.urgency} />}
            {report.followup && <MetaChip label="Follow-up" value={report.followup} />}
            {report.involvedStaff && <MetaChip label="Staff involved" value={report.involvedStaff} />}
            {report.involvedClient && <MetaChip label="Client involved" value={report.involvedClient} />}
          </div>

          {detailText && (
            <div style={styles.modalSection}>
              <div style={styles.modalSectionLabel}>Original message</div>
              <div style={styles.detailBox}>{detailText}</div>
            </div>
          )}
          {report.improvement && (
            <div style={styles.modalSection}>
              <div style={styles.modalSectionLabel}>Suggested improvement</div>
              <div style={styles.detailBox}>{report.improvement}</div>
            </div>
          )}

          <div style={styles.modalSection}>
            <div style={styles.modalSectionLabel}>Current status</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusSelect value={report.status} onChange={onStatusChange} />
              <span style={{ fontSize: 12, color: '#7a8e97' }}>
                Updated {new Date(report.statusUpdatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={styles.modalSection}>
            <div style={styles.modalSectionLabel}>Quick actions</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={styles.quickBtn} onClick={() => quick('Received. We have seen this heads-up and will look into it.', 'Acknowledged')}>
                <Clock size={13} /> Mark received
              </button>
              <button type="button" style={styles.quickBtn} onClick={() => quick('Action taken — issue has been addressed.', 'Completed')}>
                <CheckCircle2 size={13} /> Action taken
              </button>
              <button type="button" style={styles.quickBtn} onClick={() => quick('Following up — more information needed from the submitter.', 'Awaiting Response')}>
                <MessageSquareReply size={13} /> Awaiting response
              </button>
            </div>
          </div>

          {report.responses.length > 0 && (
            <div style={styles.modalSection}>
              <div style={styles.modalSectionLabel}>Response log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...report.responses].reverse().map(resp => (
                  <div key={resp.id} style={styles.responseItem}>
                    <div style={styles.responseHead}>
                      <span style={styles.responseBy}>{resp.by}</span>
                      <span style={styles.responseAt}>{new Date(resp.at).toLocaleString()}</span>
                      {resp.statusChange && (
                        <span style={{ ...styles.responseStatus, background: STATUS_COLORS[resp.statusChange].bg, color: STATUS_COLORS[resp.statusChange].color }}>
                          → {resp.statusChange}
                        </span>
                      )}
                    </div>
                    <div style={styles.responseText}>{resp.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submit} style={styles.modalSection}>
            <div style={styles.modalSectionLabel}>Write a response</div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Describe the action taken, acknowledge the submitter, or leave a follow-up note..."
              rows={4}
              style={styles.textarea}
            />
            <div style={styles.formRow}>
              <label style={styles.formField}>
                <span style={styles.formLabel}>Your name</span>
                <input
                  value={by}
                  onChange={e => setBy(e.target.value)}
                  placeholder="Admin name"
                  style={styles.input}
                />
              </label>
              <label style={styles.formField}>
                <span style={styles.formLabel}>Also change status to</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={changeStatus}
                    onChange={e => setChangeStatus(e.target.checked)}
                  />
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as ReportStatus)}
                    disabled={!changeStatus}
                    style={{ ...styles.input, flex: 1, opacity: changeStatus ? 1 : 0.5 }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </label>
            </div>
            {saveError && <div style={styles.errorBanner}>{saveError}</div>}
            {saved && <div style={styles.savedBanner}><CheckCircle2 size={14} /> Saved to this device</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
              <button
                type="submit"
                style={styles.saveBtn}
                disabled={saved || (!text.trim() && !(changeStatus && newStatus !== report.status))}
              >
                {saved ? 'Saved' : 'Save response'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metaChip}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div style={{ ...styles.stat, borderTop: `3px solid ${tint}` }}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: ReportStatus; onChange: (s: ReportStatus) => void }) {
  const c = STATUS_COLORS[value];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.bg, borderRadius: 999, padding: '3px 4px 3px 10px' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }} />
      <select
        value={value}
        onChange={e => onChange(e.target.value as ReportStatus)}
        style={{
          border: 'none', outline: 'none', background: 'transparent', color: c.color,
          fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          paddingRight: 4,
        }}
      >
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  let bg = '#eef4f8', color = '#355574';
  if (type.startsWith('Heads Up')) { bg = '#fce9df'; color = '#c65423'; }
  else if (type.startsWith('Moja Moment')) { bg = '#fef7d6'; color = '#8a7000'; }
  else if (type.startsWith('Tech')) { bg = '#e1f5f2'; color = '#2a8f83'; }
  else if (type.startsWith('SOS')) { bg = '#fde8e6'; color = '#c0392b'; }
  return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{type}</span>;
}

function UrgencyPill({ urgency }: { urgency: string }) {
  if (!urgency || urgency === '—') return <span style={{ color: '#b0bec5' }}>—</span>;
  const u = urgency.toLowerCase();
  let color = '#7a8e97';
  if (u.startsWith('red')) color = '#c0392b';
  else if (u.startsWith('yellow')) color = '#e67e22';
  else if (u.startsWith('green')) color = '#27ae60';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {urgency.split('—')[0].trim()}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Quicksand, sans-serif', padding: '24px 28px 60px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: '1.5px solid #dde8e4', borderRadius: 8, color: '#355574', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  title: { display: 'inline-flex', alignItems: 'center', gap: 10 },
  h1: { fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#355574', margin: 0, fontWeight: 600 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 },
  stat: { background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statValue: { fontSize: 26, fontWeight: 700, color: '#2d2d2d', fontFamily: 'Playfair Display, serif' },
  statLabel: { fontSize: 12, color: '#7a8e97', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 },
  controls: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12, background: '#fff', padding: 14, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  filterBox: { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1.5px solid #dde8e4', borderRadius: 8, padding: '6px 10px', background: '#fff' },
  select: { border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#355574', background: 'transparent', fontWeight: 500, cursor: 'pointer' },
  search: { flex: '1 1 220px', minWidth: 200, padding: '9px 12px', border: '1.5px solid #dde8e4', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, outline: 'none' },
  exportBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#355574', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  clearBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 12px', background: '#fff', color: '#c0392b', border: '1.5px solid #f4c4be', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  note: { fontSize: 12, color: '#7a8e97', marginBottom: 14, fontStyle: 'italic' },
  tableWrap: { background: '#fff', borderRadius: 10, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '12px 14px', background: '#eef4f8', color: '#355574', fontWeight: 600, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: '1px solid #dde8e4', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #eef1f4' },
  td: { padding: '12px 14px', color: '#2d2d2d', verticalAlign: 'top' },
  empty: { padding: '40px 20px', textAlign: 'center', color: '#a0b0b8', fontStyle: 'italic' },
  gateWrap: { minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Quicksand, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  gateCard: { width: '100%', maxWidth: 380, background: '#fff', borderRadius: 14, padding: '32px 28px', boxShadow: '0 4px 20px rgba(53,85,116,0.10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  gateIcon: { width: 56, height: 56, borderRadius: '50%', background: '#eef4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  gateTitle: { fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#355574', margin: 0, fontWeight: 600 },
  gateSub: { fontSize: 13, color: '#7a8e97', textAlign: 'center', margin: '0 0 8px', lineHeight: 1.5 },
  gateInput: { width: '100%', padding: '11px 14px', border: '1.5px solid #dde8e4', borderRadius: 8, fontFamily: 'inherit', fontSize: 15, outline: 'none', letterSpacing: 2, textAlign: 'center' },
  gateError: { color: '#c0392b', fontSize: 12, fontWeight: 600, marginTop: -2 },
  gateBtn: { width: '100%', padding: '11px 14px', background: '#355574', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 6 },
  gateBack: { background: 'transparent', border: 'none', color: '#7a8e97', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', marginTop: 4, textDecoration: 'underline' },
  respondBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#eef4f8', color: '#355574', border: '1px solid #d5e2ea', borderRadius: 6, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(20,35,50,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 },
  modalCard: { width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(20,35,50,0.30)', display: 'flex', flexDirection: 'column' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 12px', borderBottom: '1px solid #eef1f4', gap: 12 },
  modalKicker: { fontSize: 11, fontWeight: 700, color: '#7a8e97', letterSpacing: 0.6, textTransform: 'uppercase' },
  modalTitle: { fontFamily: 'Playfair Display, serif', fontSize: 18, color: '#355574', marginTop: 4, fontWeight: 600 },
  modalClose: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8e97', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  modalMeta: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaChip: { display: 'inline-flex', flexDirection: 'column', background: '#f7f9fb', border: '1px solid #eef1f4', borderRadius: 8, padding: '6px 10px', minWidth: 90 },
  metaLabel: { fontSize: 10, color: '#7a8e97', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' },
  metaValue: { fontSize: 13, color: '#2d2d2d', fontWeight: 500, marginTop: 2 },
  modalSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  modalSectionLabel: { fontSize: 11, color: '#7a8e97', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' },
  detailBox: { background: '#f7f9fb', border: '1px solid #eef1f4', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#2d2d2d', whiteSpace: 'pre-wrap', lineHeight: 1.5 },
  quickBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#fff', color: '#355574', border: '1.5px solid #dde8e4', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  responseItem: { background: '#f7f9fb', border: '1px solid #eef1f4', borderRadius: 8, padding: '10px 12px' },
  responseHead: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  responseBy: { fontSize: 12, fontWeight: 700, color: '#355574' },
  responseAt: { fontSize: 11, color: '#7a8e97' },
  responseStatus: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 },
  responseText: { fontSize: 13, color: '#2d2d2d', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  textarea: { width: '100%', padding: '10px 12px', border: '1.5px solid #dde8e4', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 },
  formField: { display: 'flex', flexDirection: 'column', gap: 4 },
  formLabel: { fontSize: 11, color: '#7a8e97', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { padding: '8px 10px', border: '1.5px solid #dde8e4', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, outline: 'none' },
  cancelBtn: { padding: '9px 14px', background: '#fff', color: '#7a8e97', border: '1.5px solid #dde8e4', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  saveBtn: { padding: '9px 16px', background: '#355574', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  savedBanner: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dff5e8', color: '#1e7a3d', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginTop: 4 },
  errorBanner: { background: '#fce9df', color: '#c0392b', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginTop: 4 },
};
