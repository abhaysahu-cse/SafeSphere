/* protect-community-grainseed.js
   Inventory manager, distribution planner, tabs, checklist, export/import
   Save in static/js/protect-community-grainseed.js
*/

(function(){
  // ---------- Data keys ----------
  const INV_KEY = 'community_grain_inventory_v1';
  const RECIP_KEY = 'community_grain_recipients_v1';
  const CHECK_KEY = 'community_grain_checklist_v1';

  // ---------- Tab content ----------
  const TAB_CONTENT = {
    design: `
      <h3>Design & Construction</h3>
      <ol>
        <li><strong>Site:</strong> choose raised, well-drained location with protection from direct rainfall and flood surge.</li>
        <li><strong>Foundation:</strong> 0.5–1.0 m high raised plinth or brick plinth for small banks. Ensure ramp access and vehicle approach.</li>
        <li><strong>Bins:</strong> wooden or concrete bins elevated on plinth. Each bin labelled by crop & variety. Provide 15–20 cm air gap under bins for ventilation.</li>
        <li><strong>Roof & walls:</strong> corrugated roof with overhang; concrete or masonry walls for pest resistance. Use mesh for ventilation openings to exclude birds/rodents.</li>
        <li><strong>Flooring:</strong> paved floor with slope to drain and prevent pooling; store seed on raised platforms on tarpaulins or pallets.</li>
      </ol>
      <p class="small">Small low-cost option: raised earthen plinth with waterproof tarpaulin and pallets to lift bags. Medium option: masonry plinth + ventilated bins.</p>
    `,
    storage: `
      <h3>Seed & Grain Storage Best Practices</h3>
      <ul>
        <li>Separate seed (for sowing) from grain (for food). Keep seed in labelled, clean, dry jute or poly-lined bags.</li>
        <li>Maintain moisture & temperature records. Ideal seed moisture: crop-dependent (~8–14%). Keep seed cool < 25°C if possible.</li>
        <li>Pest control: regular inspection, pheromone traps, sealed bins, and hygienic storage. Avoid direct contact with walls.</li>
        <li>Sanitation: clean store before new lot arrival; sun-dry floor, apply diatomaceous earth in corners if locally recommended.</li>
        <li>Seed treatment: disinfect (per extension guidance) when necessary; label treated seed and restrict for sowing only.</li>
      </ul>
    `,
    governance: `
      <h3>Governance & Records</h3>
      <ol>
        <li>Form a seed bank committee with clear roles: manager, record keeper, stewardship committee & distribution committee.</li>
        <li>Keep a simple ledger: Lot ID, date received, variety, source, qty, moisture, treatment, distributed qty, balance, recipient signatures.</li>
        <li>Agree distribution rules in community meeting — publish a short poster describing prioritisation criteria and appeal process.</li>
        <li>Insurance & linkages: register with KVK/extension for technical backup; document proof of damage to request relief.</li>
      </ol>
    `,
    resources: `
      <h3>Resources & Further Reading</h3>
      <ul>
        <li>Local KVK seed preservation notes (link/paper).</li>
        <li>NDMA/State agriculture guidelines for seed distribution (upload PDFs locally).</li>
        <li>Simple printable ledger template and distribution card (use the templates section at bottom).</li>
      </ul>
    `
  };

  // ---------- Tabs ----------
  function switchTab(tab){
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('tabContent');
    content.innerHTML = TAB_CONTENT[tab] || '<p class="small">Content is not available.</p>';
  }

  // ---------- Inventory: add, render, edit, delete ----------
  function loadInventory(){
    try {
      const raw = localStorage.getItem(INV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ console.warn('loadInventory', e); return []; }
  }

  function saveInventory(arr){
    localStorage.setItem(INV_KEY, JSON.stringify(arr));
    renderInventory();
  }

  function addLot(){
    const type = document.getElementById('lot_type').value.trim();
    const variety = document.getElementById('lot_variety').value.trim();
    const qty = parseFloat(document.getElementById('lot_qty').value);
    const moisture = parseFloat(document.getElementById('lot_moisture').value);
    const location = document.getElementById('lot_location').value.trim();
    const notes = document.getElementById('lot_notes').value.trim();
    if(!type || !variety || Number.isNaN(qty) || Number.isNaN(moisture)){ alert('Please fill type, variety, qty and moisture'); return; }

    const arr = loadInventory();
    const id = 'lot_' + Date.now();
    arr.push({ id, type, variety, qty, moisture, location, notes, receivedAt: new Date().toISOString() });
    saveInventory(arr);
    clearLotForm();
  }

  function clearLotForm(){
    ['lot_type','lot_variety','lot_qty','lot_moisture','lot_location','lot_notes'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value = '';
    });
  }

  function renderInventory(){
    const list = loadInventory();
    const wrap = document.getElementById('inventoryList');
    if(!wrap) return;
    if(list.length === 0){ wrap.innerHTML = '<div class="small-muted">No lots registered yet.</div>'; return; }

    wrap.innerHTML = list.map(l => `
      <div class="lot" data-id="${l.id}">
        <strong>${escapeHtml(l.type.toUpperCase())} • ${escapeHtml(l.variety)}</strong>
        <div class="small">Qty: ${l.qty} kg • Moisture: ${l.moisture}% • Loc: ${escapeHtml(l.location || '—')} • Received: ${new Date(l.receivedAt).toLocaleDateString()}</div>
        <div style="margin-top:6px">
          <button class="btn ghost" onclick="editLot('${l.id}')">Edit</button>
          <button class="btn ghost" onclick="removeLot('${l.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }

  window.editLot = function(id){
    const arr = loadInventory();
    const lot = arr.find(x => x.id === id);
    if(!lot){ alert('Lot not found'); return; }
    // populate form to edit (simple approach: remove old and populate inputs)
    document.getElementById('lot_type').value = lot.type;
    document.getElementById('lot_variety').value = lot.variety;
    document.getElementById('lot_qty').value = lot.qty;
    document.getElementById('lot_moisture').value = lot.moisture;
    document.getElementById('lot_location').value = lot.location;
    document.getElementById('lot_notes').value = lot.notes;
    removeLot(id); // user can adjust and add again
  };

  window.removeLot = function(id){
    let arr = loadInventory();
    arr = arr.filter(x => x.id !== id);
    saveInventory(arr);
  };

  // ---------- Distribution planner ----------
  function loadRecipients(){ try{ const r=localStorage.getItem(RECIP_KEY); return r?JSON.parse(r):[] }catch(e){return[]} }
  function saveRecipients(arr){ localStorage.setItem(RECIP_KEY, JSON.stringify(arr)); renderRecipients(); }

  window.addRecipient = function(){
    const name = document.getElementById('r_name').value.trim();
    const type = document.getElementById('r_type').value;
    const qty = parseFloat(document.getElementById('r_qty').value) || 0;
    if(!name){ alert('Enter recipient name/ID'); return; }
    const arr = loadRecipients();
    arr.push({ id: 'r_' + Date.now(), name, type, qty, addedAt: new Date().toISOString() });
    saveRecipients(arr);
    document.getElementById('r_name').value = '';
    document.getElementById('r_qty').value = '10';
  };

  function renderRecipients(){
    const arr = loadRecipients();
    const wrap = document.getElementById('recipientsList');
    if(!wrap) return;
    if(arr.length === 0){ wrap.innerHTML = '<div class="small-muted">No recipients yet.</div>'; return; }

    // show sorted by time added by default
    wrap.innerHTML = arr.map((r, idx)=>`
      <div class="lot" data-id="${r.id}">
        <strong>${escapeHtml(r.name)}</strong> • ${escapeHtml(r.type)} • requested ${r.qty} kg
        <div class="small">Added: ${new Date(r.addedAt).toLocaleString()}</div>
        <div style="margin-top:6px">
          <button class="btn ghost" onclick="removeRecipient('${r.id}')">Remove</button>
        </div>
      </div>
    `).join('');
  }

  window.removeRecipient = function(id){
    let arr = loadRecipients();
    arr = arr.filter(x => x.id !== id);
    saveRecipients(arr);
  };

  window.clearRecipients = function(){
    if(!confirm('Clear all recipients?')) return;
    localStorage.removeItem(RECIP_KEY);
    renderRecipients();
  };

  // Auto-allocate: prioritise by type order (vulnerable > landless > smallholder > largeholder)
  window.autoAllocate = function(){
    const inventory = loadInventory().slice(); // available
    if(inventory.length === 0){ alert('No inventory available'); return; }
    let stock = inventory.reduce((s, l) => s + (Number(l.qty)||0), 0);
    const recipients = loadRecipients().slice();
    if(recipients.length === 0){ alert('No recipients added'); return; }

    // ranking weights
    const weights = { vulnerable: 4, landless: 3, smallholder: 2, largeholder: 1 };
    recipients.sort((a,b) => (weights[b.type]||0) - (weights[a.type]||0)); // highest first

    const allocations = [];
    recipients.forEach(r => {
      const want = Number(r.qty) || 0;
      const give = Math.min(want, stock);
      allocations.push({ recipient: r.name, type: r.type, allocated: give });
      stock = Math.max(0, stock - give);
    });

    // store allocations in localStorage under a temporary key
    localStorage.setItem('grain_allocations_v1', JSON.stringify({ allocations, when: new Date().toISOString() }));
    // show result
    const out = allocations.map(a => `${escapeHtml(a.recipient)} — ${a.allocated} kg (${escapeHtml(a.type)})`).join('<br>');
    const wrap = document.getElementById('recipientsList');
    wrap.innerHTML = `<div class="small-muted"><strong>Allocations</strong><br>${out}</div>`;
  };

  window.clearAllocations = function(){
    localStorage.removeItem('grain_allocations_v1');
    renderRecipients();
  };

  // ---------- Print distribution ----------
  window.printDistribution = function(){
    const allocRaw = localStorage.getItem('grain_allocations_v1');
    if(!allocRaw){ alert('No allocations available. Run Auto-allocate first.'); return; }
    const alloc = JSON.parse(allocRaw);
    const content = `<h1>Distribution (${new Date(alloc.when).toLocaleString()})</h1><ul>${alloc.allocations.map(a => `<li>${escapeHtml(a.recipient)} — ${a.allocated} kg — ${escapeHtml(a.type)}</li>`).join('')}</ul>`;
    const win = window.open('', '', 'width=800,height=900');
    win.document.write(`<html><head><title>Distribution</title><style>body{font-family:Arial;padding:20px}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  // ---------- Checklist modal ----------
  function bindChecklist(){
    const btn = document.getElementById('openChecklistBtn');
    if(btn) btn.addEventListener('click', () => {
      const modal = document.getElementById('checklistModal'); if(modal) modal.style.display = 'block';
      loadChecklist();
    });
  }

  window.closeChecklist = function(){ const modal = document.getElementById('checklistModal'); if(modal) modal.style.display = 'none'; };

  window.saveChecklistModal = function(){
    const ids = ['ch_site','ch_bins','ch_vent','ch_moist','ch_pest','ch_records','ch_rules'];
    const state = {};
    ids.forEach(id => { const el = document.getElementById(id); state[id] = !!(el && el.checked); });
    localStorage.setItem(CHECK_KEY, JSON.stringify({ state, savedAt: new Date().toISOString() }));
    alert('Checklist saved locally.');
    closeChecklist();
  };

  function loadChecklist(){
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if(!raw) return;
      const o = JSON.parse(raw);
      const state = o.state || {};
      ['ch_site','ch_bins','ch_vent','ch_moist','ch_pest','ch_records','ch_rules'].forEach(id => {
        const el = document.getElementById(id); if(el) el.checked = !!state[id];
      });
    } catch(e){ console.warn('loadChecklist', e); }
  }

  // ---------- Export / Import ----------
  window.exportInventory = function(){
    const inv = loadInventory();
    const rec = loadRecipients();
    const checklist = JSON.parse(localStorage.getItem(CHECK_KEY) || 'null');
    const out = { inventory: inv, recipients: rec, checklist, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'grainseed-export.json'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // small helper: load sample data
  window.importSampleData = function(){
    const sample = [
      { id:'lot_1', type:'seed', variety:'local-rice', qty:200, moisture:12.0, location:'bin-A', notes:'harvest 2025-07-02', receivedAt:new Date().toISOString()},
      { id:'lot_2', type:'grain', variety:'maize-food', qty:500, moisture:13.2, location:'plinth-1', notes:'food reserve', receivedAt:new Date().toISOString()}
    ];
    localStorage.setItem(INV_KEY, JSON.stringify(sample));
    renderInventory();
  };

  // ---------- Utilities ----------
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); }); }

  // ---------- Drying & Moisture helper (small calculator) ----------
  window.dryingAdvice = function(moisture, crop){
    // simple heuristic-based advice
    moisture = Number(moisture);
    if(Number.isNaN(moisture)) return 'Enter moisture%';
    let ideal = 12;
    if(/rice/i.test(crop)) ideal = 12;
    else if(/maize/i.test(crop)) ideal = 12.5;
    else if(/millet/i.test(crop)) ideal = 10.5;
    const diff = moisture - ideal;
    if(diff <= 0) return `Moisture ${moisture}% is safe for ${crop}.`;
    else return `Moisture ${moisture}% — recommended: sun-dry on clean tarpaulin, thin layers, turn frequently until <= ${ideal}%. Avoid re-wetting.`;
  };

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', function(){
    switchTab('design');
    renderInventory();
    renderRecipients();
    bindChecklist();
    // hook up forms
    const lotForm = document.getElementById('lotForm'); if(lotForm) lotForm.addEventListener('submit', e=>{ e.preventDefault(); addLot(); });
    const distForm = document.getElementById('distForm'); // already handled inline on HTML
    // export button
    const exportBtn = document.getElementById('exportBtn'); if(exportBtn) exportBtn.addEventListener('click', exportInventory);
  });

  // expose some functions to window for console/debug
  window.switchTab = switchTab;
  window.addLot = addLot;
  window.renderInventory = renderInventory;
  window.loadInventory = loadInventory;
  window.loadRecipients = loadRecipients;
  window.renderRecipients = renderRecipients;
  window.saveChecklistModal = saveChecklistModal;
  window.dryingAdvice = dryingAdvice;

})();
