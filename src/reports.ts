import { createClient } from '@supabase/supabase-js';

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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DbReport {
  id: string;
  created_at: string;
  submission_type: string;
  staff_name: string;
  staff_email: string;
  category: string;
  impact: string;
  involved_staff: string;
  involved_client: string;
  headsup_text: string;
  improvement: string;
  urgency: string;
  followup: string;
  moment_client: string;
  moment_staff: string;
  moment_text: string;
  photo_name: string;
  status: string;
  status_updated_at: string;
}

interface DbResponse {
  id: string;
  report_id: string;
  created_at: string;
  author_name: string;
  response_text: string;
  status_change: string | null;
}

function toReportRow(r: DbReport, responses: DbResponse[]): ReportRow {
  const validStatus = STATUS_OPTIONS.includes(r.status as ReportStatus)
    ? (r.status as ReportStatus)
    : 'New';
  return {
    id: r.id,
    createdAt: r.created_at,
    submissionType: r.submission_type,
    staffName: r.staff_name,
    staffEmail: r.staff_email,
    category: r.category,
    impact: r.impact,
    involvedStaff: r.involved_staff,
    involvedClient: r.involved_client,
    headsupText: r.headsup_text,
    improvement: r.improvement,
    urgency: r.urgency,
    followup: r.followup,
    momentClient: r.moment_client,
    momentStaff: r.moment_staff,
    momentText: r.moment_text,
    photoName: r.photo_name,
    status: validStatus,
    statusUpdatedAt: r.status_updated_at,
    responses: responses
      .filter(resp => resp.report_id === r.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(resp => ({
        id: resp.id,
        at: resp.created_at,
        by: resp.author_name,
        text: resp.response_text,
        statusChange: (STATUS_OPTIONS.includes(resp.status_change as ReportStatus)
          ? (resp.status_change as ReportStatus)
          : undefined),
      })),
  };
}

export async function loadReports(): Promise<ReportRow[]> {
  const { data: reports, error: rErr } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (rErr) throw new Error(rErr.message);
  if (!reports || reports.length === 0) return [];

  const { data: responses, error: respErr } = await supabase
    .from('report_responses')
    .select('*')
    .in('report_id', reports.map(r => r.id));
  if (respErr) throw new Error(respErr.message);

  return reports.map(r => toReportRow(r as DbReport, (responses ?? []) as DbResponse[]));
}

export async function saveReport(
  row: Omit<ReportRow, 'id' | 'createdAt' | 'status' | 'statusUpdatedAt' | 'responses'>
): Promise<void> {
  const insert = {
    submission_type: row.submissionType,
    staff_name: row.staffName,
    staff_email: row.staffEmail,
    category: row.category,
    impact: row.impact,
    involved_staff: row.involvedStaff,
    involved_client: row.involvedClient,
    headsup_text: row.headsupText,
    improvement: row.improvement,
    urgency: row.urgency,
    followup: row.followup,
    moment_client: row.momentClient,
    moment_staff: row.momentStaff,
    moment_text: row.momentText,
    photo_name: row.photoName,
    status: 'New',
  };
  const { error } = await supabase
    .from('reports')
    .insert(insert);
  if (error) throw new Error(error.message);
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<ReportRow[]> {
  const { error } = await supabase
    .from('reports')
    .update({ status, status_updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return loadReports();
}

export async function addResponse(
  id: string,
  text: string,
  by: string,
  statusChange?: ReportStatus
): Promise<ReportRow[]> {
  const insert = {
    report_id: id,
    author_name: by.trim() || 'Admin',
    response_text: text.trim(),
    status_change: statusChange ?? null,
  };
  const { error: insErr } = await supabase
    .from('report_responses')
    .insert(insert);
  if (insErr) throw new Error(insErr.message);

  if (statusChange) {
    const { error: updErr } = await supabase
      .from('reports')
      .update({ status: statusChange, status_updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updErr) throw new Error(updErr.message);
  }
  return loadReports();
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
