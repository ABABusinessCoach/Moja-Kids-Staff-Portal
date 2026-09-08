export interface ReportRow {
  id: string;
  createdAt: string;
  submissionType: string;
  staffName: string;
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
}

const KEY = 'moja_reports_v1';

export function loadReports(): ReportRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReport(row: Omit<ReportRow, 'id' | 'createdAt'>): ReportRow {
  const list = loadReports();
  const entry: ReportRow = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...row,
  };
  list.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(list));
  return entry;
}

export function clearReports() {
  localStorage.removeItem(KEY);
}

const COLUMNS: { key: keyof ReportRow; label: string }[] = [
  { key: 'createdAt', label: 'Submitted At' },
  { key: 'submissionType', label: 'Type' },
  { key: 'staffName', label: 'Staff Name' },
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
      if (c.key === 'createdAt') {
        const d = new Date(r.createdAt);
        return esc(isNaN(d.getTime()) ? r.createdAt : d.toLocaleString());
      }
      return esc(r[c.key] as string);
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
