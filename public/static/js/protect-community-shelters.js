/* protect-community-shelters.js
   Interactive behavior: tabs, checklist (localStorage), DnD layout practice,
   volunteer roster, quiz, drill helpers, print/share.
   Put this file under static/js/protect-community-shelters.js
*/
(function () {
  // ---------- Data ----------
  const MODULE = {
    setup: [
      "Select at least two potential shelters (school, community hall) outside flood-prone zones.",
      "Check structural safety (roof, walls), access routes, number of rooms and capacity in people.",
      "Agree with owner/authority in writing about use as emergency shelter.",
      "Mark separate zones: sleeping, children area, women & privacy, medical corner, kitchen, sanitation.",
      "Identify accessible entry points and plan wheelchair ramps or temporary boards."
    ],
    supplies: [
      "Water: 5–10 litres per person per day (short-term), store in clean containers.",
      "Food: dry rations, ready-to-eat items, baby food, and feeding utensils.",
      "Health: first-aid kits, basic medicines, ORS, mosquito nets, women's hygiene supplies.",
      "Sanitation: portable toilets, tarpaulins, hand-wash stations, bleach for disinfection.",
      "Logistics: torches, power banks, fuel for cooking, basic tools, ropes and fire extinguishers."
    ],
    entry: [
      "Map entry & exit routes; keep one entry as emergency exit and one for supplies.",
      "Ensure entry area is kept clear (2–3m) for ambulance/vehicle access.",
      "Mark assembly points outside the shelter and signage for directions.",
      "Designate one table / desk for registration and one person to maintain whiteboard logs."
    ],
    roster: [
      "Shelter manager (overall coordinator).",
      "Volunteer for registration & reception.",
      "Volunteer for medical assistance (first aid trained).",
      "Volunteer for sanitation & water management.",
      "Volunteer for crowd control & security (preferably known community members)."
    ],
    sanitation: [
      "Set up separate toilets for men/women and ensure privacy.",
      "Provide water & soap for handwashing; encourage use after latrine and before food.",
      "Regularly empty/clean latrines and treat standing water with chlorine as required."
    ],
    checklist: [
      "Two ready shelter locations identified and agreed",
      "Contact list printed and available at shelter",
      "Minimum 3 volunteers trained and rostered",
      "First-aid kit & basic medicines available",
      "Cooking and water arrangements planned",
      "Sanitation facilities arranged (latrine / handwash)",
      "Accessible route / wheelchair ramp available",
      "Printed checklists and log-book available"
    ],
    quiz: [
      {
        q: "What is the most important feature of a shelter entry?",
        a: ["Narrow entrance (for security)", "Clear vehicle access and unobstructed route", "Many decorative signs"],
        correct: 1
      },
      {
        q: "How often should supplies be checked and rotated?",
        a: ["Monthly", "Only at time of disaster", "Every five years"],
        correct: 0
      },
      {
        q: "Who should maintain the shelter logbook?",
        a: ["Any visitor", "Designated registration volunteer", "Only the district official"],
        correct: 1
      }
    ]
  };

  // ---------- Helpers ----------
  const CHECK_KEY = 'safesphere_community_shelter_check_v1';
  const LAYOUT_KEY = 'safesphere_community_shelter_layout_v1';
  const ROSTER_KEY = 'safesphere_community_roster_v1';
  const QUIZ_KEY = 'safesphere_community_quiz_v1';

  // ---------- Tabs ----------
  function switchTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    renderTab(tab);
    // update poster based on tab
    updateSectionPoster(tab);
  }

  function renderTab(tab) {
    const target = document.getElementById('moduleContent');
    if (!target) return;
    if (tab === 'setup') {
      target.innerHTML = `<h3>Setup & Site Selection</h3>` + MODULE.setup.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'supplies') {
      target.innerHTML = `<h3>Supplies & Stock</h3>` + MODULE.supplies.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'roster') {
      target.innerHTML = `<h3>Rosters & Roles</h3>` + MODULE.roster.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'entry') {
      target.innerHTML = `<h3>Entry, Access & Crowd Flow</h3>` + MODULE.entry.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'drills') {
      target.innerHTML = `<h3>Practice & Drills</h3>
        <p class="small">Run simple, repeatable exercises. Keep logs of each drill and learn one improvement per drill.</p>
        <ol>
          <li>Simulate alert and perform arrival drill (30–60 minutes).</li>
          <li>Practice triage and first-aid for 3 injured.</li>
          <li>Simulate sanitation deployment and 1-hour distribution of water & food.</li>
        </ol>`;
    } else if (tab === 'resources') {
      target.innerHTML = `<h3>Resources & Templates</h3>
        <ul>
          <li><a href="#" onclick="event.preventDefault()">Shelter site checklist (PDF) — replace with local copy</a></li>
          <li><a href="#" onclick="event.preventDefault()">Volunteer training slides (upload)</a></li>
          <li><a href="#" onclick="event.preventDefault()">Sanitation setup guide (KVK / WASH)</a></li>
        </ul>`;
    }
  }

  // ---------- Checklist modal ----------
  function openChecklist() {
    const modal = document.getElementById('checklistModal');
    if (!modal) return;
    document.getElementById('checklistTitle').innerText = 'Shelter setup checklist';
    document.getElementById('checklistNote').innerText = 'Saved locally — Print or Share with volunteers.';
    modal.style.display = 'flex';
    switchChecklistTab('overview');
    loadChecklistProgress();
  }
  function closeChecklist() { const m = document.getElementById('checklistModal'); if (m) m.style.display = 'none'; }

  function switchChecklistTab(tab) {
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="small-muted">Checklist helps the shelter manager confirm key setup steps. Mark done and Save — progress stays on the device.</p>`;
    } else if (tab === 'setup') {
      content.innerHTML = MODULE.setup.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'supplies') {
      content.innerHTML = MODULE.supplies.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'sanitation') {
      content.innerHTML = MODULE.sanitation.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'roster') {
      content.innerHTML = MODULE.roster.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
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
        const inputs = document.querySelectorAll(`#checklistContent input[type="checkbox"]`);
        inputs.forEach((ch, idx) => {
          ch.checked = !!arr[idx];
          ch.addEventListener('change', () => {
            const all = Array.from(document.querySelectorAll(`#checklistContent input[type="checkbox"]`)).map(c => c.checked);
            localStorage.setItem(CHECK_KEY, JSON.stringify(all));
          });
        });
      } catch (e) { console.warn('loadChecklist:', e); }
    }, 60);
  }
  function restoreCheckedState() {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      document.querySelectorAll(`#checklistContent input[type="checkbox"]`).forEach((ch, idx) => ch.checked = !!arr[idx]);
    } catch (e) { console.warn('restore:', e); }
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
    if (!navigator.share) { alert('Share not supported on this device. Use Print.'); return; }
    const title = document.getElementById('checklistTitle').innerText;
    const text = Array.from(document.querySelectorAll('#checklistContent label')).map(l => l.innerText).join('\n');
    try { await navigator.share({ title, text }); } catch (e) { console.warn('share failed', e); }
  }

  // ---------- DnD layout ----------
  function initDnD() {
    const palette = document.getElementById('paletteItems');
    const board = document.getElementById('shelterBoard');
    const items = [
      { id: 'water', label: 'Water supply (containers)' },
      { id: 'meds', label: 'First-aid / medicines' },
      { id: 'toilets', label: 'Portable toilets' },
      { id: 'mats', label: 'Sleeping mats' },
      { id: 'kitchen', label: 'Cooking area' },
      { id: 'ramp', label: 'Wheelchair ramp' },
      { id: 'seed', label: 'Seed / grain storage' }
    ];
    palette.innerHTML = items.map(it => `<div class="dnd-item" draggable="true" data-id="${it.id}">${it.label}</div>`).join('');

    board.addEventListener('dragover', function (ev) { ev.preventDefault(); board.classList.add('dragover'); });
    board.addEventListener('dragleave', function () { board.classList.remove('dragover'); });
    board.addEventListener('drop', function (ev) {
      ev.preventDefault();
      board.classList.remove('dragover');
      const id = ev.dataTransfer.getData('text/plain');
      if (!id) return;
      // skip duplicates
      if (board.querySelector(`[data-id="${id}"]`)) return;
      const el = document.querySelector(`.dnd-item[data-id="${id}"]`);
      const clone = el.cloneNode(true);
      clone.classList.add('dnd-item-placed');
      clone.draggable = false;
      clone.style.cursor = 'default';
      clone.dataset.id = id;
      board.appendChild(clone);
    });

    document.querySelectorAll('.dnd-item').forEach(el => {
      el.addEventListener('dragstart', function (ev) {
        ev.dataTransfer.setData('text/plain', el.dataset.id);
      });
    });

    document.getElementById('btnCheckLayout').addEventListener('click', function () {
      const placed = Array.from(document.querySelectorAll('#shelterBoard .dnd-item-placed')).map(x => x.dataset.id);
      const required = ['water','meds','toilets','ramp'];
      const score = required.filter(r => placed.includes(r)).length;
      const pct = Math.round((score / required.length) * 100);
      document.getElementById('layoutResult').innerText = `Priority items placed: ${score}/${required.length} (${pct}%).`;
    });

    document.getElementById('btnResetLayout').addEventListener('click', function () {
      document.getElementById('shelterBoard').querySelectorAll('.dnd-item-placed').forEach(n => n.remove());
      document.getElementById('layoutResult').innerText = '';
      localStorage.removeItem(LAYOUT_KEY);
    });

    document.getElementById('btnSaveLayout').addEventListener('click', function () {
      const placed = Array.from(document.querySelectorAll('#shelterBoard .dnd-item-placed')).map(x => x.dataset.id);
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(placed));
      alert('Layout saved locally.');
    });

    // restore saved layout
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        arr.forEach(id => {
          const el = document.querySelector(`.dnd-item[data-id="${id}"]`);
          if (el && !document.querySelector(`#shelterBoard [data-id="${id}"]`)) {
            const clone = el.cloneNode(true); clone.classList.add('dnd-item-placed'); clone.draggable=false;
            clone.style.cursor='default'; clone.dataset.id=id;
            document.getElementById('shelterBoard').appendChild(clone);
          }
        });
      }
    } catch (e) { console.warn('restore layout', e); }
  }

  // ---------- Roster management ----------
  function initRoster() {
    const rosterBox = document.getElementById('rosterBox');
    function render() {
      const raw = localStorage.getItem(ROSTER_KEY);
      const list = raw ? JSON.parse(raw) : [];
      rosterBox.innerHTML = (list.length ? `<ul>${list.map((v,i)=>`<li>${escapeHtml(v.name)} — ${escapeHtml(v.role)} <button data-i="${i}" class="btn btn-ghost btn-sm remove-vol">Remove</button></li>`).join('')}</ul>` : '<p class="small">No volunteers added yet.</p>');
      rosterBox.querySelectorAll('.remove-vol').forEach(b => b.addEventListener('click', function (ev) {
        const idx = parseInt(b.dataset.i, 10);
        list.splice(idx,1);
        localStorage.setItem(ROSTER_KEY, JSON.stringify(list));
        render();
      }));
    }
    render();

    document.getElementById('btnAddVolunteer').addEventListener('click', function () {
      const name = prompt('Volunteer name (e.g. Rajesh Kumar)');
      if (!name) return;
      const role = prompt('Role (e.g. Registration, Medical, Sanitation)');
      const raw = localStorage.getItem(ROSTER_KEY); const list = raw ? JSON.parse(raw) : [];
      list.push({ name: name.trim(), role: role ? role.trim() : 'Volunteer' });
      localStorage.setItem(ROSTER_KEY, JSON.stringify(list));
      render();
    });
  }

  // ---------- Quiz ----------
  function renderQuiz() {
    const wrap = document.getElementById('quizWrap');
    wrap.innerHTML = MODULE.quiz.map((Q,i) => `
      <div class="quiz-question" data-idx="${i}">
        <p style="font-weight:700">Q${i+1}. ${escapeHtml(Q.q)}</p>
        <div class="quiz-options">
          ${Q.a.map((opt,j) => `<label><input type="radio" name="q${i}" value="${j}"> ${escapeHtml(opt)}</label>`).join('')}
        </div>
      </div>
    `).join('') + `<div style="margin-top:10px"><button class="submit-btn btn-primary" id="submitQuizBtn">Submit</button> <button class="btn btn-ghost" id="clearQuizBtn">Clear</button></div>
      <div id="quizResult" style="margin-top:10px;font-weight:700"></div>`;

    document.getElementById('submitQuizBtn').addEventListener('click', submitQuiz);
    document.getElementById('clearQuizBtn').addEventListener('click', clearQuiz);

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
      } catch(e){}
    }
  }

  function submitQuiz() {
    const results = MODULE.quiz.map((Q,i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      const val = sel ? parseInt(sel.value,10) : null;
      return { correct: Q.correct === val, selected: val };
    });
    const correct = results.filter(r=>r.correct).length;
    const total = MODULE.quiz.length;
    const pct = Math.round((correct/total)*100);
    let msg = `Score: ${correct} / ${total} (${pct}%) — `;
    if (pct === 100) msg += 'Excellent — you understand shelter basics.';
    else if (pct >= 70) msg += 'Good — review missed items.';
    else msg += 'Review the module and practise drills again.';
    document.getElementById('quizResult').innerText = msg;
    // save
    const ans = {};
    MODULE.quiz.forEach((_,i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      ans['q'+i] = sel ? sel.value : null;
    });
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ ans, correct, total, pct, msg }));
  }
  function clearQuiz() { MODULE.quiz.forEach((_,i) => { document.querySelectorAll(`input[name="q${i}"]`).forEach(s=>s.checked=false); }); document.getElementById('quizResult').innerText=''; localStorage.removeItem(QUIZ_KEY); }

  // ---------- Poster update helper (optional global map) ----------
  function updateSectionPoster(tab) {
    try {
      // window.SECTION_POSTERS can be set globally e.g.
      // window.SECTION_POSTERS = { setup: '/static/..', supplies: '/static/..' }
      if (!window.SECTION_POSTERS) return;
      const url = window.SECTION_POSTERS[tab];
      const img = document.querySelector('.poster');
      const container = img ? img.closest('.section') : null;
      if (url && img) {
        img.src = url; img.style.display = ''; if (container) container.style.display='block';
      } else if (img && container) {
        // if not available, hide poster area
        // (do not remove element — developer can add image later)
        img.style.display = 'none';
      }
    } catch (e) { console.warn('updateSectionPoster', e); }
  }

  // ---------- Utilities ----------
  function escapeHtml(s){ return String(s).replace(/[&<>"'`=\/]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]; }); }

  // ---------- Alert bar integration ----------
  function updateDisasterAlertFromWeather(data){
    if(!data || typeof data !== 'object') return;
    let temp = data.temp ?? data.temperature ?? null;
    let wind = data.wind ?? data.wind_speed ?? 0;
    let desc = data.description ?? data.weather ?? '';
    temp = (typeof temp === 'string') ? parseFloat(temp) : temp;
    wind = (typeof wind === 'string') ? parseFloat(wind) : wind;
    const bar = document.getElementById('disaster-alert-bar');
    const aText = document.getElementById('alertText');
    const aIcon = document.getElementById('alertIcon');
    bar.className = 'alert-normal';
    aIcon.innerText = '🟢';
    aText.innerText = 'Weather is normal. Prepare your community shelter plan.';
    if ((desc && /rain|flood|storm/i.test(desc)) || (wind >= 12 && temp <= 22)) {
      bar.className = 'alert-warning';
      aIcon.innerText = '🌧️';
      aText.innerText = 'Heavy rain / flood risk. Prepare community shelter and move essentials.';
    }
    if (data.water_level && data.water_level >= 1.0) {
      bar.className = 'alert-danger';
      aIcon.innerText = '🚨';
      aText.innerText = 'Severe flood alert! Open community shelter and evacuate to safety.';
    }
    bar.style.transform = ''; bar.style.opacity='1';
  }

  // ---------- Simple modal for info -->
  function openInfo(title, body) {
    const modal = document.getElementById('infoModal'); if (!modal) return;
    document.getElementById('infoModalTitle').innerText = title;
    document.getElementById('infoModalBody').innerText = body;
    modal.style.display = 'flex';
  }
  function closeInfo(){ const m = document.getElementById('infoModal'); if (m) m.style.display = 'none'; }

  // ---------- Bootstrap / init ----------
  document.addEventListener('DOMContentLoaded', function () {
    // initial tab
    renderTab('setup');

    // open checklist buttons
    const openBtns = document.querySelectorAll('#openChecklistBtn, #openChecklistBtnSide, #openChecklistBtn2');
    openBtns.forEach(b => b && b.addEventListener('click', openChecklist));
    // side button
    const openSide = document.getElementById('openChecklistBtnSide');
    if (openSide) openSide.addEventListener('click', openChecklist);

    // checklist inner tabs
    document.querySelectorAll('.tabs-inner .tab').forEach(t => {
      t.addEventListener('click', function () { switchChecklistTab(t.dataset.tab); });
    });
    // expose function for checklist tab switching
    window.switchChecklistTab = switchChecklistTab;
    function switchChecklistTab(tab){ switchChecklistTab(tab); } // no-op wrapper (kept for older code compatibility)

    // init DnD
    initDnD();

    // roster
    initRoster();

    // quiz
    renderQuiz();

    // share checklist
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareChecklist);

    // info modal events
    document.querySelectorAll('.story-backdrop, .story-box .btn').forEach(el => el.addEventListener('click', closeInfo));

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

    // expose useful functions globally
    window.openChecklist = openChecklist;
    window.closeChecklist = closeChecklist;
    window.printChecklist = printChecklist;
    window.shareChecklist = shareChecklist;
    window.switchTab = switchTab;
    window.openInfo = openInfo;
    window.updateDisasterAlertFromWeather = updateDisasterAlertFromWeather;
  });

  // make switchChecklistTab function available inside the closure
  function switchChecklistTab(tab) {
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="small-muted">Checklist helps the shelter manager confirm key setup steps. Mark done and Save — progress stays on the device.</p>`;
    } else if (tab === 'setup') {
      content.innerHTML = MODULE.setup.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'supplies') {
      content.innerHTML = MODULE.supplies.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'sanitation') {
      content.innerHTML = MODULE.sanitation.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'roster') {
      content.innerHTML = MODULE.roster.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
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

})();
