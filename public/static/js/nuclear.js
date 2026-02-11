/* nuclear.js - interactive behavior for Nuclear Safety module
   - tab rendering
   - checklist modal (local save / print / share)
   - quiz
   - TTS (client speechSynthesis) + server-TTS stub
   - incident alert update
*/

(function () {
  // ----- Module content (calm, civilian-facing) -----
  const CONTENT = {
    what: `
      <h3>What is a Nuclear Emergency?</h3>
      <p>A nuclear emergency means radioactive material may have been released and people could be exposed.
         Most incidents are industrial, medical or transport-related. Very rarely this involves weapons.</p>
      <h4>Common incident types</h4>
      <ul>
        <li><strong>Power plant accident:</strong> Cooling or containment failure due to equipment or disaster.</li>
        <li><strong>Material leak:</strong> Medical/industrial sources lost, damaged, or transported incorrectly.</li>
        <li><strong>Detonation (rare):</strong> Terrible scenario — official orders are decisive.</li>
      </ul>
      <div class="module-note small">
        <strong>Key idea:</strong> Distance, shielding and time reduce exposure. Calm, quick sheltering saves lives.
      </div>
    `,
    before: `
      <h3>Before an incident — prepare calmly</h3>
      <p>Preparation reduces panic and exposure. Focus on shelter planning, an emergency kit and community coordination.</p>
      <h4>Household checklist</h4>
      <ul>
        <li>Choose an inner room with few windows for temporary shelter.</li>
        <li>Store basic emergency kit: water, sealed food, radio, torch, medicines.</li>
        <li>Have plastic sheets, tape and towels to seal vents and gaps.</li>
        <li>Keep printed emergency contact numbers in a plastic bag.</li>
        <li>Do not keep iodine tablets unless officially advised by health authorities.</li>
      </ul>
      <h4>School & community</h4>
      <ul>
        <li>Designate shelter rooms and practice a calm "go inside, seal, stay" drill.</li>
        <li>Assign helpers for children, elderly and people with disabilities.</li>
      </ul>
    `,
    during: `
      <h3>During an alert — immediate actions</h3>
      <p>If you receive an official nuclear alert or suspect release, act quickly but calmly.</p>
      <ol>
        <li>Go inside immediately. Do not run outside.</li>
        <li>Close all doors and windows; turn off fans, air conditioners and ventilation.</li>
        <li>Move to the innermost room possible (basement or middle room is best).</li>
        <li>Do not eat uncovered food or drink open water sources.</li>
      </ol>
      <div class="info small">
        <strong>Note:</strong> Simple buildings reduce exposure significantly — staying sheltered often is the best action.
      </div>
    `,
    evac: `
      <h3>Evacuation — only on official order</h3>
      <p>Evacuation may be necessary if authorities calculate that exposure outside is safer than sheltering.</p>
      <h4>If told to evacuate</h4>
      <ul>
        <li>Take ID, medicines, small emergency bag.</li>
        <li>Wear covered clothing and shoes; protect mouth/nose with a cloth or mask.</li>
        <li>Follow the assigned route — do not use your own back roads unless instructed.</li>
      </ul>
      <p class="small">Leaving too early can put you at higher risk. Wait for official routes when possible.</p>
    `,
    decon: `
      <h3>Decontamination — simple step-by-step</h3>
      <ol>
        <li>Remove outer clothes carefully (do not shake). Put them in a plastic bag and seal.</li>
        <li>Shower with warm water and soap — wash hair with shampoo (no conditioner).</li>
        <li>Gently wash exposed skin; do NOT scrub hard. Rinse thoroughly.</li>
        <li>Wear clean clothes after washing. Keep contaminated clothes sealed until disposal instructions are given.</li>
      </ol>
      <p class="small">Removing clothes removes most contamination. Help children gently and calmly.</p>
    `,
    after: `
      <h3>After the incident — recovery steps</h3>
      <ul>
        <li>Return outdoors only after official clearance.</li>
        <li>Clean home surfaces with wet cloths and mopping (no sweeping that stirs dust).</li>
        <li>Document damage and personal exposures for health/relief claims.</li>
        <li>Seek medical care for symptoms and mental health support for trauma.</li>
      </ul>
    `,
    resources: `
      <h3>Resources & trusted sources</h3>
      <ul>
        <li>Local Disaster Management Authority (district/state)</li>
        <li>National health authority and hospital emergency numbers</li>
        <li>IAEA & WHO public guidance — use official translations</li>
      </ul>
      <p class="small">Avoid rumors. Share official links and instructions only.</p>
    `
  };

  // ------- QUIZ data -------
  const QUIZ = [
    { q: "What is the first action on receiving a nuclear alert?", a: ["Run outside", "Go indoors and seal openings", "Drive away immediately"], correct: 1 },
    { q: "What removes most contamination on your body?", a: ["Removing outer clothes", "Rinsing eyes only", "Drinking water"], correct: 0 },
    { q: "When should iodine tablets be used?", a: ["Always", "Only when official health authorities advise", "When you feel nauseous"], correct: 1 },
    { q: "Should you eat uncovered food during an incident?", a: ["Yes, if hungry", "No, avoid uncovered food", "Only fruits"], correct: 1 }
  ];

  // ------- Checklist data -------
  const CHECKS = {
    title: "Nuclear Safety — Checklist",
    overview: "Short checklist to prepare and react safely. Progress saved locally.",
    before: [
      "Identify inner shelter room",
      "Prepare emergency bag (water, medicines, torch, radio)",
      "Keep plastic sheets & tape for sealing",
      "Learn the family evacuation plan"
    ],
    during: [
      "Go inside and close & seal openings",
      "Turn off ventilation and heaters",
      "Use sealed water and food only"
    ],
    after: [
      "Wait for official 'all-clear' before going outside",
      "Wet-clean surfaces and mop floors",
      "Seek medical checks for symptoms"
    ]
  };

  // ----- render tab content -----
  function switchTab(tab) {
    // tabs UI
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    // content
    const el = document.getElementById('moduleContent');
    el.innerHTML = CONTENT[tab] || '<p class="small">Content not found.</p>';
    // update TTS text attribute so protect-tts picks up
    el.setAttribute('data-tts-text', stripHtml(el.innerText || ''));
  }

  function stripHtml(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  // ----- QUIZ rendering & logic -----
  const QUIZ_KEY = 'nuclear_quiz_v1';
  function renderQuiz() {
    const wrap = document.getElementById('quizWrap');
    wrap.innerHTML = QUIZ.map((Q, i) => `
      <div class="quiz-question" data-idx="${i}">
        <p style="font-weight:700">Q${i+1}. ${Q.q}</p>
        <div class="quiz-options">${Q.a.map((opt,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${opt}</label>`).join('')}</div>
      </div>
    `).join('') + `<div style="margin-top:10px"><button class="btn btn-primary" id="submitQuiz">Submit</button> <button class="btn btn-ghost" id="clearQuiz">Clear</button></div>
      <div id="quizResult" style="margin-top:12px;font-weight:700"></div>`;

    // restore saved answers
    try {
      const saved = JSON.parse(localStorage.getItem(QUIZ_KEY) || '{}');
      if (saved && saved.ans) {
        Object.keys(saved.ans).forEach(k => {
          const el = document.querySelector(`input[name="${k}"][value="${saved.ans[k]}"]`);
          if (el) el.checked = true;
        });
        document.getElementById('quizResult').innerText = saved.msg || '';
      }
    } catch (e){}
    document.getElementById('submitQuiz').addEventListener('click', submitQuiz);
    document.getElementById('clearQuiz').addEventListener('click', clearQuiz);
  }

  function submitQuiz(){
    const results = QUIZ.map((Q,i)=>{
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      const val = sel ? parseInt(sel.value,10) : null;
      return { correct: Q.correct === val, selected: val };
    });
    const correct = results.filter(r=>r.correct).length;
    const total = QUIZ.length;
    const pct = Math.round(correct/total*100);
    let msg = `Score: ${correct}/${total} (${pct}%) — `;
    if(pct===100) msg += 'Excellent — you understand the key steps.';
    else if(pct>=75) msg += 'Good — review the module for missed items.';
    else msg += 'Review the module and practise the drills again.';
    document.getElementById('quizResult').innerText = msg;
    const ans = {};
    QUIZ.forEach((_,i)=>{
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      ans['q'+i] = sel ? sel.value : null;
    });
    localStorage.setItem(QUIZ_KEY, JSON.stringify({ ans, correct, total, pct, msg }));
  }

  function clearQuiz(){
    QUIZ.forEach((_,i)=> document.querySelectorAll(`input[name="q${i}"]`).forEach(x=>x.checked=false));
    document.getElementById('quizResult').innerText = '';
    localStorage.removeItem(QUIZ_KEY);
  }

  // ----- Checklist modal -----
  const CHECK_KEY = 'nuclear_check_v1';
  function openChecklist() {
    document.getElementById('checklistModal').style.display = 'flex';
    switchChecklistTab('overview');
    loadChecklistProgress();
  }
  function closeChecklist(){ document.getElementById('checklistModal').style.display = 'none'; }

  function switchChecklistTab(tab){
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('checklistContent');
    if(tab === 'overview'){
      content.innerHTML = `<p class="small">${CHECKS.overview}</p>
        <p class="small">Use tabs to view items; mark checklist and Save to store progress on this device.</p>`;
    } else if(tab === 'before' || tab === 'during' || tab === 'after'){
      const arr = CHECKS[tab] || [];
      content.innerHTML = `<h3>${tab.charAt(0).toUpperCase()+tab.slice(1)}</h3>` + arr.map(i=>`<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if(tab === 'checklist'){
      const list = [...(CHECKS.before||[]), ...(CHECKS.during||[]), ...(CHECKS.after||[])];
      content.innerHTML = list.map((it, idx)=>`
        <div class="checklist-item">
          <input id="chk_${idx}" type="checkbox">
          <label for="chk_${idx}">${it}</label>
        </div>
      `).join('');
      restoreCheckedState();
    }
  }

  function saveChecklistProgress(){
    const inputs = Array.from(document.querySelectorAll(`#checklistContent input[type="checkbox"]`));
    const state = inputs.map(i => i.checked);
    localStorage.setItem(CHECK_KEY, JSON.stringify(state));
    alert('Checklist saved locally on this device.');
  }

  function loadChecklistProgress(){
    setTimeout(()=>{
      try {
        const raw = localStorage.getItem(CHECK_KEY);
        if(!raw) return;
        const arr = JSON.parse(raw);
        const inputs = document.querySelectorAll(`#checklistContent input[type="checkbox"]`);
        inputs.forEach((ch, idx) => {
          ch.checked = !!arr[idx];
          ch.addEventListener('change', () => {
            const all = Array.from(document.querySelectorAll(`#checklistContent input[type="checkbox"]`)).map(c => c.checked);
            localStorage.setItem(CHECK_KEY, JSON.stringify(all));
          });
        });
      } catch (e){ console.warn('loadChecklist:', e); }
    }, 60);
  }
  function restoreCheckedState(){
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if(!raw) return;
      const arr = JSON.parse(raw);
      document.querySelectorAll(`#checklistContent input[type="checkbox"]`).forEach((ch, idx)=> ch.checked = !!arr[idx]);
    } catch(e){ console.warn('restore:', e); }
  }

  function printChecklist(){
    const title = document.getElementById('checklistTitle').innerText;
    const contentHtml = document.getElementById('checklistContent').innerHTML;
    const win = window.open('', '', 'width=700,height=900');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px;} .checklist-item{margin-bottom:8px;}</style></head><body><h2>${title}</h2>${contentHtml}</body></html>`);
    win.document.close();
    win.print();
  }

  async function shareChecklist(){
    if(!navigator.share){ alert('Share not supported. Use Print or Save locally.'); return; }
    const title = document.getElementById('checklistTitle').innerText;
    const text = Array.from(document.querySelectorAll('#checklistContent label')).map(l => l.innerText).join('\n');
    try{ await navigator.share({ title, text }); } catch(e){ console.warn('share failed', e) }
  }

  // ----- Story modal -----
  function openStory(title, body){
    document.getElementById('storyModalTitle').innerText = title;
    document.getElementById('storyModalBody').innerText = body;
    document.getElementById('storyModal').style.display = 'flex';
  }
  function closeStory(){ document.getElementById('storyModal').style.display = 'none'; }

  // ----- TTS (client) -----
  let ttsUtter = null;
  function ttsPlayClient(){
    const text = document.getElementById('moduleContent').getAttribute('data-tts-text') || document.getElementById('moduleContent').innerText || '';
    if(!text) { alert('No text available for TTS'); return; }
    const lang = document.getElementById('ttsLang').value || 'en-US';
    const rate = parseFloat(document.getElementById('ttsRate').value || '1.0');
    if(window.speechSynthesis){
      if(ttsUtter) { speechSynthesis.cancel(); ttsUtter = null; }
      ttsUtter = new SpeechSynthesisUtterance(text);
      ttsUtter.lang = lang;
      ttsUtter.rate = rate;
      // try to pick a voice matching the language
      const voices = speechSynthesis.getVoices();
      const v = voices.find(x => x.lang && x.lang.toLowerCase().startsWith(lang.split('-')[0]));
      if(v) ttsUtter.voice = v;
      ttsUtter.onend = ()=> { document.getElementById('ttsPause').disabled = true; document.getElementById('ttsStop').disabled = true; };
      speechSynthesis.speak(ttsUtter);
      document.getElementById('ttsPause').disabled = false; document.getElementById('ttsStop').disabled = false;
    } else {
      alert('Speech API not supported in this browser.');
    }
  }
  function ttsPause(){ if(window.speechSynthesis){ speechSynthesis.pause(); } }
  function ttsStop(){ if(window.speechSynthesis){ speechSynthesis.cancel(); } }

  // server tts stub: expects endpoint that returns { url: "<media url>" }
  async function ttsServerPlay(){
    const slug = document.getElementById('moduleContent').getAttribute('data-tts-slug') || 'nuclear_safety';
    const lang = document.getElementById('ttsLang').value || 'en-US';
    // endpoint example: /safe/tts?slug=nuclear_safety&lang=en-US
    const url = `/safe/tts?slug=${encodeURIComponent(slug)}&lang=${encodeURIComponent(lang)}`;
    try {
      const res = await fetch(url);
      if(!res.ok) throw new Error('Server TTS not available');
      const json = await res.json();
      if(json.url){
        const audio = new Audio(json.url);
        audio.play();
        document.getElementById('ttsDownload').style.display = 'inline-block';
        document.getElementById('ttsDownload').href = json.url;
        document.getElementById('ttsDownload').download = `${slug}_${lang}.mp3`;
      } else alert('TTS generation not ready on server.');
    } catch(e){ console.warn('ttsServerPlay:', e); alert('Server TTS not available.'); }
  }

  // ----- Incident alert updater (exposed) -----
  function updateIncidentAlertFromData(data){
    const bar = document.getElementById('incident-alert');
    const icon = document.getElementById('incidentIcon');
    const text = document.getElementById('incidentText');
    bar.className = ''; // reset
    if(!data){ bar.className = 'alert-normal'; icon.innerText='🟢'; text.innerText='No active nuclear incidents reported.'; return; }
    // data example: { level: 'normal'|'warning'|'danger', message: '...' }
    if(data.level === 'danger'){ bar.className = 'alert-danger'; icon.innerText='🚨'; text.innerText = data.message || 'Severe nuclear incident — follow instructions.'; }
    else if(data.level === 'warning'){ bar.className = 'alert-warning'; icon.innerText='⚠️'; text.innerText = data.message || 'Nuclear situation: prepare to shelter.'; }
    else { bar.className = 'alert-normal'; icon.innerText='🟢'; text.innerText = data.message || 'No active nuclear incidents reported.'; }
  }

  // ----- Print module (wrap) -----
  function printModule(){
    const title = document.getElementById('pageTitle').innerText;
    const content = document.querySelector('.wrap').innerHTML;
    const win = window.open('', '', 'width=900,height=1000');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close(); win.print();
  }

  // ----- Init -----
  document.addEventListener('DOMContentLoaded', function () {
    // initial tab
    switchTab('what');
    // quiz
    renderQuiz();

    // hook up checklist buttons
    const openBtn = document.getElementById('openChecklistBtn');
    if(openBtn) openBtn.addEventListener('click', openChecklist);
    // checklist inner buttons
    document.querySelectorAll('.tabs-inner .tab').forEach(t=> t.addEventListener('click', ()=> switchChecklistTab(t.dataset.tab)));
    // connect print/share/save buttons inside checklist
    const shareBtn = document.querySelector('.checklist-controls button[onclick*="shareChecklist"]');
    if(shareBtn) shareBtn.addEventListener('click', shareChecklist);
    // story modal close
    document.querySelectorAll('.story-box .btn, .story-backdrop').forEach(el => { if(el) el.addEventListener('click', closeStory); });

    // TTS controls
    const play = document.getElementById('ttsPlay');
    if(play) play.addEventListener('click', ttsPlayClient);
    const pause = document.getElementById('ttsPause');
    if(pause) pause.addEventListener('click', ttsPause);
    const stop = document.getElementById('ttsStop');
    if(stop) stop.addEventListener('click', ttsStop);
    const serverBtn = document.getElementById('ttsServerBtn');
    if(serverBtn) serverBtn.addEventListener('click', ttsServerPlay);

    // checklist save/print wired in template buttons: ensure they exist
    const saveBtn = document.querySelector('.checklist-footer .btn-primary');
    if(saveBtn) saveBtn.addEventListener('click', saveChecklistProgress);
    const printBtn = document.querySelector('.checklist-controls button[onclick*="printChecklist"]');
    if(printBtn) printBtn.addEventListener('click', printChecklist);

    // expose helper globally
    window.updateIncidentAlertFromData = updateIncidentAlertFromData;
    window.openChecklist = openChecklist;
    window.closeChecklist = closeChecklist;
    window.switchTab = switchTab;
    window.openStory = openStory;
    window.closeStory = closeStory;
    window.printModule = printModule;
  });

})();
