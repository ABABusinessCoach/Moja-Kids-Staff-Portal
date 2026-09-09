import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

const ADMIN_EMAIL = 'hello@mojakids.com';

const BRAND = {
  blue: '#355574',
  orange: '#e66d38',
  aqua: '#6dccc2',
  yellow: '#efd35c',
  pink: '#df76b6',
  blueBg: '#eef4f8',
  aquaBg: '#e8f7f5',
  orangeBg: '#fef0e8',
  yellowBg: '#fef9e6',
  pinkBg: '#fceff6',
  textDark: '#2d3748',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bodyBg: '#f7f9fb',
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function brandWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bodyBg};font-family:'Quicksand',Calibri,Arial,sans-serif;-webkit-font-smoothing:antialiased">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
  <!-- Decorative top accent circles -->
  <div style="text-align:center;margin-bottom:0;padding:20px 0 0;position:relative">
    <div style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${BRAND.aqua};opacity:0.35;margin:0 3px"></div>
    <div style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${BRAND.pink};opacity:0.35;margin:0 3px"></div>
    <div style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${BRAND.yellow};opacity:0.35;margin:0 3px"></div>
    <div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${BRAND.orange};opacity:0.35;margin:0 3px"></div>
  </div>

  <!-- Main card -->
  <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(53,85,116,0.08)">
    ${content}
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:20px 16px 8px">
    <div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${BRAND.aqua};opacity:0.3;margin:0 2px"></div>
    <div style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${BRAND.pink};opacity:0.3;margin:0 2px"></div>
    <div style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${BRAND.yellow};opacity:0.3;margin:0 2px"></div>
    <p style="margin:10px 0 0;font-size:12px;color:${BRAND.textMuted};line-height:1.5">
      Moja Behavioral Services<br>
      <a href="mailto:hello@mojakids.com" style="color:${BRAND.blue};text-decoration:none">hello@mojakids.com</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

function headerBar(title: string, accent: string): string {
  return `
    <div style="background:${BRAND.blue};padding:28px 32px 24px;position:relative">
      <div style="position:absolute;top:12px;right:20px;display:flex;gap:4px">
        <div style="width:24px;height:24px;border-radius:50%;background:${BRAND.aqua};opacity:0.2"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:${BRAND.pink};opacity:0.2;margin-top:6px"></div>
      </div>
      <div style="width:40px;height:4px;border-radius:2px;background:${accent};margin-bottom:14px"></div>
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;font-family:'Quicksand',Calibri,Arial,sans-serif;letter-spacing:-0.2px">${escapeHtml(title)}</h1>
    </div>`;
}

function detailRow(label: string, value: string): string {
  if (!value || value === '—') return '';
  return `
    <tr>
      <td style="padding:8px 0;font-size:12px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;width:120px">${label}</td>
      <td style="padding:8px 0 8px 12px;font-size:14px;color:${BRAND.textDark};line-height:1.5">${escapeHtml(value)}</td>
    </tr>`;
}

