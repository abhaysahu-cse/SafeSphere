/* schools-shelter.js
   Interactive behavior for the School→Shelter module.
   - Tab rendering
   - Checklist modal (print & save)
   - Capacity calculator
   - Save/Export plan, roster, contacts
   - Basic sanitation planner (handwashing / latrine counts)
   - Print/export functions
*/
(function () {
  // Keys for localStorage
  const PLAN_KEY = 'safesphere_shelter_plan_v1';
  const CONTACTS_KEY = 'safesphere_shelter_contacts_v1';

  // Module data for each tab (detailed guidance)
  const CONTENT = {
    convert: {
      title: 'Convert & Plan',
      html: `
        <h3>Immediate steps (first 60 minutes)</h3>
        <ol>
          <li>Assess structural safety: avoid rooms with cracked walls or suspected structural damage.</li>
          <li>Identify main evacuation routes and block unsafe doors/areas.</li>
          <li>Decide which classrooms to open — prefer ground floor for elderly & those with mobility needs.</li>
          <li>Assign shelter manager and two assistants per floor (roles: registration, sanitation, security).</li>
        </ol>

        <h3>Preserve school property</h3>
        <ul>
          <li>Cover or move school equipment (computers, AV) into locked cupboards or higher shelves if safe.</li>
          <li>Protect books & records in waterproof boxes if possible.</li>
          <li>Mark areas out-of-bounds clearly to reduce damage.</li>
        </ul>

        <h3>Signage & dignity</h3>
        <p>Post clear signs: <em>Sleeping area</em>, <em>Women-only</em>, <em>Child-friendly space</em>, <em>Toilets</em>, <em>Isolation</em>.</p>
        <p class="small muted">You can print the shelter plan after saving.</p>
      `
    },

    sleep: {
      title: 'Sleeping Areas',
      html: `
        <h3>Layout principles</h3>
        <ul>
          <li>Spacing: allow ~3.5–4 m² per person for mats/bedding; maintain 1 m minimum spacing between mattress edges.</li>
          <li>Gender separation: provide separate rows or rooms for families, women and men where culturally required.</li>
          <li>Accessibility: allocate accessible berths close to doors and toilets for mobility-impaired individuals.</li>
          <li>Ventilation: keep windows open for airflow (security permitting).</li>
        </ul>

        <h3>Sleeping layout examples</h3>
        <ol>
          <li>Row system: mats aligned with 1 m aisle for movement — easy for roll-call and exits.</li>
          <li>Family clusters: small family groups (mothers + children) can have a 2x2 mat cluster for privacy.</li>
          <li>Separation for suspected infectious cases: isolate at least one classroom as 'isolation room'.</li>
        </ol>

        <h3>Interactive bed planner</h3>
        <p>Use the side calculator to estimate capacity. Save plan and record which rooms are used.</p>
      `
    },

    wash: {
      title: 'Sanitation & WASH',
      html: `
        <h3>Priority: Safe drinking water & handwashing</h3>
        <ul>
          <li>Identify nearest safe water source (tap, tanker delivery). If uncertain, boil or chlorinate water before distribution.</li>
          <li>Install handwashing stations at entry/exit of shelter and by latrines. Soap or ash should be available.</li>
          <li>Set up water point management: person responsible for daily refill and cleanliness.</li>
        </ul>

        <h3>Toilet & latrine planning</h3>
        <ul>
          <li>Minimum ratio (emergency): 1 toilet per 20-50 people depending on resources; priority for women and children.</li>
          <li>If existing school toilets insufficient: set up temporary latrines (e.g., pit latrines) away from water sources and living areas.</li>
          <li>Ensure privacy and locks for women and girls; provide sanitary disposal (bins) and menstrual supplies.</li>
        </ul>

        <h3>Sanitation planner (fill and save)</h3>
        <div class="form-row">
          <div class="col">
            <label>Number of existing toilets</label>
            <input type="number" id="numToilets" min="0" value="0">
          </div>
          <div class="col">
            <label>Planned temporary latrines</label>
            <input type="number" id="tempLatrines" min="0" value="0">
          </div>
        </div>
        <div style="margin-top:8px">
          <button class="btn btn-primary" id="saveSanBtn">Save WASH plan</button>
        </div>
        <div id="washStatus" class="small muted" style="margin-top:8px"></div>
      `
    },

    infection: {
      title: 'Infection Control',
      html: `
        <h3>Key infection control measures</h3>
        <ul>
          <li>Create an isolation corner / room for symptomatic individuals; provide mask and basic medical assessment.</li>
          <li>Encourage mask use for symptomatic people and caretakers; provide extra surgical masks if available.</li>
          <li>Regularly disinfect high-touch surfaces (doorknobs, handrails) at least twice daily.</li>
          <li>Promote hygiene messaging: posters at entrances, supervised handwashing before meals.</li>
        </ul>

        <h3>Waste & laundry</h3>
        <ul>
          <li>Segregate medical waste (if present) in a separate, clearly marked bin and arrange safe disposal.</li>
          <li>Establish laundry corner outside, dry items in sun, avoid keeping wet bedding inside for long.</li>
        </ul>
      `
    },

    supplies: {
      title: 'Supplies & Inventory',
      html: `
        <h3>Essential supplies checklist (minimum)</h3>
        <ul>
          <li>Water containers & dispensers, jerrycans</li>
          <li>Soap / hand sanitizer</li>
          <li>Cleaning supplies: bleach, disinfectant, brushes</li>
          <li>Blankets, mats, extra bedding</li>
          <li>First-aid kit, basic medicines and fever reducers</li>
          <li>Toilet paper, sanitary pads, waste bags</li>
        </ul>

        <h3>Inventory manager</h3>
        <div class="form-row">
          <div class="col">
            <input type="text" id="supItem" placeholder="Item name (e.g., Soap)">
          </div>
          <div style="width:120px">
            <input type="number" id="supQty" placeholder="Qty" min="0">
          </div>
        </div>
        <div style="margin-top:8px">
          <button class="btn btn-primary" id="addSupBtn">Add / Update</button>
          <button class="btn btn-ghost" id="clearSupBtn">Clear Inventory</button>
        </div>
        <div id="invTable" style="margin-top:8px"></div>
      `
    },

    management: {
      title: 'Rosters & Management',
      html: `
        <h3>Roles & rosters</h3>
        <p>Define at least: Shelter Manager, Registration, Sanitation Lead, Security/Access, Medical first-aider.</p>

        <h3>Contacts & registration</h3>
        <p>Keep printed registration forms at entry and also a digital register saved daily. Save key phone numbers (police, health, water supplier).</p>

        <label class="small">Key contacts (edit & save)</label>
        <textarea id="contactsInput" rows="5" placeholder="Health: 112\nPolice: ..."></textarea>
        <div style="margin-top:8px">
          <button class="btn btn-primary" id="saveContactsBtn">Save contacts</button>
          <button class="btn btn-ghost" id="loadContactsBtn">Load saved contacts</button>
        </div>

        <h3 style="margin-top:12px">Saved plan snapshot</h3>
        <div id="planSnapshot" class="small muted">No plan saved yet.</div>
      `
    }
  };

  // Utilities & state
  function byId(id) { return document.getElementById(id); }
  function setHTML(id, html) { const el = byId(id); if (el) el.innerHTML = html; }
  function showModal(el, show) { if (!el) return; el.setAttribute('aria-hidden', show ? 'false' : 'true'); el.style.display = show ? 'flex' : 'none'; }
  function saveToStorage(key, obj) { localStorage.setItem(key, JSON.stringify(obj)); }
  function loadFromStorage(key, def) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; } catch (e) { return def; } }

  // Render current tab
  function switchTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = CONTENT[tab];
    setHTML('moduleContent', `<h3>${content.title}</h3>${content.html}`);
    // After injecting, attach handlers for interactive elements in certain tabs
    if (tab === 'wash') attachWashHandlers();
    if (tab === 'supplies') attachSupplyHandlers();
    if (tab === 'management') attachManagementHandlers();
    if (tab === 'sleep') { /* nothing extra */ }
  }

  // Checklist modal
  function openChecklist() {
    const checklistHtml = `
      <h4>Before opening shelter</h4>
      <ul>
        <li>Structural check of classrooms</li>
        <li>Identify sleeping rooms & maximum safe capacity</li>
        <li>Assign shelter manager & rostering</li>
        <li>Prepare handwashing & WASH points</li>
      </ul>
      <h4>During occupation</h4>
      <ul>
        <li>Daily cleaning & waste removal</li>
        <li>Monitor water supply & sanitation</li>
        <li>Keep register and medical watch</li>
      </ul>
      <h4>After sheltering</h4>
      <ul>
        <li>Clean & disinfect rooms, dry items</li>
        <li>Repair & report school property damage</li>
      </ul>
    `;
    setHTML('checklistContent', checklistHtml);
    showModal(byId('checklistModal'), true);
  }
  function closeChecklist(){ showModal(byId('checklistModal'), false); }

  // Print checklist
  function printChecklist() {
    const title = 'Shelter Checklist';
    const content = byId('checklistContent').innerHTML;
    const win = window.open('', '', 'width=800,height=900');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close(); win.print();
  }

  // Capacity calculator
  function calcCapacity() {
    const area = parseFloat(byId('roomArea').value) || 0;
    const allowance = parseFloat(byId('allowance').value) || 4;
    if (area <= 0) { byId('capacityResult').innerText = 'Enter room area to calculate.'; return; }
    const cap = Math.floor(area / allowance);
    byId('capacityResult').innerHTML = `Estimated safe capacity: <span class="capacity-strong">${cap} people</span> (allowance ${allowance} m² per person)`;
  }

  // WASH handlers
  function attachWashHandlers() {
    const saveBtn = byId('saveSanBtn');
    if (!saveBtn) return;
    saveBtn.addEventListener('click', function () {
      const toilets = parseInt(byId('numToilets').value || 0, 10);
      const temp = parseInt(byId('tempLatrines').value || 0, 10);
      const washPlan = { toilets, temp, savedAt: Date.now() };
      saveToStorage(PLAN_KEY + '_wash', washPlan);
      byId('washStatus').innerText = `WASH plan saved. ${toilets} existing toilets, ${temp} temporary latrines planned.`;
    });

    // Load existing if any
    const existing = loadFromStorage(PLAN_KEY + '_wash', null);
    if (existing) {
      byId('numToilets').value = existing.toilets || 0;
      byId('tempLatrines').value = existing.temp || 0;
      byId('washStatus').innerText = 'Loaded saved WASH plan.';
    }
  }

  // Supplies/inventory handlers
  function attachSupplyHandlers() {
    const addBtn = byId('addSupBtn');
    const clearBtn = byId('clearSupBtn');
    if (!addBtn) return;
    const inv = loadFromStorage(PLAN_KEY + '_inv', {});
    renderInventory(inv);

    addBtn.addEventListener('click', function () {
      const name = (byId('supItem').value || '').trim();
      const qty = parseInt(byId('supQty').value || 0, 10);
      if (!name) { alert('Enter item name'); return; }
      const invcur = loadFromStorage(PLAN_KEY + '_inv', {});
      invcur[name] = (invcur[name] || 0) + (isNaN(qty) ? 1 : qty);
      saveToStorage(PLAN_KEY + '_inv', invcur);
      renderInventory(invcur);
      byId('supItem').value = ''; byId('supQty').value = '';
    });

    clearBtn.addEventListener('click', function () {
      if (!confirm('Clear inventory?')) return;
      saveToStorage(PLAN_KEY + '_inv', {});
      renderInventory({});
    });

    function renderInventory(data) {
      const keys = Object.keys(data || {});
      if (keys.length === 0) { byId('invTable').innerHTML = '<div class="small muted">No inventory saved</div>'; return; }
      let html = '<table class="table"><thead><tr><th>Item</th><th>Qty</th></tr></thead><tbody>';
      keys.forEach(k => { html += `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(data[k])}</td></tr>`; });
      html += '</tbody></table>';
      byId('invTable').innerHTML = html;
    }
  }

  // Management handlers
  function attachManagementHandlers() {
    const saveContacts = byId('saveContactsBtn');
    const loadContacts = byId('loadContactsBtn');
    const input = byId('contactsInput');

    // load saved contacts if any
    const saved = loadFromStorage(CONTACTS_KEY, '');
    if (saved) input.value = saved;

    saveContacts && saveContacts.addEventListener('click', function () {
      const val = input.value || '';
      saveToStorage(CONTACTS_KEY, val);
      setHTML('planSnapshot', `Contacts saved at ${new Date().toLocaleString()}`);
      byId('contactsText').innerText = val || 'No contacts saved';
      alert('Contacts saved locally.');
    });

    loadContacts && loadContacts.addEventListener('click', function () {
      const val = loadFromStorage(CONTACTS_KEY, '');
      input.value = val || '';
      alert('Loaded saved contacts.');
    });

    // show snapshot if plan exists
    const plan = loadFromStorage(PLAN_KEY, null);
    if (plan) setHTML('planSnapshot', `Plan saved: ${plan.savedAt ? new Date(plan.savedAt).toLocaleString() : 'unknown'}`);
  }

  // Save plan (aggregate key items)
  function saveFullPlan() {
    const wash = loadFromStorage(PLAN_KEY + '_wash', {});
    const inv = loadFromStorage(PLAN_KEY + '_inv', {});
    const contacts = loadFromStorage(CONTACTS_KEY, '');
    const plan = { wash, inv, contacts, savedAt: Date.now() };
    saveToStorage(PLAN_KEY, plan);
    alert('Shelter plan saved locally.');
    byId('planSnapshot') && (byId('planSnapshot').innerText = `Plan saved: ${new Date(plan.savedAt).toLocaleString()}`);
  }

  // Export plan as JSON
  function exportPlan() {
    const plan = loadFromStorage(PLAN_KEY, null);
    if (!plan) { alert('No plan saved to export. Save plan first.'); return; }
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'shelter_plan.json'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // Print plan button (prints the current wrap)
  function printPlan() {
    const title = byId('title').innerText;
    const content = document.querySelector('.wrap').innerHTML;
    const win = window.open('', '', 'width=900,height=1000');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px} h1{color:#114}</style></head><body><h1>${title}</h1>${content}</body></html>`);
    win.document.close();
    win.print();
  }

  // helpers
  function escapeHtml(s) { return (s == null) ? '' : ('' + s).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; }); }

  // Initialization and event bindings
  document.addEventListener('DOMContentLoaded', function () {
    // initial render
    switchTab('convert');

    // checklist handlers
    byId('openChecklistBtn').addEventListener('click', openChecklist);
    byId('printPlanBtn').addEventListener('click', printPlan);
    byId('printChecklist') && byId('printChecklist').addEventListener('click', printChecklist);

    // plan save/export
    byId('savePlanBtn').addEventListener('click', saveFullPlan);
    byId('exportPlanBtn').addEventListener('click', exportPlan);

    // modal close via ESC
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeChecklist(); closePlanModal(); } });

    // capacity calc
    const calcBtn = byId('calcCap');
    calcBtn && calcBtn.addEventListener('click', calcCapacity);

    // open management quick link
    const openMan = byId('openManagementBtn');
    openMan && openMan.addEventListener('click', function () { switchTab('management'); window.scrollTo({ top: 0, behavior: 'smooth' }); });

    // plan modal functions
    window.closePlanModal = function () { showModal(byId('planModal'), false); };
    // print checklist function exposure
    window.printChecklist = printChecklist;

    // Ensure contacts text on side updates
    const savedContacts = loadFromStorage(CONTACTS_KEY, '');
    if (savedContacts) byId('contactsText').innerText = savedContacts;

    // Attach other global hooks: when switching to a tab, necessary handlers attach inside switchTab()
  });

})();
