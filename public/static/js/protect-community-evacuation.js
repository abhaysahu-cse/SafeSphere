/* protect-community-evacuation.js
   Interactive behavior: tabs, DnD plan board, mobility registry,
   checklist modal, local save/export.
*/

(function(){
  // ----- TAB CONTENT: detailed guidance for each area -----
  const TAB_CONTENT = {
    mapping: `
      <h3>Route mapping — step by step</h3>
      <ol>
        <li><strong>Walk every zone</strong> with local leaders and note low points, obstructions, and electric poles.</li>
        <li><strong>Choose two independent routes</strong> from each danger zone — primary and alternate.</li>
        <li><strong>Width & slope</strong>: prefer routes wide enough for a stretcher and gentle slopes for elderly mobility.</li>
        <li><strong>Surface</strong>: prefer compacted earth, concrete or hard-packed soil; mark unstable mud/bridges.</li>
        <li><strong>Markers</strong>: prepare painted arrows, sign-boards and night reflectors; map coordinates (GPS) if possible.</li>
        <li><strong>Plan crossing points</strong> — avoid bridges that may be washed out; choose fords only if shallow and slow moving.</li>
      </ol>
      <p class="small">Deliverable: printed route map per ward, A3 poster, and a digital copy (photo) stored with community leader.</p>
    `,
    assembly: `
      <h3>Choosing assembly points</h3>
      <ul>
        <li>Raised, open field or school ground (no trees/power lines above).</li>
        <li>Space for at least 100 people per 1000 population — adjust to expected turnout.</li>
        <li>Access lanes for medical vehicle and separate vehicle staging lane.</li>
        <li>Water & sanitation spots nearby; plan for temporary latrines/shelters.</li>
        <li>Signage & reflector beacons for night-time evacuation.</li>
      </ul>
      <p class="small">Deliverable: assembly point card (location, capacity, assigned volunteers, contact number).</p>
    `,
    mobility: `
      <h3>Mobility & special needs</h3>
      <ol>
        <li>Create a local <strong>assistance register</strong> (name, house, phone, mobility type, volunteer name).</li>
        <li>Assign at least two volunteers per vulnerable person (one primary, one backup).</li>
        <li>Map wheelchair-friendly routes and confirm they remain passable during rains.</li>
        <li>Keep wheelchairs, belts, ropes and at least one community stretcher per 200 households.</li>
        <li>Plan dignity/privacy areas in assembly points (women & family tents).</li>
      </ol>
    `,
    vehicles: `
      <h3>Vehicles & boat staging</h3>
      <ul>
        <li>Designate separate <strong>vehicle staging area</strong> away from pedestrian flow — clear signage.</li>
        <li>Pre-assign drivers and fuel managers; keep 10% fuel reserve for evacuation hours.</li>
        <li>Boats: allocate upstream staging and a separate embarkation point with volunteers to load/unload animals and people safely.</li>
        <li>No parking on pedestrian routes; leave at least 2 m corridor for movement.</li>
      </ul>
    `,
    command: `
      <h3>Command, roles & communication</h3>
      <ol>
        <li>Appoint an evacuation leader (visible vest) and 3 deputies (zones).</li>
        <li>Define roles: volunteer coordinator, medical desk lead, vehicle lead, registration clerk.</li>
        <li>Communications: whistles for crowd control, megaphone, and a printed contact sheet (phone tree).</li>
        <li>Record movements on a simple ledger: time, household, number of people moved.</li>
      </ol>
    `,
    drills: `
      <h3>Drills & validation</h3>
      <ol>
        <li>Run a <strong>table-top exercise</strong> with leaders, then a full community drill every 6 months.</li>
        <li>Test night evacuation once a year (with lighting & reflectors).</li>
        <li>Measure time from alert to assembly; set target (e.g., <strong>15 minutes</strong> for 80% of households).</li>
        <li>Debrief: gather lessons and update maps/checklists.</li>
      </ol>
    `
  };

  // ----- UI: switch tabs -----
  function switchTab(tab){
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const cont = document.getElementById('tabContent');
    cont.innerHTML = TAB_CONTENT[tab] || '<p class="small">Content not found.</p>';
  }

  // init default tab
  document.addEventListener('DOMContentLoaded', function(){
    switchTab('mapping');
    initDnD();
    bindChecklistButtons();
    loadMobilityList();
    bindExport();
  });

  // ----- Checklist modal -----
  function bindChecklistButtons(){
    const openBtn = document.getElementById('openChecklistBtn');
    if(openBtn) openBtn.addEventListener('click', openChecklist);
  }

  window.openChecklist = function(){
    const modal = document.getElementById('checklistModal');
    if(modal) modal.style.display = 'block';
  };

  window.closeChecklist = function(){
    const modal = document.getElementById('checklistModal');
    if(modal) modal.style.display = 'none';
  };

  window.saveChecklistModal = function(){
    // save the checked state to localStorage
    const ids = ['c_map','c_assembly','c_mobility','c_vehicle','c_comms','c_drill'];
    const state = {};
    ids.forEach(id => {
      const el = document.getElementById(id);
      state[id] = !!(el && el.checked);
    });
    localStorage.setItem('evac_checklist_v1', JSON.stringify(state));
    alert('Checklist saved locally.');
    closeChecklist();
  };

  // ----- Drag & Drop plan board -----
  function initDnD(){
    const paletteItems = document.querySelectorAll('.palette-item');
    paletteItems.forEach(it=>{
      it.addEventListener('dragstart', function(e){
        e.dataTransfer.setData('text/plain', it.dataset.type);
      });
    });

    const board = document.getElementById('planBoard');
    if(!board) return;

    board.addEventListener('dragover', function(e){ e.preventDefault(); board.classList.add('drag-over'); });
    board.addEventListener('dragleave', function(){ board.classList.remove('drag-over'); });
    board.addEventListener('drop', function(e){
      e.preventDefault(); board.classList.remove('drag-over');
      const type = e.dataTransfer.getData('text/plain');
      if(!type) return;
      // don't duplicate unique items like assembly if already exists? allow multiple assembly
      const node = createPlanNode(type);
      board.appendChild(node);
    });

    document.getElementById('checkPlanBtn').addEventListener('click', checkPlan);
    document.getElementById('resetPlanBtn').addEventListener('click', resetPlan);
    document.getElementById('savePlanBtn').addEventListener('click', savePlanLocal);
  }

  function createPlanNode(type){
    const map = {
      'foot':'Pedestrian route',
      'wheel':'Wheelchair route',
      'assembly':'Assembly point',
      'medical':'Medical desk',
      'vehicle':'Vehicle staging',
      'boat':'Boat pickup',
      'sign':'Directional sign'
    };
    const el = document.createElement('div');
    el.className = 'board-node';
    el.dataset.type = type;
    el.tabIndex = 0;
    el.style.padding = '8px';
    el.style.margin = '6px 0';
    el.style.border = '1px solid rgba(2,6,23,0.06)';
    el.style.borderRadius = '6px';
    el.style.background = '#fff';
    el.innerHTML = `<strong>${map[type]||type}</strong> <span style="float:right;"><button onclick="removeNode(this)" class="btn-ghost small">✖</button></span>`;
    return el;
  }

  window.removeNode = function(btn){
    const node = btn.closest('.board-node');
    if(node) node.remove();
  };

  function resetPlan(){
    const board = document.getElementById('planBoard');
    if(board) board.innerHTML = '<p class="hint">Drop items here to plan routes & points</p>';
    const res = document.getElementById('planResult');
    if(res) res.innerText = '';
  }

  function checkPlan(){
    const board = document.getElementById('planBoard');
    if(!board) return;
    const types = Array.from(board.querySelectorAll('.board-node')).map(n=>n.dataset.type);
    // required critical items
    const required = ['foot','assembly','wheel','vehicle'];
    const found = required.filter(r => types.includes(r)).length;
    const score = Math.round((found / required.length) * 100);
    const res = document.getElementById('planResult');
    res.innerText = `Plan completeness: ${found}/${required.length} critical items (${score}%). Recommendations: ${recommendations(types)}`;
  }

  function recommendations(types){
    const rec = [];
    if(!types.includes('assembly')) rec.push('add at least one assembly point');
    if(!types.includes('foot')) rec.push('add pedestrian routes from all zones');
    if(!types.includes('wheel')) rec.push('add wheelchair-friendly route');
    if(!types.includes('vehicle')) rec.push('designate vehicle staging away from pedestrian flow');
    return rec.slice(0,3).join('; ');
  }

  function savePlanLocal(){
    const board = document.getElementById('planBoard');
    if(!board) return;
    const nodes = Array.from(board.querySelectorAll('.board-node')).map(n=>({type:n.dataset.type, text:n.innerText.trim()}));
    const plan = { nodes, savedAt: new Date().toISOString() };
    localStorage.setItem('community_evac_plan_v1', JSON.stringify(plan));
    alert('Plan saved locally.');
  }

  // ----- Mobility registry (local list) -----
  function loadMobilityList(){
    const raw = localStorage.getItem('community_mobility_v1');
    const list = raw ? JSON.parse(raw) : [];
    renderMobilityList(list);
  }

  function renderMobilityList(items){
    const el = document.getElementById('mobilityList');
    if(!el) return;
    if(items.length === 0) { el.innerHTML = '<div class="small">No entries yet</div>'; return; }
    el.innerHTML = items.map((p, idx) => `
      <div class="person">
        <strong>${escapeHtml(p.name)}</strong> — ${escapeHtml(p.house)} • ${escapeHtml(p.phone)} • ${escapeHtml(p.type)}
        <div class="small">Volunteer(s): ${escapeHtml(p.volunteer||'not assigned')}</div>
        <div style="margin-top:6px;"><button class="btn ghost" onclick="removePerson(${idx})">Remove</button></div>
      </div>
    `).join('');
  }

  window.addMobilityPerson = function(){
    const name = document.getElementById('m_name').value.trim();
    const house = document.getElementById('m_house').value.trim();
    const phone = document.getElementById('m_phone').value.trim();
    const type = document.getElementById('m_type').value;
    const volunteer = document.getElementById('m_volunteer').value.trim();

    if(!name || !house || !phone){ alert('Please fill name, house and phone'); return; }

    const raw = localStorage.getItem('community_mobility_v1');
    const list = raw ? JSON.parse(raw) : [];
    list.push({ name, house, phone, type, volunteer, added: new Date().toISOString() });
    localStorage.setItem('community_mobility_v1', JSON.stringify(list));
    renderMobilityList(list);

    // clear form
    document.getElementById('m_name').value='';
    document.getElementById('m_house').value='';
    document.getElementById('m_phone').value='';
    document.getElementById('m_volunteer').value='';
  };

  window.removePerson = function(index){
    const raw = localStorage.getItem('community_mobility_v1');
    const list = raw ? JSON.parse(raw) : [];
    if(index<0 || index>=list.length) return;
    list.splice(index,1);
    localStorage.setItem('community_mobility_v1', JSON.stringify(list));
    renderMobilityList(list);
  };

  // ----- Export / Import plan -----
  function bindExport(){
    const btn = document.getElementById('exportBtn');
    if(!btn) return;
    btn.addEventListener('click', function(){
      const planRaw = localStorage.getItem('community_evac_plan_v1');
      const mobRaw = localStorage.getItem('community_mobility_v1');
      const checklistRaw = localStorage.getItem('evac_checklist_v1');
      const out = {
        plan: planRaw ? JSON.parse(planRaw) : null,
        mobility: mobRaw ? JSON.parse(mobRaw) : null,
        checklist: checklistRaw ? JSON.parse(checklistRaw) : null,
        exportedAt: new Date().toISOString()
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(out, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', 'community-evac-plan.json');
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  function bindExportButton(){
    const b = document.getElementById('exportBtn');
    if(b) b.addEventListener('click', bindExport);
  }

  function bindExport(){
    const btn = document.getElementById('exportBtn');
    if(!btn) return;
    btn.addEventListener('click', function(){
      const plan = localStorage.getItem('community_evac_plan_v1');
      const mobility = localStorage.getItem('community_mobility_v1');
      const checklist = localStorage.getItem('evac_checklist_v1');
      const out = { plan: plan?JSON.parse(plan):null, mobility: mobility?JSON.parse(mobility):null, checklist: checklist?JSON.parse(checklist):null };
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'community-evac-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  // ----- small helpers -----
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); }); }

  // expose a few functions for debugging/console
  window.switchTab = switchTab;
  window.resetPlan = resetPlan;
  window.checkPlan = checkPlan;
  window.savePlanLocal = savePlanLocal;
  window.loadMobilityList = loadMobilityList;

})();