function urgencyBadge(urgency: string): string {
  if (!urgency || urgency === '—') return '';
  const u = urgency.toLowerCase();
  let bg = BRAND.blueBg, color = BRAND.blue, dot = BRAND.blue;
  if (u.startsWith('red')) { bg = '#fde8e6'; color = '#c0392b'; dot = '#c0392b'; }
  else if (u.startsWith('yellow')) { bg = BRAND.yellowBg; color = '#8a6d00'; dot = BRAND.yellow; }
  else if (u.startsWith('green')) { bg = BRAND.aquaBg; color = '#1e7a5a'; dot = BRAND.aqua; }
  return `
    <tr>
      <td style="padding:8px 0;font-size:12px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;vertical-align:top;width:120px">Urgency</td>
      <td style="padding:8px 0 8px 12px">
        <span style="display:inline-flex;align-items:center;gap:6px;background:${bg};color:${color};padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dot}"></span>
          ${escapeHtml(urgency.split('—')[0].trim())}
        </span>
      </td>
    </tr>`;
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
  const isSOS = p.submissionType.includes('SOS');
  const accent = isSOS ? '#c0392b' : BRAND.orange;
  const typeBg = isSOS ? '#fde8e6' : BRAND.orangeBg;
  const typeColor = isSOS ? '#c0392b' : BRAND.orange;

  const content = `
    ${headerBar('New Submission Received', accent)}
    <div style="padding:28px 32px">
      <!-- Type badge -->
      <div style="margin-bottom:20px">
        <span style="display:inline-block;background:${typeBg};color:${typeColor};padding:5px 14px;border-radius:999px;font-size:13px;font-weight:700">${escapeHtml(p.submissionType)}</span>
      </div>

      <!-- Submitter info -->
      <div style="background:${BRAND.blueBg};border-radius:10px;padding:16px 20px;margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Submitted by</div>
        <div style="font-size:16px;font-weight:700;color:${BRAND.blue}">${escapeHtml(p.staffName)}</div>
        <div style="font-size:13px;color:${BRAND.textMuted};margin-top:2px">
          <a href="mailto:${escapeHtml(p.staffEmail)}" style="color:${BRAND.blue};text-decoration:none">${escapeHtml(p.staffEmail)}</a>
        </div>
      </div>

      <!-- Details table -->
      <table style="width:100%;border-collapse:collapse">
        ${detailRow('Category', p.category || '')}
        ${detailRow('Impact', p.impact || '')}
        ${urgencyBadge(p.urgency || '')}
        ${detailRow('Follow-up', p.followup || '')}
        ${detailRow('Staff involved', p.involvedStaff || '')}
        ${detailRow('Client involved', p.involvedClient || '')}
        ${detailRow('Attachment', p.photoName || '')}
      </table>

      ${p.description ? `
      <!-- Description -->
      <div style="margin-top:20px;border-top:1px solid ${BRAND.border};padding-top:20px">
        <div style="font-size:11px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Details</div>
        <div style="background:${BRAND.bodyBg};border:1px solid ${BRAND.border};border-radius:10px;padding:16px 20px;font-size:14px;color:${BRAND.textDark};line-height:1.6;white-space:pre-wrap">${escapeHtml(p.description)}</div>
      </div>` : ''}

      ${p.improvement ? `
      <!-- Improvement suggestion -->
      <div style="margin-top:16px;background:${BRAND.aquaBg};border-left:4px solid ${BRAND.aqua};border-radius:0 10px 10px 0;padding:14px 18px">
        <div style="font-size:11px;font-weight:700;color:${BRAND.aqua};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Suggested Improvement</div>
        <div style="font-size:14px;color:${BRAND.textDark};line-height:1.5">${escapeHtml(p.improvement)}</div>
      </div>` : ''}

      <!-- Automated notice -->
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid ${BRAND.border}">
        <p style="margin:0;font-size:12px;color:${BRAND.textMuted}">This is an automated notification from Moja Behavioral Services.</p>
      </div>
    </div>`;

  return brandWrapper(content);
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
  const content = `
    ${headerBar('Update on Your Submission', BRAND.aqua)}
    <div style="padding:28px 32px">
      <p style="font-size:15px;color:${BRAND.textDark};margin:0 0 4px;line-height:1.5">Hi <strong>${escapeHtml(p.staffFirstName)}</strong>,</p>
      <p style="font-size:14px;color:${BRAND.textMuted};margin:0 0 20px;line-height:1.5">
        There is an update on your <strong style="color:${BRAND.blue}">${escapeHtml(p.submissionType)}</strong> from ${escapeHtml(p.submittedDate)}.
      </p>

      <!-- Response card -->
      <div style="background:${BRAND.blueBg};border-radius:12px;padding:20px 24px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:50%;background:${BRAND.blue};display:inline-block;text-align:center;line-height:32px;color:#fff;font-size:14px;font-weight:700">M</div>
          <div>
            <div style="font-size:13px;font-weight:700;color:${BRAND.blue}">Moja Admin</div>
            <div style="font-size:11px;color:${BRAND.textMuted}">Response</div>
          </div>
        </div>
        <div style="font-size:14px;color:${BRAND.textDark};line-height:1.6;white-space:pre-wrap">${escapeHtml(p.responseText)}</div>
      </div>

      <!-- Status badge -->
      <div style="background:${BRAND.aquaBg};border-radius:10px;padding:14px 20px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
        <div style="width:10px;height:10px;border-radius:50%;background:${BRAND.aqua}"></div>
        <div>
          <div style="font-size:11px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px">Status</div>
          <div style="font-size:14px;font-weight:700;color:${BRAND.blue}">${escapeHtml(p.statusLabel)}</div>
        </div>
      </div>

      ${p.originalSummary ? `
      <!-- Original submission -->
      <div style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;margin-bottom:20px">
        <div style="background:${BRAND.bodyBg};padding:12px 20px;border-bottom:1px solid ${BRAND.border}">
          <div style="font-size:12px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px">Original Submission</div>
        </div>
        <div style="padding:16px 20px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            ${detailRow('Category', p.category || '')}
            ${detailRow('Impact', p.impact || '')}
            ${detailRow('Urgency', p.urgency || '')}
            ${detailRow('Follow-up', p.followup || '')}
            ${detailRow('Staff', p.involvedStaff || '')}
            ${detailRow('Client', p.involvedClient || '')}
          </table>
          <div style="margin-top:10px;font-size:13px;color:${BRAND.textDark};line-height:1.5;white-space:pre-wrap">${escapeHtml(p.originalSummary)}</div>
        </div>
      </div>` : ''}

      <!-- Contact note -->
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid ${BRAND.border}">
        <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.5">
          Questions? Reply directly to <a href="mailto:hello@mojakids.com" style="color:${BRAND.blue};text-decoration:none;font-weight:600">hello@mojakids.com</a>
        </p>
        <p style="margin:8px 0 0;font-size:12px;color:${BRAND.textMuted}">This is an automated notification from Moja Behavioral Services.</p>
      </div>
    </div>`;

  return brandWrapper(content);
}

