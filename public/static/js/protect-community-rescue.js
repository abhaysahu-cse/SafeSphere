/* protect-community-rescue.js
   Handles tabs, inventory, roster, drills, checklist, export/import
   Save under static/js/protect-community-rescue.js
*/
(function(){
  // ---------- storage keys ----------
  const INV_KEY = 'community_rescue_inventory_v1';
  const PERSON_KEY = 'community_rescue_persons_v1';
  const CHECK_KEY = 'community_rescue_checklist_v1';
  const DRILL_KEY = 'community_rescue_drills_v1';

  // ---------- TAB CONTENT ----------
  const TAB_HTML = {
    equipment: `
      <h3>Essential equipment (recommended minimum)</h3>
      <ul>
        <li><strong>Lifejackets / PFDs</strong>: correct size, ISO-approved if available, bright colours, spray covers for storage.</li>
        <li><strong>Throwbags / rescue lines</strong>: 15–30 m water rescue rope with floatation throwbag.</li>
        <li><strong>Rescue boats</strong>: flat-bottom or inflatable with oars; clearly marked; 2-person minimum crew.</li>
        <li><strong>Boat tools</strong>: oars, bailer, pump, anchor, repair kit.</li>
        <li><strong>Comms</strong>: VHF/PMR radios or charged mobile phones with spare power banks.</li>
        <li><strong>Medical kit</strong>: trauma dressings, tourniquet, splint, antiseptics, oral rehydration salts, gloves, scissors.</li>
        <li><strong>PPE</strong>: helmets, gloves, sturdy boots, thermal blankets.</li>
      </ul>
      <p class="small">Maintain serial numbers, last service date and storage location in the inventory. Replace knotted or frayed ropes immediately.</p>
      <p><strong>Storage & maintenance:</strong> dry and ventilated storage, weekly visual checks, monthly function tests (inflate, pump, radio check).</p>
    `,
    boats: `
      <h3>Boat operations — safety checklist</h3>
      <ol>
        <li>Always brief team: roles (helm, bow person, shore safety, medic).</li>
        <li>Check weather/water current — avoid high flow or debris where possible.</li>
        <li>Inspect hull, valves, seams, oars, attachments; check fuel/air pressure before launch.</li>
        <li>Use a shore safety line and a separate spare throwbag; one person remains on shore if possible.</li>
        <li>Approach victims from downstream or at an angle to avoid being pinned; use poles/lines to stabilise.</li>
        <li>Recover victims into the boat one at a time; keep the boat stable; use scoop/slings if available.</li>
      </ol>
      <p class="small">If water is fast, favour shore-based rescue techniques (reach & throw) unless the crew is trained in swift-water rescue.</p>
      <p><strong>Boat capacity</strong>: do not overload — account for crew, victim, gear and buoyancy loss from water saturation.</p>
    `,
    ropes: `
      <h3>Rope systems & knots (practical)</h3>
      <p>Keep at least two types of line: floating rescue line (throwbag) and static rope for anchoring/tying (10-12 mm).</p>
      <ul>
        <li><strong>Throwbag</strong>: practice under calm conditions. Use to pass a line to a conscious victim.</li>
        <li><strong>Anchor lines</strong>: use for securing boat to shore tree/anchor point.</li>
        <li><strong>Knots to practice</strong>: figure-eight on a bight, clove hitch, bowline, rolling hitch. These are robust & easy to untie.</li>
      </ul>
      <p class="small">We recommend hands-on training with visual diagrams/GIFs for each knot. Replace rope with cuts/frays.</p>
      <p><a class="btn ghost" onclick="openGuide('knots')">Open knot guide (diagrams)</a></p>
    `,
    medical: `
      <h3>Medical kit contents (minimum community kit)</h3>
      <ul>
        <li>Large trauma dressing x2, adhesive dressings, triangular bandages x4</li>
        <li>Basic airway management: disposable face shield for CPR</li>
        <li>Antiseptic wipes, povidone iodine, sterile saline for wound irrigation</li>
        <li>Analgesic (paracetamol), oral rehydration salts (ORS)</li>
        <li>Splint materials, elastic bandages, scissors, tweezers</li>
        <li>Disposable gloves (nitrile), basic thermometer, hand sanitizer</li>
      </ul>
      <p class="small">Store dry and check expiry dates quarterly. Train at least one volunteer in basic life support & bleeding control.</p>
    `,
    training: `
      <h3>Training topics & roster</h3>
      <ul>
        <li>Boat launch & recovery drills, including shallow-water launch techniques.</li>
        <li>Shore-based rescue: reach, throw, row — practise with throwbags and rescue poles.</li>
        <li>Victim handling: safe approach, packaging, lifeboat entry and transfer to medic.</li>
        <li>Rope work & knots: simple anchors, hauling systems, lowering a casualty safely.</li>
        <li>First aid: bleeding control, shock management, hypothermia, fracture stabilization.</li>
        <li>Communications: how to use radios, short messages and call signs, relay plans to authorities.</li>
      </ul>
      <p class="small">Keep a roster with roles, emergency contact, and next-of-training date. Rotate roles so multiple people can operate equipment.</p>
    `,
    drills: `
      <h3>Drill planner</h3>
      <p class="small">Plan small, frequent drills. Example schedule: table-top discussion → equipment check → practical launch → full simulated rescue with medic.</p>
      <ol>
        <li>Table-top scenario & roles (30 min)</li>
        <li>Equipment check & station set-up (20 min)</li>
        <li>Boat launch & victim recovery drill (45 min)</li>
        <li>After-action review & log entry (20 min)</li>
      </ol>
      <p>Record lessons learned and update checklists and inventory after each drill.</p>
    `,
    resources: `
      <h3>Printable checklists & guides</h3>
      <ul>
        <li>Pre-deployment equipment checklist (floor poster)</li>
        <li>Boat launch and recovery checklist — printable A4</li>
        <li>First-aid quick strip for medics</li>
        <li>Volunteer role card templates (PDF)</li>
      </ul>
    `
  };

  // ---------- Tabs ----------
  function switchTab(tab){
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('tabContent');
    content.innerHTML = TAB_HTML[tab] || '<p class="small">No content</p>';
  }

  // ---------- Inventory ----------
  function loadInventory(){ try { return JSON.parse(localStorage.getItem(INV_KEY) || '[]'); } catch(e){ return []; } }
  function saveInventory(arr){ localStorage.setItem(INV_KEY, JSON.stringify(arr)); renderInventory(); }

  function addEquipment(){
    const name = document.getElementById('equip_name').value.trim();
    const cat = document.getElementById('equip_cat').value;
    const qty = parseInt(document.getElementById('equip_qty').value, 10) || 1;
    const condition = document.getElementById('equip_condition').value;
    const location = document.getElementById('equip_loc').value.trim();
    const notes = document.getElementById('equip_notes').value.trim();
    if(!name){ alert('Enter item name'); return; }
    const arr = loadInventory();
    arr.push({ id: 'e_' + Date.now(), name, cat, qty, condition, location, notes, addedAt: new Date().toISOString() });
    saveInventory(arr);
    clearEquipForm();
  }

  function clearEquipForm(){
    ['equip_name','equip_qty','equip_loc','equip_notes'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    document.getElementById('equip_qty').value = 1;
  }

  function renderInventory(){
    const arr = loadInventory();
    const wrap = document.getElementById('inventoryList');
    if(!wrap) return;
    if(arr.length === 0){ wrap.innerHTML = '<div class="small-muted">No equipment recorded.</div>'; return; }
    wrap.innerHTML = arr.map(it => `
      <div class="lot" data-id="${it.id}">
        <strong>${escapeHtml(it.name)}</strong> <span class="kv">(${escapeHtml(it.cat)})</span>
        <div class="kv">Qty: ${it.qty} • Condition: ${escapeHtml(it.condition)} • Loc: ${escapeHtml(it.location || '—')}</div>
        <div style="margin-top:6px">
          <button class="btn ghost" onclick="editEquipment('${it.id}')">Edit</button>
          <button class="btn ghost" onclick="removeEquipment('${it.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }

  window.editEquipment = function(id){
    const arr = loadInventory();
    const it = arr.find(x => x.id === id);
    if(!it) return alert('Item not found');
    document.getElementById('equip_name').value = it.name;
    document.getElementById('equip_cat').value = it.cat;
    document.getElementById('equip_qty').value = it.qty;
    document.getElementById('equip_condition').value = it.condition;
    document.getElementById('equip_loc').value = it.location;
    document.getElementById('equip_notes').value = it.notes;
    removeEquipment(id);
  };

  window.removeEquipment = function(id){
    if(!confirm('Remove this equipment?')) return;
    let arr = loadInventory(); arr = arr.filter(x => x.id !== id); saveInventory(arr);
  };

  // ---------- Persons / roster ----------
  function loadPersons(){ try { return JSON.parse(localStorage.getItem(PERSON_KEY) || '[]'); } catch(e){ return []; } }
  function savePersons(arr){ localStorage.setItem(PERSON_KEY, JSON.stringify(arr)); renderPersons(); }

  function addPerson(){
    const name = document.getElementById('p_name').value.trim();
    const role = document.getElementById('p_role').value;
    const contact = document.getElementById('p_contact').value.trim();
    if(!name) return alert('Enter name');
    const arr = loadPersons();
    arr.push({ id:'p_'+Date.now(), name, role, contact, addedAt:new Date().toISOString() });
    savePersons(arr);
    document.getElementById('p_name').value=''; document.getElementById('p_contact').value='';
  }

  function renderPersons(){
    const arr = loadPersons();
    const wrap = document.getElementById('personsList');
    if(!wrap) return;
    if(arr.length === 0){ wrap.innerHTML = '<div class="small-muted">No volunteers registered.</div>'; return; }
    wrap.innerHTML = arr.map(p => `
      <div class="lot" data-id="${p.id}">
        <strong>${escapeHtml(p.name)}</strong> <span class="kv">(${escapeHtml(p.role)})</span>
        <div class="kv">Contact: ${escapeHtml(p.contact || '—')} • Added: ${new Date(p.addedAt).toLocaleString()}</div>
        <div style="margin-top:6px">
          <button class="btn ghost" onclick="removePerson('${p.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }

  window.removePerson = function(id){
    if(!confirm('Remove volunteer?')) return;
    let arr = loadPersons(); arr = arr.filter(x => x.id !== id); savePersons(arr);
  };

  window.clearPersons = function(){
    if(!confirm('Clear all volunteers?')) return;
    localStorage.removeItem(PERSON_KEY); renderPersons();
  };

  // ---------- Checklist modal ----------
  function bindChecklist(){
    const btn = document.getElementById('openChecklistBtn');
    if(btn) btn.addEventListener('click', () => {
      const modal = document.getElementById('checklistModal'); if(modal) modal.style.display = 'block';
      loadChecklist();
    });
  }

  window.closeChecklist = function(){ const m=document.getElementById('checklistModal'); if(m) m.style.display = 'none'; };

  window.saveChecklistModal = function(){
    const ids = ['ch_pfds','ch_ropes','ch_boat','ch_med','ch_comms','ch_ppe','ch_training'];
    const state = {};
    ids.forEach(id => { const el=document.getElementById(id); state[id]=!!(el && el.checked); });
    localStorage.setItem(CHECK_KEY, JSON.stringify({state, savedAt:new Date().toISOString()}));
    alert('Checklist saved locally.');
    closeChecklist();
  };

  function loadChecklist(){
    try {
      const raw = localStorage.getItem(CHECK_KEY); if(!raw) return;
      const obj = JSON.parse(raw); const state = obj.state || {};
      ['ch_pfds','ch_ropes','ch_boat','ch_med','ch_comms','ch_ppe','ch_training'].forEach(id => {
        const el = document.getElementById(id); if(el) el.checked = !!state[id];
      });
    } catch(e){ console.warn('loadChecklist', e); }
  }

  // ---------- Drills (simple planner) ----------
  function loadDrills(){ try { return JSON.parse(localStorage.getItem(DRILL_KEY) || '[]'); } catch(e){ return []; } }
  function saveDrills(arr){ localStorage.setItem(DRILL_KEY, JSON.stringify(arr)); renderDrills(); }

  window.scheduleDrill = function(dateISO, type, notes){
    const arr = loadDrills();
    arr.push({id:'d_'+Date.now(), date:dateISO, type, notes, createdAt:new Date().toISOString()});
    saveDrills(arr);
  };

  function renderDrills(){
    const arr = loadDrills();
    const container = document.getElementById('tabContent');
    // if drills tab active, show below (quick)
    if(document.querySelector('.tab.active') && document.querySelector('.tab.active').dataset.tab === 'drills'){
      const html = (arr.length === 0) ? '<div class="small-muted">No drills scheduled.</div>' :
        arr.map(d => `<div class="lot"><strong>${escapeHtml(d.type)}</strong> • ${new Date(d.date).toLocaleString()} <div class="kv">${escapeHtml(d.notes||'')}</div></div>`).join('');
      // append to tabContent
      container.innerHTML += `<h4 style="margin-top:12px">Scheduled drills</h4><div class="list">${html}</div>`;
    }
  }

  // ---------- Export / Import ----------
  function exportData(){
    const out = {
      inventory: loadInventory(),
      volunteers: loadPersons(),
      checklist: JSON.parse(localStorage.getItem(CHECK_KEY) || 'null'),
      drills: loadDrills(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rescue-export.json'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function importSampleEquipment(){
    const sample = [
      {id:'e_1', name:'Inflatable boat (4p)', cat:'boat', qty:1, condition:'Good', location:'community shed', notes:'inflatable, patch kit', addedAt:new Date().toISOString()},
      {id:'e_2', name:'Throwbag 20m', cat:'rope', qty:4, condition:'Good', location:'shed-shelf', notes:'float line', addedAt:new Date().toISOString()},
      {id:'e_3', name:'Adult lifejacket (L)', cat:'pfd', qty:6, condition:'Good', location:'shelf', notes:'fitted', addedAt:new Date().toISOString()},
      {id:'e_4', name:'First-aid kit (trauma)', cat:'medical', qty:2, condition:'Service due', location:'med-box', notes:'restock bandages', addedAt:new Date().toISOString()}
    ];
    localStorage.setItem(INV_KEY, JSON.stringify(sample));
    renderInventory();
  }

  // ---------- Guide modal (knots, boat diagram) ----------
  window.openGuide = function(topic){
    const title = (topic==='knots') ? 'Knots & Quick Guide' : 'Guide';
    let body = '';
    if(topic==='knots'){
      body = `<p class="small">Practice these knots: <strong>figure-eight on a bight</strong>, <strong>bowline</strong>, <strong>clove hitch</strong>. Use visual diagrams or GIFs for training.</p>
      <p><img src="{% static 'image/guides/knots_placeholder.png' %}" alt="knots diagram" style="max-width:100%;border-radius:8px;"></p>
      <p class="small">Tips: keep rope coiled, avoid sharp edges, replace frayed rope immediately.</p>`;
    } else {
      body = '<p>Guide content not available.</p>';
    }
    document.getElementById('guideTitle').innerText = title;
    document.getElementById('guideBody').innerHTML = body;
    const modal = document.getElementById('guideModal'); if(modal) modal.style.display = 'block';
  };

  window.closeGuide = function(){ const m=document.getElementById('guideModal'); if(m) m.style.display = 'none'; };

  // ---------- Utilities ----------
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]) }); }

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', function(){
    switchTab('equipment');
    renderInventory();
    renderPersons();
    bindChecklist();
    // hook up forms
    const equipForm = document.getElementById('equipForm'); if(equipForm) equipForm.addEventListener('submit', e=>{ e.preventDefault(); addEquipment(); });
    const personForm = document.getElementById('personForm'); if(personForm) personForm.addEventListener('submit', e=>{ e.preventDefault(); addPerson(); });
    // sample buttons
    const exportBtn = document.getElementById('exportBtn'); if(exportBtn) exportBtn.addEventListener('click', exportData);
    const sampleBtn = document.querySelector('[onclick="importSampleEquipment()"]'); if(sampleBtn) sampleBtn.addEventListener('click', importSampleEquipment);
    // checklist buttons
    const shareBtn = document.getElementById('shareBtn'); if(shareBtn) shareBtn.addEventListener('click', ()=>{ alert('Use Export to share JSON or Print the checklist.'); });
    // close modals on backdrop click already bound by HTML using onclick attributes
  });

  // expose for debugging
  window.renderInventory = renderInventory;
  window.renderPersons = renderPersons;
  window.exportData = exportData;
  window.importSampleEquipment = importSampleEquipment;

})();
