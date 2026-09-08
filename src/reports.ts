export type ReportStatus = 'New' | 'Acknowledged' | 'In Progress' | 'Awaiting Response' | 'Completed';
export const STATUS_OPTIONS: ReportStatus[] = ['New', 'Acknowledged', 'In Progress', 'Awaiting Response', 'Completed'];

export interface AdminResponse {
  id: string;
  at: string;
  by: string;
  text: string;
  statusChange?: ReportStatus;
}

export interface ReportRow {
  id: string;
  createdAt: string;
  submissionType: string;
  staffName: string;
  staffEmail: string;
  category: string;
  impact: string;
  involvedStaff: string;
  involvedClient: string;
  headsupText: string;
  improvement: string;
  urgency: string;
  followup: string;
  momentClient: string;
  momentStaff: string;
  momentText: string;
  photoName: string;
  status: ReportStatus;
  statusUpdatedAt: string;
  responses: AdminResponse[];
}

const KEY = 'moja_reports_v1';

function normalize(entry: Partial<ReportRow>): ReportRow {
  const validStatus = STATUS_OPTIONS.includes(entry.status as ReportStatus)
    ? (entry.status as ReportStatus)
    : 'New';
  return {
    id: entry.id ?? crypto.randomUUID(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
    submissionType: entry.submissionType ?? '',
    staffName: entry.staffName ?? '',
    staffEmail: entry.staffEmail ?? '',
    category: entry.category ?? '',
    impact: entry.impact ?? '',
    involvedStaff: entry.involvedStaff ?? '',
    involvedClient: entry.involvedClient ?? '',
    headsupText: entry.headsupText ?? '',
    improvement: entry.improvement ?? '',
    urgency: entry.urgency ?? '',
    followup: entry.followup ?? '',
    momentClient: entry.momentClient ?? '',
    momentStaff: entry.momentStaff ?? '',
    momentText: entry.momentText ?? '',
    photoName: entry.photoName ?? '',
    status: validStatus,
    statusUpdatedAt: entry.statusUpdatedAt ?? entry.createdAt ?? new Date().toISOString(),
    responses: Array.isArray(entry.responses) ? entry.responses : [],
  };
}

export function addResponse(id: string, text: string, by: string, statusChange?: ReportStatus): ReportRow[] {
  const list = loadReports();
  const now = new Date().toISOString();
  const response: AdminResponse = {
    id: crypto.randomUUID(),
    at: now,
    by: by.trim() || 'Admin',
    text: text.trim(),
    statusChange,
  };
  const next = list.map(r => {
    if (r.id !== id) return r;
    return {
      ...r,
      responses: [...r.responses, response],
      status: statusChange ?? r.status,
      statusUpdatedAt: statusChange ? now : r.statusUpdatedAt,
    };
  });
  persistReports(next);
  return next;
}

function persistReports(list: ReportRow[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  const check = localStorage.getItem(KEY);
  if (!check) throw new Error('Save failed: storage returned empty after write.');
}

export function loadReports(): ReportRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize);
  } catch {
    return [];
  }
}

export function saveReport(row: Omit<ReportRow, 'id' | 'createdAt' | 'status' | 'statusUpdatedAt' | 'responses'>): ReportRow {
  const list = loadReports();
  const now = new Date().toISOString();
  const entry: ReportRow = normalize({ ...row, id: crypto.randomUUID(), createdAt: now, status: 'New', statusUpdatedAt: now, responses: [] });
  list.unshift(entry);
  persistReports(list);
  return entry;
}

export function updateReportStatus(id: string, status: ReportStatus): ReportRow[] {
  const list = loadReports();
  const next = list.map(r => r.id === id ? { ...r, status, statusUpdatedAt: new Date().toISOString() } : r);
  persistReports(next);
  return next;
}

export function clearReports() {
  localStorage.removeItem(KEY);
}

const COLUMNS: { key: keyof ReportRow; label: string }[] = [
  { key: 'createdAt', label: 'Submitted At' },
  { key: 'status', label: 'Status' },
  { key: 'statusUpdatedAt', label: 'Status Updated' },
  { key: 'submissionType', label: 'Type' },
  { key: 'staffName', label: 'Staff Name' },
  { key: 'staffEmail', label: 'Staff Email' },
  { key: 'category', label: 'Category' },
  { key: 'impact', label: 'Impact' },
  { key: 'involvedStaff', label: 'Involved Staff' },
  { key: 'involvedClient', label: 'Involved Client' },
  { key: 'headsupText', label: 'Details' },
  { key: 'improvement', label: 'Suggested Improvement' },
  { key: 'urgency', label: 'Urgency' },
  { key: 'followup', label: 'Follow-up' },
  { key: 'momentClient', label: 'Moment Client' },
  { key: 'momentStaff', label: 'Moment Staff' },
  { key: 'momentText', label: 'Moment Description' },
  { key: 'photoName', label: 'Attachment' },
  { key: 'responses', label: 'Admin Response Log' },
];

function esc(v: string): string {
  const s = (v ?? '').toString();
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCSV(rows: ReportRow[], filter?: (r: ReportRow) => boolean): string {
  const filtered = filter ? rows.filter(filter) : rows;
  const header = COLUMNS.map(c => esc(c.label)).join(',');
  const body = filtered.map(r =>
    COLUMNS.map(c => {
      if (c.key === 'createdAt' || c.key === 'statusUpdatedAt') {
        const raw = r[c.key] as string;
        const d = new Date(raw);
        return esc(isNaN(d.getTime()) ? raw : d.toLocaleString());
      }
      if (c.key === 'responses') {
        return esc(r.responses.map(x => {
          const when = new Date(x.at);
          const stamp = isNaN(when.getTime()) ? x.at : when.toLocaleString();
          const tag = x.statusChange ? ` [→ ${x.statusChange}]` : '';
          return `${stamp} — ${x.by}${tag}: ${x.text}`;
        }).join('\n'));
      }
      return esc(r[c.key] as unknown as string);
    }).join(',')
  ).join('\r\n');
  return header + '\r\n' + body;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { COLUMNS };
