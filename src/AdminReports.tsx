import { useEffect, useMemo, useState } from 'react';
import { Download, Trash2, ArrowLeft, FileSpreadsheet, Filter, Lock } from 'lucide-react';
import { loadReports, toCSV, downloadCSV, clearReports, ReportRow } from './reports';

type TypeFilter = 'all' | 'Heads Up' | 'Moja Moment' | 'Tech Issue' | 'SOS';

const ADMIN_PASSCODE = 'moja2026';
const UNLOCK_KEY = 'moja_admin_unlocked_v1';

export default function AdminReports({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');
  const [unlocked, setUnlocked] = useState<boolean>(() => sessionStorage.getItem(UNLOCK_KEY) === 'yes');
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);

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

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (typeFilter !== 'all' && !r.submissionType.startsWith(typeFilter)) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          r.staffName.toLowerCase().includes(q) ||
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
  }, [rows, typeFilter, query]);

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
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Staff</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Impact</th>
              <th style={styles.th}>Urgency</th>
              <th style={styles.th}>Details</th>
              <th style={styles.th}>Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={styles.empty}>
                  {rows.length === 0
                    ? 'No reports yet. Submissions from this device will appear here automatically.'
                    : 'No reports match the current filter.'}
                </td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id} style={styles.tr}>
                <td style={styles.td}>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={styles.td}><TypeBadge type={r.submissionType} /></td>
                <td style={styles.td}>{r.staffName || '—'}</td>
                <td style={styles.td}>{r.category || '—'}</td>
                <td style={styles.td}>{r.impact || '—'}</td>
                <td style={styles.td}><UrgencyPill urgency={r.urgency} /></td>
                <td style={{ ...styles.td, maxWidth: 320, whiteSpace: 'pre-wrap' }}>
                  {r.submissionType.startsWith('Moja Moment') ? r.momentText : r.headsupText}
                </td>
                <td style={styles.td}>{r.followup || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
};
