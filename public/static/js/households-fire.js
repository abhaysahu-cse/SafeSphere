/*
  static/js/fire.js
  Behavior for the household fire module:
  - Tab rendering + poster swap
  - Checklist modal (save/restore/print/share)
  - Quiz (save progress)
  - Practice: escape simulation (simple interactive)
  - Stories modal
  - Disaster alert integration (safe, non-blocking)
*/
window.fire = (function () {
  // -------- Module text/data (detailed) ----------
  const MODULE = {
    prevention: {
      title: "Prevention — Reduce risk now",
      bullets: [
        "Install smoke detectors on every floor and test monthly.",
        "Keep LPG cylinders outside or in ventilated space; check rubber pipe every 6 months.",
        "Avoid charging phones on beds and never leave charging overnight unattended.",
        "Service old wiring and replace frayed cables; do not use multi-socket adaptors permanently.",
        "Keep a fire blanket and ABC extinguisher in the kitchen; store safely and train family."
      ]
    },
    detection: {
      title: "Detection & early warning",
      bullets: [
        "Smoke alarms should be outside sleeping areas and in corridors.",
        "Alarm battery check: press-to-test monthly; replace batteries yearly.",
        "If you smell gas, do not switch lights on — open windows and exit, then call technician."
      ]
    },
    escape: {
      title: "Escape steps — room-by-room actions",
      bullets: [
        "Feel door with back of hand before opening; if hot, do not open.",
        "If smoke: crawl low — breathing air near floor.",
        "Close doors behind you to slow fire spread.",
        "Use stairs — never elevators in multi-storey buildings.",
        "Stop–Drop–Roll if clothing ignites."
      ]
    },
    extinguish: {
      title: "Extinguish & safe appliance use",
      bullets: [
        "For pan (oil) fires: cover with metal lid / blanket — do NOT pour water.",
        "For small electrical fires: use CO₂ or dry powder extinguisher; never use water.",
        "Use PASS method: Pull, Aim, Squeeze, Sweep — only if fire is small and you're trained."
      ]
    },
    recover: {
      title: "After the event — recovery steps",
      bullets: [
        "Do not switch electricity on until checked by electrician.",
        "Document damage with photos for insurance and relief.",
        "Ventilate and clean smoke-exposed items; seek medical attention for smoke inhalation.",
        "Dispose of contaminated food; boil water until safe to drink if mains contaminated."
      ]
    },
    practice: {
      title: "Practice & Drills",
      bullets: [
        "Monthly drill: night-time evacuation to meeting point. Time yourselves.",
        "Kitchen drill: cover-pan technique demonstration (no real fire).",
        "Extinguisher demo with trainer once per year."
      ]
    },
    resources: {
      title: "Resources",
      bullets: [
        "Local fire service guidance (add local pamphlet / PDF)",
        "NDMA / State disaster management leaflets (upload PDFs here)",
        "Guides on safe LPG handling and battery disposal"
      ]
    },

    // checklist items (printable)
    checklist: [
      "Smoke alarm installed and tested",
      "Gas pipe checked & regulator secured",
      "Extinguisher or fire blanket available in kitchen",
      "Escape routes mapped and family knows meeting point",
      "Emergency numbers saved on every phone",
      "Charging is done on hard surfaces, not on beds"
    ],

    // quiz
    quiz: [
      { q: "Where should a smoke alarm be installed?", a: ["Inside oven", "Outside sleeping areas / corridor", "In the bathroom"], correct: 1 },
      { q: "What's the correct action if clothes catch fire?", a: ["Run fast to ground floor", "Stop - Drop - Roll", "Remove clothes quickly while running"], correct: 1 },
      { q: "How to treat a small oil pan fire?", a: ["Throw water", "Cover with metal lid", "Blow on it"], correct: 1 }
    ]
  };

  // Posters (swap with section tabs) — you will replace these with real images
  const SECTION_POSTERS = {
    prevention: "{% static 'image/protect/households/fire_prevention.jpg' %}",
    detection: "{% static 'image/protect/households/fire_detection.jpg' %}",
    escape: "{% static 'image/protect/households/fire_escape.jpg' %}",
    extinguish: "{% static 'image/protect/households/fire_extinguish.jpg' %}",
    recover: "{% static 'image/protect/households/fire_recover.jpg' %}",
    practice: "{% static 'image/protect/households/fire_practice.jpg' %}",
    resources: "{% static 'image/protect/households/fire_resources.jpg' %}"
  };

  // ----- DOM helpers -----
  function el(id) { return document.getElementById(id); }

  // ----- Tabs & poster swap -----
  function switchTab(tab) {
    // update active tab UI
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    // render content
    renderTab(tab);
    // update poster
    updateSectionPoster(tab);
  }

  function renderTab(tab) {
    const target = el('moduleContent');
    if (!target) return;
    const data = MODULE[tab];
    if (!data) {
      // handle custom tabs like resources/practice
      if (tab === 'practice') {
        target.innerHTML = `<h3>${MODULE.practice.title}</h3>
          <p class="small">Practice escape decisions with the simulation below and run drills at home.</p>
          <div class="practice-grid">
            <div class="escape-room">
              <h4>Escape simulation — choose your action</h4>
              <p class="small">Scenario: You sleep on the 2nd floor, you smell smoke in corridor.</p>
              <div class="escape-actions">
                <button class="btn btn-primary" onclick="fire.runEscape('openDoor')">Open door & check</button>
                <button class="btn btn-ghost" onclick="fire.runEscape('crawl')">Crawl low and exit</button>
                <button class="btn btn-ghost" onclick="fire.runEscape('signal')">Stay & signal from window</button>
              </div>
              <div id="escapeResult" class="escape-result" aria-live="polite"></div>
            </div>
            <div class="section">
              <h4>Practice drills</h4>
              <ol>
                <li>Night drill: simulate waking and getting out in under 2 minutes.</li>
                <li>Kitchen demo: show how to cover a pan fire without water.</li>
                <li>Extinguisher demo: practice with an empty demo extinguisher or trainer.</li>
              </ol>
            </div>
          </div>`;
        return;
      } else if (tab === 'resources') {
        target.innerHTML = `<h3>${MODULE.resources.title}</h3><ul>${MODULE.resources.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
        return;
      } else {
        target.innerHTML = `<p class="small">No content.</p>`;
        return;
      }
    }

    // Render standard content block
    const html = `<h3>${data.title}</h3>
      <ul>${data.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    target.innerHTML = html;
  }

  function updateSectionPoster(tab) {
    try {
      const container = el('sectionPoster');
      const img = el('sectionPosterImg');
      if (!container || !img) return;
      const url = SECTION_POSTERS[tab];
      if (url) {
        img.src = url;
        img.alt = `${tab} poster`;
        img.style.display = '';
        container.setAttribute('aria-hidden', 'false');
      } else {
        img.src = '';
        img.style.display = 'none';
        container.setAttribute('aria-hidden', 'true');
      }
    } catch (e) { console.warn('updateSectionPoster', e); }
  }

  // ----- Checklist modal -----
  const CHECK_KEY = 'safesphere_house_fire_check_v1';
  function openChecklist() {
    const modal = el('checklistModal');
    if (!modal) return;
    // default to overview tab inside checklist
    switchChecklistTab('overview');
    modal.style.display = 'flex';
    loadChecklistProgress();
  }
  function closeChecklist() {
    const modal = el('checklistModal');
    if (!modal) return;
    modal.style.display = 'none';
  }

  function switchChecklistTab(tab) {
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = el('checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="small">Checklist to prepare, escape and recover. Mark items done and save — data is stored locally on this device.</p>`;
    } else if (tab === 'before') {
      content.innerHTML = `<h3>Before — prevention</h3><ul>${MODULE.prevention.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    } else if (tab === 'during') {
      content.innerHTML = `<h3>During — escape</h3><ul>${MODULE.escape.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    } else if (tab === 'after') {
      content.innerHTML = `<h3>After — recovery</h3><ul>${MODULE.recover.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    } else if (tab === 'checklist') {
      content.innerHTML = MODULE.checklist.map((it, idx) => `
        <div class="checklist-item">
          <input id="chk_${idx}" type="checkbox">
          <label for="chk_${idx}">${it}</label>
        </div>
      `).join('');
      restoreCheckedState();
    }
  }

  function saveChecklistProgress() {
    const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
    const state = Array.from(inputs).map(i => i.checked);
    localStorage.setItem(CHECK_KEY, JSON.stringify({ state, ts: Date.now() }));
    alert('Checklist saved locally on this device.');
  }

  function loadChecklistProgress() {
    setTimeout(() => {
      try {
        const raw = localStorage.getItem(CHECK_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
        inputs.forEach((ch, idx) => { ch.checked = !!(data.state && data.state[idx]); ch.addEventListener('change', autoSaveChecklist); });
      } catch (e) { console.warn('loadChecklistProgress', e); }
    }, 60);
  }

  function autoSaveChecklist() {
    const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
    const state = Array.from(inputs).map(i => i.checked);
    localStorage.setItem(CHECK_KEY, JSON.stringify({ state, ts: Date.now() }));
  }

  function restoreCheckedState() {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
      inputs.forEach((ch, idx) => ch.checked = !!(data.state && data.state[idx]));
    } catch (e) { console.warn('restoreCheckedState', e); }
  }

  function printChecklist() {
    const title = el('checklistTitle').innerText;
    const contentHtml = el('checklistContent').innerHTML;
    const win = window.open('', '', 'width=700,height=900');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px;} .checklist-item{margin-bottom:8px;}</style></head><body><h2>${title}</h2>${contentHtml}</body></html>`);
    win.document.close();
    win.print();
  }

  async function shareChecklist() {
    if (!navigator.share) { alert('Share not supported. Use Print.'); return; }
    const title = el('checklistTitle').innerText;
    const text = Array.from(document.querySelectorAll('#checklistContent label')).map(l => l.innerText).join('\n');
    try { await navigator.share({ title, text }); } catch (e) { console.warn('shareChecklist', e); }
  }

  // ----- Quiz -----
  const QUIZ_KEY = 'safesphere_house_fire_quiz_v1';
  function renderQuiz() {
    const wrap = el('quizWrap');
    if (!wrap) return;
    wrap.innerHTML = MODULE.quiz.map((Q, i) => `
      <div class="quiz-question" data-idx="${i}">
        <p style="font-weight:700">Q${i + 1}. ${Q.q}</p>
        <div class="quiz-options">
          ${Q.a.map((opt, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`).join('')}
        </div>
      </div>
    `).join('') + `<div style="margin-top:10px"><button class="submit-btn" id="submitQuizBtn">Submit</button> <button class="btn btn-ghost" id="clearQuizBtn">Clear</button></div>
      <div id="quizResult" style="margin-top:10px;font-weight:700"></div>`;

    // restore saved
    const saved = localStorage.getItem(QUIZ_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data && data.ans) {
          Object.keys(data.ans).forEach(k => {
            const elInput = document.querySelector(`input[name="${k}"][value="${data.ans[k]}"]`);
            if (elInput) elInput.checked = true;
          });
          el('quizResult').innerText = data.msg || '';
        }
      } catch (e) { console.warn('restore quiz', e); }
    }
    el('submitQuizBtn').addEventListener('click', submitQuiz);
    el('clearQuizBtn').addEventListener('click', clearQuiz);
  }

  function submitQuiz() {
    const results = MODULE.quiz.map((Q, i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      const val = sel ? parseInt(sel.value, 10) : null;
      return { correct: Q.correct === val, selected: val };
    });
    const correct = results.filter(r => r.correct).length;
    const total = MODULE.quiz.length;
    const pct = Math.round((correct / total) * 100);
    let msg = `Score: ${correct} / ${total} (${pct}%) — `;
    if (pct === 100) msg += 'Excellent — you understand the steps.';
    else if (pct >= 70) msg += 'Good — review missed items.';
    else msg += 'Review the module and practice drills again.';
    el('quizResult').innerText = msg;
    const ans = {};
    MODULE.quiz.forEach((_, i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      ans['q' + i] = sel ? sel.value : null;
    });
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ ans, correct, total, pct, msg }));
  }

  function clearQuiz() {
    MODULE.quiz.forEach((_, i) => { document.querySelectorAll(`input[name="q${i}"]`).forEach(s => s.checked = false); });
    el('quizResult').innerText = '';
    localStorage.removeItem(QUIZ_KEY);
  }

  // ----- Escape practice simulation (simple) -----
  function runEscape(action) {
    const out = el('escapeResult');
    if (!out) return;
    // A very simple decision tree for demo:
    if (action === 'openDoor') {
      out.innerText = 'You opened the door — hot smoke rushes in. Result: unsafe. If door is hot, do not open. Crawl low or signal from window.';
      out.style.color = '#b45309';
    } else if (action === 'crawl') {
      out.innerText = 'Good: crawling keeps you in clearer air. Exit using the nearest safe route. Close door behind you.';
      out.style.color = '#116530';
    } else if (action === 'signal') {
      out.innerText = 'If you cannot exit safely, stay low, block gaps with wet cloth and signal for help from window/balcony.';
      out.style.color = '#0b5';
    } else {
      out.innerText = 'Choose an action.';
    }
  }

  // ----- Stories modal -----
  function openStory(e, id) {
    if (e) e.preventDefault();
    const title = id === 1 ? 'Kitchen fire — quick cover' : 'Inverter battery heating';
    const body = id === 1 ? 'A family used a metal lid to cover a flaming pan and evacuated. They needed minor treatment and a new pan.' : 'A rooftop inverter started to smoke — battery was isolated and technician called.';
    el('storyModalTitle').innerText = title;
    el('storyModalBody').innerText = body;
    const modal = document.querySelector('.story-modal');
    if (modal) modal.style.display = 'flex';
  }
  function closeStory() {
    const modal = document.querySelector('.story-modal');
    if (modal) modal.style.display = 'none';
  }

  // ----- Print module -----
  function printModule() {
    const title = el('pageTitle').innerText;
    const content = document.querySelector('.wrap').innerHTML;
    const win = window.open('', '', 'width=900,height=1000');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close();
    win.print();
  }

  // ----- FAQ toggle helper -----
  function toggleFaq(el) {
    const a = el.nextElementSibling;
    if (!a) return;
    a.style.display = a.style.display === 'block' ? 'none' : 'block';
  }

  // ----- Disaster alert integration (safe, non-blocking) -----
  function updateDisasterAlertFromWeather(data) {
    if (!data || typeof data !== 'object') return;
    let temp = data.temp ?? data.temperature ?? null;
    let wind = data.wind ?? data.wind_speed ?? 0;
    let desc = data.description ?? data.weather ?? '';
    temp = (typeof temp === 'string') ? parseFloat(temp) : temp;
    wind = (typeof wind === 'string') ? parseFloat(wind) : wind;

    const bar = el('disaster-alert-bar');
    const aText = el('alertText');
    const aIcon = el('alertIcon');
    if (!bar || !aText || !aIcon) return;

    bar.className = 'alert-normal';
    aIcon.innerText = '🟢';
    aText.innerText = 'Weather is normal. Stay prepared.';

    // If smoke or fire detected in external feed:
    if (desc && /smoke|fire/i.test(desc)) {
      bar.className = 'alert-warning';
      aIcon.innerText = '⚠️';
      aText.innerText = 'Smoke reported nearby. Check inhalation safety and evacuation routes.';
    }
    bar.style.transform = '';
    bar.style.opacity = '1';
  }

  // ----- initialisation -----
  function init() {
    // Render initial tab
    renderTab('prevention');
    updateSectionPoster('prevention');
    // wire up buttons
    const openBtns = [el('openChecklistBtn'), el('openChecklistBtn2')].filter(Boolean);
    openBtns.forEach(b => b.addEventListener('click', openChecklist));
    // checklist tab buttons delegation
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.addEventListener('click', function () { switchChecklistTab(t.dataset.tab); }));

    // checklist control buttons
    const shareBtn = el('shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareChecklist);

    // render quiz
    renderQuiz();

    // escape result hook (exposed functions bound later)
    window.fire = window.fire || {};
    // expose low-level functions
    window.fire.runEscape = runEscape;
    window.fire.openChecklist = openChecklist;
    window.fire.closeChecklist = closeChecklist;
    window.fire.switchChecklistTab = switchChecklistTab;
    window.fire.printChecklist = printChecklist;
    window.fire.printModule = printModule;
    window.fire.toggleFaq = toggleFaq;
    window.fire.openStory = openStory;
    window.fire.closeStory = closeStory;
    window.fire.switchTab = switchTab;
    window.fire.updateDisasterAlertFromWeather = updateDisasterAlertFromWeather;

    // dismiss alert
    const dismiss = el('dismissAlert');
    if (dismiss) {
      dismiss.addEventListener('click', () => {
        const bar = el('disaster-alert-bar');
        if (bar) { bar.style.transform = 'translateY(-110%)'; setTimeout(() => bar.style.opacity = '0', 260); }
      });
      dismiss.addEventListener('keyup', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') dismiss.click(); });
    }
  }

  // Expose public API
  return {
    init,
    switchTab,
    openChecklist,
    closeChecklist,
    switchChecklistTab,
    saveChecklistProgress,
    printChecklist,
    shareChecklist,
    renderQuiz,
    submitQuiz: submitQuiz,
    clearQuiz,
    runEscape,
    toggleFaq,
    openStory,
    closeStory,
    printModule,
    updateDisasterAlertFromWeather
  };
})();

// initialize when DOM ready
document.addEventListener('DOMContentLoaded', function () {
  try { fire.init(); } catch (e) { console.warn('fire.init error', e); }
});
