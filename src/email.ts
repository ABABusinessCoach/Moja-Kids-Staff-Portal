import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

const ADMIN_EMAIL = 'hello@mojakids.com';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function row(label: string, value: string): string {
  if (!value || value === '—') return '';
  return `<tr><td style="padding:6px 12px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 12px">${escapeHtml(value)}</td></tr>`;
}

function buildSubmissionHtml(p: {
  submissionType: string;
  staffName: string;
  staffEmail: string;
  category?: string;
  impact?: string;
  involvedStaff?: string;
  involvedClient?: string;
  description?: string;
  improvement?: string;
  urgency?: string;
  followup?: string;
  photoName?: string;
}): string {
  const isUrgent = p.submissionType.includes('SOS');
  const accent = isUrgent ? '#c0392b' : '#2a7c6f';
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:${accent};padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;color:#fff;font-size:20px">${escapeHtml(p.submissionType)}</h1>
      </div>
      <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;padding:20px 24px">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
          ${row('From', `${p.staffName} (${p.staffEmail})`)}
          ${row('Category', p.category || '')}
          ${row('Impact', p.impact || '')}
          ${row('Urgency', p.urgency || '')}
          ${row('Follow-up', p.followup || '')}
          ${row('Staff involved', p.involvedStaff || '')}
          ${row('Client involved', p.involvedClient || '')}
          ${row('Photo', p.photoName || '')}
        </table>
        ${p.description ? `<div style="margin-top:16px;padding:16px;background:#f8f9fa;border-radius:6px;font-size:14px;color:#333;white-space:pre-wrap">${escapeHtml(p.description)}</div>` : ''}
        ${p.improvement ? `<div style="margin-top:12px;padding:12px 16px;background:#eef6f4;border-radius:6px;font-size:13px;color:#2a7c6f"><strong>Suggested improvement:</strong><br>${escapeHtml(p.improvement)}</div>` : ''}
        <p style="margin-top:20px;font-size:12px;color:#999">This is an automated notification from Moja Behavioral Services.</p>
      </div>
    </div>`;
}

function buildResponseHtml(p: {
  staffFirstName: string;
  submissionType: string;
  submittedDate: string;
  responseText: string;
  statusLabel: string;
  originalSummary?: string;
  category?: string;
  impact?: string;
  urgency?: string;
  followup?: string;
  involvedStaff?: string;
  involvedClient?: string;
}): string {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#2a7c6f;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;color:#fff;font-size:20px">Update on your ${escapeHtml(p.submissionType)}</h1>
      </div>
      <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;padding:20px 24px">
        <p style="font-size:14px;color:#333">Hi ${escapeHtml(p.staffFirstName)},</p>
        <p style="font-size:14px;color:#333">There is an update on your <strong>${escapeHtml(p.submissionType)}</strong> submission from ${escapeHtml(p.submittedDate)}.</p>
        <div style="margin:16px 0;padding:16px;background:#eef6f4;border-left:4px solid #2a7c6f;border-radius:4px">
          <div style="font-size:12px;color:#666;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Admin Response</div>
          <div style="font-size:14px;color:#333;white-space:pre-wrap">${escapeHtml(p.responseText)}</div>
          <div style="margin-top:10px;font-size:13px;color:#555"><strong>Status:</strong> ${escapeHtml(p.statusLabel)}</div>
        </div>
        ${p.originalSummary ? `
        <details style="margin-top:16px">
          <summary style="font-size:13px;color:#888;cursor:pointer">Original submission details</summary>
          <div style="margin-top:8px;padding:12px;background:#f8f9fa;border-radius:6px;font-size:13px;color:#555">
            <table style="width:100%;border-collapse:collapse">
              ${row('Category', p.category || '')}
              ${row('Impact', p.impact || '')}
              ${row('Urgency', p.urgency || '')}
              ${row('Follow-up', p.followup || '')}
              ${row('Staff', p.involvedStaff || '')}
              ${row('Client', p.involvedClient || '')}
            </table>
            <div style="margin-top:8px;white-space:pre-wrap">${escapeHtml(p.originalSummary)}</div>
          </div>
        </details>` : ''}
        <p style="margin-top:20px;font-size:12px;color:#999">If you have questions, please reply to hello@mojakids.com.<br>This is an automated notification from Moja Behavioral Services.</p>
      </div>
    </div>`;
}

async function callEdgeFunction(to: string, subject: string, html: string, replyTo?: string): Promise<void> {

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html, replyTo }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn('Email send failed:', (body as { error?: string }).error || res.status);
    }
  } catch (err) {
    console.warn('Email send error:', err);
  }
}

export function sendSubmissionEmail(p: {
  submissionType: string;
  staffName: string;
  staffEmail: string;
  category?: string;
  impact?: string;
  involvedStaff?: string;
  involvedClient?: string;
  description?: string;
  improvement?: string;
  urgency?: string;
  followup?: string;
  photoName?: string;
}): void {
  const subject = `${p.submissionType} — from ${p.staffName}`;
  const html = buildSubmissionHtml(p);
  callEdgeFunction(ADMIN_EMAIL, subject, html).catch(() => {});
}

export async function sendResponseEmail(p: {
  staffEmail: string;
  staffName: string;
  submissionType: string;
  submittedDate: string;
  responseText: string;
  statusLabel: string;
  originalSummary?: string;
  category?: string;
  impact?: string;
  urgency?: string;
  followup?: string;
  involvedStaff?: string;
  involvedClient?: string;
}): Promise<void> {
  const firstName = p.staffName?.split(' ')[0] || 'there';
  const subject = `Update: Your ${p.submissionType} submission — ${p.statusLabel}`;
  const html = buildResponseHtml({
    staffFirstName: firstName,
    submissionType: p.submissionType,
    submittedDate: p.submittedDate,
    responseText: p.responseText,
    statusLabel: p.statusLabel,
    originalSummary: p.originalSummary,
    category: p.category,
    impact: p.impact,
    urgency: p.urgency,
    followup: p.followup,
    involvedStaff: p.involvedStaff,
    involvedClient: p.involvedClient,
  });
  await callEdgeFunction(p.staffEmail, subject, html, 'hello@mojakids.com');
}
