import { useState, useEffect, useRef, useCallback } from 'react';
import emailjs from '@emailjs/browser';

emailjs.init('bMB4o-cBjiQ1vODli');
const SVC = 'service_y6hfvxk';
const TPL = 'template_qktlb8f';
const ADMIN = 'hello@mojakids.com';

type Screen = 'name' | 'type' | 'headsup' | 'moment' | 'thanks';
type SubmissionType = 'headsup' | 'moment' | 'both' | '';
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

const STANDALONE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Moja Heads Up Form</title>
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"><\/script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Quicksand:wght@400;500;600&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Quicksand', sans-serif; background: #f5ede0; min-height: 100vh; }
.screen { display: none; }
.screen.active { display: flex; flex-direction: column; min-height: 100vh; }
.header { background: #2d5d7b; padding: 24px 32px; display: flex; align-items: center; gap: 16px; }
.logo-mark { width: 52px; height: 52px; border-radius: 50%; background: #f4a158; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.logo-mark svg { width: 28px; height: 28px; }
.header-text h1 { font-family: 'Playfair Display', serif; font-size: 22px; color: #fcf1e3; font-weight: 600; letter-spacing: 0.3px; }
.header-text p { font-family: 'Quicksand', sans-serif; font-size: 13px; color: #bbd4ce; margin-top: 2px; font-weight: 500; }
.header-moment { background: #3d2b1f; }
.header-moment .logo-mark { background: #f4a158; }
.header-moment .header-text p { color: #f4a158; opacity: 0.8; }
.content { flex: 1; padding: 32px; max-width: 680px; margin: 0 auto; width: 100%; }
.welcome-content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 32px; text-align: center; }
.welcome-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #f4a158; margin-bottom: 12px; }
.welcome-title { font-family: 'Playfair Display', serif; font-size: 32px; color: #2d5d7b; font-weight: 600; margin-bottom: 12px; line-height: 1.3; }
.welcome-sub { font-size: 15px; color: #7a8e97; line-height: 1.7; max-width: 420px; margin: 0 auto 36px; }
.name-input-wrap { width: 100%; max-width: 400px; margin: 0 auto; }
.name-input-wrap input { width: 100%; padding: 16px 20px; border: 1.5px solid #bbd4ce; border-radius: 12px; font-family: 'Quicksand', sans-serif; font-size: 16px; font-weight: 500; background: #fff; color: #2d2d2d; text-align: center; margin-bottom: 16px; transition: border-color 0.2s; }
.name-input-wrap input:focus { outline: none; border-color: #2d5d7b; }
.name-input-wrap input::placeholder { color: #b0bec5; }
.btn-primary { width: 100%; padding: 16px; background: #2d5d7b; color: #fcf1e3; border: none; border-radius: 12px; font-family: 'Quicksand', sans-serif; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; letter-spacing: 0.3px; }
.btn-primary:hover { background: #1e4560; }
.btn-primary:disabled { background: #a8c4d0; cursor: not-allowed; }
.btn-secondary { padding: 13px 24px; background: transparent; color: #2d5d7b; border: 1.5px solid #bbd4ce; border-radius: 10px; font-family: 'Quicksand', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.btn-secondary:hover { background: #eef4f8; border-color: #2d5d7b; }
.btn-orange { background: #f4a158 !important; color: #fff !important; }
.btn-orange:hover { background: #e08840 !important; }
.type-grid { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
.type-card { background: #fff; border: 1.5px solid #dde8e4; border-radius: 16px; padding: 20px 24px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 18px; }
.type-card:hover { border-color: #2d5d7b; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(45,93,123,0.08); }
.type-card.selected { border-color: #2d5d7b; background: #eef4f8; }
.type-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.icon-headsup { background: #fdeee8; }
.icon-moment { background: #fdf6e8; }
.icon-both { background: #eef4f8; }
.type-card-text h3 { font-family: 'Playfair Display', serif; font-size: 17px; color: #2d5d7b; margin-bottom: 3px; }
.type-card-text p { font-size: 13px; color: #7a8e97; line-height: 1.5; }
.field-group { margin-bottom: 24px; }
.field-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #2d5d7b; margin-bottom: 8px; }
.field-hint { font-size: 11px; color: #a0b0b8; font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 6px; }
.required { color: #f4a158; }
input[type="text"], textarea { width: 100%; padding: 13px 16px; border: 1.5px solid #dde8e4; border-radius: 10px; font-family: 'Quicksand', sans-serif; font-size: 15px; font-weight: 500; background: #fff; color: #2d2d2d; transition: border-color 0.2s; -webkit-appearance: none; }
input[type="text"]:focus, textarea:focus { outline: none; border-color: #2d5d7b; }
textarea { resize: vertical; min-height: 96px; line-height: 1.6; }
.chip-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 9px 16px; border: 1.5px solid #dde8e4; border-radius: 24px; font-family: 'Quicksand', sans-serif; font-size: 14px; font-weight: 500; background: #fff; color: #4a6b7a; cursor: pointer; transition: all 0.15s; user-select: none; }
.chip:hover { border-color: #2d5d7b; color: #2d5d7b; }
.chip.selected { background: #2d5d7b; color: #fcf1e3; border-color: #2d5d7b; }
.urgency-grid { display: flex; flex-direction: column; gap: 10px; }
.urgency-card { background: #fff; border: 1.5px solid #dde8e4; border-radius: 12px; padding: 14px 18px; cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.15s; }
.urgency-card:hover { border-color: #2d5d7b; }
.urgency-card.sel-red { border-color: #c0392b; background: #fdf2f1; }
.urgency-card.sel-yellow { border-color: #e67e22; background: #fdf7f0; }
.urgency-card.sel-green { border-color: #27ae60; background: #f0faf4; }
.u-dot { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; }
.u-red { background: #c0392b; }
.u-yellow { background: #e67e22; }
.u-green { background: #27ae60; }
.u-label { font-size: 14px; font-weight: 600; color: #2d2d2d; }
.u-desc { font-size: 12px; color: #888; margin-top: 2px; }
.followup-grid { display: flex; gap: 10px; }
.followup-btn { flex: 1; padding: 12px 16px; text-align: center; border: 1.5px solid #dde8e4; border-radius: 10px; background: #fff; color: #4a6b7a; font-family: 'Quicksand', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.followup-btn.selected { background: #2d5d7b; color: #fcf1e3; border-color: #2d5d7b; }
.upload-area { border: 1.5px dashed #bbd4ce; border-radius: 12px; background: #fff; padding: 20px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
.upload-area:hover { border-color: #2d5d7b; }
.upload-icon { margin-bottom: 8px; }
.upload-area p { font-size: 13px; color: #a0b0b8; font-weight: 500; }
.file-name { font-size: 12px; color: #2d5d7b; margin-top: 6px; font-weight: 600; }
.file-preview img { max-width: 100%; max-height: 180px; border-radius: 8px; margin-top: 10px; }
.section-head { font-family: 'Playfair Display', serif; font-size: 18px; color: #2d5d7b; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f4a158; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.error-msg { font-size: 12px; color: #c0392b; margin-top: 6px; font-weight: 500; }
.btn-row { display: flex; gap: 12px; margin-top: 8px; align-items: center; }
.submit-error { font-size: 13px; color: #c0392b; margin-top: 10px; font-weight: 500; }
.thanks-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 48px 32px; background: #f5ede0; }
.thanks-circle { width: 80px; height: 80px; border-radius: 50%; background: #2d5d7b; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
.thanks-circle svg { width: 36px; height: 36px; stroke: #fcf1e3; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.thanks-wrap h2 { font-family: 'Playfair Display', serif; font-size: 28px; color: #2d5d7b; margin-bottom: 10px; }
.thanks-wrap p { font-size: 15px; color: #7a8e97; line-height: 1.6; max-width: 360px; margin: 0 auto; }
.countdown { font-size: 13px; color: #b0bec5; margin-top: 24px; font-weight: 500; }
@media (max-width: 600px) { .content { padding: 20px 16px; } .two-col { grid-template-columns: 1fr; } .welcome-title { font-size: 26px; } }
<\/style>
<\/head>
<body>
<div id="screen-name" class="screen active">
  <div class="header">
    <div class="logo-mark"><svg viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#fff" stroke-width="1.5"/><path d="M8 19V10l6 6 6-6v9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><\/svg><\/div>
    <div class="header-text"><h1>Moja Behavioral Services<\/h1><p>Staff Communication Form<\/p><\/div>
  <\/div>
  <div class="welcome-content">
    <p class="welcome-eyebrow">Moja Kids Staff Portal<\/p>
    <h2 class="welcome-title">How are things going today?<\/h2>
    <p class="welcome-sub">Share a heads up or celebrate a Moja Moment. Your voice helps us grow together.<\/p>
    <div class="name-input-wrap">
      <input type="text" id="staff-name" placeholder="Enter your full name" autocomplete="off" />
      <span id="name-error" style="display:none; text-align:center; margin-top:-10px; margin-bottom:12px; font-size:12px; color:#c0392b; font-weight:500;">Please enter your name to continue.<\/span>
      <button class="btn-primary" onclick="goToTypeSelect()">Get Started<\/button>
    <\/div>
  <\/div>
<\/div>
<div id="screen-type" class="screen">
  <div class="header">
    <div class="logo-mark"><svg viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#fff" stroke-width="1.5"/><path d="M8 19V10l6 6 6-6v9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><\/svg><\/div>
    <div class="header-text"><h1>Moja Behavioral Services<\/h1><p>Staff Communication Form<\/p><\/div>
  <\/div>
  <div class="content" style="padding-top:36px;">
    <p style="font-size:15px;color:#7a8e97;margin-bottom:24px;">Hi <span id="name-display" style="color:#2d5d7b;font-weight:600;"><\/span>, what would you like to share?<\/p>
    <div class="type-grid">
      <div class="type-card" id="card-headsup" onclick="selectType('headsup')"><div class="type-icon icon-headsup"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e07040" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/><\/svg><\/div><div class="type-card-text"><h3>Heads Up<\/h3><p>Flag something that needs attention — a concern, challenge, or area for improvement.<\/p><\/div><\/div>
      <div class="type-card" id="card-moment" onclick="selectType('moment')"><div class="type-icon icon-moment"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c49a20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><\/svg><\/div><div class="type-card-text"><h3>Moja Moment<\/h3><p>Celebrate a highlight, win, or something meaningful that happened today.<\/p><\/div><\/div>
      <div class="type-card" id="card-both" onclick="selectType('both')"><div class="type-icon icon-both"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d5d7b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/><\/svg><\/div><div class="type-card-text"><h3>Both<\/h3><p>I have a Heads Up and a Moja Moment to share.<\/p><\/div><\/div>
    <\/div>
    <button class="btn-secondary" onclick="show('screen-name')">Back<\/button>
  <\/div>
<\/div>
<div id="screen-headsup" class="screen">
  <div class="header"><div class="logo-mark"><svg viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#fff" stroke-width="1.5"/><path d="M8 19V10l6 6 6-6v9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><\/svg><\/div><div class="header-text"><h1>Heads Up<\/h1><p>Flag something for the team<\/p><\/div><\/div>
  <div class="content">
    <div class="field-group"><div class="section-head">Category<\/div><div class="chip-wrap" id="category-chips"><div class="chip" onclick="selectChip(this,'category')">Client / Session<\/div><div class="chip" onclick="selectChip(this,'category')">Environment / Room<\/div><div class="chip" onclick="selectChip(this,'category')">Team / Staffing<\/div><div class="chip" onclick="selectChip(this,'category')">Schedule / Time<\/div><div class="chip" onclick="selectChip(this,'category')">Payroll / Admin<\/div><div class="chip" onclick="selectChip(this,'category')">Materials / Supplies<\/div><div class="chip" onclick="selectChip(this,'category')">Tech / Data<\/div><div class="chip" onclick="selectChip(this,'category')">Not sure<\/div><\/div><div id="category-error" style="display:none" class="error-msg">Please select a category.<\/div><\/div>
    <div class="field-group"><div class="section-head">What was impacted?<\/div><div class="chip-wrap" id="impact-chips"><div class="chip" onclick="selectChip(this,'impact')">Client experience<\/div><div class="chip" onclick="selectChip(this,'impact')">Session flow<\/div><div class="chip" onclick="selectChip(this,'impact')">Safety<\/div><div class="chip" onclick="selectChip(this,'impact')">Team workflow<\/div><div class="chip" onclick="selectChip(this,'impact')">Environment<\/div><div class="chip" onclick="selectChip(this,'impact')">Scheduling<\/div><div class="chip" onclick="selectChip(this,'impact')">Other<\/div><\/div><div id="impact-error" style="display:none" class="error-msg">Please select what was impacted.<\/div><\/div>
    <div class="field-group"><div class="section-head">Who's involved?<\/div><div class="two-col"><div><label class="field-label">Staff<\/label><input type="text" id="involved-staff" placeholder="Staff name(s)" /></div><div><label class="field-label">Client <span class="field-hint">(initials only)<\/span><\/label><input type="text" id="involved-client" placeholder="e.g. J.D., M.L." /></div><\/div><\/div>
    <div class="field-group"><label class="field-label">What's the heads up? <span class="required">*<\/span><\/label><textarea id="headsup-text" placeholder="Describe what happened or what you noticed..."><\/textarea><div id="headsup-text-error" style="display:none" class="error-msg">Please describe the situation.<\/div><\/div>
    <div class="field-group"><label class="field-label">Photo <span class="field-hint">(optional)<\/span><\/label><div class="upload-area" onclick="document.getElementById('photo-upload').click()"><div class="upload-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbd4ce" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/><\/svg><\/div><p>Tap to attach a photo<\/p><div id="file-preview"><\/div><\/div><input type="file" id="photo-upload" accept="image/*" style="display:none" onchange="handlePhoto(this)" /></div>
    <div class="field-group"><label class="field-label">What would improve this?<\/label><textarea id="improvement-text" placeholder="Any ideas or suggestions..." style="min-height:80px;"><\/textarea><\/div>
    <div class="field-group"><div class="section-head">Urgency<\/div><div class="urgency-grid"><div class="urgency-card" id="u-red" onclick="selectUrgency('red')"><div class="u-dot u-red"><\/div><div><div class="u-label">Red — Stop and act immediately<\/div><div class="u-desc">Safety concern or issue requiring immediate action<\/div><\/div><\/div><div class="urgency-card" id="u-yellow" onclick="selectUrgency('yellow')"><div class="u-dot u-yellow"><\/div><div><div class="u-label">Yellow — Address within the week<\/div><div class="u-desc">Important but not immediately urgent<\/div><\/div><\/div><div class="urgency-card" id="u-green" onclick="selectUrgency('green')"><div class="u-dot u-green"><\/div><div><div class="u-label">Green — Not stopping anything<\/div><div class="u-desc">Low urgency, address when convenient<\/div><\/div><\/div><\/div><div id="urgency-error" style="display:none" class="error-msg">Please select an urgency level.<\/div><\/div>
    <div class="field-group"><label class="field-label">Would you like follow-up?<\/label><div class="followup-grid"><div class="followup-btn" id="fu-yes" onclick="selectFollowup('yes')">Yes, please follow up<\/div><div class="followup-btn" id="fu-no" onclick="selectFollowup('no')">No follow-up needed<\/div><\/div><\/div>
    <div class="btn-row"><button class="btn-secondary" onclick="show('screen-type')">Back<\/button><button class="btn-primary" onclick="submitHeadsUp()" id="btn-submit-hu">Submit Heads Up<\/button><\/div>
    <div id="err-hu" style="display:none" class="submit-error"><\/div>
  <\/div>
<\/div>
<div id="screen-moment" class="screen">
  <div class="header header-moment"><div class="logo-mark"><svg viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#fff" stroke-width="1.5"/><path d="M8 19V10l6 6 6-6v9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><\/svg><\/div><div class="header-text"><h1>Moja Moment<\/h1><p>Share something worth celebrating<\/p><\/div><\/div>
  <div class="content" style="padding-top:32px;">
    <p style="font-size:13px;color:#a0b0b8;font-style:italic;margin-bottom:28px;line-height:1.6;">Use client initials only to protect privacy (e.g. Fi.La.)<\/p>
    <div class="field-group"><label class="field-label">Client initials<\/label><input type="text" id="moment-client" placeholder="e.g. Fi.La., J.D." /></div>
    <div class="field-group"><label class="field-label">Staff involved <span class="field-hint">(optional)<\/span><\/label><input type="text" id="moment-staff" placeholder="Staff name(s)" /></div>
    <div class="field-group"><label class="field-label">What happened? <span class="required">*<\/span> <span class="field-hint">1–3 sentences<\/span><\/label><textarea id="moment-text" placeholder="Describe the moment in 1–3 sentences..." style="min-height:120px;"><\/textarea><div id="moment-text-error" style="display:none" class="error-msg">Please describe the Moja Moment.<\/div><\/div>
    <div class="btn-row"><button class="btn-secondary" onclick="show('screen-type')">Back<\/button><button class="btn-primary btn-orange" onclick="submitMoment()" id="btn-submit-mm">Submit Moja Moment<\/button><\/div>
    <div id="err-mm" style="display:none" class="submit-error"><\/div>
  <\/div>
<\/div>
<div id="screen-thanks" class="screen">
  <div class="header"><div class="logo-mark"><svg viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#fff" stroke-width="1.5"/><path d="M8 19V10l6 6 6-6v9" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><\/svg><\/div><div class="header-text"><h1>Moja Behavioral Services<\/h1><p>Staff Communication Form<\/p><\/div><\/div>
  <div class="thanks-wrap"><div class="thanks-circle"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"><\/polyline><\/svg><\/div><h2 id="thanks-title">Thank you!<\/h2><p id="thanks-msg">Your submission has been sent.<\/p><div class="countdown" id="countdown"><\/div><\/div>
<\/div>
<script>
emailjs.init("bMB4o-cBjiQ1vODli");
const SVC="service_y6hfvxk",TPL="template_qktlb8f",ADMIN="hello@mojakids.com";
let S={name:"",type:"",hu:{category:"",impact:"",staff:"",client:"",text:"",improvement:"",urgency:"",followup:"",photoB64:"",photoName:""},mm:{client:"",staff:"",text:""}};
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');window.scrollTo(0,0);}
function goToTypeSelect(){const n=document.getElementById('staff-name').value.trim();const err=document.getElementById('name-error');if(!n){err.style.display='block';return;}err.style.display='none';S.name=n;document.getElementById('name-display').textContent=n.split(' ')[0];show('screen-type');}
function selectType(t){document.querySelectorAll('.type-card').forEach(c=>c.classList.remove('selected'));document.getElementById('card-'+t).classList.add('selected');S.type=t;setTimeout(()=>{show(t==='moment'?'screen-moment':'screen-headsup');},160);}
function selectChip(el,g){el.closest('.chip-wrap').querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));el.classList.add('selected');S.hu[g]=el.textContent.trim();document.getElementById(g+'-error').style.display='none';}
function selectUrgency(l){['red','yellow','green'].forEach(x=>{document.getElementById('u-'+x).className='urgency-card';});document.getElementById('u-'+l).classList.add('sel-'+l);S.hu.urgency=l;document.getElementById('urgency-error').style.display='none';}
function selectFollowup(v){document.getElementById('fu-yes').classList.toggle('selected',v==='yes');document.getElementById('fu-no').classList.toggle('selected',v==='no');S.hu.followup=v;}
function handlePhoto(input){const f=input.files[0];if(!f)return;S.hu.photoName=f.name;const r=new FileReader();r.onload=e=>{S.hu.photoB64=e.target.result;document.getElementById('file-preview').innerHTML='<img src="'+e.target.result+'"/><p class="file-name">'+f.name+'<\/p>';};r.readAsDataURL(f);}
function validateHU(){let ok=true;if(!S.hu.category){document.getElementById('category-error').style.display='block';ok=false;}if(!S.hu.impact){document.getElementById('impact-error').style.display='block';ok=false;}const t=document.getElementById('headsup-text').value.trim();if(!t){document.getElementById('headsup-text-error').style.display='block';ok=false;}else{S.hu.text=t;}if(!S.hu.urgency){document.getElementById('urgency-error').style.display='block';ok=false;}S.hu.staff=document.getElementById('involved-staff').value.trim();S.hu.client=document.getElementById('involved-client').value.trim();S.hu.improvement=document.getElementById('improvement-text').value.trim();return ok;}
function uLabel(u){return u==='red'?'RED — Act immediately':u==='yellow'?'YELLOW — Within the week':'GREEN — Not urgent';}
async function submitHeadsUp(){if(!validateHU())return;const btn=document.getElementById('btn-submit-hu');btn.disabled=true;btn.textContent='Sending...';const p={to_email:ADMIN,submission_type:"Heads Up",staff_name:S.name,category:S.hu.category,impact:S.hu.impact,involved_staff:S.hu.staff||'—',involved_client:S.hu.client||'—',headsup_text:S.hu.text,improvement:S.hu.improvement||'—',urgency:uLabel(S.hu.urgency),followup:S.hu.followup==='yes'?'Yes — follow up requested':'No follow-up needed',moment_client:'—',moment_staff:'—',moment_text:'—',photo_name:S.hu.photoName||'No photo',photo_data:S.hu.photoB64||''};try{await emailjs.send(SVC,TPL,p);if(S.type==='both'){show('screen-moment');btn.disabled=false;btn.textContent='Submit Heads Up';}else{showThanks("Heads Up submitted!","Sent to hello@mojakids.com — it'll be routed to the right person.");}}catch(e){document.getElementById('err-hu').textContent='Send failed: '+(e.text||e);document.getElementById('err-hu').style.display='block';btn.disabled=false;btn.textContent='Submit Heads Up';}}
async function submitMoment(){const t=document.getElementById('moment-text').value.trim();if(!t){document.getElementById('moment-text-error').style.display='block';return;}document.getElementById('moment-text-error').style.display='none';S.mm.client=document.getElementById('moment-client').value.trim();S.mm.staff=document.getElementById('moment-staff').value.trim();S.mm.text=t;const btn=document.getElementById('btn-submit-mm');btn.disabled=true;btn.textContent='Sending...';const p={to_email:ADMIN,submission_type:"Moja Moment",staff_name:S.name,category:'—',impact:'—',involved_staff:S.mm.staff||'—',involved_client:S.mm.client||'—',headsup_text:'—',improvement:'—',urgency:'—',followup:'—',moment_client:S.mm.client||'—',moment_staff:S.mm.staff||'—',moment_text:S.mm.text,photo_name:'No photo',photo_data:''};try{await emailjs.send(SVC,TPL,p);showThanks("Moja Moment shared!","Sent to hello@mojakids.com. Thank you for celebrating your team.");}catch(e){document.getElementById('err-mm').textContent='Send failed: '+(e.text||e);document.getElementById('err-mm').style.display='block';btn.disabled=false;btn.textContent='Submit Moja Moment';}}
function showThanks(title,msg){document.getElementById('thanks-title').textContent=title;document.getElementById('thanks-msg').textContent=msg;show('screen-thanks');let c=8;const el=document.getElementById('countdown');el.textContent='Resetting in 8 seconds...';const t=setInterval(()=>{c--;el.textContent='Resetting in '+c+' second'+(c!==1?'s':'')+'...';if(c<=0){clearInterval(t);reset();}},1000);}
function reset(){S={name:"",type:"",hu:{category:"",impact:"",staff:"",client:"",text:"",improvement:"",urgency:"",followup:"",photoB64:"",photoName:""},mm:{client:"",staff:"",text:""}};['staff-name','headsup-text','improvement-text','involved-staff','involved-client','moment-text','moment-client','moment-staff'].forEach(id=>document.getElementById(id).value='');document.getElementById('file-preview').innerHTML='';document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));document.querySelectorAll('.urgency-card').forEach(c=>c.className='urgency-card');document.querySelectorAll('.followup-btn').forEach(b=>b.classList.remove('selected'));document.querySelectorAll('.type-card').forEach(c=>c.classList.remove('selected'));['btn-submit-hu','btn-submit-mm'].forEach(id=>{const b=document.getElementById(id);b.disabled=false;b.textContent=id.includes('hu')?'Submit Heads Up':'Submit Moja Moment';});show('screen-name');}
<\/script>
<\/body>
<\/html>`;

function downloadHTML() {
  const blob = new Blob([STANDALONE_HTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'moja-staff-form.html';
  a.click();
  URL.revokeObjectURL(url);
}

function Header({ title, subtitle, dark, showDownload }: { title: string; subtitle: string; dark?: boolean; showDownload?: boolean }) {
  return (
    <div className={`moja-header${dark ? ' moja-header-moment' : ''}`}>
      <div className="moja-logo-container">
        <img src="/MOJA+Behavioral_(1).png" alt="Moja Behavioral Services" className="moja-logo-img" />
      </div>
      <div style={{ flex: 1 }}>
        <div className="moja-header-title">{title}</div>
        <div className="moja-header-sub">{subtitle}</div>
      </div>
      {showDownload && (
        <button className="moja-download-btn" onClick={downloadHTML} title="Download standalone HTML file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('name');
  const [staffName, setStaffName] = useState('');
  const [nameError, setNameError] = useState(false);
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
    setNameError(false);
    setSubmissionType('');
    setHu({ category: '', impact: '', staff: '', client: '', text: '', improvement: '', urgency: '', followup: '', photoB64: '', photoName: '' });
    setHuErrors({ category: false, impact: false, text: false, urgency: false });
    setHuSubmitError('');
    setPhotoPreview('');
    setMm({ client: '', staff: '', text: '' });
    setMmTextError(false);
    setMmSubmitError('');
    show('name');
  }

  function goToTypeSelect() {
    if (!staffName.trim()) { setNameError(true); return; }
    setNameError(false);
    show('type');
  }

  function selectType(t: SubmissionType) {
    setSubmissionType(t);
    setTimeout(() => show(t === 'moment' ? 'moment' : 'headsup'), 160);
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
    const p = {
      to_email: ADMIN, submission_type: 'Heads Up', staff_name: staffName,
      category: hu.category, impact: hu.impact,
      involved_staff: hu.staff || '—', involved_client: hu.client || '—',
      headsup_text: hu.text, improvement: hu.improvement || '—',
      urgency: uLabel(hu.urgency),
      followup: hu.followup === 'yes' ? 'Yes — follow up requested' : 'No follow-up needed',
      moment_client: '—', moment_staff: '—', moment_text: '—',
      photo_name: hu.photoName || 'No photo', photo_data: hu.photoB64 || '',
    };
    try {
      await emailjs.send(SVC, TPL, p);
      if (submissionType === 'both') { show('moment'); }
      else { setThanksTitle('Heads Up submitted!'); setThanksMsg("Sent to hello@mojakids.com — it'll be routed to the right person."); show('thanks'); }
    } catch (err: unknown) {
      setHuSubmitError('Send failed: ' + ((err as { text?: string })?.text || String(err)));
    } finally { setHuSubmitting(false); }
  }

  async function submitMoment() {
    if (!mm.text.trim()) { setMmTextError(true); return; }
    setMmTextError(false);
    setMmSubmitting(true);
    setMmSubmitError('');
    const p = {
      to_email: ADMIN, submission_type: 'Moja Moment', staff_name: staffName,
      category: '—', impact: '—', involved_staff: mm.staff || '—', involved_client: mm.client || '—',
      headsup_text: '—', improvement: '—', urgency: '—', followup: '—',
      moment_client: mm.client || '—', moment_staff: mm.staff || '—', moment_text: mm.text,
      photo_name: 'No photo', photo_data: '',
    };
    try {
      await emailjs.send(SVC, TPL, p);
      setThanksTitle('Moja Moment shared!');
      setThanksMsg('Sent to hello@mojakids.com. Thank you for celebrating your team.');
      show('thanks');
    } catch (err: unknown) {
      setMmSubmitError('Send failed: ' + ((err as { text?: string })?.text || String(err)));
    } finally { setMmSubmitting(false); }
  }

  async function sendSOS() {
    if (!sos.location.trim()) { setSosLocationError(true); return; }
    setSosLocationError(false);
    setSosSending(true);
    setSosSendError('');
    const senderName = sos.name.trim() || staffName.trim() || 'Unknown staff';
    const p = {
      to_email: ADMIN,
      submission_type: 'SOS — URGENT HELP NEEDED',
      staff_name: senderName,
      category: 'EMERGENCY',
      impact: 'Safety',
      involved_staff: senderName,
      involved_client: '—',
      headsup_text: `LOCATION: ${sos.location.trim()}${sos.note.trim() ? `\n\nADDITIONAL INFO: ${sos.note.trim()}` : ''}`,
      improvement: '—',
      urgency: 'RED — IMMEDIATE HELP NEEDED',
      followup: 'Yes — follow up immediately',
      moment_client: '—',
      moment_staff: '—',
      moment_text: '—',
      photo_name: 'No photo',
      photo_data: '',
    };
    try {
      await emailjs.send(SVC, TPL, p);
      setSosSent(true);
    } catch (err: unknown) {
      setSosSendError('Failed to send: ' + ((err as { text?: string })?.text || String(err)));
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

  return (
    <div className="moja-app">

      {screen === 'name' && (
        <div className="moja-screen">
          <Header title="Moja Behavioral Services" subtitle="Staff Communication Form" showDownload />
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
                  value={staffName}
                  onChange={e => { setStaffName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                  onKeyDown={e => e.key === 'Enter' && goToTypeSelect()}
                />
                {nameError && <p className="moja-inline-error" style={{ textAlign: 'center', marginTop: '-10px', marginBottom: 12 }}>Please enter your name to continue.</p>}
                <button className="moja-btn-primary" onClick={goToTypeSelect}>Get Started</button>
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
              {[
                { id: 'headsup' as const, label: 'Heads Up', desc: 'Flag something that needs attention — a concern, challenge, or area for improvement.', bg: '#fce9df',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e66d38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
                { id: 'moment' as const, label: 'Moja Moment', desc: 'Celebrate a highlight, win, or something meaningful that happened today.', bg: '#fef7d6',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8a000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
                { id: 'both' as const, label: 'Both', desc: 'I have a Heads Up and a Moja Moment to share.', bg: '#ddf4f2',
                  icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3aa89e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
              ].map(({ id, label, desc, bg, icon }) => (
                <div key={id} className={`moja-type-card${submissionType === id ? ' selected' : ''}`} onClick={() => selectType(id)}>
                  <div className="moja-type-icon" style={{ background: bg }}>{icon}</div>
                  <div className="moja-type-card-text">
                    <h3>{label}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
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
              <textarea className="moja-textarea" placeholder="Describe what happened or what you noticed..."
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
              <textarea className="moja-textarea" style={{ minHeight: 80 }} placeholder="Any ideas or suggestions..."
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
              <textarea className="moja-textarea" style={{ minHeight: 120 }} placeholder="Describe the moment in 1–3 sentences..."
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
