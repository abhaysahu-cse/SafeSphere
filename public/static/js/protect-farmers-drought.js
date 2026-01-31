/* protect-farmers-drought.js
   Interactive behavior for Drought module:
   - tabs, section poster switching
   - checklist modal (save/restore)
   - quiz (save/restore)
   - print & share helpers
   - small accessibility helpers
*/
(function () {
  // Module content (well-researched, practical)
  const MODULE = {
    before: [
      "Assess water: measure well/water level and repair leaks.",
      "Store drinking water and ensure containers are clean.",
      "Construct or repair farm ponds and check bunds.",
      "Choose drought-tolerant / short-duration crops (millets, pulses, sorghum).",
      "Plan to reduce irrigated area to save water.",
      "Store fodder early and consider staggered feeding.",
      "Mulch fields and use conservation tillage to reduce evaporation.",
      "Register and check crop/loan insurance (PMFBY or state schemes) — file records early."
    ],
    during: [
      "Prioritise drinking water for people & animals; use rationing plans.",
      "Switch to deficit irrigation scheduling (less frequent, deeper watering).",
      "Use mulches and shade to reduce crop stress; consider partial harvest where possible.",
      "Sell weak animals early to avoid losses and feed shortages.",
      "Coordinate with neighbours for tanker or water sharing; request government relief early."
    ],
    after: [
      "Test soil salinity and moisture before replanting; soil remediation if needed.",
      "Rebuild and maintain ponds and recharge structures.",
      "Use saved seed carefully — test germination, disinfect seed if required.",
      "Apply for relief/compensation with documentation (photos, dates, receipts).",
      "Plan livelihood diversification (value-add, seasonal non-farm work)."
    ],
    checklist: [
      "Drinking water stored for household & animals",
      "Fodder stocks secured",
      "Drought-tolerant seeds available",
      "Farm pond / bunds repaired",
      "Mulch material available",
      "Emergency contact list shared"
    ],
    quiz: [
      { q: "Which crop is best for drought resilience?", a: ["Paddy (rice)", "Finger millet (ragi) / Millets", "Sugarcane"], correct: 1 },
      { q: "First priority for scarce water?", a: ["Washing", "Irrigation for all crops", "Drinking water for people & animals"], correct: 2 },
      { q: "Quick measure to reduce evaporation?", a: ["Plough deeply to expose soil", "Apply mulch and reduce soil disturbance", "Remove topsoil"], correct: 1 }
    ]
  };

  // Local storage keys
  const CHECK_KEY = 'safesphere_drought_check_v1';
  const QUIZ_KEY = 'safesphere_drought_quiz_v1';

  // --- Tab rendering & poster switching ---
  function switchTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    renderTab(tab);
    updateSectionPoster(tab);
  }

  function renderTab(tab) {
    const target = document.getElementById('moduleContent');
    if (!target) return;
    if (tab === 'before' || tab === 'during' || tab === 'after') {
      const arr = MODULE[tab];
      target.innerHTML = `<h3>${tab.charAt(0).toUpperCase() + tab.slice(1)}</h3>` +
        arr.map(i => `<div class="step">• ${i}</div>`).join('');
    } else if (tab === 'practice') {
      target.innerHTML = `<h3>Practice & Planning</h3>
        <p class="small">Use the exercises below in a farmer group to rehearse choices that save water and income.</p>
        <ol>
          <li>Water audit: measure daily household & animal water use; find 20% savings.</li>
          <li>Mulch relay: prepare and distribute mulch to 5 households and monitor soil moisture.</li>
          <li>Contingency plan: create a list of animals to sell, animals to keep, and emergency contacts.</li>
        </ol>
        <div style="margin-top:10px"><button class="btn btn-primary" onclick="printModule()">Print Plan</button></div>`;
    } else if (tab === 'resources') {
      target.innerHTML = `<h3>Resources</h3>
        <ul>
          <li>Local KVK / State Agriculture extension (add contact)</li>
          <li>Guides: Rainwater harvesting, Farm pond construction (replace with PDFs)</li>
          <li>Insurance: Check state and central crop insurance schemes</li>
        </ul>`;
    }
  }

  function updateSectionPoster(tab) {
    try {
      if (!window.SECTION_POSTERS) return;
      const url = window.SECTION_POSTERS[tab];
      const container = document.getElementById('sectionPoster');
      const img = document.getElementById('sectionPosterImg');
      if (url && img) {
        img.src = url;
        img.style.display = '';
        if (container) container.style.display = '';
        container.setAttribute('aria-hidden', 'false');
      } else {
        if (img) { img.src = ''; img.style.display = 'none'; }
        if (container) container.style.display = 'none';
      }
    } catch (e) {
      console.warn('updateSectionPoster', e);
    }
  }

  // --- Checklist modal ---
  function openChecklist() {
    const modal = document.getElementById('checklistModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchChecklistTab('overview');
    loadChecklistProgress();
  }
  function closeChecklist() {
    const modal = document.getElementById('checklistModal');
    if (!modal) return;
    modal.style.display = 'none';
  }

  function switchChecklistTab(tab) {
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="small">Mark items as done and Save. Progress is stored on this device for offline use. Use Print to create a community copy.</p>`;
    } else if (tab === 'before' || tab === 'during' || tab === 'after') {
      const arr = MODULE[tab];
      content.innerHTML = `<h3>${tab.charAt(0).toUpperCase() + tab.slice(1)}</h3>` + arr.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
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
    const inputs = Array.from(document.querySelectorAll('#checklistContent input[type="checkbox"]'));
    const state = inputs.map(i => i.checked);
    localStorage.setItem(CHECK_KEY, JSON.stringify(state));
    alert('Checklist progress saved locally on this device.');
  }

  function loadChecklistProgress() {
    setTimeout(() => {
      try {
        const raw = localStorage.getItem(CHECK_KEY);
        if (!raw) return;
        const arr = JSON.parse(raw);
        const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
        inputs.forEach((ch, idx) => {
          ch.checked = !!arr[idx];
          ch.addEventListener('change', () => {
            const all = Array.from(document.querySelectorAll('#checklistContent input[type="checkbox"]')).map(c => c.checked);
            localStorage.setItem(CHECK_KEY, JSON.stringify(all));
          });
        });
      } catch (e) { console.warn('loadChecklist', e); }
    }, 60);
  }

  function restoreCheckedState() {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      document.querySelectorAll('#checklistContent input[type="checkbox"]').forEach((ch, idx) => ch.checked = !!arr[idx]);
    } catch (e) { console.warn('restoreCheckedState', e); }
  }

  function printChecklist() {
    const title = document.getElementById('checklistTitle').innerText;
    const contentHtml = document.getElementById('checklistContent').innerHTML;
    const win = window.open('', '', 'width=700,height=900');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px;} .checklist-item{margin-bottom:8px;}</style></head><body><h2>${title}</h2>${contentHtml}</body></html>`);
    win.document.close();
    win.print();
  }

  async function shareChecklist() {
    if (!navigator.share) {
      alert('Share not supported on this device. Use Print or save locally.');
      return;
    }
    const title = document.getElementById('checklistTitle').innerText;
    const text = Array.from(document.querySelectorAll('#checklistContent label')).map(l => l.innerText).join('\n');
    try { await navigator.share({ title, text }); } catch (e) { console.warn('share failed', e); }
  }

  // --- Quiz ---
  function renderQuiz() {
    const wrap = document.getElementById('quizWrap');
    if (!wrap) return;
    wrap.innerHTML = MODULE.quiz.map((Q, i) => `
      <div class="quiz-question" data-idx="${i}">
        <p style="font-weight:700">Q${i + 1}. ${Q.q}</p>
        <div class="quiz-options">
          ${Q.a.map((opt, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`).join('')}
        </div>
      </div>
    `).join('') + `<div style="margin-top:10px"><button class="submit-btn btn-primary" id="submitQuizBtn">Submit</button> <button class="btn btn-ghost" id="clearQuizBtn">Clear</button></div>
    <div id="quizResult" style="margin-top:10px;font-weight:700"></div>`;

    // restore saved
    const saved = localStorage.getItem(QUIZ_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data && data.ans) {
          Object.keys(data.ans).forEach(k => {
            const el = document.querySelector(`input[name="${k}"][value="${data.ans[k]}"]`);
            if (el) el.checked = true;
          });
          document.getElementById('quizResult').innerText = data.msg || '';
        }
      } catch (e) {}
    }

    document.getElementById('submitQuizBtn').addEventListener('click', submitQuiz);
    document.getElementById('clearQuizBtn').addEventListener('click', clearQuiz);
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
    if (pct === 100) msg += 'Excellent — you understand key drought steps.';
    else if (pct >= 70) msg += 'Good — review missed items.';
    else msg += 'Review the module and practice the drills again.';
    document.getElementById('quizResult').innerText = msg;
    // save answers
    const ans = {};
    MODULE.quiz.forEach((_, i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      ans['q' + i] = sel ? sel.value : null;
    });
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ ans, correct, total, pct, msg }));
  }

  function clearQuiz() {
    MODULE.quiz.forEach((_, i) => {
      document.querySelectorAll(`input[name="q${i}"]`).forEach(s => s.checked = false);
    });
    document.getElementById('quizResult').innerText = '';
    localStorage.removeItem(QUIZ_KEY);
  }

  // --- Stories modal ---
  function openStory(e, id) {
    if (e) e.preventDefault();
    const title = (id === 1) ? 'Marathwada: millets adoption' : 'Telangana: farm ponds';
    const body = (id === 1) ? 'Farmers shifted to millets and pulses, reducing water needs and stabilising income.' :
      'Communities built/rehabilitated farm ponds and stored water for critical needs.';
    document.getElementById('storyModalTitle').innerText = title;
    document.getElementById('storyModalBody').innerText = body;
    const modal = document.getElementById('storyModal');
    if (modal) modal.style.display = 'flex';
  }
  function closeStory() {
    const modal = document.getElementById('storyModal');
    if (modal) modal.style.display = 'none';
  }

  // --- print module (basic) ---
  function printModule() {
    const title = document.getElementById('title').innerText;
    const wrap = document.querySelector('.wrap');
    const content = wrap ? wrap.innerHTML : '';
    const win = window.open('', '', 'width=900,height=1000');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px} h1{color:#114}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close();
    win.print();
  }

  // --- FAQ toggle ---
  function toggleFaq(el) {
    const a = el.nextElementSibling;
    if (!a) return;
    a.style.display = (a.style.display === 'block') ? 'none' : 'block';
  }

  // --- Disaster alert integration (safe) ---
  function updateDisasterAlertFromWeather(data) {
    if (!data || typeof data !== 'object') return;
    let temp = data.temp ?? data.temperature ?? null;
    let rain = data.rain ?? data.rainfall ?? 0;
    let desc = data.description ?? data.weather ?? '';
    temp = (typeof temp === 'string') ? parseFloat(temp) : temp;
    rain = (typeof rain === 'string') ? parseFloat(rain) : rain;

    const bar = document.getElementById('disaster-alert-bar');
    const aText = document.getElementById('alertText');
    const aIcon = document.getElementById('alertIcon');

    bar.className = 'alert-normal';
    aIcon.innerText = '🟢';
    aText.innerText = 'No drought alert. Monitor rainfall & water levels.';

    // Very simple drought heuristic: low recent rainfall + high temp
    if ((rain !== null && rain < 5 && temp !== null && temp >= 38) || (/dry|drought|no rain/i.test(String(desc)))) {
      bar.className = 'alert-warning';
      aIcon.innerText = '🌞';
      aText.innerText = 'Dry conditions detected. Activate water-saving steps.';
    }
    bar.style.transform = '';
    bar.style.opacity = '1';
  }

  // --- bootstrap / init ---
  document.addEventListener('DOMContentLoaded', function () {
    // default tab
    renderTab('before');
    updateSectionPoster('before');

    // hook up buttons
    const openChecklistBtn = document.getElementById('openChecklistBtn');
    if (openChecklistBtn) openChecklistBtn.addEventListener('click', openChecklist);
    const openChecklistBtn2 = document.getElementById('openChecklistBtn2');
    if (openChecklistBtn2) openChecklistBtn2.addEventListener('click', openChecklist);

    // checklist tab buttons (delegated)
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.addEventListener('click', function () { switchChecklistTab(t.dataset.tab); }));

    // render quiz
    renderQuiz();

    // story modal close handlers
    document.querySelectorAll('.story-backdrop, .story-box .btn').forEach(el => el.addEventListener('click', closeStory));

    // dismiss alert button
    const dismiss = document.getElementById('dismissAlert');
    if (dismiss) {
      dismiss.addEventListener('click', function () {
        const bar = document.getElementById('disaster-alert-bar');
        if (!bar) return;
        bar.style.transform = 'translateY(-110%)';
        setTimeout(() => { bar.style.opacity = '0'; }, 260);
      });
      dismiss.addEventListener('keyup', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') dismiss.click(); });
    }

    // share checklist binding
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareChecklist);

    // expose helpers (optional)
    window.switchTab = switchTab;
    window.openChecklist = openChecklist;
    window.closeChecklist = closeChecklist;
    window.switchChecklistTab = switchChecklistTab;
    window.saveChecklistProgress = saveChecklistProgress;
    window.printChecklist = printChecklist;
    window.printModule = printModule;
    window.toggleFaq = toggleFaq;
    window.updateDisasterAlertFromWeather = updateDisasterAlertFromWeather;
    window.openStory = openStory;
    window.closeStory = closeStory;
  });

})();
