/* schools-supplies.js
   Inventory manager and checklist interactions for school supplies & first aid.
   - Add items (category, name, qty, expiry, notes)
   - Highlight low stock and expired items
   - Export CSV / JSON, print inventory, save to localStorage
   Put under: static/js/schools-supplies.js
*/
(function () {
  const STORAGE_KEY = 'safesphere_school_supplies_v1';

  // Elements
  const itemCategory = document.getElementById('itemCategory');
  const itemName = document.getElementById('itemName');
  const itemQty = document.getElementById('itemQty');
  const itemExpiry = document.getElementById('itemExpiry');
  const itemNotes = document.getElementById('itemNotes');
  const addItemBtn = document.getElementById('addItemBtn');
  const clearExpiredBtn = document.getElementById('clearExpiredBtn');

  const searchInput = document.getElementById('searchInput');
  const filterCategory = document.getElementById('filterCategory');
  const inventoryList = document.getElementById('inventoryList');

  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportAllBtn = document.getElementById('exportAllBtn');
  const printListBtn = document.getElementById('printListBtn');
  const resetAllBtn = document.getElementById('resetAllBtn');

  const openChecklistBtn = document.getElementById('openChecklistBtn');
  const checklistModal = document.getElementById('checklistModal');

  // state
  let inventory = []; // items: { id, category, name, qty, expiry (ISO or ''), notes, createdAt }

  function uid(prefix='i'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

  // load from localStorage
  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      inventory = JSON.parse(raw) || [];
    } catch (e) { console.warn('loadState err', e); inventory = []; }
  }

  function saveState(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) { console.warn('save err', e); }
  }

  // utility for parsing date
  function parseISODate(s){
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  function daysUntil(date){
    if (!date) return null;
    const now = new Date(); const diff = date - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()); // midnight-based
    return Math.ceil(diff / (1000*60*60*24));
  }

  // render list with filters & search
  function renderList(){
    const q = (searchInput.value || '').trim().toLowerCase();
    const cat = filterCategory.value || '';
    const now = new Date();
    inventoryList.innerHTML = '';
    if (inventory.length === 0) { inventoryList.innerHTML = '<div class="small muted">No items in inventory</div>'; return; }

    // order: category -> expiry nearest first
    const shown = inventory.slice().filter(item => {
      if (cat && item.category !== cat) return false;
      if (q) {
        if (!(item.name.toLowerCase().includes(q) || (item.notes || '').toLowerCase().includes(q) || item.category.toLowerCase().includes(q))) return false;
      }
      return true;
    }).sort((a,b) => {
      const da = a.expiry ? new Date(a.expiry) : null;
      const db = b.expiry ? new Date(b.expiry) : null;
      if (da && db) return da - db;
      if (da && !db) return -1;
      if (!da && db) return 1;
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });

    shown.forEach(item => {
      const itemEl = document.createElement('div'); itemEl.className = 'item';
      const expiryDate = parseISODate(item.expiry);
      const days = expiryDate ? daysUntil(expiryDate) : null;
      if (days !== null && days < 0) itemEl.classList.add('expired');
      else if (item.qty !== null && item.qty <= lowThreshold(item.category)) itemEl.classList.add('low');

      itemEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:4px">
          <strong>${escapeHtml(item.name)}</strong>
          <div class="meta">${escapeHtml(item.category)} · ${escapeHtml(item.notes || '')}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <div class="badge">${item.qty}</div>
          <div class="expiry">${expiryDate ? (expiryDate.toISOString().slice(0,10) + (days !== null ? ` • ${days}d` : '')) : 'No expiry'}</div>
          <div style="display:flex;gap:6px;margin-top:6px">
            <button class="btn btn-ghost small" data-id="${item.id}" onclick="(function(id){ editItem(id)})('${item.id}')">Edit</button>
            <button class="btn btn-ghost small" data-id="${item.id}" onclick="(function(id){ removeItem(id)})('${item.id}')">Remove</button>
          </div>
        </div>
      `;
      inventoryList.appendChild(itemEl);
    });
  }

  function lowThreshold(category){
    // simple sensible defaults; schools can change these heuristics
    switch(category){
      case 'water': return 10;      // litres / containers threshold
      case 'medicine': return 5;
      case 'dryfood': return 5;
      case 'sanitation': return 10;
      default: return 3;
    }
  }

  // add or update item
  addItemBtn.addEventListener('click', function(){
    const name = (itemName.value || '').trim();
    const category = (itemCategory.value || '').trim();
    const qty = parseInt(itemQty.value, 10) || 0;
    const expiry = itemExpiry.value || '';
    const notes = (itemNotes.value || '').trim();
    if (!name || qty <= 0) { alert('Please give a valid item name and quantity'); return; }

    // if item with same name+category exists, update qty & expiry (merge)
    const existing = inventory.find(i => i.name.toLowerCase() === name.toLowerCase() && i.category === category);
    if (existing) {
      if (!confirm('Item exists — add quantity to existing stock? Cancel to create a separate entry.')) {
        // create new separate
        const id = uid();
        inventory.push({ id, category, name, qty, expiry, notes, createdAt: new Date().toISOString() });
      } else {
        existing.qty = existing.qty + qty;
        if (expiry) existing.expiry = expiry;
        if (notes) existing.notes = notes;
      }
    } else {
      const id = uid();
      inventory.push({ id, category, name, qty, expiry, notes, createdAt: new Date().toISOString() });
    }
    // clear form
    itemName.value = ''; itemQty.value=''; itemExpiry.value=''; itemNotes.value='';
    saveState(); renderList();
  });

  // remove expired items
  clearExpiredBtn.addEventListener('click', function(){
    const now = new Date();
    const expired = inventory.filter(i => i.expiry && parseISODate(i.expiry) < now);
    if (expired.length === 0) { alert('No expired items found'); return; }
    if (!confirm(`Found ${expired.length} expired items. Remove them from inventory?`)) return;
    inventory = inventory.filter(i => !(i.expiry && parseISODate(i.expiry) < now));
    saveState(); renderList();
  });

  // remove item
  window.removeItem = function(id){
    if (!confirm('Remove this item?')) return;
    inventory = inventory.filter(i => i.id !== id);
    saveState(); renderList();
  };

  // edit item - bring into form for update
  window.editItem = function(id){
    const it = inventory.find(i=>i.id===id);
    if (!it) return;
    itemCategory.value = it.category;
    itemName.value = it.name;
    itemQty.value = it.qty;
    itemExpiry.value = it.expiry || '';
    itemNotes.value = it.notes || '';
    // when adding again, the merge flow will ask or update— user may want to remove old entry manually
    // Alternatively we could implement a proper update flow; keep simple for now.
    // Remove original (so new addition will replace)
    if (confirm('Edit will remove the existing record. Proceed?')) {
      inventory = inventory.filter(i => i.id !== id);
      saveState();
      renderList();
    }
  };

  // filter & search events
  searchInput.addEventListener('input', renderList);
  filterCategory.addEventListener('change', renderList);

  // export CSV
  exportCsvBtn.addEventListener('click', exportCSV);
  exportAllBtn.addEventListener('click', exportCSV); // same behaviour
  function exportCSV(){
    if (inventory.length === 0) { alert('No inventory to export'); return; }
    const header = ['category','name','qty','expiry','notes','createdAt'];
    const rows = inventory.map(it => [it.category, it.name, it.qty, it.expiry || '', it.notes || '', it.createdAt || '']);
    const csv = [header.join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n');
    downloadBlob(csv, 'text/csv', 'school_inventory.csv');
  }
  function csvEscape(s){ return `"${(''+(s||'')).replace(/"/g,'""')}"`; }

  // export JSON
  exportJsonBtn.addEventListener('click', function(){
    if (inventory.length === 0) { alert('No inventory to export'); return; }
    downloadBlob(JSON.stringify({ inventory, exportedAt: new Date().toISOString() }, null, 2), 'application/json', 'school_inventory.json');
  });

  // helper for download
  function downloadBlob(content, type, filename){
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // print inventory
  printListBtn.addEventListener('click', function(){
    const html = buildPrintHTML();
    const w = window.open('', '', 'width=900,height=700');
    w.document.write(html);
    w.document.close();
    setTimeout(()=> w.print(), 600);
  });

  function buildPrintHTML(){
    const rows = inventory.map(it => `<tr>
      <td>${escapeHtml(it.category)}</td>
      <td>${escapeHtml(it.name)}</td>
      <td>${escapeHtml(it.qty)}</td>
      <td>${escapeHtml(it.expiry || '')}</td>
      <td>${escapeHtml(it.notes || '')}</td>
    </tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Inventory — Print</title>
      <style>body{font-family:Arial;padding:16px;color:#112} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f7f7f7}</style></head><body>
      <h1>School Supplies Inventory</h1><div>Printed: ${new Date().toLocaleString()}</div>
      <table><thead><tr><th>Category</th><th>Item</th><th>Qty</th><th>Expiry</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
  }

  // reset all
  resetAllBtn.addEventListener('click', function(){
    if (!confirm('Reset entire inventory? This will remove local data.')) return;
    inventory = []; saveState(); renderList();
  });

  // simple print poster handlers (placeholder)
  const printPosterBtn = document.getElementById('printPosterBtn');
  const downloadPosterBtn = document.getElementById('downloadPosterBtn');
  printPosterBtn.addEventListener('click', function(){
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Storage Poster</title>
      <style>body{font-family:Arial;padding:20px} .poster{width:100%;height:800px;border:2px dashed #ddd;display:flex;align-items:center;justify-content:center;font-size:22px;color:#666}</style></head>
      <body><div class="poster">Poster placeholder — replace image with generated poster for storage best-practices</div></body></html>`;
    const w = window.open('', '', 'width=800,height=1000'); w.document.write(html); w.document.close(); setTimeout(()=> w.print(), 600);
  });
  downloadPosterBtn.addEventListener('click', function(){
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="#fff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-size="20">Poster placeholder: replace with your generated poster</text></svg>`;
    downloadBlob(svg, 'image/svg+xml', 'storage_poster.svg');
  });

  // checklist modal
  openChecklistBtn.addEventListener('click', function(){
    checklistModal.setAttribute('aria-hidden', 'false'); checklistModal.style.display = 'flex';
  });
  window.closeChecklist = function(){
    checklistModal.setAttribute('aria-hidden', 'true'); checklistModal.style.display = 'none';
  };

  // save checklist (just save timestamp to storage)
  window.saveChecklist = function(){
    localStorage.setItem(STORAGE_KEY + '_checklist', JSON.stringify({ ts: new Date().toISOString() }));
    alert('Checklist saved locally');
  };
  window.printChecklist = function(){
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Checklist</title>
      <style>body{font-family:Arial;padding:16px} h1{color:#0b6b4f}</style></head><body><h1>Shelter Storage Checklist</h1>
      <ol>
        <li>Designate storage room and lockable medicine cabinet.</li>
        <li>Elevate all food & water containers at least 30 cm off the floor.</li>
        <li>Label shelves and boxes with content, date received and expiry.</li>
        <li>Place a signboard with contact numbers and the stock master near the storage door.</li>
        <li>Ensure a clean separate area for cooking and waste to avoid contamination.</li>
        <li>Assign staff responsible for monthly checks and stock rotation.</li>
      </ol></body></html>`;
    const w = window.open('', '', 'width=700,height=800'); w.document.write(html); w.document.close(); setTimeout(()=> w.print(), 500);
  };

  // helper escape
  function escapeHtml(s){ return (s==null) ? '' : (''+s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); }); }

  // initial load
  (function init(){
    loadState();
    renderList();
    // wire export buttons already set above
  })();

})();
