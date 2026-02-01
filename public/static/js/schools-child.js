/* schools-child.js
   Interactive behavior for Child Protection & Psychosocial Support module.
   - Activity timer
   - Simple local roster manager (add/edit/remove)
   - Referral contact editor (modal)
   - Checklist open/print
   - Local storage persistence
*/
(function () {
  // LocalStorage keys
  const ROSTER_KEY = 'safesphere_school_roster_v1';
  const REFERRAL_KEY = 'safesphere_school_referrals_v1';

  // Elements
  const startTimerBtn = document.getElementById('startTimer');
  const stopTimerBtn = document.getElementById('stopTimer');
  const activityTimer = document.getElementById('activityTimer');

  const staffNameInput = document.getElementById('staffName');
  const staffRoleInput = document.getElementById('staffRole');
  const addStaffBtn = document.getElementById('addStaffBtn');
  const rosterList = document.getElementById('rosterList');
  const exportRosterBtn = document.getElementById('exportRoster');

  const editReferralsBtn = document.getElementById('editReferralsBtn');
  const referralsModal = document.getElementById('referralsModal');
  const referralsInput = document.getElementById('referralsInput');
  const saveReferralsBtn = document.getElementById('saveReferrals');

  const openChecklistBtn = document.getElementById('openChecklist');
  const printPosterBtn = document.getElementById('printPoster');

  // Timer state
  let timerHandle = null;
  let timerSeconds = 0;

  // Roster state
  let roster = [];

  // Helpers
  function uid(prefix='s'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
  function saveRoster(){ localStorage.setItem(ROSTER_KEY, JSON.stringify(roster)); }
  function loadRoster(){ try { roster = JSON.parse(localStorage.getItem(ROSTER_KEY) || '[]'); } catch(e){ roster = []; } }

  function renderRoster(){
    rosterList.innerHTML = '';
    if (roster.length === 0){ rosterList.innerHTML = '<div class="small muted">No staff added</div>'; return; }
    roster.forEach(r => {
      const row = document.createElement('div'); row.className = 'roster-row';
      row.innerHTML = `<div>
        <strong>${escapeHtml(r.name)}</strong><div class="small muted">${escapeHtml(r.role)}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost small" data-id="${r.id}" onclick="(function(id){ removeStaff(id)})('${r.id}')">Remove</button>
      </div>`;
      rosterList.appendChild(row);
    });
  }

  window.removeStaff = function(id){
    if (!confirm('Remove this staff entry?')) return;
    roster = roster.filter(r => r.id !== id);
    saveRoster(); renderRoster();
  };

  // Timer functions
  function formatTime(sec){
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }
  function startTimer(){
    if (timerHandle) return;
    timerSeconds = 0;
    activityTimer.innerText = formatTime(timerSeconds);
    timerHandle = setInterval(()=> {
      timerSeconds++;
      activityTimer.innerText = formatTime(timerSeconds);
      // visual indicator every minute (optional)
    }, 1000);
    startTimerBtn.disabled = true; stopTimerBtn.disabled = false;
  }
  function stopTimer(){
    if (!timerHandle) return;
    clearInterval(timerHandle); timerHandle = null;
    startTimerBtn.disabled = false; stopTimerBtn.disabled = true;
  }

  // Referral modal
  function openReferrals(){
    referralsModal.setAttribute('aria-hidden', 'false'); referralsModal.style.display = 'flex';
    const val = localStorage.getItem(REFERRAL_KEY) || '';
    referralsInput.value = val || 'KVK / Child Welfare Committee: (add)\nHealth: 112\nPolice: (add)';
  }
  function closeReferrals(){ referralsModal.setAttribute('aria-hidden', 'true'); referralsModal.style.display = 'none'; }
  function saveReferrals(){
    localStorage.setItem(REFERRAL_KEY, referralsInput.value || '');
    document.getElementById('referralsText').innerText = referralsInput.value || 'Add referral contacts';
    closeReferrals();
    alert('Saved referral contacts locally');
  }

  // Simple print poster (placeholder)
  function printPoster(){
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Child Support Poster</title>
      <style>body{font-family:Arial;padding:20px} h1{color:#0b6b4f} .box{border:1px dashed #ddd;padding:20px;border-radius:8px}</style></head>
      <body><h1>Child Protection: You are safe here</h1><div class="box"><ol><li>Look for safety</li><li>Listen calmly</li><li>Protect & connect</li><li>Tell the safeguarding officer</li></ol></div></body></html>`;
    const w = window.open('', '', 'width=700,height=900'); w.document.write(html); w.document.close(); setTimeout(()=> w.print(), 400);
  }

  // Checklist open (scroll modal behavior not included here — reuse poster)
  function openChecklist(){
    window.printChecklist ? window.printChecklist() : alert('Use Print checklist button in module (or integrate server-side).');
  }

  // Export roster
  function exportRoster(){
    if (roster.length === 0) { alert('No staff to export'); return; }
    const csv = ['name,role', ...roster.map(r => `"${r.name.replace(/"/g,'""')}","${r.role.replace(/"/g,'""')}"`)].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'school_roster.csv'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // small helper
  function escapeHtml(s){ return (s==null) ? '' : (''+s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); }); }

  // Init & events
  document.addEventListener('DOMContentLoaded', function(){
    // timer buttons
    startTimerBtn.addEventListener('click', startTimer);
    stopTimerBtn.addEventListener('click', stopTimer);
    stopTimerBtn.disabled = true;

    // roster
    loadRoster(); renderRoster();
    addStaffBtn.addEventListener('click', function(){
      const name = (staffNameInput.value||'').trim();
      const role = (staffRoleInput.value||'').trim();
      if (!name || !role) { alert('Please enter name and role'); return; }
      roster.push({ id: uid('r'), name, role });
      staffNameInput.value=''; staffRoleInput.value='';
      saveRoster(); renderRoster();
    });
    exportRosterBtn.addEventListener('click', exportRoster);

    // referrals modal
    editReferralsBtn.addEventListener('click', openReferrals);
    saveReferralsBtn.addEventListener('click', saveReferrals);
    // populate referralsText from storage
    const refVal = localStorage.getItem(REFERRAL_KEY);
    if (refVal) document.getElementById('referralsText').innerText = refVal;

    // checklist & poster
    openChecklistBtn.addEventListener('click', openChecklist);
    printPosterBtn.addEventListener('click', printPoster);

    // shortcuts: allow pressing ESC to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeReferrals(); }
    });

    // expose functions to global for small handlers used inline
    window.closeReferrals = closeReferrals;
    window.openChecklist = openChecklist;
    window.printPoster = printPoster;
    window.saveReferrals = saveReferrals;
    window.removeStaff = removeStaff;
  });
})();
