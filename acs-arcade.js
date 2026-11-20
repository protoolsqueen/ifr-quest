/* IFR QUEST / ACS Arcade v1.0. Original games. The optional six-pack is the
 * unmodified MPL-2.0 Open Aviation Components web component; attribution in UI.
 * This is a conceptual study game, not a procedure or aircraft-specific trainer.
 */
(() => {
  'use strict';
  const cockpit = document.getElementById('view-cockpit');
  if (!cockpit) return;
  const KEY = 'ifrQuestArcadeV1';
  const CODES = ['IR.I.C.K2', 'IR.VI.A.K1', 'IR.VI.B.K1', 'IR.VII.D.K2'];
  const TITLES = ['ALTITUDE RUN', 'RNAV DECODE', 'GLIDESLOPE LOCK', 'FAILURE DETECTIVE'];
  const LABELS = ['Clearance + route factors', 'LP versus LNAV', 'Precision approach', 'Instrument failure modes'];
  const SCENARIOS = [
    [
      { obstacle: 6300, mountain: false, wind: '22 kt headwind at 8,000 ft', glide: '12 NM to nearest suitable field', oxygen: 'No supplemental oxygen available' },
      { obstacle: 5400, mountain: true, wind: '40 kt tailwind aloft', glide: 'Terrain rising toward the destination', oxygen: 'Check oxygen requirements above 12,500 ft MSL' },
      { obstacle: 7100, mountain: false, wind: 'Strong headwind above 9,000 ft', glide: 'Nearest suitable airport 18 NM away', oxygen: 'Confirm aircraft ceiling and oxygen before climbing' }
    ],
    [
      { mode: 'LNAV', lnav: 740, lp: 620, note: 'Receiver annunciates LNAV, even though the approach plate publishes LP minima.' },
      { mode: 'LP', lnav: 780, lp: 640, note: 'LP is active. Both LP and LNAV are lateral-only, non-precision minima.' },
      { mode: 'LNAV', lnav: 860, lp: 700, note: 'LP guidance is unavailable. The navigator correctly reverted to LNAV.' }
    ],
    [
      { gs: 80, equipment: 'normal' },
      { gs: 100, equipment: 'approachLights' },
      { gs: 120, equipment: 'normal' }
    ],
    [
      { kind: 'pitot', symptom: 'Airspeed stops responding while altitude and vertical-speed indications behave normally.', fix: 'pitot', title: 'THE FROZEN SPEED TAPE', expl: 'Pitot blockage or failure can make airspeed unreliable. Cross-check attitude, power, other air data and the aircraft-specific procedure.' },
      { kind: 'static', symptom: 'Altimeter freezes and VSI trends toward zero during an actual climb; airspeed may also be erroneous.', fix: 'static', title: 'THE STATIC TRAP', expl: 'A blocked static source can affect altimeter, VSI and airspeed. Verify with other sources and use the approved alternate-static procedure if equipped.' },
      { kind: 'gyro', symptom: 'Attitude and directional indications begin drifting together while independent pitot-static readings remain plausible.', fix: 'gyro', title: 'THE DRIFTING HORIZON', expl: 'Loss of a shared vacuum/gyro source can make heading and attitude indications unreliable. Cross-check independent standby instruments.' }
    ]
  ];
  const read = () => { try { const value = JSON.parse(localStorage.getItem(KEY) || '{}'); return { cleared: value.cleared && typeof value.cleared === 'object' ? value.cleared : {}, bestStreak: Number(value.bestStreak) || 0, totalCorrect: Number(value.totalCorrect) || 0 }; } catch { return { cleared: {}, bestStreak: 0, totalCorrect: 0 }; } };
  const progress = read();
  const state = { mission: 0, round: 0, choice: '', secondary: '', altitude: 0, rate: 400, hint: false, graded: false, correct: false, streak: 0, feedback: '', startMs: 0, componentReady: false };
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const scenario = () => SCENARIOS[state.mission][state.round];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const selected = (value) => state.choice === value ? ' aria-pressed="true" class="arc-pick is-active"' : ' aria-pressed="false" class="arc-pick"';
  const missionScore = index => SCENARIOS[index].filter((_, i) => progress.cleared[`${CODES[index]}:${i}`]).length;
  const totalCleared = () => CODES.reduce((sum, _, i) => sum + missionScore(i), 0);
  const syncLog = (event, data) => { try { if (typeof logEvent === 'function') logEvent(event, data); } catch {} };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch {} };
  const shell = document.createElement('div');
  shell.id = 'acsArcade'; shell.className = 'arcade';
  const heading = cockpit.querySelector('.cockpit-heading p');
  if (heading) heading.textContent = 'Four real ACS knowledge targets. Twelve tactile rounds. Read the scene, move the controls, lock your decision, and learn why.';
  cockpit.querySelector('.cockpit-heading')?.insertAdjacentElement('afterend', shell);
  function roundReset() {
    const data = scenario(); state.choice = ''; state.secondary = ''; state.hint = false;
    state.graded = false; state.correct = false; state.feedback = ''; state.startMs = performance.now();
    state.altitude = data.obstacle ? data.obstacle + (data.mountain ? 1300 : 400) : 0;
    state.rate = data.gs ? Math.round(data.gs * 4.1 / 10) * 10 : 400;
  }
  function nav() { return `<div class="arc-missions" role="group" aria-label="ACS mission selection">${CODES.map((code, index) => `<button type="button" data-mission="${index}" class="arc-tab ${state.mission === index ? 'active' : ''}" aria-pressed="${state.mission === index}"><small>${String(index + 1).padStart(2,'0')} · ${esc(code)}</small><strong>${TITLES[index]}</strong><span>${missionScore(index)}/3 CLEARED</span></button>`).join('')}</div>`; }
  function altitudeUI(data) {
    const min = data.obstacle + (data.mountain ? 2000 : 1000);
    const low = data.obstacle - 400, high = min + 800;
    const altitudeY = clamp(215 - (state.altitude - low) / (high - low) * 166, 38, 215);
    const obstacleY = clamp(215 - (data.obstacle - low) / (high - low) * 166, 38, 215);
    return `<div class="arc-graphic arc-terrain"><div class="arc-graphic-label">SIMULATED ROUTE PROFILE · ${data.mountain ? 'DESIGNATED MOUNTAINOUS AREA' : 'NONMOUNTAINOUS AREA'}</div>
    <svg viewBox="0 0 640 250" role="img" aria-label="Terrain profile and selected altitude relative to the highest obstacle" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="arcMountain" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#536b7a"/><stop offset="1" stop-color="#12283c"/></linearGradient></defs>
    <path d="M0 218 L0 180 70 170 130 185 210 116 267 153 324 80 392 171 455 142 510 190 560 151 640 198 640 250 0 250Z" fill="url(#arcMountain)" stroke="#85b4c5" stroke-width="1.5"/>
    <path d="M0 230H640" stroke="#91b3c9" opacity=".35"/><path d="M0 ${obstacleY}H640" stroke="#ffb78b" stroke-dasharray="7 7" opacity=".7"/>
    <path id="arcAltLine" d="M0 ${altitudeY}H640" stroke="#9af8d0" stroke-width="3" stroke-dasharray="12 6"/><path d="M330 81l0 -22m-7 6h14" stroke="#ffd29a" stroke-width="3"/>
    <g transform="translate(465 ${altitudeY - 14})"><path d="M-26 0H17L31 8 17 11H-26L-40 8Z" fill="#e8faf9"/></g>
    <text x="12" y="23" font-size="14" font-weight="800" fill="#ffcb9d">OBSTACLE ${data.obstacle.toLocaleString()} FT</text>
    <text id="arcAltLabel" x="12" y="${altitudeY - 10}" font-size="15" font-weight="900" fill="#b8ffdf">SELECTED ${state.altitude.toLocaleString()} FT</text></svg>
    </div><div class="arc-brief-grid"><div><small>TERRAIN</small><strong>${data.mountain ? 'Mountainous' : 'Nonmountainous'}</strong></div><div><small>HIGHEST OBSTACLE</small><strong>${data.obstacle.toLocaleString()} FT MSL</strong></div><div><small>PLANNING FACTORS</small><strong>Wind · Glide · Oxygen</strong></div></div>
    <label class="arc-control-label" for="arcRange">MOVE THE ALTITUDE SELECTOR · FEET MSL</label><input id="arcRange" data-range="altitude" type="range" min="${low}" max="${high}" step="100" value="${state.altitude}" ${state.graded ? 'disabled' : ''}/>
    <div class="arc-range-ends"><span>${low.toLocaleString()} FT</span><strong id="arcRangeValue">${state.altitude.toLocaleString()} FT</strong><span>${high.toLocaleString()} FT</span></div>
    <div class="arc-telemetry"><span>${esc(data.wind)}</span><span>${esc(data.glide)}</span><span>${esc(data.oxygen)}</span></div>
    <p class="arc-fine">No published minimum altitude is supplied in this exercise. Set the minimum generic obstacle-clearance floor under 14 CFR 91.177; it is not an authorization to fly at that altitude.</p>`;
  }
  function navUI(data) {
    return `<div class="arc-graphic arc-rnav"><div class="arc-graphic-label">RNAV (GPS) RWY 27 · SYNTHETIC TRAINING PLATE</div>
    <div class="arc-avionics"><div class="arc-avionics-head"><span>GPS · APR</span><b>${data.mode}</b><span>DTK 270°</span></div>
    <div class="arc-cdi"><div class="arc-cdi-axis"></div><div class="arc-cdi-cross"></div><div class="arc-cdi-plane">▲</div><div class="arc-cdi-dots">●　●　│　●　●</div></div>
    <div class="arc-avionics-foot">LATERAL GUIDANCE ONLY <span>NO APPROVED VERTICAL GUIDANCE</span></div></div></div>
    <p class="arc-prompt">${esc(data.note)} Select the <strong>published minima matching the active mode</strong>.</p>
    <div class="arc-choices"><button type="button" data-choice="LP"${selected('LP')}>LP <strong>MDA ${data.lp} FT</strong><small>Angular lateral sensitivity</small></button>
    <button type="button" data-choice="LNAV"${selected('LNAV')}>LNAV <strong>MDA ${data.lnav} FT</strong><small>Lateral guidance</small></button>
    <button type="button" data-choice="LPV"${selected('LPV')}>LPV <strong>DA —</strong><small>Not available or published here</small></button></div>
    <p class="arc-fine">Numbers are invented for the training chart. Both LP and LNAV use a published MDA; LPV is a separate approach service with vertical guidance.</p>`;
  }
  function precisionUI(data) {
    const expected = Math.round(data.gs * 5.31 / 10) * 10;
    const offset = clamp((state.rate - expected) / 13, -44, 44);
    return `<div class="arc-graphic arc-ils"><div class="arc-graphic-label">ILS FINAL · 3° GLIDESLOPE · ${data.gs} KT GROUNDSPEED</div>
    <div class="arc-ils-contents"><div class="arc-loc" aria-label="Conceptual glideslope and localizer needles"><div class="arc-ils-markings"><span>·</span><span>·</span><span>+</span><span>·</span><span>·</span></div><div class="arc-ils-cross"></div><div class="arc-ils-vertical"></div><div id="arcGlideNeedle" class="arc-ils-horizontal" style="transform:translateY(${offset}px)"></div><div class="arc-ils-arrow">▲</div></div>
    <div class="arc-ils-numbers"><small>GS</small><strong>${data.gs} KT</strong><small>VS SELECTED</small><strong id="arcSelectedVs">${state.rate} FPM</strong><small>RULE OF THUMB</small><strong>GS × 5.3</strong></div></div></div>
    <label for="arcRange" class="arc-control-label">DIAL AN INITIAL DESCENT RATE</label><input id="arcRange" data-range="rate" type="range" min="300" max="900" step="10" value="${state.rate}" ${state.graded ? 'disabled' : ''}/>
    <div class="arc-range-ends"><span>300 FPM</span><strong id="arcRangeValue">${state.rate} FPM</strong><span>900 FPM</span></div>
    <p class="arc-prompt">${data.equipment === 'approachLights' ? 'The approach lights are NOTAMed inoperative. Which minimums action is appropriate?' : 'The ILS equipment is operating. Which statement describes the descent-rate estimate?'}</p>
    <div class="arc-choices"><button type="button" data-choice="chart"${selected('chart')}>${data.equipment === 'approachLights' ? 'Apply chart inoperative-lighting visibility notes' : 'The rate is an estimate; follow actual glideslope indications'}</button>
    <button type="button" data-choice="ignore"${selected('ignore')}>${data.equipment === 'approachLights' ? 'Use normal published visibility anyway' : 'Maintain a fixed rate even if glideslope differs'}</button></div>
    <p class="arc-fine">Conceptual needle movement only; not a complete aircraft dynamics model. Operational DA/DH and visibility require the actual chart and equipment status.</p>`;
  }
  function failureUI(data) {
    return `<div class="arc-graphic arc-fault"><div class="arc-graphic-label">PARTIAL PANEL · DIAGNOSE THE COMMON FAILURE SOURCE</div>
    <div class="arc-fault-head"><span class="arc-warning">⚠ ${esc(data.title)}</span><span>IMC / SIMULATED</span></div><p>${esc(data.symptom)}</p>
    <div class="arc-fault-columns"><div>ATTITUDE / HEADING <strong>${data.kind === 'gyro' ? 'UNRELIABLE' : 'CHECK'}</strong></div><div>AIRSPEED <strong>${data.kind === 'pitot' ? 'FROZEN' : data.kind === 'static' ? 'SUSPECT' : 'NORMAL'}</strong></div><div>ALT / VSI <strong>${data.kind === 'static' ? 'FROZEN / ZERO' : 'RESPONSIVE'}</strong></div></div></div>
    <div class="arc-choices arc-choices-four" role="group" aria-label="Select failure source"><button type="button" data-choice="pitot"${selected('pitot')}>PITOT</button><button type="button" data-choice="static"${selected('static')}>STATIC</button><button type="button" data-choice="gyro"${selected('gyro')}>GYRO / VACUUM</button><button type="button" data-choice="pfd"${selected('pfd')}>PFD POWER</button></div>
    <div class="arc-thirdparty"><div class="arc-thirdparty-head"><div><b>LIVE SIX-PACK · UNUSUAL ATTITUDES</b><small>Actual Open Aviation Components simulation, not a CSS imitation</small></div><button type="button" data-oa-toggle aria-expanded="false" class="arc-micro">OPEN RECOVERY LAB ↓</button></div>
    <div id="arcOAPanel" hidden><p>Read attitude, airspeed, altimeter and heading. Trigger a random upset, decide on a recovery, then reveal and compare. This is supplemental instrument-scan practice, not a simulation of the fault above.</p>
    <div id="arcOAMount"><div class="arc-oa-loading">Tap to load the original open-source six-pack instrument trainer.</div></div>
    <p class="arc-fine">Source: <a href="https://github.com/Open-Aviation-Solutions/open-aviation-components" target="_blank" rel="noopener noreferrer">Open Aviation Components</a> · MPL-2.0 · unmodified component · external CDN required.</p></div></div>`;
  }
  function body() {
    const data = scenario();
    const intro = [
      'Read the terrain, choose the generic IFR obstacle-clearance floor, and check the larger planning picture.',
      'Trust the actual annunciation, not the best-looking minima on the synthetic chart.',
      'Dial the approximate 3° descent rate, then decide how equipment limitations affect the approach.',
      'Cross-check the readings. Find the failed source rather than trusting any one indication.'
    ][state.mission];
    return `<div class="arcade-top"><div><div class="arc-kicker">ACS GAME SYSTEM / ROUND ${state.round + 1} OF 3</div><h2>${TITLES[state.mission]}</h2><p>${intro}</p></div><div class="arc-score"><small>STREAK</small><b>${state.streak}</b><small>${totalCleared()} / 12 CLEARED</small></div></div>
    <div class="arc-progress" aria-label="Progress for current mission">${SCENARIOS[state.mission].map((_, i) => `<span class="${progress.cleared[`${CODES[state.mission]}:${i}`] ? 'done' : ''} ${i === state.round ? 'current' : ''}"></span>`).join('')}</div>
    <div class="arc-main">${state.mission === 0 ? altitudeUI(data) : state.mission === 1 ? navUI(data) : state.mission === 2 ? precisionUI(data) : failureUI(data)}
    <div class="arc-actionbar"><button type="button" data-hint class="arc-text-btn" ${state.graded ? 'disabled' : ''}>${state.hint ? 'HINT REVEALED' : 'NEED A HINT?'}</button><button type="button" data-commit class="arc-submit" ${state.graded ? 'disabled' : ''}>LOCK DECISION →</button></div>
    <div id="arcFeedback" class="arc-feedback ${state.graded ? state.correct ? 'good' : 'bad' : ''}" ${state.graded || state.hint ? '' : 'hidden'} role="status" aria-live="polite">${state.graded ? `<strong>${state.correct ? 'CLEARED / +' + (state.hint ? 60 : 100) + ' XP' : 'NOT QUITE — STUDY THE DEBRIEF'}</strong><p>${esc(state.feedback)}</p><button class="arc-next" type="button" data-next>${state.round < 2 ? 'NEXT SCENARIO →' : 'NEXT MISSION →'}</button>` : `<strong>HINT</strong><p>${esc(hintText())}</p>`}</div>
    <div class="arc-fine arc-footerline">${CODES[state.mission]} · FAA-S-ACS-8C · Educational scenarios, not real approach charts or approved avionics.</div></div>`;
  }
  function hintText() {
    const s = scenario();
    return [
      `Without a published minimum: highest obstacle + ${s.mountain ? '2,000 ft mountainous' : '1,000 ft nonmountainous'} within 4 NM of course. Then evaluate the other planning factors.`,
      'LP and LNAV both use MDA and lateral guidance. Select the minima matching the mode actually available.',
      'A 3° path needs roughly 318 feet per nautical mile. Multiply groundspeed by about 5.3 for feet/minute.',
      'Different pitot/static/gyro sources affect different groups of instruments. Cross-check independent information.'
    ][state.mission];
  }
  function render() {
    shell.innerHTML = `<div class="arc-banner"><span><i aria-hidden="true"></i> JACK'S ACS ARCADE</span><span>12 SCENARIOS · 4 KNOWLEDGE CODES</span></div>${nav()}${body()}`;
    if (state.mission === 3 && window.IFROAWasOpen) { const btn = shell.querySelector('[data-oa-toggle]'); if (btn) openOA(btn); }
  }
  function updateRange(input) {
    if (!input) return;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    if (input.dataset.range === 'altitude') {
      state.altitude = value; const s = scenario(); const low = s.obstacle - 400, high = s.obstacle + (s.mountain ? 2800 : 1800);
      const y = clamp(215 - (value - low) / (high - low) * 166, 38, 215);
      const line = shell.querySelector('#arcAltLine'), label = shell.querySelector('#arcAltLabel');
      if (line) line.setAttribute('d', `M0 ${y}H640`);
      if (label) { label.setAttribute('y', String(y - 10)); label.textContent = `SELECTED ${value.toLocaleString()} FT`; }
    } else if (input.dataset.range === 'rate') {
      state.rate = value; const expected = Math.round(scenario().gs * 5.31 / 10) * 10;
      const needle = shell.querySelector('#arcGlideNeedle'); if (needle) needle.style.transform = `translateY(${clamp((value - expected) / 13, -44, 44)}px)`;
      const selected = shell.querySelector('#arcSelectedVs'); if (selected) selected.textContent = `${value} FPM`;
    }
    const output = shell.querySelector('#arcRangeValue'); if (output) output.textContent = input.dataset.range === 'altitude' ? `${value.toLocaleString()} FT` : `${value} FPM`;
  }
  function grade() {
    if (state.graded) return;
    const data = scenario(); let ok = false; let message = '';
    if (state.mission === 0) {
      const buffer = data.mountain ? 2000 : 1000, floor = data.obstacle + buffer;
      ok = state.altitude === floor;
      message = `${data.obstacle.toLocaleString()} ft obstacle + ${buffer.toLocaleString()} ft buffer = ${floor.toLocaleString()} ft MSL minimum generic obstacle-clearance floor. Other published minima, MEA/MOCA, directions from ATC, airspace, glide, winds, oxygen and performance can require a different altitude. ${ok ? 'Exact planning floor selected.' : `You selected ${state.altitude.toLocaleString()} ft; aim for the generic floor in this exercise.`}`;
    } else if (state.mission === 1) {
      ok = state.choice === data.mode;
      message = `The receiver annunciates ${data.mode}. Select ${data.mode} MDA ${data.mode === 'LP' ? data.lp : data.lnav} ft on this invented chart. Both LNAV and LP provide lateral guidance; LP offers angular sensitivity, but neither supplies approved vertical guidance. LPV is different.`;
    } else if (state.mission === 2) {
      const expected = data.gs * 5.31;
      ok = Math.abs(state.rate - expected) <= 35 && state.choice === 'chart';
      message = `${data.gs} kt × 5.31 ≈ ${Math.round(expected)} fpm to approximate a 3° path. ${data.equipment === 'approachLights' ? 'With approach lights inoperative, consult the published inoperative-equipment notes and apply any required visibility/minimums adjustment.' : 'The computed rate is only an initial estimate; follow the actual glideslope rather than holding a fixed vertical speed.'}`;
    } else {
      ok = state.choice === data.kind;
      message = data.expl;
    }
    state.graded = true; state.correct = ok; state.feedback = message;
    state.streak = ok ? state.streak + 1 : 0;
    progress.bestStreak = Math.max(progress.bestStreak, state.streak);
    const key = `${CODES[state.mission]}:${state.round}`;
    if (ok && !progress.cleared[key]) {
      progress.cleared[key] = true; progress.totalCorrect++;
      const xp = state.hint ? 60 : 100;
      try { if (typeof record !== 'undefined' && typeof window.save === 'function') { record.xp = (Number(record.xp) || 0) + xp; window.save(); } } catch {}
    }
    save();
    syncLog('acs_arcade_round_graded', { code: CODES[state.mission], round: state.round + 1, correct: ok, seconds: Math.round((performance.now() - state.startMs) / 100) / 10, hint: state.hint });
    render();
    shell.querySelector('#arcFeedback')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
  }
  function loadOriginalSixPack(mount) {
    if (!mount || mount.dataset.loading) return;
    mount.dataset.loading = 'true';
    const url = 'https://unpkg.com/@open-aviation-solutions/components@0.1.15/dist/lib/define.es.js';
    import(url).then(() => customElements.whenDefined('unusual-attitudes')).then(() => {
      if (!mount.isConnected) return;
      mount.replaceChildren(); const instrument = document.createElement('unusual-attitudes');
      instrument.setAttribute('height', '540px'); instrument.setAttribute('scenario', 'random');
      instrument.setAttribute('severity', 'standard'); instrument.setAttribute('setup-seconds', '3');
      instrument.setAttribute('instruments', 'asi ai alt di vsi'); instrument.setAttribute('show-help', 'false');
      mount.appendChild(instrument); state.componentReady = true;
    }).catch(() => {
      if (!mount.isConnected) return;
      mount.innerHTML = '<div class="arc-oa-loading">The six-pack library could not load (internet connection or CDN). <a href="https://open-aviation-solutions.github.io/open-aviation-components/unusual-attitudes/" target="_blank" rel="noopener noreferrer">Open the official live trainer ↗</a></div>';
    });
  }
  function openOA(btn) {
    const panel = shell.querySelector('#arcOAPanel');
    if (!panel) return;
    panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); btn.textContent = 'CLOSE RECOVERY LAB ↑';
    window.IFROAWasOpen = true;
    loadOriginalSixPack(shell.querySelector('#arcOAMount'));
  }
  shell.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.hasAttribute('data-mission')) { state.mission = Number(button.dataset.mission); state.round = 0; window.IFROAWasOpen = false; roundReset(); render(); syncLog('acs_arcade_opened', { code: CODES[state.mission] }); }
    else if (button.hasAttribute('data-choice')) { if (!state.graded) { state.choice = button.dataset.choice; shell.querySelectorAll('[data-choice]').forEach(b => { b.classList.toggle('is-active', b === button); b.setAttribute('aria-pressed', String(b === button)); }); } }
    else if (button.hasAttribute('data-hint')) { if (!state.graded) { state.hint = true; render(); } }
    else if (button.hasAttribute('data-commit')) grade();
    else if (button.hasAttribute('data-next')) { if (state.round < 2) state.round++; else { state.round = 0; state.mission = (state.mission + 1) % CODES.length; } window.IFROAWasOpen = false; roundReset(); render(); shell.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
    else if (button.hasAttribute('data-oa-toggle')) { const panel = shell.querySelector('#arcOAPanel'); if (panel?.hidden) openOA(button); else { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); button.textContent = 'OPEN RECOVERY LAB ↓'; window.IFROAWasOpen = false; } }
  });
  shell.addEventListener('input', event => { if (event.target.matches('[data-range]') && !state.graded) updateRange(event.target); });
  roundReset(); render();
  window.IFRArcade = { setMission: index => { if (Number.isInteger(index) && index >= 0 && index < 4) { state.mission = index; state.round = 0; window.IFROAWasOpen = false; roundReset(); render(); } }, getProgress: () => ({ cleared: totalCleared(), bestStreak: progress.bestStreak }), getState: () => ({ ...state }) };
})();