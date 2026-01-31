/*
  static/js/earthquake.js
  Behaviour for Household Earthquake module:
  - Tab rendering + poster swap (reads window.SECTION_POSTERS from template)
  - Checklist modal (localStorage, print, share)
  - Quiz (localStorage)
  - Practice simulation: pick safe action in scenario & simple retrofit checklist
  - Story modal & disaster-alert hooks
*/

window.earthquake = (function () {

  const MODULE = {
    prevention: {
      title: "Preparation & Planning (weeks → months)",
      bullets: [
        "Map your home: mark high/low points, safe spots and possible exit routes; photograph layout.",
        "Prepare family emergency plan: who grabs documents, who moves kids, meeting point outside hazard zone.",
        "Make emergency kits: per person — torch, power bank, medicines, water (2–3 days), copies of IDs, small cash.",
        "Practice communication: a paper contact list and a two-tiered contact (neighbour + outside relative).",
        "Know utility shutoffs: where to switch off gas, electricity and water safely."
      ]
    },

    retrofit: {
      title: "Low-cost retrofit & infrastructure (what you can do)",
      bullets: [
        "Anchor tall furniture, bookcases and water heaters to walls using straps/anchor bolts.",
        "Bolt or strap LPG cylinders and install a simple shut-off valve accessible from outside.",
        "Secure heavy appliances (fridge, inverter, generator) with brackets and non-slip pads.",
        "Add bracing to masonry: timber bands, ring beams or confining elements as per local guidance.",
        "Improve drainage around the foundation and avoid piling soil against masonry; provide a drain route downhill."
      ]
    },

    during: {
      title: "During — Protect people first (immediate actions)",
      bullets: [
        "DROP — COVER — HOLD: drop to the floor, take cover under a sturdy table and hold on until shaking stops.",
        "If outside, move to an open area away from buildings, trees, walls and power lines.",
        "If in bed, stay there and protect your head with a pillow; if near a window, move to safer interior corner if possible.",
        "If in a multi-storey building avoid elevators; use stairs only after shaking ends and route is safe.",
        "If cooking, turn off flame if you can safely do so — avoid running."
      ]
    },

    after: {
      title: "After — Triage, safety checks & recovery priority",
      bullets: [
        "Check people first: treat serious injuries, stop bleeding, perform basic first aid; seek help.",
        "Inspect building: visible cracks, leaning walls, sagging roofs — if unsafe, evacuate to open area.",
        "Turn off gas if you smell gas; do not light matches until gas is ruled out. Turn off electricity if wiring is damaged.",
        "Document damage with photos (time-stamped) for insurance and relief claims.",
        "Check water supply and boil water if mains may be contaminated; inspect sanitation to avoid disease."
      ]
    },

    community: {
      title: "Community-level actions",
      bullets: [
        "Identify community evacuation grounds and keep a local tool cache (rope, ladders, tarpaulins).",
        "Form a local DRR (disaster risk reduction) committee to maintain drills and checklists.",
        "Agree on community-level heavy-item moving plan (tractors, boats, vehicles) and shared emergency storage.",
        "Coordinate with local authorities for retrofitting grants or building assessments."
      ]
    },

    practice: {
      title: "Practice & Drills",
      bullets: [
        "Monthly night-time drill: reach meeting point in under 3 minutes.",
        "Secure-one-week plan: each week, secure one vulnerable item (top-heavy cupboard, water heater, inverter).",
        "First-aid & search basics: teach family basic first aid and how to check for trapped people safely."
      ]
    },

    checklist: [
      "Family emergency plan written and shared",
      "Emergency kit prepared for each family member",
      "Heavy furniture and water heater anchored",
      "Gas cylinder secured and shut-off accessible",
      "Photographs of property and documents stored off-site"
    ],

    quiz: [
      { q: "What is the recommended immediate action during shaking?", a: ["Run outside quickly", "Drop-Cover-Hold", "Stand in a doorway"], correct: 1 },
      { q: "How often should you test smoke/CO alarms or practice drills?", a: ["Annually", "Monthly (drills), alarms monthly", "Never needed"], correct: 1 },
      { q: "A simple retrofit step for water heaters is:", a: ["Leave loose", "Strap/anchor to wall", "Move to balcony"], correct: 1 }
    ]
  };

  const CHECK_KEY = 'safesphere_house_quake_check_v1';
  const QUIZ_KEY = 'safesphere_house_quake_quiz_v1';

  // DOM helpers
  function el(id) { return document.getElementById(id); }

  // Tabs & poster swap
  function switchTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    renderTab(tab);
    updateSectionPoster(tab);
  }

  function renderTab(tab) {
    const target = el('moduleContent');
    if (!target) return;

    // handle built-in modules or custom tabs
    if (MODULE[tab]) {
      const data = MODULE[tab];
      const html = `<h3>${data.title}</h3><ul>${data.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      target.innerHTML = html;
      return;
    }

    if (tab === 'resources') {
      target.innerHTML = `<h3>Resources</h3><ul>
        <li>Local building codes & retrofit guidance (contact local authority)</li>
        <li>NDMA / Seismic retrofit pamphlets (upload PDFs)</li>
        <li>Local NGOs & engineering volunteers for assessments</li>
      </ul>`;
      return;
    }

    if (tab === 'practice') {
      target.innerHTML = `<h3>${MODULE.practice.title}</h3>
        <p class="small">Try the short simulation and run real drills at home.</p>
        <div class="practice-grid">
          <div class="sim-board">
            <h4>Scenario: You are at home and shaking starts</h4>
            <p class="small">Choose the best immediate action:</p>
            <div class="sim-actions">
              <button class="btn btn-primary" onclick="earthquake.practiseAction('drop')">Drop, Cover, Hold</button>
              <button class="btn btn-ghost" onclick="earthquake.practiseAction('run')">Run outside</button>
              <button class="btn btn-ghost" onclick="earthquake.practiseAction('door')">Stand in doorway</button>
            </div>
            <div id="simResult" style="margin-top:10px;font-weight:800;"></div>
          </div>

          <div class="section">
            <h4>Retrofit checklist (weekly plan)</h4>
            <ol>
              <li>Week 1: bolt bookcases and secure top-heavy items.</li>
              <li>Week 2: strap water heater and secure gas cylinder.</li>
              <li>Week 3: check roof and repair loose tiles/attachments.</li>
            </ol>
            <p class="small">Small, steady progress is cheaper and effective.</p>
          </div>
        </div>`;
      return;
    }

    target.innerHTML = `<p class="small">Section not found.</p>`;
  }

  function updateSectionPoster(tab) {
    try {
      const container = el('sectionPoster');
      const img = el('sectionPosterImg');
      if (!container || !img) return;
      const posters = window.SECTION_POSTERS || {};
      const url = posters[tab];
      if (url) {
        img.src = url;
        img.style.display = '';
        container.setAttribute('aria-hidden', 'false');
      } else {
        img.src = '';
        img.style.display = 'none';
        container.setAttribute('aria-hidden', 'true');
      }
    } catch (e) { console.warn('updateSectionPoster error', e); }
  }

  // Checklist modal
  function openChecklist() {
    const modal = el('checklistModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchChecklistTab('overview');
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
      content.innerHTML = `<p class="small">Checklist helps you confirm simple steps. Save progress locally for repeated drills.</p>`;
      return;
    }
    if (tab === 'before') {
      content.innerHTML = `<h3>Before — key actions</h3><ul>${MODULE.prevention.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return;
    }
    if (tab === 'during') {
      content.innerHTML = `<h3>During — safe actions</h3><ul>${MODULE.during.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return;
    }
    if (tab === 'after') {
      content.innerHTML = `<h3>After — recovery</h3><ul>${MODULE.after.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return;
    }
    if (tab === 'checklist') {
      content.innerHTML = MODULE.checklist.map((it, idx) => `
        <div class="checklist-item">
          <input id="chk_${idx}" type="checkbox">
          <label for="chk_${idx}">${it}</label>
        </div>
      `).join('');
      restoreCheckedState();
      return;
    }
    content.innerHTML = `<p class="small">No content.</p>`;
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
        inputs.forEach((ch, idx) => {
          ch.checked = !!(data.state && data.state[idx]);
          ch.addEventListener('change', autoSaveChecklist);
        });
      } catch (e) { console.warn('loadChecklistProgress', e); }
    }, 80);
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

  // Quiz
  function renderQuiz() {
    const wrap = el('quizWrap');
    if (!wrap) return;
    wrap.innerHTML = MODULE.quiz.map((Q, i) => `
      <div class="quiz-question" data-idx="${i}">
        <p style="font-weight:700">Q${i+1}. ${Q.q}</p>
        <div class="quiz-options">
          ${Q.a.map((opt, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`).join('')}
        </div>
      </div>
    `).join('') + `<div style="margin-top:10px"><button class="btn btn-primary" id="submitQuizBtn">Submit</button> <button class="btn btn-ghost" id="clearQuizBtn">Clear</button></div>
      <div id="quizResult" style="margin-top:10px;font-weight:700"></div>`;

    // restore
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

    const submit = el('submitQuizBtn'), clear = el('clearQuizBtn');
    if (submit) submit.addEventListener('click', submitQuiz);
    if (clear) clear.addEventListener('click', clearQuiz);
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
    MODULE.quiz.forEach((_, i) => document.querySelectorAll(`input[name="q${i}"]`).forEach(s => s.checked = false));
    el('quizResult').innerText = '';
    localStorage.removeItem(QUIZ_KEY);
  }

  // Practice simulate action
  function practiseAction(action) {
    const out = el('simResult');
    if (!out) return;
    if (action === 'drop') {
      out.innerText = 'Correct: Drop - Cover - Hold keeps you under protective structure and reduces injury from falling objects.';
      out.style.color = '#116530';
    } else if (action === 'run') {
      out.innerText = 'Unsafe: Running outside during shaking risks falling debris. Wait until shaking stops and then evacuate if necessary.';
      out.style.color = '#b45309';
    } else if (action === 'door') {
      out.innerText = 'Doorways are not reliably safer; use a sturdy table to cover. Doorways may be dangerous in modern houses.';
      out.style.color = '#b45309';
    } else out.innerText = 'Choose an action.';
  }

  // Story modal
  function openStory(e, id) {
    if (e) e.preventDefault();
    const title = id === 1 ? 'Anchored shelves saved family' : 'Community drains reduced collapse risk';
    const body = id === 1 ? 'Anchored shelving and strapped water heater prevented heavy falling objects and allowed safe evacuation.' : 'Cleared drains protected the foundation after aftershocks and rains.';
    el('storyModalTitle').innerText = title;
    el('storyModalBody').innerText = body;
    const modal = document.querySelector('.story-modal');
    if (modal) modal.style.display = 'flex';
  }
  function closeStory() {
    const modal = document.querySelector('.story-modal');
    if (modal) modal.style.display = 'none';
  }

  // Print module
  function printModule() {
    const title = el('pageTitle').innerText;
    const content = document.querySelector('.wrap').innerHTML;
    const win = window.open('', '', 'width=900,height=1000');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close();
    win.print();
  }

  // FAQ toggle
  function toggleFaq(elm) {
    const a = elm.nextElementSibling;
    if (!a) return;
    a.style.display = a.style.display === 'block' ? 'none' : 'block';
  }

  // Disaster alert (placeholder integration)
  function updateDisasterAlertFromHazard(data) {
    if (!data || typeof data !== 'object') return;
    const bar = el('disaster-alert-bar');
    const aText = el('alertText');
    if (!bar || !aText) return;
    bar.className = 'alert-normal';
    aText.innerText = 'No seismic alerts. Review your plan.';
    if (data.alert === 'earthquake') {
      bar.className = 'alert-danger';
      el('alertIcon').innerText = '🚨';
      aText.innerText = 'Seismic alert — Drop, Cover, Hold and follow local instructions.';
    }
  }

  // init
  function init() {
    renderTab('prevention');
    updateSectionPoster('prevention');
    renderQuiz();

    // bind buttons
    const openBtns = [el('openChecklistBtn'), el('openChecklistBtn2')].filter(Boolean);
    openBtns.forEach(b => b.addEventListener('click', openChecklist));
    const shareBtn = el('shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareChecklist);

    // dismiss alert
    const dismiss = el('dismissAlert');
    if (dismiss) {
      dismiss.addEventListener('click', () => {
        const bar = el('disaster-alert-bar');
        if (bar) { bar.style.transform = 'translateY(-110%)'; setTimeout(()=>bar.style.opacity='0',260); }
      });
      dismiss.addEventListener('keyup', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') dismiss.click(); });
    }

    // expose useful functions for inline onclick in HTML
    window.earthquake = window.earthquake || {};
    window.earthquake.practiseAction = practiseAction;
    window.earthquake.switchTab = switchTab;
    window.earthquake.openChecklist = openChecklist;
    window.earthquake.closeChecklist = closeChecklist;
    window.earthquake.switchChecklistTab = switchChecklistTab;
    window.earthquake.saveChecklistProgress = saveChecklistProgress;
    window.earthquake.printChecklist = printChecklist;
    window.earthquake.shareChecklist = shareChecklist;
    window.earthquake.renderQuiz = renderQuiz;
    window.earthquake.submitQuiz = submitQuiz;
    window.earthquake.clearQuiz = clearQuiz;
    window.earthquake.openStory = openStory;
    window.earthquake.closeStory = closeStory;
    window.earthquake.printModule = printModule;
    window.earthquake.toggleFaq = toggleFaq;
    window.earthquake.updateDisasterAlertFromHazard = updateDisasterAlertFromHazard;
  }

  return {
    init,
    switchTab,
    practiseAction,
    openChecklist,
    closeChecklist,
    switchChecklistTab,
    saveChecklistProgress,
    printChecklist,
    shareChecklist,
    renderQuiz,
    submitQuiz,
    clearQuiz,
    openStory,
    closeStory,
    printModule,
    toggleFaq,
    updateDisasterAlertFromHazard
  };

})();

// initialize when DOM ready
document.addEventListener('DOMContentLoaded', function () {
  try { earthquake.init(); } catch (e) { console.warn('earthquake.init error', e); }
});
