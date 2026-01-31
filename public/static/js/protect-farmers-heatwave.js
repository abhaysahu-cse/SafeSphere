/* protect-farmers-heatwave.js
   Interactive behavior for Heatwave — Farmers module
   Place under static/js/protect-farmers-heatwave.js
*/
(function () {
  // Module content (research-based, practical)
  const MODULE = {
    before: [
      "Store extra drinking water for people and animals; fill containers and keep cool.",
      "Provide shade: nets, tarpaulins or temporary sheds for seedlings and livestock.",
      "Mulch fields to reduce evaporation and keep soil moisture (straw, leaves).",
      "Adjust irrigation schedule: water early morning or late evening to reduce evaporation loss.",
      "Plan early harvest for sensitive crops if heat stress forecasted (consult market timing).",
      "Prepare cooling points for animals (shaded water troughs, shallow pools).",
      "Check and protect cold-chain items (vaccines, medicines) and fuel for pumps."
    ],
    during: [
      "Avoid field work during peak heat (10:00–16:00); schedule tasks early morning/late evening.",
      "Keep livestock shaded and provide frequent, small amounts of cool water.",
      "Use mulching / light shade for young plants; misting or sprinklers for high-value crops if water allows.",
      "Do not mix heavy work and direct sun — rotate labor and ensure rest & fluids.",
      "Monitor crop for blossom drop and sunscald; save seed from less-affected plots if possible."
    ],
    after: [
      "Assess crop damage: salvage marketable portions, dry and store produce safely.",
      "Rehydrate soils: apply gentle irrigation and use soil conditioners to restore structure.",
      "Check animals for heat-related illness; provide electrolytes and veterinary care for stressed stock.",
      "Plan replanting on less-affected plots; consider tolerant varieties for next season.",
      "Document losses and immediate needs for KVK/relief applications."
    ],
    checklist: [
      "Reserve clean drinking water containers",
      "Shading ready for animals and seedlings (nets/tarpaulin)",
      "Mulch materials available (straw, leaves)",
      "Irrigation schedule set to early/late hours",
      "Cooling point for livestock identified",
      "Emergency contact list (vet, KVK, village leader)"
    ],
    quiz: [
      { q: "When is the best time to irrigate during a heatwave?", a: ["Midday", "Early morning / late evening", "Night only"], correct: 1 },
      { q: "What helps reduce evaporation from the field?", a: ["Mulching", "Burning residue", "Tilling heavily"], correct: 0 },
      { q: "How to protect livestock from heat stress?", a: ["Give large water once a day", "No change", "Provide shade and frequent small water"], correct: 2 }
    ]
  };

  // Poster update helper: expects window.SECTION_POSTERS mapping to be set in HTML
  function updateSectionPoster(tab) {
    try {
      const mapping = window.SECTION_POSTERS || {};
      const url = mapping[tab];
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
    document.querySelectorAll('.tabs .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    renderTab(tab);
    // update poster to match section
    updateSectionPoster(tab);
  }

  function renderTab(tab) {
    const target = document.getElementById('moduleContent');
    if (!target) return;
    if (tab === 'before' || tab === 'during' || tab === 'after') {
      const list = MODULE[tab];
      target.innerHTML = `<h3>${capitalize(tab)}</h3>` + list.map(i => `<div class="step">• ${i}</div>`).join('');
    } else if (tab === 'practice') {
      target.innerHTML = `<h3>Practice: Prioritize what to save</h3>
        <p class="small">Drag the items and order them by priority — then check to see correct priorities for heatwaves.</p>
        <div class="practice-area">
          <div class="practice-instructions small">Drag from the palette into the priority list (top = highest).</div>
          <div class="dnd-wrap" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
            <div class="palette" aria-label="Palette">
              <strong>Palette</strong>
              <div id="paletteItems" class="palette-items"></div>
            </div>
            <div class="priority-board" id="priorityBoard" aria-label="Priority board" tabindex="0">
              <em class="small">Drop here (top = save first)</em>
            </div>
          </div>
          <p style="margin-top:8px"><button class="btn btn-primary" id="practiceCheck">Check</button>
          <button class="btn btn-ghost" id="practiceReset">Reset</button></p>
          <div id="practiceResult" style="margin-top:8px;font-weight:700"></div>
        </div>`;
      initPracticeDnD();
    } else if (tab === 'resources') {
      target.innerHTML = `<h3>Resources</h3>
        <ul>
          <li><a href="#" onclick="event.preventDefault()">ICAR / KVK heatwave guidance (replace with PDF)</a></li>
          <li><a href="#" onclick="event.preventDefault()">Shade-net suppliers & low-cost shading designs</a></li>
          <li><a href="#" onclick="event.preventDefault()">Mulching materials and suppliers</a></li>
        </ul>`;
    } else {
      target.innerHTML = '<p class="small">Section not found.</p>';
    }
  }

  // Practice: drag & drop / ordering
  function initPracticeDnD() {
    const palette = document.getElementById('paletteItems');
    const board = document.getElementById('priorityBoard');
    const items = [
      { id: 'people-water', label: 'People drinking water' },
      { id: 'animal-shade', label: 'Animal shade & water' },
      { id: 'seed-storage', label: 'Seed bags / small stored grain' },
      { id: 'mulch', label: 'Mulching materials' },
      { id: 'irrigation', label: 'Irrigation scheduling' },
      { id: 'tractor', label: 'Tractor / machinery' }
    ];
    palette.innerHTML = items.map(it => `<div class="dnd-item" draggable="true" data-id="${it.id}">${it.label}</div>`).join('');

    board.addEventListener('dragover', ev => { ev.preventDefault(); board.classList.add('dragover'); });
    board.addEventListener('dragleave', () => board.classList.remove('dragover'));
    board.addEventListener('drop', ev => {
      ev.preventDefault();
      board.classList.remove('dragover');
      const id = ev.dataTransfer.getData('text/plain');
      if (!id) return;
      if (board.querySelector(`[data-id="${id}"]`)) return;
      const el = document.querySelector(`.dnd-item[data-id="${id}"]`);
      const clone = el.cloneNode(true);
      clone.classList.add('dnd-placed');
      clone.draggable = true;
      board.appendChild(clone);
      // allow reordering inside board via drag
      addReordering(clone);
    });

    document.querySelectorAll('.dnd-item').forEach(el => {
      el.addEventListener('dragstart', ev => ev.dataTransfer.setData('text/plain', el.dataset.id));
    });

    // check & reset
    document.getElementById('practiceCheck').addEventListener('click', function () {
      const placed = Array.from(document.querySelectorAll('#priorityBoard .dnd-placed')).map(x => x.dataset.id);
      // priority for heatwave: people-water, animal-shade, seed-storage, mulching, irrigation, tractor
      const correct = ['people-water', 'animal-shade', 'seed-storage', 'mulch', 'irrigation', 'tractor'];
      // score: how many in top-4 correct in order (lenient)
      let score = 0;
      for (let i = 0; i < Math.min(4, placed.length); i++) {
        if (placed[i] === correct[i]) score++;
      }
      const pct = Math.round((score / 4) * 100);
      document.getElementById('practiceResult').innerText = `Top-4 correct: ${score}/4 (${pct}%) — recommended priority shown in guidance.`;
    });

    document.getElementById('practiceReset').addEventListener('click', function () {
      document.getElementById('priorityBoard').innerHTML = `<em class="small">Drop here (top = save first)</em>`;
      document.getElementById('practiceResult').innerText = '';
    });

    // enable reordering within the board
    function addReordering(el) {
      el.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', el.dataset.id); el.classList.add('dragging'); });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      // allow drop between elements
      const board = document.getElementById('priorityBoard');
      board.addEventListener('dragover', ev => {
        ev.preventDefault();
        const after = getDragAfterElement(board, ev.clientY);
        const dragging = document.querySelector('.dnd-placed.dragging');
        if (!dragging) return;
        if (after == null) board.appendChild(dragging);
        else board.insertBefore(dragging, after);
      });
    }
    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.dnd-placed:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }

  // Checklist modal
  const CHECK_KEY = 'safesphere_heatwave_check_v1';
  function openChecklist() {
    const modal = document.getElementById('checklistModal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchChecklistTab('overview');
    loadChecklistProgress();
  }
  function closeChecklist() {
    const modal = document.getElementById('checklistModal');
    if (modal) modal.style.display = 'none';
  }
  function switchChecklistTab(tab) {
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="small">Checklist focuses on actions you can perform quickly to protect people, animals and seed stock. Save progress locally and Print to share.</p>`;
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
    alert('Checklist saved locally on this device.');
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
    if (!navigator.share) {
      alert('Share not supported on this device — use Print or Save locally.');
      return;
    }
    const title = document.getElementById('checklistTitle').innerText;
    const text = Array.from(document.querySelectorAll('#checklistContent label')).map(l => l.innerText).join('\n');
    try { await navigator.share({ title, text }); } catch (e) { console.warn('share', e); }
  }

  // Quiz
  const QUIZ_KEY = 'safesphere_heatwave_quiz_v1';
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

    // restore
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
    if (pct === 100) msg += 'Excellent — you understand the steps.';
    else if (pct >= 70) msg += 'Good — review missed items.';
    else msg += 'Review the module and practise drills again.';
    document.getElementById('quizResult').innerText = msg;
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

  // Stories modal
  function openStory(e, id) {
    if (e) e.preventDefault();
    const title = (id === 1) ? 'Shade nets saved chilli crop — summary' : 'Mulch and timed irrigation — summary';
    const body = (id === 1) ? 'A small community used shade nets and saved an entire chilli crop during a 7-day heatwave.' : 'Mulching and early-morning irrigation kept seedlings alive through peak heat period.';
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
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px} h1{color:#b45309}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close();
    win.print();
  }

  // FAQ toggle
  function toggleFaq(el) {
    const a = el.nextElementSibling;
    if (!a) return;
    a.style.display = (a.style.display === 'block') ? 'none' : 'block';
  }

  // Alert integration (simple heuristics)
  function updateDisasterAlertFromWeather(data) {
    if (!data || typeof data !== 'object') return;
    let temp = data.temp ?? data.temperature ?? null;
    let desc = data.description ?? data.weather ?? '';
    temp = (typeof temp === 'string') ? parseFloat(temp) : temp;
    const bar = document.getElementById('disaster-alert-bar');
    const aText = document.getElementById('alertText');
    const aIcon = document.getElementById('alertIcon');
    bar.className = 'alert-normal'; aIcon.innerText = '🟢'; aText.innerText = 'Weather is normal. Stay prepared.';
    if (temp !== null && temp >= 42) {
      bar.className = 'alert-danger'; aIcon.innerText = '🔥'; aText.innerText = 'Extreme heat alert! Protect people & animals — avoid outside work.';
    } else if (temp !== null && temp >= 38) {
      bar.className = 'alert-warning'; aIcon.innerText = '🌡️'; aText.innerText = 'High heat — reduce field work and use shade & water.';
    } else if (desc && /heat|heatwave/i.test(desc)) {
      bar.className = 'alert-warning'; aIcon.innerText = '🌡️'; aText.innerText = 'Heat advisory — follow heatwave checklist.';
    }
    bar.style.transform = ''; bar.style.opacity = '1';
  }

  // Small utilities
  function capitalize(s) { return s && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // Bootstrap / init hooks
  document.addEventListener('DOMContentLoaded', function () {
    // initial tab & poster
    renderTab('before');
    updateSectionPoster('before');

    // checklist open buttons
    const openBtn = document.getElementById('openChecklistBtn');
    const openBtn2 = document.getElementById('openChecklistBtn2');
    if (openBtn) openBtn.addEventListener('click', openChecklist);
    if (openBtn2) openBtn2.addEventListener('click', openChecklist);

    // checklist tab delegation (safe)
    document.querySelectorAll('.tabs-inner .tab').forEach(t => {
      t.addEventListener('click', () => switchChecklistTab(t.dataset.tab));
    });

    // render quiz
    renderQuiz();

    // story modal close (backdrop/button)
    document.querySelectorAll('.story-backdrop, .story-box .btn').forEach(el => {
      el.addEventListener('click', closeStory);
    });

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
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareChecklist);

    // expose functions for console / other scripts
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
