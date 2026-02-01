/* schools-audit.js
   Handles checklist state, save/load, score, export and print.
   Save under: static/js/schools-audit.js
*/
(function () {
  const STORAGE_KEY = 'safesphere_school_audit_v1';

  // helper: gather all check-items
  function collectItems() {
    const nodes = Array.from(document.querySelectorAll('.check-item'));
    return nodes.map(node => {
      const key = node.dataset.key;
      const checked = !!node.querySelector('.chk') && node.querySelector('.chk').checked;
      const note = node.querySelector('.notes textarea') ? node.querySelector('.notes textarea').value.trim() : '';
      const photoInput = node.querySelector('.photo');
      const photoName = (photoInput && photoInput.files && photoInput.files[0]) ? photoInput.files[0].name : '';
      const marked = !!node.querySelector('.mark-fix') && node.querySelector('.mark-fix').dataset.marked === '1';
      return { key, checked, note, photoName, marked };
    });
  }

  // save form state to localStorage
  function saveState() {
    const payload = {
      meta: {
        auditor: document.getElementById('auditorName').value.trim(),
        site: document.getElementById('siteName').value.trim(),
        date: document.getElementById('auditDate').value || new Date().toISOString().slice(0,10),
        summary: document.getElementById('finalSummary').value.trim(),
        fixes: document.getElementById('fixList').value.trim()
      },
      items: collectItems()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    flash('Saved locally.');
    return payload;
  }

  // load from localStorage
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.meta) {
        document.getElementById('auditorName').value = data.meta.auditor || '';
        document.getElementById('siteName').value = data.meta.site || '';
        document.getElementById('auditDate').value = data.meta.date || '';
        document.getElementById('finalSummary').value = data.meta.summary || '';
        document.getElementById('fixList').value = data.meta.fixes || '';
      }
      if (Array.isArray(data.items)) {
        data.items.forEach(it => {
          const node = document.querySelector(`.check-item[data-key="${it.key}"]`);
          if (!node) return;
          const chk = node.querySelector('.chk');
          if (chk) chk.checked = !!it.checked;
          const ta = node.querySelector('.notes textarea');
          if (ta) ta.value = it.note || '';
          // we cannot restore file inputs (browsers block). show filename as placeholder if present
          if (it.photoName) {
            const uploader = node.querySelector('.img-uploader');
            if (uploader && !uploader.querySelector('.file-name')) {
              const span = document.createElement('div');
              span.className = 'file-name';
              span.textContent = `Previously added file: ${it.photoName}`;
              span.style.fontSize = '0.85rem';
              span.style.color = '#666';
              uploader.appendChild(span);
            }
          }
          if (it.marked) {
            const markBtn = node.querySelector('.mark-fix');
            if (markBtn) setMarked(markBtn, true);
          }
        });
      }
    } catch (e) {
      console.warn('load error', e);
    }
  }

  // calculate score: percent of checks that are NOT flagged (i.e., items where checkbox is true means OK)
  function calculateScore(payload) {
    const items = payload ? payload.items : collectItems();
    if (!items || items.length === 0) return 0;
    const ok = items.filter(it => it.checked).length;
    return Math.round((ok / items.length) * 100);
  }

  function showScore() {
    const payload = saveState(); // ensure state saved before scoring
    const score = calculateScore(payload);
    document.getElementById('scoreValue').innerText = `${score}%`;
    return score;
  }

  // print: open new window with formatted content
  function printReport() {
    const payload = saveState();
    const title = `School Safety Audit — ${payload.meta.site || ''} — ${payload.meta.date || ''}`;
    const win = window.open('', '', 'width=900,height=1000');
    const styles = `<style>
      body{font-family:Arial;padding:20px;color:#123}
      h1{color:#0f5132}
      .section{margin-bottom:18px;padding:10px;border:1px solid #eee;border-radius:8px}
      .item{margin-bottom:8px}
      .muted{color:#666;font-size:0.95rem}
    </style>`;
    const header = `<h1>${escapeHtml(title)}</h1>
      <div class="muted">Auditor: ${escapeHtml(payload.meta.auditor||'')} | Site: ${escapeHtml(payload.meta.site||'')} | Date: ${escapeHtml(payload.meta.date||'')}</div>
      <h3>Summary</h3><div>${escapeHtml(payload.meta.summary||'')}</div>
      <h3>Top fixes</h3><div>${escapeHtml(payload.meta.fixes||'')}</div>
      <h3>Safety score: ${calculateScore(payload)}%</h3>
    `;
    const itemsHtml = payload.items.map(it => `
      <div class="item">
        <strong>${escapeHtml(it.key)}</strong> — ${it.checked ? 'OK' : 'Needs attention'}
        <div class="muted">Notes: ${escapeHtml(it.note||'')}</div>
        <div class="muted">Photo: ${escapeHtml(it.photoName||'')}</div>
      </div>
    `).join('');
    win.document.write(`<html><head><title>${escapeHtml(title)}</title>${styles}</head><body>${header}<div class="section">${itemsHtml}</div></body></html>`);
    win.document.close();
    win.print();
  }

  // export payload to JSON file
  function exportJson() {
    const payload = saveState();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = payload.meta.date || new Date().toISOString().slice(0,10);
    a.download = `school-audit-${(payload.meta.site||'site').replace(/\s+/g,'_')}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    flash('Export started');
  }

  // small flash message
  function flash(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '20px';
    el.style.background = '#0f5132';
    el.style.color = '#fff';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 10px 24px rgba(0,0,0,0.15)';
    document.body.appendChild(el);
    setTimeout(()=> el.style.opacity = '0.0', 1600);
    setTimeout(()=> el.remove(), 2200);
  }

  // escape HTML for printing
  function escapeHtml(s) {
    if (!s) return '';
    return (''+s).replace(/[&<>"']/g, function (m) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
  }

  // reset form
  function resetForm() {
    if (!confirm('Reset form and clear saved local progress?')) return;
    localStorage.removeItem(STORAGE_KEY);
    document.getElementById('auditForm').reset();
    // clear notes and any show file names
    document.querySelectorAll('.file-name').forEach(n => n.remove());
    document.getElementById('scoreValue').innerText = '—';
    flash('Form reset');
  }

  // mark/unmark fix
  function setMarked(button, marked) {
    if (marked) {
      button.dataset.marked = '1';
      button.textContent = 'Marked ✓';
      button.style.background = '#ffefc5';
      button.style.border = '1px solid #f0c36b';
    } else {
      button.dataset.marked = '0';
      button.textContent = 'Mark for repair';
      button.style.background = '';
      button.style.border = '';
    }
  }

  // attach listeners
  document.addEventListener('DOMContentLoaded', function () {
    // load saved
    loadState();

    // wire top buttons
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveState);

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportJson);

    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', printReport);

    const calcBtn = document.getElementById('calcScoreBtn');
    if (calcBtn) calcBtn.addEventListener('click', showScore);

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetForm);

    // jump nav
    document.querySelectorAll('.jump').forEach(b => {
      b.addEventListener('click', function () {
        const target = document.getElementById(b.dataset.target);
        if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });

    // attach mark-for-repair buttons
    document.querySelectorAll('.mark-fix').forEach(btn => {
      setMarked(btn, false);
      btn.addEventListener('click', function () {
        const isMarked = btn.dataset.marked === '1';
        setMarked(btn, !isMarked);
      });
    });

    // photo input: show file name on select
    document.querySelectorAll('.photo').forEach(input => {
      input.addEventListener('change', function () {
        const file = input.files && input.files[0];
        if (!file) return;
        const parent = input.closest('.img-uploader');
        // remove any previous file-name
        const existing = parent.querySelector('.file-name');
        if (existing) existing.remove();
        const span = document.createElement('div');
        span.className = 'file-name';
        span.textContent = `Chosen: ${file.name}`;
        span.style.fontSize = '0.85rem';
        span.style.color = '#666';
        parent.appendChild(span);
      });
    });

    // enable saving when any checkbox or notes change (light autosave)
    document.querySelectorAll('.chk, .notes textarea').forEach(el => {
      el.addEventListener('change', debounce(saveState, 800));
      el.addEventListener('input', debounce(saveState, 1200));
    });

    // ensure print/save/expose keys also available for keyboard:
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); saveState(); flash('Saved (Ctrl+S)'); }
      if (e.ctrlKey && e.key.toLowerCase() === 'e') { e.preventDefault(); exportJson(); }
    });
  });

  // debounce basic
  function debounce(fn, wait) {
    let t;
    return function () {
      clearTimeout(t);
      const args = arguments;
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

})();
