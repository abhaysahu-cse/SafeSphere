/* public/static/js/protect-farmers-flood.js
   All client logic for the farmers flood module:
   - checklist modal and tabs
   - save/restore checklist progress (localStorage)
   - print & share helper
   - drag & drop activity
   - quiz logic
   - basic region selector handling
*/

(function () {
  // Keys
  const PROG_KEY = 'sf_farm_flood_check_progress_v1';
  const STATS_KEY = 'sf_farm_flood_stats_v1';

  // Checklist data
  const CHECKLIST = {
    title: "Farmers — Flood Season Checklist",
    overview: "Focus on seeds, livestock and tools. Save these and you preserve next season's income.",
    before: [
      "Move seeds & stored grain to raised platform or upper floor.",
      "Move medicines, cash and documents to a sealed box on higher ground.",
      "Move livestock to pre-identified high ground or shelter.",
      "Secure tools, pumps and motors in high shed or tie them down.",
      "Harvest mature patches only if safely possible."
    ],
    during: [
      "Prioritize human and animal safety — move people first.",
      "Move livestock and essential feed to safe shelter.",
      "Switch off electrical supply only if safe to do so.",
      "Avoid wading in fast-moving water.",
      "Use boats/tractors only if operated by experienced person."
    ],
    after: [
      "Document damages (photos & quantities) for relief and claims.",
      "Dry grains & seeds immediately on clean tarpaulin; turn often.",
      "Disinfect saved seed as per local KVK instructions before planting.",
      "Desilt fields and test soil salinity before replanting (gypsum + leaching if saline).",
      "Contact local KVK for replanting recommendations and seed supply."
    ]
  };

  // initial state
  let currentTab = 'overview';
  let currentRegion = localStorage.getItem('sf_region') || 'andhra';

  // elements
  const checklistModal = document.getElementById('checklistModal');
  const checklistContent = document.getElementById('checklistContent');
  const checklistTitle = document.getElementById('checklistTitle');
  const checklistNote = document.getElementById('checklistNote');
  const tabs = document.querySelectorAll('#checklistTabs .tab');
  const regionSelect = document.getElementById('regionSelect');

  // Open/close modal
  window.openChecklist = function (role) {
    // only one role now (farmers)
    checklistTitle.innerText = CHECKLIST.title;
    checklistNote.innerText = `Region: ${regionSelect.options[regionSelect.selectedIndex].text}`;
    switchTab('overview');
    checklistModal.classList.remove('hidden');
    bumpStat('opened_checklists');
    loadChecklistProgress();
  };

  window.closeChecklist = function () {
    checklistModal.classList.add('hidden');
  };

  function switchTab(tab) {
    currentTab = tab;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    renderTabContent(tab);
  }
  window.switchTab = switchTab; // export for onclicks

  function renderTabContent(tab) {
    if (!checklistContent) return;
    if (tab === 'overview') {
      checklistContent.innerHTML = `<p class="small">${CHECKLIST.overview}</p>`;
      return;
    }
    if (tab === 'checklist') {
      // render checkboxes combining before/during/after
      const items = [...CHECKLIST.before, ...CHECKLIST.during, ...CHECKLIST.after];
      const html = items.map((it, idx) => `
        <div class="checklist-item">
          <input type="checkbox" id="chk_${idx}">
          <label for="chk_${idx}">${it}</label>
        </div>
      `).join('');
      checklistContent.innerHTML = html;
      restoreCheckedState();
      attachCheckboxHandlers();
      return;
    }
    // before/during/after lists
    const arr = CHECKLIST[tab] || [];
    checklistContent.innerHTML = arr.map(it => `<div style="padding:8px 0">• ${it}</div>`).join('') || '<p class="small">No items.</p>';
  }

  // attach checkbox events so changes are saved locally
  function attachCheckboxHandlers() {
    const inputs = checklistContent.querySelectorAll('input[type="checkbox"]');
    inputs.forEach((ch, i) => {
      ch.addEventListener('change', () => {
        saveChecklistProgress(); // autosave on change
      });
    });
  }

  function saveChecklistProgress() {
    const inputs = checklistContent.querySelectorAll('input[type="checkbox"]');
    const state = Array.from(inputs).map(i => i.checked);
    const all = JSON.parse(localStorage.getItem(PROG_KEY) || '{}');
    all['farmers'] = state;
    localStorage.setItem(PROG_KEY, JSON.stringify(all));
    bumpStat('saved_progress');
    alert('Checklist progress saved locally on this device.');
  }
  window.saveChecklistProgress = saveChecklistProgress;

  function loadChecklistProgress() {
    // if checklist tab already rendered, restore
    setTimeout(() => {
      const all = JSON.parse(localStorage.getItem(PROG_KEY) || '{}');
      const state = all['farmers'] || [];
      const inputs = checklistContent.querySelectorAll('input[type="checkbox"]');
      inputs.forEach((ch, idx) => {
        ch.checked = !!state[idx];
      });
    }, 50);
  }

  function restoreCheckedState() {
    const all = JSON.parse(localStorage.getItem(PROG_KEY) || '{}');
    const state = all['farmers'] || [];
    const inputs = checklistContent.querySelectorAll('input[type="checkbox"]');
    inputs.forEach((ch, idx) => ch.checked = !!state[idx]);
  }

  // print checklist (prints the content area)
  window.printChecklist = function () {
    // temporarily render checklist.tab=checklist if not
    const prev = currentTab;
    switchTab('checklist');
    setTimeout(() => {
      const content = checklistContent.innerHTML;
      const title = checklistTitle.innerText;
      const w = window.open('', '', 'width=800,height=900');
      w.document.write(`<html><head><title>${title}</title>
        <style>body{font-family:Arial;padding:18px;} .checklist-item{margin-bottom:8px;}</style>
        </head><body><h2>${title}</h2>${content}</body></html>`);
      w.document.close();
      w.print();
      w.close();
      switchTab(prev);
    }, 60);
  };

  // share (uses navigator.share if available)
  window.shareChecklist = async function () {
    try {
      const title = checklistTitle.innerText;
      // build a text summary
      const items = [...CHECKLIST.before, ...CHECKLIST.during, ...CHECKLIST.after];
      const text = `${title}\n\n${items.join('\n')}`;
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        alert('Share is not supported on this device. You can print the checklist instead.');
      }
    } catch (err) {
      console.warn('share error', err && err.message);
    }
  };

  // stats bump
  function bumpStat(key) {
    const s = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
    s[key] = (s[key] || 0) + 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  }

  // region selector
  if (regionSelect) {
    regionSelect.value = currentRegion;
    regionSelect.addEventListener('change', () => {
      currentRegion = regionSelect.value;
      localStorage.setItem('sf_region', currentRegion);
      // update checklist note when modal open
      const note = document.getElementById('checklistNote');
      if (note) note.innerText = `Region: ${regionSelect.options[regionSelect.selectedIndex].text}`;
    });
  }

  // Drag & Drop logic for activity
  const dragPool = document.getElementById('dragPool');
  const safeZone = document.getElementById('safeZone');
  if (dragPool && safeZone) {
    dragPool.addEventListener('dragstart', (e) => {
      const target = e.target;
      if (target && target.matches('.drag-item')) {
        e.dataTransfer.setData('text/plain', target.dataset.key);
      }
    });
    safeZone.addEventListener('dragover', (e) => e.preventDefault());
    safeZone.addEventListener('drop', (e) => {
      e.preventDefault();
      const key = e.dataTransfer.getData('text/plain');
      const el = dragPool.querySelector(`[data-key="${key}"]`) || document.querySelector(`[data-key="${key}"]`);
      if (el) safeZone.appendChild(el);
    });
  }

  // check arrangement button
  const checkArrangementBtn = document.getElementById('checkArrangementBtn');
  if (checkArrangementBtn) {
    checkArrangementBtn.addEventListener('click', () => {
      const inside = Array.from(safeZone.querySelectorAll('.drag-item')).map(x => x.dataset.key);
      const required = ['seeds', 'tools', 'animal'];
      const missing = required.filter(k => !inside.includes(k));
      const res = document.getElementById('arrangeResult');
      if (!res) return;
      if (missing.length === 0) {
        res.innerText = 'Good — everything is on the safe platform!';
      } else {
        res.innerText = 'Missing: ' + missing.join(', ') + '. Move them to the safe zone.';
      }
    });
  }

  // quiz logic
  const submitQuizBtn = document.getElementById('submitQuizBtn');
  if (submitQuizBtn) {
    submitQuizBtn.addEventListener('click', () => {
      const q1 = document.querySelector('input[name="q1"]:checked');
      const q2 = document.querySelector('input[name="q2"]:checked');
      let score = 0; let total = 2;
      if (q1 && q1.value === 'b') score++;
      if (q2 && q2.value === 'b') score++;
      const pct = Math.round((score / total) * 100);
      const el = document.getElementById('quizResult');
      if (el) {
        el.innerText = `Score: ${score}/${total} (${pct}%) — ${pct === 100 ? 'Excellent' : (pct >= 50 ? 'Good' : 'Review steps again')}`;
      }
      bumpStat('quiz_attempts');
    });
  }

  // open modal from top-level button
  const openChecklistBtn = document.getElementById('openChecklistBtn');
  if (openChecklistBtn) openChecklistBtn.addEventListener('click', () => openChecklist('farmers'));

  // initial content render: set default tab content when page loads
  document.addEventListener('DOMContentLoaded', () => {
    // attach onclicks to tab elements to update currentTab variable when used
    document.querySelectorAll('#checklistTabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        switchTab(t.dataset.tab);
      });
    });
    // initial render
    switchTab('overview');

    // fallback: attach printChecklist to top print button
    const printBtn = document.getElementById('printChecklistBtn');
    if (printBtn) printBtn.addEventListener('click', () => window.printChecklist ? window.printChecklist() : alert('Print not available.'));

    // link top "watch demo" to scroll to video
    const playDemoBtn = document.getElementById('playDemoBtn');
    if (playDemoBtn) playDemoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const vid = document.getElementById('demoVideo');
      if (vid) vid.scrollIntoView({ behavior: 'smooth' });
    });
  });

})();
