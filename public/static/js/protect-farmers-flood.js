/* static/js/protect-farmers-flood.js
   All interactive behavior for Flood module (checklist, quiz, tabs, DnD, modals)
*/
(function () {
  'use strict';

  // ---------- Module data ----------
  const MODULE = {
    before: [
      "Monitor local weather and official alerts (IMD / state bulletins).",
      "Move harvested produce, seeds and fertilizers to raised platforms or upper floors.",
      "Keep animal feed, medicines and essential fodder stored on higher ground.",
      "Tie tools, tractors and small machinery or move to shelter to prevent washing away.",
      "Prepare sandbags or earthen bunds around low store rooms where possible.",
      "Charge power banks and keep important phone numbers written on paper and in phone."
    ],
    during: [
      "Move livestock to higher ground or community shelters before water rises.",
      "Switch off main electricity and disconnect pumps if safe to do so.",
      "Avoid walking or driving through moving flood water.",
      "If using boats for rescue, secure animals and tag them if possible.",
      "Keep drinking water and basic medicines in waterproof bags."
    ],
    after: [
      "Document damage with photos (for relief/insurance) and note the time of events.",
      "Dry stored grains fully before returning to storage; discard moulded grain and seek seed replacement.",
      "Desilt fields and test for salinity if surge occurred.",
      "Check animals for injuries; seek veterinary help and isolate sick animals.",
      "Coordinate with local KVK/extension for input support and recovery."
    ],
    checklist: [
      "Raised storage ready for seeds & grains",
      "Animal shelter identified on higher ground",
      "Tools & machinery secured or moved",
      "Emergency bag ready (medicines, documents, torch, powerbank)",
      "Contact list shared with neighbours",
      "Community contact for boats and tractors noted"
    ],
    quiz: [
      { q: "Where should you store seed bags before a flood?", a: ["Low shed", "Raised platform / upper floor", "Open yard"], correct: 1 },
      { q: "What should you do with pumps when flood water approaches?", a: ["Keep them running", "Switch off and disconnect if safe", "Leave them on auto"], correct: 1 },
      { q: "After flood, how should you treat wet grains?", a: ["Store immediately", "Dry & disinfect before storage", "Discard all grain"], correct: 1 }
    ]
  };

  // ---------- Poster helper ----------
  // window.SECTION_POSTERS should be set in template to static paths {before,during,after}
  function updateSectionPoster(tab) {
    try {
      if (!window.SECTION_POSTERS) return;
      const url = window.SECTION_POSTERS[tab];
      const container = document.getElementById('sectionPoster');
      const img = document.getElementById('sectionPosterImg');
      if (url && img && container) {
        img.src = url;
        img.style.display = '';
        container.setAttribute('aria-hidden', 'false');
      } else {
        if (img) { img.src = ''; img.style.display = 'none'; }
        if (container) container.setAttribute('aria-hidden', 'true');
      }
    } catch (e) {
      // never crash page
      /* eslint-disable no-console */
      console.warn('updateSectionPoster:', e);
    }
  }

  // ---------- Tabs ----------
  function switchTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    renderTab(tab);
  }

  function renderTab(tab) {
    const target = document.getElementById('moduleContent');
    if (!target) return;

    if (tab === 'before' || tab === 'during' || tab === 'after') {
      const arr = MODULE[tab];
      target.innerHTML = `<h3>${tab.charAt(0).toUpperCase() + tab.slice(1)}</h3>` +
        arr.map(i => `<div class="step">• ${i}</div>`).join('');
    } else if (tab === 'practice') {
      target.innerHTML = `<h3>Practice: quick drag & drop</h3>
        <p class="small">Drag the important items to the 'Save first' area. This helps practise priorities.</p>
        <div class="dnd-area">
          <div class="dnd-palette" aria-label="Items palette">
            <strong>Items</strong>
            <div id="paletteItems"></div>
          </div>
          <div class="dnd-board" id="saveZone" aria-label="Save first zone" tabindex="0">
            <em class="small">Drop here: items to save first</em>
          </div>
        </div>
        <p style="margin-top:8px"><button class="btn btn-primary" id="dndCheckBtn">Check choices</button> <button class="btn btn-ghost" id="dndResetBtn">Reset</button></p>
        <div id="dndResult" style="margin-top:10px;font-weight:700"></div>`;
      // init DnD after DOM created
      requestAnimationFrame(initDnD);
    } else if (tab === 'resources') {
      target.innerHTML = `<h3>Resources</h3>
        <ul>
          <li><a href="#" onclick="event.preventDefault()">NDMA: Flood preparedness guide (replace with PDF)</a></li>
          <li><a href="#" onclick="event.preventDefault()">KVK local extension phone numbers (upload CSV)</a></li>
          <li><a href="#" onclick="event.preventDefault()">Farm pond & raised plinth guidance</a></li>
        </ul>`;
    } else {
      target.innerHTML = '';
    }

    // update poster for the tab (works even if poster not provided)
    updateSectionPoster(tab);
  }

  // ---------- DnD practice ----------
  function initDnD() {
    const palette = document.getElementById('paletteItems');
    const saveZone = document.getElementById('saveZone');
    if (!palette || !saveZone) return;

    const items = [
      { id: 'seedbags', label: 'Seed bags' },
      { id: 'livestock', label: 'Livestock' },
      { id: 'pump', label: 'Pump & motor' },
      { id: 'tools', label: 'Small tools' },
      { id: 'fertilizer', label: 'Fertilizer sacks' },
      { id: 'tractor', label: 'Tractor' }
    ];
    palette.innerHTML = items.map(it => `<div class="dnd-item" draggable="true" data-id="${it.id}">${it.label}</div>`).join('');

    // allow drop to saveZone
    saveZone.addEventListener('dragover', function (ev) { ev.preventDefault(); saveZone.classList.add('dragover'); });
    saveZone.addEventListener('dragleave', function () { saveZone.classList.remove('dragover'); });
    saveZone.addEventListener('drop', function (ev) {
      ev.preventDefault();
      saveZone.classList.remove('dragover');
      const id = ev.dataTransfer.getData('text/plain');
      if (!id) return;
      if (saveZone.querySelector(`[data-id="${id}"]`)) return;
      const el = document.querySelector(`.dnd-item[data-id="${id}"]`);
      if (!el) return;
      const clone = el.cloneNode(true);
      clone.classList.add('dnd-item-placed');
      clone.style.cursor = 'default';
      clone.draggable = false;
      saveZone.appendChild(clone);
    });

    // palette dragstart
    document.querySelectorAll('.dnd-item').forEach(function (el) {
      el.addEventListener('dragstart', function (ev) {
        try { ev.dataTransfer.setData('text/plain', el.dataset.id); } catch (e) {}
      });
    });

    // check/reset buttons — guard existence
    const checkBtn = document.getElementById('dndCheckBtn');
    const resetBtn = document.getElementById('dndResetBtn');
    if (checkBtn) {
      checkBtn.addEventListener('click', function () {
        const placed = Array.from(document.querySelectorAll('#saveZone .dnd-item-placed')).map(x => x.dataset.id);
        const correct = ['seedbags', 'livestock', 'pump', 'tools'];
        const score = placed.filter(p => correct.includes(p)).length;
        const pct = Math.round((score / correct.length) * 100);
        const resultText = `You saved ${score}/${correct.length} high-priority items (${pct}%).`;
        const out = document.getElementById('dndResult');
        if (out) out.innerText = resultText;
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        const zone = document.getElementById('saveZone');
        if (zone) zone.innerHTML = `<em class="small">Drop here: items to save first</em>`;
        const out = document.getElementById('dndResult');
        if (out) out.innerText = '';
      });
    }
  }

  // ---------- Checklist modal ----------
  const CHECK_KEY = 'safesphere_farmers_flood_check_v2';
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
      content.innerHTML = `<p class="small">Checklist helps confirm key steps before/during/after a flood. Mark done and Save — progress stays on this device.</p>`;
    } else if (tab === 'before' || tab === 'during' || tab === 'after') {
      const arr = MODULE[tab] || [];
      content.innerHTML = `<h3>${tab.charAt(0).toUpperCase() + tab.slice(1)}</h3>` + arr.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if (tab === 'checklist') {
      content.innerHTML = MODULE.checklist.map((it, idx) => `
        <div class="checklist-item">
          <input id="chk_${idx}" type="checkbox">
          <label for="chk_${idx}">${it}</label>
        </div>
      `).join('');
      restoreCheckedState();
    } else {
      content.innerHTML = '';
    }
  }

  function saveChecklistProgress() {
    const inputs = Array.from(document.querySelectorAll(`#checklistContent input[type="checkbox"]`));
    const state = inputs.map(i => i.checked);
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(state)); } catch (e) { console.warn('saveChecklist:', e); }
    alert('Checklist progress saved locally on this device.');
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
            try { localStorage.setItem(CHECK_KEY, JSON.stringify(all)); } catch (e) {}
          });
        });
      } catch (e) { console.warn('loadChecklist:', e); }
    }, 80);
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
    const titleEl = document.getElementById('checklistTitle');
    const contentEl = document.getElementById('checklistContent');
    if (!titleEl || !contentEl) return;
    const title = titleEl.innerText;
    const contentHtml = contentEl.innerHTML;
    const win = window.open('', '', 'width=700,height=900');
    if (!win) { alert('Unable to open print window.'); return; }
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px;} .checklist-item{margin-bottom:8px;}</style></head><body><h2>${title}</h2>${contentHtml}</body></html>`);
    win.document.close();
    win.print();
  }

  async function shareChecklist() {
    if (!navigator.share) {
      alert('Share not supported — use Print or Save locally.');
      return;
    }
    const titleEl = document.getElementById('checklistTitle');
    const labels = Array.from(document.querySelectorAll('#checklistContent label')).map(l => l.innerText);
    try { await navigator.share({ title: titleEl ? titleEl.innerText : 'Checklist', text: labels.join('\n') }); } catch (e) { console.warn('share failed', e); }
  }

  // ---------- Quiz ----------
  const QUIZ_KEY = 'safesphere_farmers_flood_quiz_v1';
  function renderQuiz() {
    const wrap = document.getElementById('quizWrap');
    if (!wrap) return;
    wrap.innerHTML = MODULE.quiz.map((Q, i) => `
      <div class="quiz-question" data-idx="${i}">
        <p style="font-weight:700">Q${i + 1}. ${Q.q}</p>
        <div class="quiz-options">
          ${Q.a.map((opt, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`).join('')}
        </div>
      </div>`).join('') + `<div style="margin-top:10px"><button class="submit-btn btn-primary" id="submitQuizBtn">Submit</button>
      <button class="btn btn-ghost" id="clearQuizBtn">Clear</button></div>
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
          const qr = document.getElementById('quizResult');
          if (qr) qr.innerText = data.msg || '';
        }
      } catch (e) { /* ignore */ }
    }

    const submitBtn = document.getElementById('submitQuizBtn');
    const clearBtn = document.getElementById('clearQuizBtn');
    if (submitBtn) submitBtn.addEventListener('click', submitQuiz);
    if (clearBtn) clearBtn.addEventListener('click', clearQuiz);
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
    const out = document.getElementById('quizResult');
    if (out) out.innerText = msg;

    // save
    const ans = {};
    MODULE.quiz.forEach((_, i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      ans['q' + i] = sel ? sel.value : null;
    });
    try { localStorage.setItem(QUIZ_KEY, JSON.stringify({ ans, correct, total, pct, msg })); } catch (e) {}
  }

  function clearQuiz() {
    MODULE.quiz.forEach((_, i) => {
      document.querySelectorAll(`input[name="q${i}"]`).forEach(s => { s.checked = false; });
    });
    const out = document.getElementById('quizResult');
    if (out) out.innerText = '';
    try { localStorage.removeItem(QUIZ_KEY); } catch (e) {}
  }

  // ---------- Stories modal ----------
  function openStory(e, id) {
    if (e && e.preventDefault) e.preventDefault();
    const title = (id === 1) ? 'Floods damage paddy harvest — summary' : 'Community boats rescue livestock — summary';
    const body = (id === 1) ? 'Farmers who used raised storage saved seed stock and could replant next season.' : 'Volunteers used village boats to move livestock to safe mounds and saved feed stores.';
    const titleEl = document.getElementById('storyModalTitle');
    const bodyEl = document.getElementById('storyModalBody');
    const modal = document.getElementById('storyModal');
    if (titleEl) titleEl.innerText = title;
    if (bodyEl) bodyEl.innerText = body;
    if (modal) modal.style.display = 'flex';
  }
  function closeStory() {
    const modal = document.getElementById('storyModal');
    if (modal) modal.style.display = 'none';
  }

  // ---------- Print module ----------
  function printModule() {
    const title = (document.getElementById('title') || {}).innerText || 'Flood module';
    const content = document.querySelector('.wrap') ? document.querySelector('.wrap').innerHTML : '';
    const win = window.open('', '', 'width=900,height=1000');
    if (!win) { alert('Unable to open print window.'); return; }
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close();
    win.print();
  }

  // ---------- FAQ toggle ----------
  function toggleFaq(el) {
    const a = el && el.nextElementSibling;
    if (!a) return;
    a.style.display = (a.style.display === 'block') ? 'none' : 'block';
  }

  // ---------- Alert integration ----------
  function updateDisasterAlertFromWeather(data) {
    if (!data || typeof data !== 'object') return;
    let temp = data.temp ?? data.temperature ?? null;
    let wind = data.wind ?? data.wind_speed ?? 0;
    let desc = data.description ?? data.weather ?? '';
    temp = (typeof temp === 'string') ? parseFloat(temp) : temp;
    wind = (typeof wind === 'string') ? parseFloat(wind) : wind;

    const bar = document.getElementById('disaster-alert-bar');
    const aText = document.getElementById('alertText');
    const aIcon = document.getElementById('alertIcon');
    if (!bar || !aText || !aIcon) return;

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

  // ---------- bootstrap / init ----------
  document.addEventListener('DOMContentLoaded', function () {
    // initial tab and poster
    renderTab('before');

    // hook up checklist open buttons (guard)
    const btn1 = document.getElementById('openChecklistBtn');
    const btn2 = document.getElementById('openChecklistBtn2');
    if (btn1) btn1.addEventListener('click', openChecklist);
    if (btn2) btn2.addEventListener('click', openChecklist);

    // checklist tab buttons (delegated)
    document.querySelectorAll('.tabs-inner .tab').forEach(t => {
      t.addEventListener('click', function () { switchChecklistTab(t.dataset.tab); });
    });

    // render quiz
    renderQuiz();

    // story modal close handlers (guard)
    const storyModal = document.getElementById('storyModal');
    if (storyModal) {
      // close for any .btn in modal
      storyModal.querySelectorAll('.btn').forEach(el => el.addEventListener('click', closeStory));
      const backdrop = storyModal.querySelector('.story-backdrop');
      if (backdrop) backdrop.addEventListener('click', closeStory);
    }

    // dismiss alert
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

    // share checklist
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareChecklist);

    // expose safe functions on window for convenience
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

    // set initial poster explicitly (in case renderTab did not update)
    updateSectionPoster('before');
  });

})();
