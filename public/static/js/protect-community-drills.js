/* protect-community-drills.js
   behaviors: tabs, checklist modal, roster (localStorage), drill simulation,
   printable templates, small AAR helper.
*/

(function () {
  const TABS = {
    plan: `
      <h3>Plan a Drill</h3>
      <ol>
        <li>Objective: choose 2–3 realistic objectives (evacuation, child safety, boat rescue).</li>
        <li>Scope: area (village/ward), number of households, vulnerable groups.</li>
        <li>Schedule: announce date/time, allow volunteers to opt-in.</li>
        <li>Safety: ensure medical cover and brief all volunteers on boundaries.</li>
      </ol>
      <p class="small">Tip: start with short (15–30 min) drills and increase complexity over time.</p>
    `,
    roles: `
      <h3>Volunteer Roles (suggested)</h3>
      <ul>
        <li><strong>Evacuation lead</strong>: shepherd people to assembly points.</li>
        <li><strong>First aid</strong>: basic care and triage until ambulance arrives.</li>
        <li><strong>Logistics</strong>: manage supplies, tarpaulins, food, potable water.</li>
        <li><strong>Communications</strong>: call list, radio/megaphone.</li>
        <li><strong>Childcare</strong>: look after children in shelter safe area.</li>
      </ul>
      <p class="small">Assign backups for each role and rotate responsibilities to build resilience.</p>
    `,
    daynight: `
      <h3>Day & Night Drills</h3>
      <p>Many communities only practise daytime drills — night drills are essential because navigation, lighting and panic behaviours differ.</p>
      <ul>
        <li>Night drill checklist: torches, marked routes with reflective tape, volunteer headcounts, slow movement training.</li>
        <li>Practice partial blackout scenarios: simulate power cut while evacuating.</li>
        <li>Test lighting & signage: provide reflective markers at assembly points.</li>
      </ul>
      <p class="small">Run at least one night drill per year, and include a pet-handling station.</p>
    `,
    elder: `
      <h3>Including Elders & Those with Mobility Needs</h3>
      <ul>
        <li>Pre-register residents needing assistance (wheelchairs, hearing/vision impairment).</li>
        <li>Assign two volunteers per vulnerable person (lead + backup).</li>
        <li>Ensure ramps and clear routes; avoid stairs where possible.</li>
        <li>Use loudspeaker and visual signals for those with hearing loss.</li>
      </ul>
      <p class="small">Practice slow-movement evacuation: drills must account for slower walking speed.</p>
    `,
    pets: `
      <h3>Animals & Pets</h3>
      <ul>
        <li>Plan a pet holding area near shelter with food and water.</li>
        <li>Tag animals and keep simple records (owner, phone, animal type).</li>
        <li>Train 2 volunteers in safe animal handling; avoid crowding when loading into boats.</li>
      </ul>
      <p class="small">Include livestock in village-level drills (moving to mounds, temporary pens).</p>
    `,
    afteraction: `
      <h3>After-action Review (AAR)</h3>
      <p>Immediately after the drill, gather volunteers and community reps for 20–30 minutes AAR:</p>
      <ol>
        <li>What went well?</li>
        <li>What failed or caused delay?</li>
        <li>Who will action improvements (name + due date)?</li>
        <li>Record time to assembly and any injuries or safety near-misses.</li>
      </ol>
      <button class="btn ghost" onclick="downloadAAR()">Download AAR template</button>
    `,
    templates: `
      <h3>Printable Templates</h3>
      <p>Use the templates to draw routes, mark assembly points and print for noticeboards.</p>
      <ul>
        <li><a href="#" onclick="showPrintTemplate('templateEvac')">Evacuation Map Template</a></li>
        <li><a href="#" onclick="showPrintTemplate('templateAAR')">AAR Template</a></li>
      </ul>
    `
  };

  // --- Tab switching ---
  function switchTab(tab) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = document.getElementById('tabContent');
    content.innerHTML = TABS[tab] || '<p class="small">No content</p>';
    // show/hide checklist button depending on tab (optional)
  }

  // --- Checklist modal ---
  function openChecklist() {
    const modal = document.getElementById('checklistModal');
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    restoreDrillChecklist();
  }
  function closeChecklist() {
    const modal = document.getElementById('checklistModal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
  function saveDrillChecklist() {
    const keys = ['c-notify','c-assembly','c-firstaid','c-boats','c-access','c-child','c-pets','c-comm'];
    const obj = {};
    keys.forEach(k => { const el = document.getElementById(k); obj[k]=!!(el && el.checked); });
    localStorage.setItem('safesphere_drill_check', JSON.stringify({ts:Date.now(), data:obj}));
    alert('Drill checklist saved locally.');
    closeChecklist();
  }
  function restoreDrillChecklist() {
    try {
      const raw = localStorage.getItem('safesphere_drill_check');
      if(!raw) return;
      const obj = JSON.parse(raw).data || {};
      Object.keys(obj).forEach(k => { const el=document.getElementById(k); if(el) el.checked = !!obj[k]; });
    } catch(e) { console.warn(e); }
  }

  // --- Roster (local) ---
  function openRoster() {
    const modal = document.getElementById('rosterModal');
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    renderRoster();
  }
  function closeRoster() {
    const modal = document.getElementById('rosterModal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
  function getRoster() {
    try {
      return JSON.parse(localStorage.getItem('safesphere_roster') || '[]');
    } catch(e){ return []; }
  }
  function saveRoster(list) {
    localStorage.setItem('safesphere_roster', JSON.stringify(list));
  }
  function addVolunteer() {
    const name = document.getElementById('volName').value.trim();
    const phone = document.getElementById('volPhone').value.trim();
    const role = document.getElementById('volRole').value;
    const avail = document.getElementById('volAvail').value.trim();
    if(!name || !phone) { alert('Name & phone required'); return; }
    const list = getRoster();
    list.push({ id:Date.now(), name, phone, role, avail });
    saveRoster(list);
    document.getElementById('rosterForm').reset();
    renderRoster();
  }
  function renderRoster() {
    const container = document.getElementById('rosterList');
    const list = getRoster();
    if(!container) return;
    if(list.length===0) { container.innerHTML = '<p class="small">No volunteers yet. Add from the form above.</p>'; return; }
    container.innerHTML = list.map(v => `
      <div class="roster-entry" data-id="${v.id}">
        <div>
          <strong>${escapeHtml(v.name)}</strong><div class="small">${escapeHtml(v.role)} · ${escapeHtml(v.avail)}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <a class="btn ghost" href="tel:${escapeHtml(v.phone)}">Call</a>
          <button class="btn ghost" onclick="removeVolunteer(${v.id})">Remove</button>
        </div>
      </div>
    `).join('');
  }
  function removeVolunteer(id) {
    const list = getRoster().filter(v => v.id !== id);
    saveRoster(list);
    renderRoster();
  }
  function exportRoster() {
    const list = getRoster();
    if(!list.length) { alert('No volunteers to export'); return; }
    const csv = ['name,phone,role,avail'].concat(list.map(v => `${csvEscape(v.name)},${csvEscape(v.phone)},${csvEscape(v.role)},${csvEscape(v.avail)}`)).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'volunteer_roster.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // --- Drill simulation (simple demo flow) ---
  function simulateDrill() {
    const start = Date.now();
    const steps = [
      { t:0, msg:'Alert: Drill starting in 1 minute. Volunteers to positions.' },
      { t:2000, msg:'Sound alarm: families begin to move to assembly points.'},
      { t:5000, msg:'Volunteers guiding, child shelter set up.'},
      { t:8000, msg:'Count complete: report to comms team.'},
      { t:11000, msg:'Drill complete — begin after-action review.'}
    ];
    const resultEl = document.getElementById('tabContent');
    resultEl.innerHTML = '<h3>Drill simulation</h3><div id="simLog"></div>';
    const log = document.getElementById('simLog');
    let i=0;
    const iv = setInterval(()=> {
      if(i>=steps.length) { clearInterval(iv); log.innerHTML += '<div style="margin-top:8px;font-weight:700">Simulation finished — run AAR now.</div>'; return; }
      log.innerHTML += `<div class="sim-line">• ${steps[i].msg}</div>`;
      log.scrollTop = log.scrollHeight;
      i++;
    }, 1800);
  }

  // --- AAR download helper ---
  function downloadAAR() {
    const template = document.getElementById('templateAAR').innerText || 'AAR template';
    const blob = new Blob([template], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'AAR_template.txt'; document.body.appendChild(a);
    a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // --- print templates ---
  function showPrintTemplate(id) {
    const el = document.getElementById(id);
    if(!el) { alert('Template not found'); return; }
    const win = window.open('', '', 'width=800,height=900');
    win.document.write('<html><head><title>Template</title><style>body{font-family:Arial;padding:20px}</style></head><body>');
    win.document.write(el.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  }
  function printModule() {
    const title = document.getElementById('pageTitle').innerText;
    const wrap = document.querySelector('.wrap').innerHTML;
    const win = window.open('', '', 'width=900,height=1000');
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}</style></head><body><h1>${title}</h1>${wrap}</body></html>`);
    win.document.close();
    win.print();
  }

  // small helpers
  function csvEscape(v){ return `"${(v||'').replace(/"/g,'""')}"` }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }

  // Expose needed functions globally
  window.switchTab = function(tab){ // also update tab active class
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    // if the target tab is not in our TABS map maybe it's data-tab attr — handle both
    if(TABS[tab]) { document.getElementById('tabContent').innerHTML = TABS[tab]; } else { document.getElementById('tabContent').innerHTML = '<p class="small">Content coming soon</p>'; }
  };
  window.openChecklist = openChecklist;
  window.closeChecklist = closeChecklist;
  window.saveDrillChecklist = saveDrillChecklist;
  window.openRoster = openRoster;
  window.closeRoster = closeRoster;
  window.addVolunteer = addVolunteer;
  window.removeVolunteer = removeVolunteer;
  window.exportRoster = exportRoster;
  window.simulateDrill = simulateDrill;
  window.downloadAAR = downloadAAR;
  window.showPrintTemplate = showPrintTemplate;
  window.printModule = printModule;
  window.downloadAAR = downloadAAR;

  // DOM ready actions
  document.addEventListener('DOMContentLoaded', function () {
    // initial tab content
    document.getElementById('tabContent').innerHTML = TABS.plan;
    // wire buttons
    const oc = document.getElementById('openChecklistBtn'); if(oc) oc.addEventListener('click', openChecklist);
    const ob = document.getElementById('startDrillBtn'); if(ob) ob.addEventListener('click', simulateDrill);
    const or = document.getElementById('openRosterBtn'); if(or) or.addEventListener('click', openRoster);
    // roster close - also close when backdrop clicked (roster modal)
    document.querySelectorAll('.modal-backdrop').forEach(b => b.addEventListener('click', function(){ this.parentElement.style.display='none'; }));
    renderRoster();
  });
})();
