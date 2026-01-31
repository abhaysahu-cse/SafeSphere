// static/js/cyclone.js
// Deep, property-focused cyclone module behavior
(function () {
  const MODULE = {
    planning: {
      title: "Land & Planning: site matters",
      bullets: [
        "Do not build below known storm surge / tidal flood lines.",
        "Keep drainage clear around foundations — never block natural drains.",
        "Avoid locating fuel or hazardous storage in low corners.",
        "Plant windbreak trees at a safe distance (avoid falling onto roof).",
        "If possible, raise plinth above local flood level."
      ]
    },
    structure: {
      title: "House structure & retrofit (key actions)",
      bullets: [
        "Anchor roofs with hurricane straps or metal ties fixed into wall plates.",
        "Use through-bolts and washers to fix roof to walls; avoid only nails.",
        "Provide continuous load path from roof to foundation (straps, ties).",
        "Install robust shutters or tropical roller shutters for windows.",
        "Secure water tanks with straps and base anchors; don't leave them loose.",
        "Avoid large unprotected glass on windward sides; use laminated glass if possible.",
        "Locate generator and fuel storage at safe elevation away from living areas."
      ]
    },
    before: {
      title: "Before (72–24 hours)",
      bullets: [
        "Check official warnings; plan to act early (do not wait for red alert).",
        "Move valuables, documents, medicines to upper floors or high shelves.",
        "Anchor or bring indoors all loose items (potted plants, tools, sheets).",
        "Board or shutter windows; close and lock external doors.",
        "Fill water tanks for drinking but secure them properly; top-up fuel for generator if needed.",
        "Take photos of house and valuables for insurance/relief.",
        "Evacuate early if your house is low-lying or structurally weak."
      ]
    },
    during: {
      title: "During (what to do)",
      bullets: [
        "Stay in the safest internal room on the lowest risk floor (not by windows).",
        "Keep radio / phone charged and listen to official instructions.",
        "If roof damage begins, move to a safer shelter early; do not wait.",
        "Avoid standing near damaged walls or broken windows; watch for debris.",
        "If flooding happens, avoid driving and do not walk through fast-moving water."
      ]
    },
    after: {
      title: "After (reduce long-term losses)",
      bullets: [
        "Wait for authorities to declare safe before returning.",
        "Document all damage with timestamps (photos + short video). This accelerates relief/insurance.",
        "Check electrical and gas supply with a qualified person before reuse.",
        "Dry and disinfect interiors; remove mud and silt from foundations, ventilate structure.",
        "Temporary repairs: cover exposed roof with tarpaulin and secure to prevent further water ingress.",
        "Engage local KVK/engineers for structural checks — do not rebuild without assessment."
      ]
    },
    checklist: [
      "Roof & tanks anchored",
      "Windows boarded / shutters in place",
      "Emergency kit (3 days water & food)",
      "Important documents photographed & stored",
      "Generator & fuel safely stored",
      "Evacuation route known & tested"
    ],
    quiz: [
      { q: "Best immediate action to stop roof uplift?", a: ["Remove sheets", "Anchor with straps/bolts", "Paint the roof"], correct: 1 },
      { q: "Where to store family documents before cyclone?", a: ["In the yard", "Waterproof folder on upper shelf", "In the garage"], correct: 1 },
      { q: "After cyclone, which is most important before switching appliances on?", a: ["Turn on appliances immediately", "Check wiring for damage", "Start generator"], correct: 1 }
    ]
  };

  // DOM helpers
  function el(id) { return document.getElementById(id); }
  function $(selector) { return Array.from(document.querySelectorAll(selector)); }

  // Poster swap based on SECTION_POSTERS
  function updatePoster(tab) {
    try {
      const map = window.SECTION_POSTERS || {};
      const url = map[tab];
      const img = el('sectionPosterImg');
      const container = el('sectionPoster');
      if (url) {
        img.src = url;
        img.style.display = '';
        container.setAttribute('aria-hidden', 'false');
      } else {
        img.src = '';
        img.style.display = 'none';
        container.setAttribute('aria-hidden', 'true');
      }
    } catch (e) { console.warn('updatePoster', e); }
  }

  // Render tab content
  function renderTab(tab) {
    const content = el('moduleContent');
    if (!content) return;
    const bucket = MODULE[tab];
    if (!bucket) {
      if (tab === 'practice') {
        content.innerHTML = `<h3>Practice & drill</h3>
          <p class="small">Run these drills with family: (1) Roof-check drill (2) Evacuation drill (3) Photo-evidence collection drill.</p>
          <ol>
            <li>Time yourself packing emergency kit (10 min target).</li>
            <li>Practice moving 3 important items to upper shelf in 5 minutes.</li>
            <li>Practice walking your evacuation route together.</li>
          </ol>`;
      } else if (tab === 'resources') {
        content.innerHTML = `<h3>Resources & contacts</h3><ul>
          <li>Local SDMA / District Disaster Management Office (add phone)</li>
          <li>Nearest cyclone shelter map (add link)</li>
          <li>Local masons & contractors for retrofitting</li>
        </ul>`;
      } else content.innerHTML = `<p class="small-muted">No content for ${tab}</p>`;
      return;
    }
    content.innerHTML = `<h3>${bucket.title}</h3><ul>` + bucket.bullets.map(b => `<li>${b}</li>`).join('') + `</ul>`;
  }

  // Tabs click wiring (delegated)
  function initTabs() {
    document.addEventListener('click', function (ev) {
      const tab = ev.target.closest('.tab');
      if (!tab || !tab.dataset.tab) return;
      const chosen = tab.dataset.tab;
      // visually set active
      $('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === chosen));
      renderTab(chosen);
      updatePoster(chosen);
    });
    // default
    renderTab('planning');
    updatePoster('planning');
  }

  // Checklist modal behavior
  const CHECK_KEY = 'safesphere_cyclone_check_v1';
  function openChecklist() {
    const modal = el('checklistModal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => {
      // default to overview content
      switchChecklistTab('overview');
    }, 0);
  }
  function closeChecklist() { const m = el('checklistModal'); if (m) m.style.display = 'none'; }
  function switchChecklistTab(tab) {
    const tabs = document.querySelectorAll('#checklistTabs .tab');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const cont = el('checklistContent');
    if (!cont) return;
    if (tab === 'overview') {
      cont.innerHTML = `<p class="small-muted">This checklist focuses on reducing structural and property loss. Mark items as done and Save; progress is stored locally.</p>`;
    } else if (['before','during','after'].includes(tab)) {
      const items = MODULE[tab].bullets;
      cont.innerHTML = `<h4>${tab.charAt(0).toUpperCase()+tab.slice(1)}</h4><ul>` + items.map(i => `<li>${i}</li>`).join('') + `</ul>`;
    } else if (tab === 'checklist') {
      cont.innerHTML = MODULE.checklist.map((ch, idx) => `
        <div class="checklist-item"><input id="chk_${idx}" type="checkbox"> <label for="chk_${idx}">${ch}</label></div>
      `).join('');
      restoreChecklistState();
    }
  }
  function saveChecklist() {
    try {
      const checks = Array.from(document.querySelectorAll('#checklistContent input[type="checkbox"]')).map(c => c.checked);
      localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
      alert('Checklist saved locally.');
    } catch (e) { console.warn(e); alert('Save failed'); }
  }
  function restoreChecklistState() {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
      inputs.forEach((ch, i) => ch.checked = !!arr[i]);
      // attach change auto-save
      inputs.forEach(ch => ch.addEventListener('change', () => {
        const now = Array.from(document.querySelectorAll('#checklistContent input[type="checkbox"]')).map(c => c.checked);
        localStorage.setItem(CHECK_KEY, JSON.stringify(now));
      }));
    } catch (e) { console.warn(e); }
  }

  // Quiz rendering & logic
  const QUIZ_KEY = 'safesphere_cyclone_quiz_v1';
  function renderQuiz() {
    const wrap = el('quizWrap');
    if (!wrap) return;
    wrap.innerHTML = MODULE.quiz.map((Q,i) => `
      <div class="quiz-question" data-idx="${i}">
        <p style="font-weight:700">Q${i+1}. ${Q.q}</p>
        <div class="quiz-options">
          ${Q.a.map((opt,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`).join('')}
        </div>
      </div>
    `).join('') + `<div style="margin-top:10px"><button class="btn btn-primary" id="submitQuizBtn">Submit</button>
      <button class="btn btn-ghost" id="clearQuizBtn">Clear</button></div><div id="quizResult" style="margin-top:10px;font-weight:700"></div>`;

    // restore saved
    const saved = localStorage.getItem(QUIZ_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data && data.ans) {
          Object.keys(data.ans).forEach(k => {
            const elRadio = document.querySelector(`input[name="${k}"][value="${data.ans[k]}"]`);
            if (elRadio) elRadio.checked = true;
          });
          el('quizResult').innerText = data.msg || '';
        }
      } catch (e) {}
    }
    // bind
    const sub = el('submitQuizBtn'); if (sub) sub.addEventListener('click', submitQuiz);
    const clr = el('clearQuizBtn'); if (clr) clr.addEventListener('click', clearQuiz);
  }
  function submitQuiz(){
    const results = MODULE.quiz.map((Q,i) => {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      const val = sel ? parseInt(sel.value,10) : null;
      return { correct: Q.correct === val, selected: val };
    });
    const correct = results.filter(r=>r.correct).length;
    const total = MODULE.quiz.length;
    const pct = Math.round((correct/total)*100);
    let msg = `Score: ${correct}/${total} (${pct}%) — `;
    if (pct === 100) msg += 'Excellent — you understand property protection.';
    else if (pct >=70) msg += 'Good — review missed items.';
    else msg += 'Review module & practice drills again.';
    el('quizResult').innerText = msg;
    // save
    const ans = {};
    MODULE.quiz.forEach((_,i)=>{
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      ans['q'+i] = sel ? sel.value : null;
    });
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ ans, correct, total, pct, msg }));
  }
  function clearQuiz(){
    MODULE.quiz.forEach((_,i)=>{ document.querySelectorAll(`input[name="q${i}"]`).forEach(r=> r.checked=false); });
    el('quizResult').innerText = '';
    localStorage.removeItem(QUIZ_KEY);
  }

  // Stories modal
  function openStory(e,id){
    if (e) e.preventDefault();
    const title = id===1 ? 'Anchored roof saved homes' : 'Community resilience example';
    const body = id===1 ? 'Anchoring roof with straps prevented uplift — houses kept dry and required only minor repairs.' : 'Community storage on raised platforms reduced seed loss and accelerated recovery.';
    el('storyModalTitle').innerText = title;
    el('storyModalBody').innerText = body;
    el('storyModal').style.display='flex';
  }
  function closeStory(){ el('storyModal').style.display='none'; }

  // Print
  function printModule(){ window.print(); }

  // Save sample evidence note (quick helper)
  function saveEvidenceNote(){
    try {
      const note = { ts: Date.now(), note: 'Take photos of roof, windows, water tank (before cyclone)' };
      localStorage.setItem('safesphere_evidence_note', JSON.stringify(note));
      alert('Sample evidence note saved locally.');
    } catch(e){ console.warn(e); }
  }

  // Alert bar integration (non-blocking)
  function updateDisasterAlertFromWeather(data){
    const bar = el('disaster-alert-bar');
    const text = el('alertText'); const icon = el('alertIcon');
    if (!data) { bar.className='alert-normal'; icon.innerText='🟢'; text.innerText='No cyclone warning. Stay prepared.'; return; }
    // simple heuristics
    const desc = (data.description||'').toLowerCase();
    if ((desc.indexOf('cyclone')>-1) || (data.severity && data.severity==='severe')) {
      bar.className='alert-danger';
      icon.innerText='🚨';
      text.innerText='Severe cyclone warning — follow evacuation orders now.';
    } else if (desc.indexOf('storm')>-1 || desc.indexOf('gale')>-1) {
      bar.className='alert-warning';
      icon.innerText='🌬️';
      text.innerText='Strong wind / storm risk — secure loose objects and follow local advice.';
    } else {
      bar.className='alert-normal';
      icon.innerText='🟢';
      text.innerText='No cyclone warning. Stay prepared.';
    }
    bar.style.transform='';
    bar.style.opacity='1';
  }

  // Init wiring on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    // global buttons
    const openBtns = [el('openChecklistBtn'), el('openChecklistBtn2')].filter(Boolean);
    openBtns.forEach(b => b.addEventListener('click', openChecklist));
    if (el('openQuizBtn')) el('openQuizBtn').addEventListener('click', function(){ el('quizSection').hidden = false; renderQuiz(); });

    // checklist tab delegation inside modal
    document.addEventListener('click', function(ev){
      const t = ev.target.closest('#checklistTabs .tab');
      if (t && t.dataset.tab) switchChecklistTab(t.dataset.tab);
    });

    // bind print and dismiss actions
    if (el('printModuleBtn')) el('printModuleBtn').addEventListener('click', printModule);
    if (el('dismissAlert')) {
      el('dismissAlert').addEventListener('click', function(){
        const bar = el('disaster-alert-bar'); bar.style.transform='translateY(-120%)'; setTimeout(()=> bar.style.opacity='0',260);
      });
      el('dismissAlert').addEventListener('keyup', function(e){ if (e.key==='Enter' || e.key===' ') e.target.click(); });
    }

    // checklist modal tab buttons (create them)
    const checklistTabsContainer = el('checklistTabs');
    if (checklistTabsContainer) {
      // already present? otherwise create
    }
    // bind checklist modal tab switching default behavior
    function switchChecklistTab(tab){
      const tabs = document.querySelectorAll('#checklistTabs .tab');
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab===tab));
      const content = el('checklistContent');
      if (!content) return;
      if (tab==='overview') {
        content.innerHTML = `<p class="small-muted">Checklist focuses on reducing structural & property loss. Save progress locally.</p>`;
      } else if (tab==='before' || tab==='during' || tab==='after') {
        const arr = MODULE[tab].bullets;
        content.innerHTML = `<h4>${MODULE[tab].title}</h4><ul>` + arr.map(i=>`<li>${i}</li>`).join('') + `</ul>`;
      } else if (tab==='checklist') {
        content.innerHTML = MODULE.checklist.map((c,i)=> `<div class="checklist-item"><input id="chk_${i}" type="checkbox"> <label for="chk_${i}">${c}</label></div>`).join('');
        restoreChecklistState();
      }
    }
    // expose small function to global cyclone object used by HTML
    window.cyclone = {
      switchTab: function(tab){ $('.tab').forEach(t=> t.classList.toggle('active', t.dataset.tab===tab)); renderTab(tab); updatePoster(tab); },
      openChecklist: openChecklist,
      closeChecklist: closeChecklist,
      saveChecklist: saveChecklist,
      openStory: openStory,
      closeStory: closeStory,
      printModule: printModule,
      openStoryEvent: openStory,
      updateDisasterAlertFromWeather: updateDisasterAlertFromWeather
    };

    // create visible checklist tabs inside modal if missing (safe fallback)
    if (!document.querySelector('#checklistTabs .tab')) {
      const tabsHtml = `<div id="checklistTabs" class="tabs-inner">
        <button class="tab active" data-tab="overview">Overview</button>
        <button class="tab" data-tab="before">Before</button>
        <button class="tab" data-tab="during">During</button>
        <button class="tab" data-tab="after">After</button>
        <button class="tab" data-tab="checklist">Checklist</button>
      </div>`;
      const box = document.querySelector('.checklist-box');
      if (box) box.insertAdjacentHTML('beforeend', tabsHtml);
      // initial content
      switchChecklistTab('overview');
    }

    // wire story modal close (backdrop & buttons)
    document.querySelectorAll('.story-backdrop, .story-box .btn-ghost').forEach(n=>{ n.addEventListener('click', closeStory); });

    // evidence save
    if (el('saveEvidenceBtn')) el('saveEvidenceBtn').addEventListener('click', saveEvidenceNote);
  });

  // Small helper functions used above but hoisted
  function switchChecklistTab(tab) {
    const tabs = document.querySelectorAll('#checklistTabs .tab');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab===tab));
    const content = el('checklistContent');
    if (!content) return;
    if (tab === 'overview') {
      content.innerHTML = `<p class="small-muted">Checklist focuses on reducing structural & property loss. Save progress locally.</p>`;
    } else if (['before','during','after'].includes(tab)) {
      const arr = MODULE[tab].bullets;
      content.innerHTML = `<h4>${MODULE[tab].title}</h4><ul>` + arr.map(i=>`<li>${i}</li>`).join('') + `</ul>`;
    } else if (tab==='checklist') {
      content.innerHTML = MODULE.checklist.map((c,i)=> `<div class="checklist-item"><input id="chk_${i}" type="checkbox"> <label for="chk_${i}">${c}</label></div>`).join('');
      restoreChecklistState();
    }
  }

  function restoreChecklistState(){
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      document.querySelectorAll('#checklistContent input[type="checkbox"]').forEach((ch,i)=> ch.checked = !!arr[i]);
    } catch(e){ console.warn('restoreChecklistState', e); }
  }

  // utility
  function initTabs(){ /* stub exists above, replaced by cyclone.switchTab exposure */ }
  // expose renderQuiz & others global for debugging
  window.cycloneRenderQuiz = function(){ renderQuiz(); };
  function renderQuiz(){ /* see earlier inner function renderQuiz defined — reusing that implementation */ }
})();
