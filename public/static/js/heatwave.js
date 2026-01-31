/*
  static/js/heatwave.js
  Behaviour for Household Heatwave module:
  - Tab rendering + poster swap (reads window.SECTION_POSTERS injected by template)
  - Checklist modal (localStorage, print, share)
  - Quiz (localStorage)
  - Practice simulation (choose cooling actions)
  - Story modal & alert hooks
*/

(function () {
  const MODULE = {
    preparation: {
      title: "Preparation & Planning (days → months)",
      bullets: [
        "Identify vulnerable people (children, elderly, pregnant, chronic conditions) and prepare a contact/assist list.",
        "Create a 'cool corner' in the house: shaded, ventilated, near water, with a fan if possible.",
        "Prepare emergency water storage: clean jerry, refill schedule, basic water purification tablets.",
        "Plan workload: reschedule outdoor labour to early morning / evening; keep tools and PPE shaded.",
        "Stock a small medicine/ORs (oral rehydration salts) kit and list of local health contacts."
      ]
    },

    cooling: {
      title: "Home cooling & low-cost retrofit",
      bullets: [
        "Reflective roofs or light-coloured paint reduce heat absorption significantly.",
        "Install external shading: awnings, shade cloth, or simple bamboo/cloth screens on sun-facing windows.",
        "Improve ventilation: create cross-ventilation paths and add vents near the roof to exhaust hot air.",
        "Use evaporative cooling (wet cloths, clay pots / pot-in-pot methods) in dry climates.",
        "Insulate attic/roof space cheaply using reflective foil or local materials to slow heat penetration."
      ]
    },

    during: {
      title: "During heatwave — protect people first",
      bullets: [
        "Hydrate: sip water frequently; avoid sugary or alcoholic drinks. For heavy work take scheduled water breaks.",
        "Stay in shade / coolest room during peak hours (11:00–16:00). Use wet cloths on neck/forehead for quick cooling.",
        "Look for heat stress signs: heavy sweating, dizziness, nausea, headaches, confusion — move the person to cool place and rehydrate; seek medical help for severe symptoms.",
        "Limit use of ovens and indoor heat sources; use fans and shaded windows for airflow.",
        "Preserve medications as recommended (some need cool storage). Keep a cool box with ice packs for critical medicines if needed."
      ]
    },

    after: {
      title: "After — recovery & monitoring",
      bullets: [
        "Check on vulnerable neighbours for delayed heat effects (elderly may show issues after the heat subsides).",
        "Replenish water stocks and repair or replace shaded covers and tarpaulins used.",
        "Check infrastructure: asphalted roofs, solar panels and wiring for heat-related damage.",
        "Document any heat-related crop or property losses for relief programs and insurance.",
        "Plan tree planting and permanent shade works to reduce future exposure."
      ]
    },

    livestock: {
      title: "Livestock & food security",
      bullets: [
        "Provide shade and aerated shelters for animals; increase water access and clean drinking points.",
        "Adjust feeding schedule to cooler parts of the day; avoid heat-stress-inducing high-energy feeds at midday.",
        "Protect perishable food with insulated cool boxes or evaporative clay cooling in dry zones.",
        "Monitor and isolate animals showing heat stress; contact vet early as livestock deteriorates quickly in extreme heat."
      ]
    },

    practice: {
      title: "Practice — simple drills",
      bullets: [
        "Set a community hydration check (phone / in-person) for vulnerable residents each heatwave day.",
        "Weekly 'cool corner' check: ensure water jerry is full, fan is functional and shades are in place.",
        "Cooling-centre plan: map nearest public shade/cooling centres and transport options."
      ]
    },

    checklist: [
      "Emergency water storage refilled and clean",
      "Cool corner prepared with fan/ice/blankets",
      "List of vulnerable people and contacts shared",
      "Shades & reflective roof or coverings installed",
      "Livestock shade and drinking points prepared"
    ],

    quiz: [
      { q: "What is the best immediate action during peak heat for outdoor workers?", a: ["Keep working, ignore heat", "Move to shade, hydrate, rest", "Drink alcohol to cool down"], correct: 1 },
      { q: "A low-cost way to reduce roof heat is:", a: ["Dark paint", "Reflective/light-colour paint", "Remove roof"], correct: 1 },
      { q: "Sign of severe heatstroke requiring urgent medical help is:", a: ["Mild thirst", "High body temperature with confusion and fainting", "Sweating a little"], correct: 1 }
    ]
  };

  // keys
  const CHECK_KEY = 'safesphere_house_heat_check_v1';
  const QUIZ_KEY = 'safesphere_house_heat_quiz_v1';

  // helpers
  function el(id) { return document.getElementById(id); }

  // Tab & poster rendering
  function switchTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    renderTab(tab);
    updateSectionPoster(tab);
  }

  function renderTab(tab) {
    const target = el('moduleContent');
    if (!target) return;

    if (MODULE[tab]) {
      const data = MODULE[tab];
      target.innerHTML = `<h3>${data.title}</h3><ul>${data.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return;
    }

    if (tab === 'resources') {
      target.innerHTML = `<h3>Resources</h3><ul>
        <li>Local health service heatwave guidance</li>
        <li>NDMA/State heatwave pamphlet (upload PDF)</li>
        <li>Nearest cooling centres and water points (add on map)</li>
      </ul>`;
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
    } catch (e) { console.warn('updateSectionPoster:', e); }
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
      content.innerHTML = `<p class="small">Checklist helps families prepare and saves lives. Save progress locally for repeated drills.</p>`;
      return;
    }
    if (tab === 'preparation') {
      content.innerHTML = `<h3>Preparation</h3><ul>${MODULE.preparation.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return;
    }
    if (tab === 'during') {
      content.innerHTML = `<h3>During</h3><ul>${MODULE.during.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return;
    }
    if (tab === 'after') {
      content.innerHTML = `<h3>After</h3><ul>${MODULE.after.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
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
        inputs.forEach((ch, idx) => {
          ch.checked = !!(data.state && data.state[idx]);
          ch.addEventListener('change', autoSaveChecklist);
        });
      } catch (e) { console.warn('loadChecklistProgress:', e); }
    }, 80);
  }

  function restoreCheckedState() {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
      inputs.forEach((ch, idx) => ch.checked = !!(data.state && data.state[idx]));
    } catch (e) { console.warn('restoreCheckedState:', e); }
  }

  function autoSaveChecklist() {
    const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
    const state = Array.from(inputs).map(i => i.checked);
    localStorage.setItem(CHECK_KEY, JSON.stringify({ state, ts: Date.now() }));
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
    if (!navigator.share) { alert('Share not supported. Use Print or Save.'); return; }
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
    if (pct === 100) msg += 'Excellent — you know the key heatwave actions.';
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

  // Practice: choose cooling action and get feedback
  function practiceAction(action) {
    const out = el('simResult');
    if (!out) return;
    if (action === 'shade') {
      out.innerText = 'Good: adding external shade reduces direct solar gain dramatically.';
      out.style.color = '#116530';
    } else if (action === 'fan') {
      out.innerText = 'Fans help when the air temperature is lower than the skin temperature or in dry heat; ensure airflow and hydration.';
      out.style.color = '#0b5';
    } else if (action === 'ac') {
      out.innerText = 'AC is effective but energy-intensive; prioritise vulnerable people or community cooling centres to save cost.';
      out.style.color = '#0b5';
    } else out.innerText = 'Select an action to test.';
  }

  // Story modal
  function openStory(e, id) {
    if (e) e.preventDefault();
    const title = id === 1 ? 'Community cooling point helps elders' : 'Reflective roof reduces indoor heat';
    const body = id === 1 ? 'Local community hall converted to a cooling point; elders visited daily during heatwave and heat admissions reduced.' : 'A family painted roof with reflective paint and noticed lower indoor temperatures by several degrees.';
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

  // Alert hook (accepts object: { heat_alert: 'watch'|'warning' })
  function updateHeatAlert(data) {
    if (!data || typeof data !== 'object') return;
    const bar = el('disaster-alert-bar');
    const aText = el('alertText');
    const aIcon = el('alertIcon');
    bar.className = 'alert-normal';
    aIcon.innerText = '🟢';
    if (data.heat_alert === 'watch') {
      bar.className = 'alert-warning';
      aIcon.innerText = '🔥';
      aText.innerText = 'Heatwave watch: prepare water and cooling measures.';
    } else if (data.heat_alert === 'warning') {
      bar.className = 'alert-danger';
      aIcon.innerText = '🚨';
      aText.innerText = 'Heatwave warning: follow cooling & hydration guidance now.';
    } else {
      aText.innerText = 'Weather is normal. Stay prepared for heat.';
    }
    bar.style.transform = '';
    bar.style.opacity = '1';
  }

  // init on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    try {
      // initial tab & poster
      renderInitial();
      // bind checklist buttons
      const openBtns = [el('openChecklistBtn'), el('openChecklistBtn2')].filter(Boolean);
      openBtns.forEach(b => b.addEventListener('click', openChecklist));
      // checklist tab buttons delegation
      document.querySelectorAll('.tabs-inner .tab').forEach(t => {
        t.addEventListener('click', function () { switchChecklistTab(t.dataset.tab); });
      });
      // render quiz
      renderQuiz();

      // practice button exposures for inline onclick usage
      window.heatwave = window.heatwave || {};
      window.heatwave.practiceAction = practiceAction;
      window.heatwave.switchTab = switchTab;
      window.heatwave.openChecklist = openChecklist;
      window.heatwave.closeChecklist = closeChecklist;
      window.heatwave.switchChecklistTab = switchChecklistTab;
      window.heatwave.saveChecklistProgress = saveChecklistProgress;
      window.heatwave.printChecklist = printChecklist;
      window.heatwave.shareChecklist = shareChecklist;
      window.heatwave.renderQuiz = renderQuiz;
      window.heatwave.submitQuiz = submitQuiz;
      window.heatwave.clearQuiz = clearQuiz;
      window.heatwave.openStory = openStory;
      window.heatwave.closeStory = closeStory;
      window.heatwave.printModule = printModule;
      window.heatwave.toggleFaq = toggleFaq;
      window.heatwave.updateHeatAlert = updateHeatAlert;

      // dismiss alert
      const dismiss = el('dismissAlert');
      if (dismiss) {
        dismiss.addEventListener('click', function () { const bar = el('disaster-alert-bar'); bar.style.transform = 'translateY(-110%)'; setTimeout(()=>bar.style.opacity='0',260); });
        dismiss.addEventListener('keyup', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') dismiss.click(); });
      }
    } catch (e) { console.warn('heatwave init error', e); }
  });

  // functions for checklist tab behaviour (delegated here so html can call)
  function switchChecklistTab(tab) {
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = el('checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="small">This checklist helps households prepare for heatwaves — focus on hydration, shading and vulnerable people.</p>`;
      return;
    }
    if (tab === 'preparation') {
      content.innerHTML = `<h3>Prepare</h3><ul>${MODULE.preparation.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return;
    }
    if (tab === 'during') {
      content.innerHTML = `<h3>During</h3><ul>${MODULE.during.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return;
    }
    if (tab === 'after') {
      content.innerHTML = `<h3>After</h3><ul>${MODULE.after.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
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
    }
  }

  // helper restore / save
  function restoreCheckedState() {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      const arr = obj.state || [];
      const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
      inputs.forEach((ch, i) => ch.checked = !!arr[i]);
      inputs.forEach((ch) => ch.addEventListener('change', autoSaveChecklist));
    } catch (e) { console.warn('restoreCheckedState:', e); }
  }
  function autoSaveChecklist() {
    const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
    const state = Array.from(inputs).map(i => i.checked);
    localStorage.setItem(CHECK_KEY, JSON.stringify({ state, ts: Date.now() }));
  }

  // initial render helper
  function renderInitial() {
    // default to preparation
    switchTab('preparation');
    // render checklist tabs (initial)
    switchChecklistTab('overview');
    // render quiz
    renderQuiz();
  }

  // export small API
  window.heatwave = window.heatwave || {};
  window.heatwave.switchTab = switchTab;
  window.heatwave.openChecklist = openChecklist;
  window.heatwave.closeChecklist = closeChecklist;
  window.heatwave.switchChecklistTab = switchChecklistTab;
  window.heatwave.saveChecklistProgress = saveChecklistProgress;
  window.heatwave.printChecklist = printChecklist;
  window.heatwave.shareChecklist = shareChecklist;
  window.heatwave.renderQuiz = renderQuiz;
  window.heatwave.submitQuiz = submitQuiz;
  window.heatwave.clearQuiz = clearQuiz;
  window.heatwave.practiceAction = practiceAction;
  window.heatwave.updateHeatAlert = updateHeatAlert;

})();
