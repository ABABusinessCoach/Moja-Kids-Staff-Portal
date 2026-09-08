import { useState, useEffect, useRef, useCallback } from 'react';
import AdminReports from './AdminReports';
import { saveReport } from './reports';
import { sendSubmissionEmail } from './email';

type Screen = 'name' | 'type' | 'headsup' | 'moment' | 'tech' | 'thanks';
type SubmissionType = 'headsup' | 'moment' | 'tech' | '';
type Urgency = 'red' | 'yellow' | 'green' | '';
type FollowUp = 'yes' | 'no' | '';

interface SOSState {
  name: string;
  location: string;
  note: string;
}

interface HUState {
  category: string;
  impact: string;
  staff: string;
  client: string;
  text: string;
  improvement: string;
  urgency: Urgency;
  followup: FollowUp;
  photoB64: string;
  photoName: string;
}

interface MMState {
  client: string;
  staff: string;
  text: string;
}

interface TechState {
  issueType: string;
  system: string;
  tryingTo: string;
  whatHappened: string;
  stepsTried: string;
  urgency: Urgency;
  followup: FollowUp;
  photoB64: string;
  photoName: string;
}



const MAX_TEXT = 5000;
const MAX_SHORT = 200;

function Header({ title, subtitle, dark }: { title: string; subtitle: string; dark?: boolean }) {
  return (
    <div className={`moja-header${dark ? ' moja-header-moment' : ''}`}>
      <div className="moja-logo-container">
        <img src="/MOJA+Behavioral_(1).png" alt="Moja Behavioral Services" className="moja-logo-img" />
      </div>
      <div style={{ flex: 1 }}>
        <div className="moja-header-title">{title}</div>
        <div className="moja-header-sub">{subtitle}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<string>(() => (typeof window !== 'undefined' ? window.location.hash : ''));
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [screen, setScreen] = useState<Screen>('name');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState<'' | 'missing' | 'invalid'>('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('');

  const [hu, setHu] = useState<HUState>({
    category: '', impact: '', staff: '', client: '', text: '',
    improvement: '', urgency: '', followup: '', photoB64: '', photoName: '',
  });
  const [huErrors, setHuErrors] = useState({ category: false, impact: false, text: false, urgency: false });
  const [huSubmitError, setHuSubmitError] = useState('');
  const [huSubmitting, setHuSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [mm, setMm] = useState<MMState>({ client: '', staff: '', text: '' });
  const [mmTextError, setMmTextError] = useState(false);
  const [mmSubmitError, setMmSubmitError] = useState('');
  const [mmSubmitting, setMmSubmitting] = useState(false);

  const [tech, setTech] = useState<TechState>({
    issueType: '', system: '', tryingTo: '', whatHappened: '',
    stepsTried: '', urgency: '', followup: '', photoB64: '', photoName: '',
  });
  const [techErrors, setTechErrors] = useState({ issueType: false, whatHappened: false, urgency: false });
  const [techSubmitError, setTechSubmitError] = useState('');
  const [techSubmitting, setTechSubmitting] = useState(false);
  const techFileInputRef = useRef<HTMLInputElement>(null);
  const [techPhotoPreview, setTechPhotoPreview] = useState('');

  const [thanksTitle, setThanksTitle] = useState('');
  const [thanksMsg, setThanksMsg] = useState('');
  const [countdown, setCountdown] = useState(8);

  const [sosOpen, setSosOpen] = useState(false);
  const [sos, setSos] = useState<SOSState>({ name: '', location: '', note: '' });
  const [sosLocationError, setSosLocationError] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosSendError, setSosSendError] = useState('');

  const show = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (screen !== 'thanks') return;
    setCountdown(8);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); resetAll(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  function resetAll() {
    setStaffName('');
    setStaffEmail('');
    setNameError(false);
    setEmailError('');
    setSubmissionType('');
    setHu({ category: '', impact: '', staff: '', client: '', text: '', improvement: '', urgency: '', followup: '', photoB64: '', photoName: '' });
    setHuErrors({ category: false, impact: false, text: false, urgency: false });
    setHuSubmitError('');
    setPhotoPreview('');
    setMm({ client: '', staff: '', text: '' });
    setMmTextError(false);
    setMmSubmitError('');
    setTech({ issueType: '', system: '', tryingTo: '', whatHappened: '', stepsTried: '', urgency: '', followup: '', photoB64: '', photoName: '' });
    setTechErrors({ issueType: false, whatHappened: false, urgency: false });
    setTechSubmitError('');
    setTechPhotoPreview('');
    show('name');
  }

  function goToTypeSelect() {
    const emailTrim = staffEmail.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
    let ok = true;
    if (!staffName.trim()) { setNameError(true); ok = false; } else { setNameError(false); }
    if (!emailTrim) { setEmailError('missing'); ok = false; }
    else if (!emailValid) { setEmailError('invalid'); ok = false; }
    else { setEmailError(''); }
    if (!ok) return;
    show('type');
  }

  function selectType(t: SubmissionType) {
    setSubmissionType(t);
    setTimeout(() => show(t === 'moment' ? 'moment' : t === 'tech' ? 'tech' : 'headsup'), 160);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setHu(h => ({ ...h, photoB64: result, photoName: f.name }));
    };
    r.readAsDataURL(f);
  }

  function uLabel(u: Urgency) {
    return u === 'red' ? 'RED — Act immediately' : u === 'yellow' ? 'YELLOW — Within the week' : 'GREEN — Not urgent';
  }

  async function submitHeadsUp() {
    const errors = { category: !hu.category, impact: !hu.impact, text: !hu.text.trim(), urgency: !hu.urgency };
    setHuErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    setHuSubmitting(true);
    setHuSubmitError('');
    try {
      await saveReport({ submissionType: 'Heads Up', staffName, staffEmail, category: hu.category, impact: hu.impact, involvedStaff: hu.staff || '', involvedClient: hu.client || '', headsupText: hu.text, improvement: hu.improvement || '', urgency: uLabel(hu.urgency), followup: hu.followup === 'yes' ? 'Yes — follow up requested' : 'No follow-up needed', momentClient: '', momentStaff: '', momentText: '', photoName: hu.photoName || '' });
      sendSubmissionEmail({ submissionType: 'Heads Up', staffName, staffEmail, category: hu.category, impact: hu.impact, involvedStaff: hu.staff || '', involvedClient: hu.client || '', description: hu.text, improvement: hu.improvement || '', urgency: uLabel(hu.urgency), followup: hu.followup === 'yes' ? 'Yes — follow up requested' : 'No follow-up needed', photoName: hu.photoName || '' });
      setThanksTitle('Heads Up submitted!'); setThanksMsg("Sent to hello@mojakids.com — it'll be routed to the right person."); show('thanks');
    } catch (err: unknown) {
      setHuSubmitError('Something went wrong while saving. Please try again.');
    } finally { setHuSubmitting(false); }
  }

  async function submitMoment() {    if (!mm.text.trim()) { setMmTextError(true); return; }
    setMmTextError(false);
    setMmSubmitting(true);
    setMmSubmitError('');
    try {
      await saveReport({ submissionType: 'Moja Moment', staffName, staffEmail, category: '', impact: '', involvedStaff: mm.staff || '', involvedClient: mm.client || '', headsupText: '', improvement: '', urgency: '', followup: '', momentClient: mm.client || '', momentStaff: mm.staff || '', momentText: mm.text, photoName: '' });
      sendSubmissionEmail({ submissionType: 'Moja Moment', staffName, staffEmail, involvedStaff: mm.staff || '', involvedClient: mm.client || '', description: mm.text });
      setThanksTitle('Moja Moment shared!');
      setThanksMsg('Sent to hello@mojakids.com. Thank you for celebrating your team.');
      show('thanks');
    } catch (err: unknown) {
      setMmSubmitError('Something went wrong while saving. Please try again.');
    } finally { setMmSubmitting(false); }
  }

  function handleTechPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      const result = ev.target?.result as string;
      setTechPhotoPreview(result);
      setTech(t => ({ ...t, photoB64: result, photoName: f.name }));
    };
    r.readAsDataURL(f);
  }

  async function submitTech() {
    const errors = { issueType: !tech.issueType, whatHappened: !tech.whatHappened.trim(), urgency: !tech.urgency };
    setTechErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    setTechSubmitting(true);
    setTechSubmitError('');
    try {
      await saveReport({ submissionType: 'Tech Issue', staffName, staffEmail, category: tech.issueType, impact: tech.system || '', involvedStaff: staffName, involvedClient: '', headsupText: `TRYING TO DO: ${tech.tryingTo || '—'}\n\nWHAT HAPPENED: ${tech.whatHappened}\n\nSTEPS TRIED: ${tech.stepsTried || '—'}`, improvement: '', urgency: uLabel(tech.urgency), followup: tech.followup === 'yes' ? 'Yes — follow up requested' : 'No follow-up needed', momentClient: '', momentStaff: '', momentText: '', photoName: tech.photoName || '' });
      sendSubmissionEmail({ submissionType: 'Tech Issue', staffName, staffEmail, category: tech.issueType, impact: tech.system || '', involvedStaff: staffName, description: `TRYING TO DO: ${tech.tryingTo || '—'}\n\nWHAT HAPPENED: ${tech.whatHappened}\n\nSTEPS TRIED: ${tech.stepsTried || '—'}`, urgency: uLabel(tech.urgency), followup: tech.followup === 'yes' ? 'Yes — follow up requested' : 'No follow-up needed', photoName: tech.photoName || '' });
      setThanksTitle('Tech Issue reported!');
      setThanksMsg('Sent to hello@mojakids.com. The team will look into it right away.');
      show('thanks');
    } catch (err: unknown) {
      setTechSubmitError('Something went wrong while saving. Please try again.');
    } finally { setTechSubmitting(false); }
  }

  async function sendSOS() {
    if (!sos.location.trim()) { setSosLocationError(true); return; }
    setSosLocationError(false);
    setSosSending(true);
    setSosSendError('');
    const senderName = sos.name.trim() || staffName.trim() || 'Unknown staff';
    try {
      await saveReport({ submissionType: 'SOS — URGENT HELP NEEDED', staffName: senderName, staffEmail, category: 'EMERGENCY', impact: 'Safety', involvedStaff: senderName, involvedClient: '', headsupText: `LOCATION: ${sos.location.trim()}${sos.note.trim() ? `\n\nADDITIONAL INFO: ${sos.note.trim()}` : ''}`, improvement: '', urgency: 'RED — IMMEDIATE HELP NEEDED', followup: 'Yes — follow up immediately', momentClient: '', momentStaff: '', momentText: '', photoName: '' });
      sendSubmissionEmail({ submissionType: 'SOS — URGENT HELP NEEDED', staffName: senderName, staffEmail, category: 'EMERGENCY', impact: 'Safety', involvedStaff: senderName, description: `LOCATION: ${sos.location.trim()}${sos.note.trim() ? `\n\nADDITIONAL INFO: ${sos.note.trim()}` : ''}`, urgency: 'RED — IMMEDIATE HELP NEEDED', followup: 'Yes — follow up immediately' });
      setSosSent(true);
    } catch (err: unknown) {
      setSosSendError('Something went wrong while saving. Please try again.');
    } finally {
      setSosSending(false);
    }
  }

  function closeSOS() {
    setSosOpen(false);
    setSos({ name: '', location: '', note: '' });
    setSosLocationError(false);
    setSosSent(false);
    setSosSendError('');
  }

  const CATEGORIES = ['Client / Session','Environment / Room','Team / Staffing','Schedule / Time','Payroll / Admin','Materials / Supplies','Tech / Data','Not sure'];
  const IMPACTS = ['Client experience','Session flow','Safety','Team workflow','Environment','Scheduling','Other'];
  const URGENCY_OPTIONS = [
    { id: 'red' as const, label: 'Red — Stop and act immediately', desc: 'Safety concern or issue requiring immediate action' },
    { id: 'yellow' as const, label: 'Yellow — Address within the week', desc: 'Important but not immediately urgent' },
    { id: 'green' as const, label: 'Green — Not stopping anything', desc: 'Low urgency, address when convenient' },
  ];

  if (route === '#admin' || route === '#reports') {
    return <AdminReports onBack={() => { window.location.hash = ''; }} />;
  }

  return (
    <div className="moja-app">

      {screen === 'name' && (
        <div className="moja-screen">
          <Header title="Moja Behavioral Services" subtitle="Staff Communication Form" />
          <div className="moja-welcome-content">
            {/* Brand accent blobs */}
            <div className="moja-blob moja-blob-aqua" />
            <div className="moja-blob moja-blob-pink" />
            <div className="moja-blob moja-blob-yellow" />
            <div className="moja-welcome-inner">
              <p className="moja-eyebrow">Moja Kids Staff Portal</p>
              <h2 className="moja-welcome-title">How are things going today?</h2>
              <p className="moja-welcome-sub">Share a heads up or celebrate a Moja Moment. Your voice helps us grow together.</p>
              <div className="moja-name-wrap">
                <input
                  type="text"
                  className="moja-name-input"
                  placeholder="Enter your full name"
                  autoComplete="off"
                  maxLength={MAX_SHORT}
                  value={staffName}
                  onChange={e => { setStaffName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                  onKeyDown={e => e.key === 'Enter' && goToTypeSelect()}
                />
                {nameError && <p className="moja-inline-error" style={{ textAlign: 'center', marginTop: '-10px', marginBottom: 12 }}>Please enter your name to continue.</p>}
                <input
                  type="email"
                  className="moja-name-input"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  maxLength={MAX_SHORT}
                  value={staffEmail}
                  onChange={e => { setStaffEmail(e.target.value); if (e.target.value.trim()) setEmailError(''); }}
                  onKeyDown={e => e.key === 'Enter' && goToTypeSelect()}
                  style={{ marginTop: 12 }}
                />
                {emailError === 'missing' && <p className="moja-inline-error" style={{ textAlign: 'center', marginTop: '-10px', marginBottom: 12 }}>Please enter your email so we can follow up with you.</p>}
                {emailError === 'invalid' && <p className="moja-inline-error" style={{ textAlign: 'center', marginTop: '-10px', marginBottom: 12 }}>That email doesn't look right. Please check it and try again.</p>}
                <button className="moja-btn-primary" onClick={goToTypeSelect}>Get Started</button>
                <button
                  type="button"
                  onClick={() => { window.location.hash = '#admin'; }}
                  style={{ marginTop: 18, background: 'transparent', border: 'none', color: '#7a8e97', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Admin: View reports spreadsheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'type' && (
        <div className="moja-screen">
          <Header title="Moja Behavioral Services" subtitle="Staff Communication Form" />
          <div className="moja-content" style={{ paddingTop: 36 }}>
            <p className="moja-greeting">Hi <span className="moja-accent">{staffName.split(' ')[0]}</span>, what would you like to share?</p>
            <div className="moja-type-grid">
              {/* 3-card top row */}
              <div className="moja-type-row">
                <div className={`moja-type-card moja-type-card-compact${submissionType === 'headsup' ? ' selected' : ''}`} onClick={() => selectType('headsup')}>
                  <div className="moja-type-icon" style={{ background: '#fce9df' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e66d38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div className="moja-type-card-text">
                    <h3>Heads Up</h3>
                    <p>Flag a concern or area for improvement.</p>
                  </div>
                </div>
                <div className={`moja-type-card moja-type-card-compact${submissionType === 'moment' ? ' selected' : ''}`} onClick={() => selectType('moment')}>
                  <div className="moja-type-icon" style={{ background: '#fef7d6' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8a000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div className="moja-type-card-text">
                    <h3>Moja Moment</h3>
                    <p>Celebrate a highlight or win.</p>
                  </div>
                </div>
                <div className={`moja-type-card moja-type-card-compact moja-type-card-tech${submissionType === 'tech' ? ' selected' : ''}`} onClick={() => selectType('tech')}>
                  <div className="moja-type-icon moja-tech-icon">
                    <img src="/images/tech/image.png" alt="Tech" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  </div>
                  <div className="moja-type-card-text">
                    <h3>Tech Issue</h3>
                    <p>Report a tech or data problem.</p>
                  </div>
                </div>
              </div>
              {/* SOS full-width */}
              <div className="moja-type-card moja-type-card-sos moja-type-card-sos-full" onClick={() => { setSosOpen(true); setSosSent(false); }}>
                <div className="moja-type-icon" style={{ background: '#fde8e6' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="moja-type-card-text">
                  <h3 style={{ color: '#c0392b' }}>SOS — I Need Help</h3>
                  <p>Send an urgent alert with your location. Admin will be notified immediately.</p>
                </div>
              </div>
            </div>
            <button className="moja-btn-secondary" onClick={() => show('name')}>Back</button>
          </div>
        </div>
      )}

      {screen === 'headsup' && (
        <div className="moja-screen">
          <Header title="Heads Up" subtitle="Flag something for the team" />
          <div className="moja-content">

            <div className="moja-field-group">
              <div className="moja-section-head">Category</div>
              <div className="moja-chip-wrap">
                {CATEGORIES.map(c => (
                  <div key={c} className={`moja-chip${hu.category === c ? ' selected' : ''}`}
                    onClick={() => { setHu(h => ({ ...h, category: c })); setHuErrors(e => ({ ...e, category: false })); }}>{c}</div>
                ))}
              </div>
              {huErrors.category && <p className="moja-inline-error">Please select a category.</p>}
            </div>

            <div className="moja-field-group">
              <div className="moja-section-head">What was impacted?</div>
              <div className="moja-chip-wrap">
                {IMPACTS.map(c => (
                  <div key={c} className={`moja-chip${hu.impact === c ? ' selected' : ''}`}
                    onClick={() => { setHu(h => ({ ...h, impact: c })); setHuErrors(e => ({ ...e, impact: false })); }}>{c}</div>
                ))}
              </div>
              {huErrors.impact && <p className="moja-inline-error">Please select what was impacted.</p>}
            </div>

            <div className="moja-field-group">
              <div className="moja-section-head">Who's involved?</div>
              <div className="moja-two-col">
                <div>
                  <label className="moja-field-label">Staff</label>
                  <input type="text" className="moja-input" placeholder="Staff name(s)" value={hu.staff} onChange={e => setHu(h => ({ ...h, staff: e.target.value }))} />
                </div>
                <div>
                  <label className="moja-field-label">Client <span className="moja-hint">(initials only)</span></label>
                  <input type="text" className="moja-input" placeholder="e.g. J.D., M.L." value={hu.client} onChange={e => setHu(h => ({ ...h, client: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">What's the heads up? <span className="moja-required">*</span></label>
              <textarea className="moja-textarea" maxLength={MAX_TEXT} placeholder="Describe what happened or what you noticed..."
                value={hu.text} onChange={e => { setHu(h => ({ ...h, text: e.target.value })); if (e.target.value.trim()) setHuErrors(er => ({ ...er, text: false })); }} />
              {huErrors.text && <p className="moja-inline-error">Please describe the situation.</p>}
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">Photo <span className="moja-hint">(optional)</span></label>
              <div className="moja-upload-area" onClick={() => fileInputRef.current?.click()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6dccc2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                  <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <p>Tap to attach a photo</p>
                {photoPreview && <img src={photoPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, marginTop: 10 }} />}
                {hu.photoName && <p className="moja-file-name">{hu.photoName}</p>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">What would improve this?</label>
              <textarea className="moja-textarea" maxLength={MAX_TEXT} style={{ minHeight: 80 }} placeholder="Any ideas or suggestions..."
                value={hu.improvement} onChange={e => setHu(h => ({ ...h, improvement: e.target.value }))} />
            </div>

            <div className="moja-field-group">
              <div className="moja-section-head">Urgency</div>
              <div className="moja-urgency-grid">
                {URGENCY_OPTIONS.map(({ id, label, desc }) => (
                  <div key={id} className={`moja-urgency-card${hu.urgency === id ? ` sel-${id}` : ''}`}
                    onClick={() => { setHu(h => ({ ...h, urgency: id })); setHuErrors(e => ({ ...e, urgency: false })); }}>
                    <div className={`moja-u-dot u-${id}`} />
                    <div>
                      <div className="moja-u-label">{label}</div>
                      <div className="moja-u-desc">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {huErrors.urgency && <p className="moja-inline-error">Please select an urgency level.</p>}
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">Would you like follow-up?</label>
              <div className="moja-followup-grid">
                <div className={`moja-followup-btn${hu.followup === 'yes' ? ' selected' : ''}`} onClick={() => setHu(h => ({ ...h, followup: 'yes' }))}>Yes, please follow up</div>
                <div className={`moja-followup-btn${hu.followup === 'no' ? ' selected' : ''}`} onClick={() => setHu(h => ({ ...h, followup: 'no' }))}>No follow-up needed</div>
              </div>
            </div>

            <div className="moja-btn-row">
              <button className="moja-btn-secondary" onClick={() => show('type')}>Back</button>
              <button className="moja-btn-primary" disabled={huSubmitting} onClick={submitHeadsUp}>
                {huSubmitting ? 'Sending...' : 'Submit Heads Up'}
              </button>
            </div>
            {huSubmitError && <p className="moja-submit-error">{huSubmitError}</p>}
          </div>
        </div>
      )}

      {screen === 'moment' && (
        <div className="moja-screen">
          <Header title="Moja Moment" subtitle="Share something worth celebrating" dark />
          <div className="moja-content" style={{ paddingTop: 32 }}>
            <p className="moja-privacy-note">Use client initials only to protect privacy (e.g. Fi.La.)</p>

            <div className="moja-field-group">
              <label className="moja-field-label">Client initials</label>
              <input type="text" className="moja-input" placeholder="e.g. Fi.La., J.D." value={mm.client} onChange={e => setMm(m => ({ ...m, client: e.target.value }))} />
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">Staff involved <span className="moja-hint">(optional)</span></label>
              <input type="text" className="moja-input" placeholder="Staff name(s)" value={mm.staff} onChange={e => setMm(m => ({ ...m, staff: e.target.value }))} />
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">What happened? <span className="moja-required">*</span> <span className="moja-hint">1–3 sentences</span></label>
              <textarea className="moja-textarea" maxLength={MAX_TEXT} style={{ minHeight: 120 }} placeholder="Describe the moment in 1–3 sentences..."
                value={mm.text} onChange={e => { setMm(m => ({ ...m, text: e.target.value })); if (e.target.value.trim()) setMmTextError(false); }} />
              {mmTextError && <p className="moja-inline-error">Please describe the Moja Moment.</p>}
            </div>

            <div className="moja-btn-row">
              <button className="moja-btn-secondary" onClick={() => show('type')}>Back</button>
              <button className="moja-btn-primary moja-btn-orange" disabled={mmSubmitting} onClick={submitMoment}>
                {mmSubmitting ? 'Sending...' : 'Submit Moja Moment'}
              </button>
            </div>
            {mmSubmitError && <p className="moja-submit-error">{mmSubmitError}</p>}
          </div>
        </div>
      )}

      {screen === 'tech' && (
        <div className="moja-screen">
          <Header title="Tech Issue" subtitle="Report a tech or data problem" />
          <div className="moja-content">

            <div className="moja-field-group">
              <div className="moja-section-head">Issue type <span className="moja-required">*</span></div>
              <div className="moja-chip-wrap">
                {['App / Software', 'Device / Hardware', 'Network / Internet', 'Data / Records', 'Printer / Equipment', 'Other'].map(t => (
                  <div key={t} className={`moja-chip${tech.issueType === t ? ' selected' : ''}`}
                    onClick={() => { setTech(s => ({ ...s, issueType: t })); setTechErrors(e => ({ ...e, issueType: false })); }}>{t}</div>
                ))}
              </div>
              {techErrors.issueType && <p className="moja-inline-error">Please select an issue type.</p>}
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">Which system or device? <span className="moja-hint">(optional)</span></label>
              <input type="text" className="moja-input" placeholder="e.g. iPad, CATT database, printer in Room 2"
                value={tech.system} onChange={e => setTech(s => ({ ...s, system: e.target.value }))} />
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">What were you trying to do? <span className="moja-hint">(optional)</span></label>
              <input type="text" className="moja-input" placeholder="e.g. Log in to the app, print a report, save a session note"
                value={tech.tryingTo} onChange={e => setTech(s => ({ ...s, tryingTo: e.target.value }))} />
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">What happened? <span className="moja-required">*</span></label>
              <textarea className="moja-textarea" maxLength={MAX_TEXT} placeholder="Describe the problem in as much detail as possible..."
                value={tech.whatHappened}
                onChange={e => { setTech(s => ({ ...s, whatHappened: e.target.value })); if (e.target.value.trim()) setTechErrors(er => ({ ...er, whatHappened: false })); }} />
              {techErrors.whatHappened && <p className="moja-inline-error">Please describe what happened.</p>}
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">Steps already tried <span className="moja-hint">(optional)</span></label>
              <textarea className="moja-textarea" maxLength={MAX_TEXT} style={{ minHeight: 80 }} placeholder="e.g. Restarted the device, cleared the browser cache..."
                value={tech.stepsTried} onChange={e => setTech(s => ({ ...s, stepsTried: e.target.value }))} />
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">Screenshot <span className="moja-hint">(optional)</span></label>
              <div className="moja-upload-area" onClick={() => techFileInputRef.current?.click()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6dccc2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                  <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <p>Tap to attach a screenshot</p>
                {techPhotoPreview && <img src={techPhotoPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, marginTop: 10 }} />}
                {tech.photoName && <p className="moja-file-name">{tech.photoName}</p>}
              </div>
              <input ref={techFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleTechPhoto} />
            </div>

            <div className="moja-field-group">
              <div className="moja-section-head">Urgency <span className="moja-required">*</span></div>
              <div className="moja-urgency-grid">
                {URGENCY_OPTIONS.map(({ id, label, desc }) => (
                  <div key={id} className={`moja-urgency-card${tech.urgency === id ? ` sel-${id}` : ''}`}
                    onClick={() => { setTech(s => ({ ...s, urgency: id })); setTechErrors(e => ({ ...e, urgency: false })); }}>
                    <div className={`moja-u-dot u-${id}`} />
                    <div>
                      <div className="moja-u-label">{label}</div>
                      <div className="moja-u-desc">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {techErrors.urgency && <p className="moja-inline-error">Please select an urgency level.</p>}
            </div>

            <div className="moja-field-group">
              <label className="moja-field-label">Would you like follow-up?</label>
              <div className="moja-followup-grid">
                <div className={`moja-followup-btn${tech.followup === 'yes' ? ' selected' : ''}`} onClick={() => setTech(s => ({ ...s, followup: 'yes' }))}>Yes, please follow up</div>
                <div className={`moja-followup-btn${tech.followup === 'no' ? ' selected' : ''}`} onClick={() => setTech(s => ({ ...s, followup: 'no' }))}>No follow-up needed</div>
              </div>
            </div>

            <div className="moja-btn-row">
              <button className="moja-btn-secondary" onClick={() => show('type')}>Back</button>
              <button className="moja-btn-primary moja-btn-tech" disabled={techSubmitting} onClick={submitTech}>
                {techSubmitting ? 'Sending...' : 'Submit Tech Issue'}
              </button>
            </div>
            {techSubmitError && <p className="moja-submit-error">{techSubmitError}</p>}
          </div>
        </div>
      )}

      {screen === 'thanks' && (
        <div className="moja-screen">
          <Header title="Moja Behavioral Services" subtitle="Staff Communication Form" />
          <div className="moja-thanks-wrap">
            <div className="moja-thanks-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>{thanksTitle}</h2>
            <p>{thanksMsg}</p>
            <div className="moja-countdown">Resetting in {countdown} second{countdown !== 1 ? 's' : ''}...</div>
          </div>
        </div>
      )}

      {/* SOS floating button */}
      <button className="moja-sos-fab" onClick={() => { setSosOpen(true); setSosSent(false); }} aria-label="Send SOS alert">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        SOS
      </button>

      {/* SOS modal */}
      {sosOpen && (
        <div className="moja-sos-overlay" onClick={e => { if (e.target === e.currentTarget) closeSOS(); }}>
          <div className="moja-sos-modal">
            {sosSent ? (
              <div className="moja-sos-sent">
                <div className="moja-sos-sent-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>SOS Sent</h3>
                <p>Your alert has been sent to the admin team. Help is on the way.</p>
                <button className="moja-sos-close-btn" onClick={closeSOS}>Close</button>
              </div>
            ) : (
              <>
                <div className="moja-sos-modal-header">
                  <div className="moja-sos-header-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <div className="moja-sos-modal-title">Send SOS Alert</div>
                    <div className="moja-sos-modal-sub">Admin will be notified immediately</div>
                  </div>
                  <button className="moja-sos-x" onClick={closeSOS} aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="moja-sos-modal-body">
                  <div className="moja-sos-field">
                    <label className="moja-sos-label">Your name <span className="moja-hint">(optional if already entered)</span></label>
                    <input
                      type="text"
                      className="moja-input"
                      placeholder={staffName.trim() ? staffName : 'Your full name'}
                      value={sos.name}
                      onChange={e => setSos(s => ({ ...s, name: e.target.value }))}
                    />
                  </div>
                  <div className="moja-sos-field">
                    <label className="moja-sos-label">Location <span className="moja-required">*</span></label>
                    <input
                      type="text"
                      className={`moja-input${sosLocationError ? ' moja-input-error' : ''}`}
                      placeholder="e.g. Room 3, Main hallway, Parking lot"
                      value={sos.location}
                      onChange={e => { setSos(s => ({ ...s, location: e.target.value })); if (e.target.value.trim()) setSosLocationError(false); }}
                    />
                    {sosLocationError && <p className="moja-inline-error">Please enter a location.</p>}
                  </div>
                  <div className="moja-sos-field">
                    <label className="moja-sos-label">Additional info <span className="moja-hint">(optional)</span></label>
                    <textarea
                      className="moja-textarea"
                      style={{ minHeight: 76 }}
                      placeholder="Briefly describe what's happening..."
                      value={sos.note}
                      onChange={e => setSos(s => ({ ...s, note: e.target.value }))}
                    />
                  </div>
                  {sosSendError && <p className="moja-submit-error">{sosSendError}</p>}
                  <button className="moja-sos-send-btn" disabled={sosSending} onClick={sendSOS}>
                    {sosSending ? 'Sending...' : 'Send SOS Now'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
