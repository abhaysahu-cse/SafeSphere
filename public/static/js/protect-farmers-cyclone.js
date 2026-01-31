/* protect-farmers-cyclone.js
   Interactive behavior for Cyclone module (tabs, checklist, practice DnD, quiz, poster swap, alert)
   Place under static/js/protect-farmers-cyclone.js
*/
(function () {
  // Practical, researched content oriented for farmers
  const MODULE = {
    before: [
      "Secure roofs: tie down sheet roofing with ropes or cross-bracing; anchor loose roof sheets.",
      "Move stored seed, fertilizers and tools to upper floors or sealed, raised platforms.",
      "Trim or remove dead/weak branches close to houses and animal shelters.",
      "Tie or anchor fuel drums and pesticides in a sheltered spot away from water sources.",
      "Arrange transport for livestock to community high ground or shelter if possible.",
      "Harvest high-value or near-mature crops if there's time and safe access."
    ],
    during: [
      "Stay in a strong room/shelter away from windows and glass.",
      "Do not go outside while high winds are blowing or during the eye’s passage — wait until authorities announce it is safe.",
      "Turn off electricity and gas; avoid using open flames if gas smell is present.",
      "Keep emergency kit (torch, medicines, documents) and a whistle to signal rescuers.",
      "If water is rising, move to the highest safe point inside the shelter or a roof only when commanded by rescue teams."
    ],
    after: [
      "Do not re-enter damaged buildings until an authority or engineer confirms they are safe.",
      "Document damage with photos for relief & insurance claims.",
      "Clear debris carefully; look out for downed power lines and blocked drains.",
      "Dry and clean stored grains; discard material contaminated by oil/fuel.",
      "Check livestock for injuries and dehydration; arrange veterinarian care as needed.",
      "Coordinate community recovery: communal tools, fuel sharing & debris clearance."
    ],
    checklist: [
      "Roof anchoring prepared (ropes, battens)",
      "Seed & grain moved to raised storage",
      "Animal shelter identified & transport arranged",
      "Tools & fuel anchored or stored safely",
      "Emergency bag ready (medicines, papers, torch, whistle)",
      "Community contact tree & tractor/boat info recorded"
    ],
    quiz: [
      { q: "What is the immediate action for roofs before strong winds arrive?", a: ["Remove sheets", "Tie/anchor roofing sheets and battens", "Paint the roof"], correct: 1 },
      { q: "During the cyclone, where is the safest place to be?", a: ["Near windows to watch", "In a strong shelter away from windows", "Under a tree"], correct: 1 },
      { q: "After the cyclone, what should you NOT do?", a: ["Check for downed wires before touching", "Re-enter unsafe buildings immediately", "Document damage by photos"], correct: 1 }
    ]
  };

  // Poster swap helper (reads window.SECTION_POSTERS provided in HTML)
  function updateSectionPoster(tab) {
    try {
      const map = window.SECTION_POSTERS || {};
      const url = map[tab];
      const container = document.getElementById('sectionPoster');
      const img = document.getElementById('sectionPosterImg');
      if (url && img) {
        img.src = url;
        img.style.display = '';
        container.setAttribute('aria-hidden', 'false');
      } else {
        if (img) { img.src = ''; img.style.display = 'none'; }
        if (container) container.setAttribute('aria-hidden', 'true');
      }
    } catch (e) { console.warn('updateSectionPoster', e); }
  }

  // Tabs
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
      target.innerHTML = `<h3>${capitalize(tab)}</h3>` + arr.map(i => `<div class="step">• ${i}</div>`).join('');
    } else if (tab === 'practice') {
      target.innerHTML = `<h3>Practice: Secure & Prioritise</h3>
        <p class="small">Drag items from the palette into the secure zone. Top slot = highest priority to secure before strong winds arrive.</p>
        <div class="practice-wrap" style="margin-top:10px">
          <div class="palette-col"><strong>Palette</strong><div id="paletteItems"></div></div>
          <div class="secure-col" id="secureZone" tabindex="0"><em class="small">Drop here: items to secure first</em></div>
        </div>
        <p style="margin-top:8px"><button class="btn btn-primary" id="practiceCheck">Check</button> <button class="btn btn-ghost" id="practiceReset">Reset</button></p>
        <div id="practiceResult" style="margin-top:8px;font-weight:700"></div>`;
      initPracticeDnD();
    } else if (tab === 'resources') {
      target.innerHTML = `<h3>Resources</h3>
        <ul>
          <li><a href="#" onclick="event.preventDefault()">IMD & local cyclone advisories — best practice links (replace with PDFs)</a></li>
          <li><a href="#" onclick="event.preventDefault()">Roof-tying how-to (diagrams & short video)</a></li>
          <li><a href="#" onclick="event.preventDefault()">Community shelter conversion checklist</a></li>
        </ul>`;
    } else {
      target.innerHTML = '<p class="small">Section not available.</p>';
    }
  }

  // Practice DnD (secure items)
  function initPracticeDnD() {
    const palette = document.getElementById('paletteItems');
    const secureZone = document.getElementById('secureZone');
    const items = [
      { id: 'roof', label: 'Tie roofs / loose sheets' },
      { id: 'seed', label: 'Move seeds & grains to raised area' },
      { id: 'animals', label: 'Move animals to shelter' },
      { id: 'tools', label: 'Anchor tools & pumps' },
      { id: 'fuel', label: 'Secure fuel & chemicals' },
      { id: 'trees', label: 'Trim/clear weak branches' }
    ];
    palette.innerHTML = items.map(it => `<div class="dnd-item" draggable="true" data-id="${it.id}">${it.label}</div>`).join('');

    secureZone.addEventListener('dragover', ev => { ev.preventDefault(); secureZone.classList.add('dragover'); });
    secureZone.addEventListener('dragleave', () => secureZone.classList.remove('dragover'));
    secureZone.addEventListener('drop', ev => {
      ev.preventDefault();
      secureZone.classList.remove('dragover');
      const id = ev.dataTransfer.getData('text/plain');
      if (!id) return;
      if (secureZone.querySelector(`[data-id="${id}"]`)) return;
      const el = document.querySelector(`.dnd-item[data-id="${id}"]`);
      const clone = el.cloneNode(true);
      clone.classList.add('dnd-placed');
      clone.draggable = true;
      secureZone.appendChild(clone);
      addReordering(clone);
    });

    document.querySelectorAll('.dnd-item').forEach(el => {
      el.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', el.dataset.id));
    });

    document.getElementById('practiceCheck').addEventListener('click', function () {
      const placed = Array.from(document.querySelectorAll('#secureZone .dnd-placed')).map(x => x.dataset.id);
      const correct = ['roof', 'seed', 'animals', 'tools']; // top priorities
      let score = 0;
      for (let i = 0; i < Math.min(4, placed.length); i++) if (placed[i] === correct[i]) score++;
      document.getElementById('practiceResult').innerText = `Top-4 correct: ${score}/4`;
    });

    document.getElementById('practiceReset').addEventListener('click', function () {
      secureZone.innerHTML = `<em class="small">Drop here: items to secure first</em>`;
      document.getElementById('practiceResult').innerText = '';
    });

    // reordering helper
    function addReordering(el) {
      el.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', el.dataset.id); el.classList.add('dragging'); });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      const container = document.getElementById('secureZone');
      container.addEventListener('dragover', ev => {
        ev.preventDefault();
        const after = getDragAfterElement(container, ev.clientY);
        const dragging = document.querySelector('.dnd-placed.dragging');
        if (!dragging) return;
        if (after == null) container.appendChild(dragging);
        else container.insertBefore(dragging, after);
      });
    }
    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.dnd-placed:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }

  // Checklist modal
  const CHECK_KEY = 'safesphere_cyclone_check_v1';
  function openChecklist() {
    const modal = document.getElementById('checklistModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchChecklistTab('overview');
    loadChecklistProgress();
  }
  function closeChecklist() { const modal = document.getElementById('checklistModal'); if (modal) modal.style.display = 'none'; }

  function switchChecklistTab(tab) {
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="small">Checklist helps confirm key actions before, during and after cyclones. Save progress locally and Print for distribution.</p>`;
    } else if (tab === 'before' || tab === 'during' || tab === 'after') {
      const arr = MODULE[tab];
      content.innerHTML = `<h3>${capitalize(tab)}</h3>` + arr.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
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
    alert('Checklist progress saved locally.');
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
    } catch (e) { console.warn('restore', e); }
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
    if (!navigator.share) { alert('Share not supported — use Print or Save locally.'); return; }
    const title = document.getElementById('checklistTitle').innerText;
    const text = Array.from(document.querySelectorAll('#checklistContent label')).map(l => l.innerText).join('\n');
    try { await navigator.share({ title, text }); } catch (e) { console.warn('share', e); }
  }

  // Quiz
  const QUIZ_KEY = 'safesphere_cyclone_quiz_v1';
  function renderQuiz() {
    const wrap = document.getElementById('quizWrap');
    if (!wrap) return;
    wrap.innerHTML = MODULE.quiz.map((Q, i) => `
      <div class="quiz-question" data-idx="${i}">
        <p style="font-weight:700">Q${i+1}. ${Q.q}</p>
        <div class="quiz-options">
          ${Q.a.map((opt, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`).join('')}
        </div>
      </div>
    `).join('') + `<div style="margin-top:10px"><button class="submit-btn btn-primary" id="submitQuizBtn">Submit</button>
    <button class="btn btn-ghost" id="clearQuizBtn">Clear</button></div>
    <div id="quizResult" style="margin-top:10px;font-weight:700"></div>`;

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
    if (pct === 100) msg += 'Excellent — you understand cyclone safety.';
    else if (pct >= 70) msg += 'Good — review missed items.';
    else msg += 'Review the module and practice drills again.';
    document.getElementById('quizResult').innerText = msg;
    const ans = {};
    MODULE.quiz.forEach((_, i) => { const sel = document.querySelector(`input[name="q${i}"]:checked`); ans['q' + i] = sel ? sel.value : null; });
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ ans, correct, total, pct, msg }));
  }
  function clearQuiz() {
    MODULE.quiz.forEach((_, i) => document.querySelectorAll(`input[name="q${i}"]`).forEach(s => s.checked = false));
    document.getElementById('quizResult').innerText = '';
    localStorage.removeItem(QUIZ_KEY);
  }

  // Stories modal
  function openStory(e, id) {
    if (e) e.preventDefault();
    const title = (id === 1) ? 'Tied roofs reduced damage — summary' : 'Community shelter success — summary';
    const body = (id === 1) ? 'Households that tied their roofs and removed loose items suffered far less damage.' : 'Community shelters saved people and stored seed on raised racks; quick coordination helped recovery.';
    document.getElementById('storyModalTitle').innerText = title;
    document.getElementById('storyModalBody').innerText = body;
    document.getElementById('storyModal').style.display = 'flex';
  }
  function closeStory() { document.getElementById('storyModal').style.display = 'none'; }

  // Print module
  function printModule() {
    const title = document.getElementById('title').innerText;
    const content = document.querySelector('.wrap').innerHTML;
    const win = window.open('', '', 'width=900,height=1000');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px} h1{color:#0b558f}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close();
    win.print();
  }

  // FAQ toggle
  function toggleFaq(el) {
    const a = el.nextElementSibling;
    if (!a) return;
    a.style.display = (a.style.display === 'block') ? 'none' : 'block';
  }

  // Alert integration: wind & storm heuristics
  function updateDisasterAlertFromWeather(data) {
    if (!data || typeof data !== 'object') return;
    let wind = data.wind ?? data.wind_speed ?? 0;
    let desc = data.description ?? data.weather ?? '';
    wind = (typeof wind === 'string') ? parseFloat(wind) : wind;
    const bar = document.getElementById('disaster-alert-bar');
    const aText = document.getElementById('alertText');
    const aIcon = document.getElementById('alertIcon');

    bar.className = 'alert-normal'; aIcon.innerText = '🟢'; aText.innerText = 'Weather is normal. Monitor cyclone alerts.';
    // Simple thresholds (units flexible; call with consistent units)
    // If wind reported in km/h: moderate risk > 60 km/h, severe > 100 km/h
    if (wind >= 100) {
      bar.className = 'alert-danger'; aIcon.innerText = '🚨'; aText.innerText = 'Severe wind alert! Evacuate/seek shelter immediately.';
    } else if (wind >= 60 || (desc && /storm|cyclone|gale/i.test(desc))) {
      bar.className = 'alert-warning'; aIcon.innerText = '🌪️'; aText.innerText = 'Strong wind / storm risk. Secure loose items and move to shelter.';
    }
    bar.style.transform = ''; bar.style.opacity = '1';
  }

  // small util
  function capitalize(s) { return s && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // bootstrap / init
  document.addEventListener('DOMContentLoaded', function () {
    renderTab('before');
    updateSectionPoster('before');

    // attach buttons
    const openBtn = document.getElementById('openChecklistBtn'); if (openBtn) openBtn.addEventListener('click', openChecklist);
    const openBtn2 = document.getElementById('openChecklistBtn2'); if (openBtn2) openBtn2.addEventListener('click', openChecklist);

    // checklist tabs delegation
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.addEventListener('click', () => switchChecklistTab(t.dataset.tab)));

    // render quiz
    renderQuiz();

    // story modal close bindings
    document.querySelectorAll('.story-backdrop, .story-box .btn').forEach(el => { if (el) el.addEventListener('click', closeStory); });

    // dismiss alert
    const dismiss = document.getElementById('dismissAlert');
    if (dismiss) {
      dismiss.addEventListener('click', function () {
        const bar = document.getElementById('disaster-alert-bar');
        bar.style.transform = 'translateY(-110%)';
        setTimeout(() => { bar.style.opacity = '0'; }, 260);
      });
      dismiss.addEventListener('keyup', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') dismiss.click(); });
    }

    // share checklist
    const shareBtn = document.getElementById('shareBtn'); if (shareBtn) shareBtn.addEventListener('click', shareChecklist);

    // expose functions
    window.switchTab = switchTab;
    window.openChecklist = openChecklist;
    window.closeChecklist = closeChecklist;
    window.switchChecklistTab = switchChecklistTab;
    window.printChecklist = printChecklist;
    window.printModule = printModule;
    window.toggleFaq = toggleFaq;
    window.openStory = openStory;
    window.closeStory = closeStory;
    window.updateDisasterAlertFromWeather = updateDisasterAlertFromWeather;
  });

})();
