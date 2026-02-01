/* schools-drills.js
   Handles: checklist modal, planner (save drills to localStorage), print, role-play helpers
   Place at: static/js/schools-drills.js
*/

(function(){
  // Local keys
  const CHECK_KEY = 'safesphere_school_drill_check_v1';
  const PLANNER_KEY = 'safesphere_school_drill_plans_v1';

  // DOM helpers
  const el = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);

  // Default checklist content (research-backed)
  const CHECK = {
    pre: [
      "Designate a School Safety Team and lead teacher for drills",
      "Check evacuation routes and remove obstructions",
      "Confirm assembly points and accessible routes for students with disabilities",
      "Test alarm system and alternative communication (phone/SMS/megaphone)",
      "Prepare emergency kit (first-aid, torch, teacher contact list, blankets, water)"
    ],
    during: [
      "Activate alarm; teacher calmly instructs students to leave by primary route",
      "Teacher takes class list and leads students, closes the classroom door",
      "Safety Team assists mobility-impaired students and checks corridors",
      "At assembly point: roll-call, report missing students to HOD",
      "Basic first-aid for minor injuries; escalate serious cases to ambulance"
    ],
    after: [
      "Conduct short psychosocial check-in with students",
      "Log drill performance (time, issues, bottlenecks)",
      "Repair or clear any blocked exits; update plan",
      "Share drill report with local education authority and parents (short note)"
    ]
  };

  // Show / hide modals
  function openChecklist(){ el('checklistModal').style.display = 'flex'; switchChecklistTab('pre'); loadChecklist(); }
  function closeChecklist(){ el('checklistModal').style.display = 'none'; }
  function openPlanner(){ el('plannerModal').style.display = 'flex'; }
  function closePlanner(){ el('plannerModal').style.display = 'none'; }

  // Switch checklist tabs
  function switchChecklistTab(tab){
    document.querySelectorAll('.tabs-inner .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const content = el('checklistContent');
    if(!content) return;
    if(tab === 'pre' || tab === 'during' || tab === 'after'){
      const arr = CHECK[tab];
      content.innerHTML = '<h3>' + (tab.charAt(0).toUpperCase()+tab.slice(1)) + '</h3>' + arr.map(i => `<div style="padding:6px 0">• ${i}</div>`).join('');
    } else if(tab === 'log'){
      // show stored drill logs
      const raw = localStorage.getItem(PLANNER_KEY);
      let html = '<h3>Saved Drill Plans</h3>';
      if(!raw) html += '<p class="small">No drill plans saved.</p>';
      else {
        const arr = JSON.parse(raw);
        html += '<ul>';
        arr.forEach((d, idx) => {
          html += `<li><strong>${d.name}</strong> — ${d.date} (${d.hazard}) <button onclick="window._sd_viewPlan(${idx})" class="btn btn-ghost">View</button></li>`;
        });
        html += '</ul>';
      }
      content.innerHTML = html;
    } else {
      content.innerHTML = '<p class="small">Select a tab.</p>';
    }
  }

  // Checklist persistence
  function saveChecklist(){
    // Gather any checkboxes in content (if present)
    const checks = Array.from(document.querySelectorAll('#checklistContent input[type="checkbox"]')).map(c => c.checked);
    localStorage.setItem(CHECK_KEY, JSON.stringify({checks, ts:Date.now()}));
    alert('Checklist saved locally.');
  }
  function loadChecklist(){
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if(!raw) return;
      const obj = JSON.parse(raw);
      // If checklist tab currently has inputs, restore
      const inputs = document.querySelectorAll('#checklistContent input[type="checkbox"]');
      inputs.forEach((ch, i) => ch.checked = !!obj.checks[i]);
    } catch(e){ console.warn('loadChecklist', e); }
  }

  // Print checklist content
  function printChecklist(){
    const title = el('checklistTitle').innerText || 'School Drill Checklist';
    const content = el('checklistContent').innerHTML;
    const w = window.open('', '', 'width=700,height=900');
    w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}</style></head><body><h2>${title}</h2>${content}</body></html>`);
    w.document.close();
    w.print();
  }

  // Planner: save drills and show
  function savePlanner(data){
    const raw = localStorage.getItem(PLANNER_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(data);
    localStorage.setItem(PLANNER_KEY, JSON.stringify(arr));
  }

  function renderPlannerList(){
    const raw = localStorage.getItem(PLANNER_KEY);
    const target = el('plannerResult');
    if(!target) return;
    if(!raw){ target.innerHTML = '<p class="small">No planned drills yet.</p>'; return; }
    const arr = JSON.parse(raw);
    target.innerHTML = '<ul>' + arr.map((d,i) => `<li><strong>${d.name}</strong> — ${d.date} — ${d.hazard} <button class="btn btn-ghost" onclick="window._sd_viewPlan(${i})">View</button> <button class="btn btn-ghost" onclick="window._sd_deletePlan(${i})">Delete</button></li>`).join('') + '</ul>';
  }

  // Expose plan view/delete for buttons inside generated html
  window._sd_viewPlan = function(i){
    const raw = localStorage.getItem(PLANNER_KEY);
    if(!raw) return alert('No plan found');
    const arr = JSON.parse(raw);
    const p = arr[i];
    alert(`Drill: ${p.name}\nDate: ${p.date}\nHazard: ${p.hazard}\nScope: ${p.scope}\nLead: ${p.lead}`);
  };
  window._sd_deletePlan = function(i){
    const raw = localStorage.getItem(PLANNER_KEY);
    if(!raw) return;
    const arr = JSON.parse(raw);
    arr.splice(i,1);
    localStorage.setItem(PLANNER_KEY, JSON.stringify(arr));
    renderPlannerList();
  };

  // Print evacuation template (the page's printable template)
  function printEvacTemplate(){
    // build a simple printable map area — user should replace with proper map in production
    const html = `<div style="font-family:Arial;padding:20px">
      <h2>School Evacuation Template</h2>
      <p>Mark primary & secondary routes, assembly points and accessible routes for mobility-impaired students.</p>
      <div style="border:1px solid #ddd;height:420px;display:flex;align-items:center;justify-content:center;color:#aaa">Replace with site map image</div>
    </div>`;
    const w = window.open('','', 'width=800,height=900');
    w.document.write(html);
    w.document.close();
    w.print();
  }

  // Hook up events on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function(){
    // Buttons
    const openChecklistBtn = document.getElementById('openChecklistBtn');
    if(openChecklistBtn) openChecklistBtn.addEventListener('click', openChecklist);
    const plannerBtn = document.getElementById('plannerBtn');
    if(plannerBtn) plannerBtn.addEventListener('click', openPlanner);
    const planDrillBtn = document.getElementById('planDrillBtn');
    if(planDrillBtn) planDrillBtn.addEventListener('click', openPlanner);
    const printTemplateBtn = document.getElementById('printTemplateBtn');
    if(printTemplateBtn) printTemplateBtn.addEventListener('click', printEvacTemplate);

    // Planner form
    const plannerForm = document.getElementById('plannerForm');
    if(plannerForm){
      plannerForm.addEventListener('submit', function(e){
        e.preventDefault();
        const data = {
          name: el('drillName').value || 'Unnamed drill',
          date: el('drillDate').value || new Date().toISOString(),
          hazard: el('drillHazard').value || 'general',
          scope: el('drillScope').value || 'Whole school',
          lead: el('drillLead').value || ''
        };
        savePlanner(data);
        renderPlannerList();
        el('plannerForm').reset();
        el('plannerResult').innerHTML = '<p class="small">Drill saved. It will appear in Drill Log.</p>';
      });
    }

    // Modal tab clicks (delegated)
    document.querySelectorAll('.tabs-inner .tab').forEach(t => {
      t.addEventListener('click', () => switchChecklistTab(t.dataset.tab));
    });

    // Checklist control buttons within modals
    // Save / print bound to window functions below
    window.saveChecklist = saveChecklist;
    window.printChecklist = printChecklist;
    window.openChecklist = openChecklist;
    window.closeChecklist = closeChecklist;
    window.openPlanner = openPlanner;
    window.closePlanner = closePlanner;
    window.printEvacTemplate = printEvacTemplate;
    window.switchChecklistTab = switchChecklistTab;

    // Render planner list if modal open
    renderPlannerList();

    // Initialize default checklist tab
    switchChecklistTab('pre');
  });

})();