function buildStatusChangeHtml(p: {
  staffFirstName: string;
  submissionType: string;
  submittedDate: string;
  newStatus: string;
}): string {
  let statusColor = BRAND.blue;
  let statusBg = BRAND.blueBg;
  const s = p.newStatus.toLowerCase();
  if (s === 'acknowledged') { statusColor = '#1e4d8c'; statusBg = '#e1eefb'; }
  else if (s === 'in progress') { statusColor = '#8a6300'; statusBg = BRAND.yellowBg; }
  else if (s === 'awaiting response') { statusColor = BRAND.orange; statusBg = BRAND.orangeBg; }
  else if (s === 'completed') { statusColor = '#1e7a3d'; statusBg = '#dff5e8'; }

  const content = `
    ${headerBar('Status Update', BRAND.yellow)}
    <div style="padding:28px 32px">
      <p style="font-size:15px;color:${BRAND.textDark};margin:0 0 4px;line-height:1.5">Hi <strong>${escapeHtml(p.staffFirstName)}</strong>,</p>
      <p style="font-size:14px;color:${BRAND.textMuted};margin:0 0 24px;line-height:1.5">
        The status of your <strong style="color:${BRAND.blue}">${escapeHtml(p.submissionType)}</strong> from ${escapeHtml(p.submittedDate)} has been updated.
      </p>

      <!-- Status card -->
      <div style="background:${statusBg};border-radius:12px;padding:24px 28px;text-align:center;margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px">New Status</div>
        <div style="font-size:22px;font-weight:700;color:${statusColor};letter-spacing:-0.3px">${escapeHtml(p.newStatus)}</div>
      </div>

      <!-- What this means -->
      <div style="background:${BRAND.bodyBg};border-radius:10px;padding:16px 20px;margin-bottom:20px">
        <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.5">
          ${s === 'acknowledged' ? 'Your submission has been seen and noted by the admin team.' :
            s === 'in progress' ? 'Your submission is being actively reviewed or addressed.' :
            s === 'awaiting response' ? 'The admin team needs additional information from you. Please check your email or reach out.' :
            s === 'completed' ? 'This matter has been resolved. Thank you for your submission.' :
            'Your submission status has been updated.'}
        </p>
      </div>

      <!-- Contact note -->
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid ${BRAND.border}">
        <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.5">
          Questions? Reply directly to <a href="mailto:hello@mojakids.com" style="color:${BRAND.blue};text-decoration:none;font-weight:600">hello@mojakids.com</a>
        </p>
        <p style="margin:8px 0 0;font-size:12px;color:${BRAND.textMuted}">This is an automated notification from Moja Behavioral Services.</p>
      </div>
    </div>`;

  return brandWrapper(content);
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

export async function sendStatusChangeEmail(p: {
  staffEmail: string;
  staffName: string;
  submissionType: string;
  submittedDate: string;
  newStatus: string;
}): Promise<void> {
  const firstName = p.staffName?.split(' ')[0] || 'there';
  const subject = `Status Update: Your ${p.submissionType} — now ${p.newStatus}`;
  const html = buildStatusChangeHtml({
    staffFirstName: firstName,
    submissionType: p.submissionType,
    submittedDate: p.submittedDate,
    newStatus: p.newStatus,
  });
  await callEdgeFunction(p.staffEmail, subject, html, 'hello@mojakids.com');
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
