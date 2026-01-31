/* protect-households-flood.js
   Behavior for the Household Flood module:
   - Tab switching
   - Poster swapping per-tab
   - Checklist modal (save/load/print/share)
   - Quiz rendering & scoring (saved to localStorage)
   - Drag & drop practice
   - Poster lightbox
   - Disaster alert update hook
*/

(function () {
  // --- Data (detailed content used by checklist and quiz) ---
  const DATA = {
    checklist: [
      "Household emergency plan and meeting point",
      "Emergency bags for each person (water, meds, ID, torch, powerbank)",
      "Sealed waterproof box with documents & copies",
      "Raised pallets / plinth for seed & food",
      "Secure pumps & small machinery",
      "Chlorine tablets and basic first aid kit",
      "Community boat/tractor roster noted"
    ],
    quiz: [
      { q: "What is the first priority when a flood warning arrives?", a: ["Move documents", "Move people (elderly/children) to safe place", "Secure tools"], correct: 1 },
      { q: "Where should important documents be kept?", a: ["On the ground", "In sealed waterproof box on a high shelf/roof", "Inside a freezer"], correct: 1 },
      { q: "After a flood, before using electricity you should:", a: ["Switch on immediately", "Call an electrician to inspect", "Pour water into sockets"], correct: 1 }
    ]
  };

  // --- Utility ---
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // --- Tabs & Poster swapping ---
  function initTabs() {
    qsa('.tabs .tab').forEach(tab => {
      tab.addEventListener('click', function () {
        const t = tab.dataset.tab;
        switchTab(t);
      });
    });
    // initial activation
    const active = qs('.tabs .tab.active') || qs('.tabs .tab[data-tab="preparation"]');
    if (active) switchTab(active.dataset.tab || 'preparation');
  }

  function switchTab(tab) {
    // switch tab buttons
    qsa('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    // switch content
    qsa('.tab-content').forEach(c => {
      c.classList.toggle('active', c.dataset.tab === tab);
    });
    // update poster
    updateSectionPoster(tab);
    // smooth scroll to module area
    const moduleArea = qs('.content');
    if (moduleArea) moduleArea.scrollIntoView({ behavior: 'smooth' });
  }

  // Poster swap using data attributes on image
  function updateSectionPoster(tab) {
    const img = qs('#sectionPosterImg');
    if (!img) return;
    try {
      const url = img.getAttribute('data-' + tab);
      if (url) {
        img.src = url;
        img.style.display = '';
        img.removeAttribute('aria-hidden');
      } else {
        img.style.display = 'none';
        img.setAttribute('aria-hidden', 'true');
      }
    } catch (e) { console.warn('poster swap error', e); }
  }

  // Poster lightbox
  function initPosterViewer() {
    const viewBtn = qs('#viewPosterBtn');
    const posterWrapImg = qs('#sectionPosterImg');
    viewBtn && viewBtn.addEventListener('click', function () {
      const src = posterWrapImg && posterWrapImg.src;
      if (!src) return alert('Poster not available yet.');
      qs('#posterLarge').src = src;
      qs('#posterLightbox').style.display = 'flex';
    });
    qs('.lightbox .backdrop') && qs('.lightbox .backdrop').addEventListener('click', closePoster);
  }
  function closePoster() {
    qs('#posterLightbox').style.display = 'none';
    qs('#posterLarge').src = '';
  }

  // --- Checklist modal ---
  const CHECK_KEY = 'safesphere_household_check_v1';
  function openChecklist() {
    const modal = qs('#checklistModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchChecklistTab('overview');
  }
  function closeChecklist() {
    const modal = qs('#checklistModal');
    if (!modal) return;
    modal.style.display = 'none';
  }

  function switchChecklistTab(tab) {
    qsa('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = qs('#checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="muted">Checklist helps you confirm the most important steps: people first, documents, assets, sanitation. Mark items and Save — progress is stored on this device.</p>`;
    } else if (tab === 'before') {
      content.innerHTML = `<h3>Before</h3><ul>${DATA.checklist.slice(0,4).map(i => `<li>${i}</li>`).join('')}</ul>`;
    } else if (tab === 'during') {
      content.innerHTML = `<h3>During</h3><ul><li>Move people to safe place</li><li>Keep drinking water sealed</li><li>Avoid moving water</li></ul>`;
    } else if (tab === 'after') {
      content.innerHTML = `<h3>After</h3><ul><li>Document damage (photos)</li><li>Dry & disinfect goods</li><li>Call extension services for seed support</li></ul>`;
    } else if (tab === 'list') {
      content.innerHTML = DATA.checklist.map((it, idx) => `
        <div class="checklist-item">
          <input id="chk_${idx}" type="checkbox">
          <label for="chk_${idx}">${it}</label>
        </div>
      `).join('');
      restoreCheckedState();
    }
  }

  function saveChecklistProgress() {
    const checks = qsa('#checklistContent input[type="checkbox"]').map(c => c.checked);
    localStorage.setItem(CHECK_KEY, JSON.stringify({ checks: checks, ts: Date.now() }));
    alert('Checklist saved locally on this device.');
  }

  function restoreCheckedState() {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      const arr = obj.checks || [];
      qsa('#checklistContent input[type="checkbox"]').forEach((ch, i) => {
        ch.checked = !!arr[i];
        ch.addEventListener('change', function () {
          const cur = qsa('#checklistContent input[type="checkbox"]').map(c => c.checked);
          localStorage.setItem(CHECK_KEY, JSON.stringify({ checks: cur, ts: Date.now() }));
        });
      });
    } catch (e) { console.warn('restore checklist', e); }
  }

  function printChecklist() {
    const title = qs('#checklistTitle').innerText || 'Checklist';
    const contentHtml = qs('#checklistContent').innerHTML;
    const win = window.open('', '', 'width=700,height=900');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px;} .checklist-item{margin-bottom:8px;}</style></head><body><h2>${title}</h2>${contentHtml}</body></html>`);
    win.document.close();
    win.print();
  }

  // share checklist
  async function shareChecklist() {
    if (!navigator.share) return alert('Share not supported. Use Print instead.');
    const text = qsa('#checklistContent label').map(l => l.innerText).join('\n');
    try { await navigator.share({ title: 'Household Flood Checklist', text }); } catch (e) { console.warn('share fail', e); }
  }

  // --- Quiz ---
  const QUIZ_KEY = 'safesphere_household_quiz_v1';
  function renderQuiz() {
    const wrap = qs('#quizWrap');
    if (!wrap) return;
    wrap.innerHTML = DATA.quiz.map((Q, i) => `
      <div class="quiz-q" data-idx="${i}">
        <p><strong>Q${i+1}:</strong> ${Q.q}</p>
        <div class="quiz-options">
          ${Q.a.map((opt, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`).join('')}
        </div>
      </div>
    `).join('') + `<div style="margin-top:10px"><button class="btn btn-primary" id="submitQuiz">Submit</button> <button class="btn btn-ghost" id="clearQuiz">Clear</button></div><div id="quizResult" style="margin-top:10px;font-weight:700"></div>`;

    // restore saved answers
    const saved = localStorage.getItem(QUIZ_KEY);
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        if (obj.ans) {
          Object.keys(obj.ans).forEach(k => {
            const el = qs(`input[name="${k}"][value="${obj.ans[k]}"]`);
            if (el) el.checked = true;
          });
          qs('#quizResult').innerText = obj.msg || '';
        }
      } catch (e) {}
    }

    qs('#submitQuiz') && qs('#submitQuiz').addEventListener('click', submitQuiz);
    qs('#clearQuiz') && qs('#clearQuiz').addEventListener('click', clearQuiz);
  }

  function submitQuiz() {
    const results = DATA.quiz.map((Q, i) => {
      const sel = qs(`input[name="q${i}"]:checked`);
      const val = sel ? parseInt(sel.value, 10) : null;
      return { correct: Q.correct === val, selected: val };
    });
    const correct = results.filter(r => r.correct).length;
    const total = DATA.quiz.length;
    const pct = Math.round((correct / total) * 100);
    let msg = `Score: ${correct} / ${total} (${pct}%) — `;
    if (pct === 100) msg += 'Excellent — you understand the key points.';
    else if (pct >= 70) msg += 'Good — review missed areas.';
    else msg += 'Review the module and practice drills again.';
    qs('#quizResult').innerText = msg;
    // save
    const ans = {};
    DATA.quiz.forEach((_, i) => {
      const sel = qs(`input[name="q${i}"]:checked`);
      ans['q' + i] = sel ? sel.value : null;
    });
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ ans, correct, total, pct, msg }));
  }

  function clearQuiz() {
    DATA.quiz.forEach((_, i) => qsa(`input[name="q${i}"]`).forEach(r => r.checked = false));
    qs('#quizResult') && (qs('#quizResult').innerText = '');
    localStorage.removeItem(QUIZ_KEY);
  }

  // --- Drag & Drop practice ---
  function initDnD() {
    const palette = qs('#paletteItems');
    const saveZone = qs('#saveZone');
    const dataItems = [
      { id: 'seedbags', label: 'Seed bags' },
      { id: 'livestock', label: 'Livestock' },
      { id: 'pump', label: 'Pump & motor' },
      { id: 'documents', label: 'Documents' },
      { id: 'tools', label: 'Small tools' },
      { id: 'tractor', label: 'Tractor' }
    ];
    if (palette) palette.innerHTML = dataItems.map(it => `<div class="dnd-item" draggable="true" data-id="${it.id}">${it.label}</div>`).join('');

    saveZone && saveZone.addEventListener('dragover', ev => { ev.preventDefault(); saveZone.classList.add('dragover'); });
    saveZone && saveZone.addEventListener('dragleave', () => saveZone.classList.remove('dragover'));
    saveZone && saveZone.addEventListener('drop', ev => {
      ev.preventDefault();
      saveZone.classList.remove('dragover');
      const id = ev.dataTransfer.getData('text/plain');
      if (!id) return;
      if (saveZone.querySelector(`[data-id="${id}"]`)) return;
      const el = qs(`.dnd-item[data-id="${id}"]`);
      if (!el) return;
      const clone = el.cloneNode(true);
      clone.classList.add('dnd-item-placed');
      clone.draggable = false;
      clone.removeAttribute('draggable');
      saveZone.appendChild(clone);
    });
    // palette dragstart
    qsa('.dnd-item').forEach(el => el.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', el.dataset.id)));

    qs('#dndCheckBtn') && qs('#dndCheckBtn').addEventListener('click', function () {
      const placed = qsa('#saveZone .dnd-item-placed').map(x => x.dataset.id);
      const correct = ['seedbags', 'livestock', 'pump', 'documents'];
      const score = placed.filter(p => correct.includes(p)).length;
      const pct = Math.round((score / correct.length) * 100);
      qs('#dndResult').innerText = `You placed ${score}/${correct.length} high-priority items (${pct}%).`;
    });
    qs('#dndResetBtn') && qs('#dndResetBtn').addEventListener('click', function () {
      if (qs('#saveZone')) qs('#saveZone').innerHTML = `<em class="muted">Drop here: items to save first</em>`;
      qs('#dndResult').innerText = '';
    });
  }

  // --- Disaster alert integration (non-blocking) ---
  function updateDisasterAlertFromWeather(data) {
    if (!data || typeof data !== 'object') return;
    let temp = data.temp ?? data.temperature ?? null;
    let wind = data.wind ?? data.wind_speed ?? 0;
    let desc = data.description ?? data.weather ?? '';
    temp = (typeof temp === 'string') ? parseFloat(temp) : temp;
    wind = (typeof wind === 'string') ? parseFloat(wind) : wind;

    const bar = qs('#disaster-alert-bar');
    const aText = qs('#alertText');
    const aIcon = qs('#alertIcon');
    bar.className = 'alert-normal';
    aIcon.innerText = '🟢';
    aText.innerText = 'Weather is normal. Stay prepared.';

    if ((desc && /rain|flood|storm/i.test(desc)) || (wind >= 12 && temp <= 22)) {
      bar.className = 'alert-warning';
      aIcon.innerText = '🌧️';
      aText.innerText = 'Heavy rain / flood risk. Move valuables & animals to higher ground.';
    }
    if (data.water_level && data.water_level >= 1.0) {
      bar.className = 'alert-danger';
      aIcon.innerText = '🚨';
      aText.innerText = 'Severe flood alert! Evacuate to safe shelter now.';
    }
    bar.style.transform = '';
    bar.style.opacity = '1';
  }

  // --- init ---
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initPosterViewer();
    // checklist buttons
    qs('#openChecklistBtn') && qs('#openChecklistBtn').addEventListener('click', openChecklist);
    qsa('[onclick="openChecklist()"]').forEach(b => b.addEventListener('click', openChecklist)); // other open buttons
    // checklist inner tabs
    qsa('.tabs-inner .tab').forEach(t => t.addEventListener('click', function () { switchChecklistTab(t.dataset.tab); }));

    qs('#shareBtn') && qs('#shareBtn').addEventListener('click', shareChecklist);
    qs('#dismissAlert') && qs('#dismissAlert').addEventListener('click', function () {
      const bar = qs('#disaster-alert-bar');
      bar.style.transform = 'translateY(-110%)';
      setTimeout(() => bar.style.opacity = '0', 260);
    });

    // quiz
    renderQuiz();

    // DnD practice
    initDnD();

    // story modal close handlers (if added)
    if (qs('#storyModal')) {
      qsa('#storyModal .btn, #storyModal .backdrop').forEach(el => el.addEventListener('click', () => qs('#storyModal').style.display = 'none'));
    }

    // Expose hooks
    window.updateDisasterAlertFromWeather = updateDisasterAlertFromWeather;
    window.openChecklist = openChecklist;
    window.closeChecklist = closeChecklist;
    window.switchTab = switchTab;
    window.switchChecklistTab = switchChecklistTab;
    window.printChecklist = printChecklist;
    window.saveChecklistProgress = saveChecklistProgress;
    window.printModule = function () {
      window.print();
    };
  });

})();
