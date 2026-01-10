/* wildfire_simulation.js
   Improved: fixes inspection-after-place, adds well & watchtower, risk logic tweaks.
   Works with your HTML IDs (#wildfire-canvas, #tileInfo, #advisorText, buttons as in HTML)
*/

(() => {
  const canvas = document.getElementById('wildfire-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // DPI fix
  function fixDPI() {
    const dpr = window.devicePixelRatio || 1;
    const w = parseInt(canvas.getAttribute('width'), 10);
    const h = parseInt(canvas.getAttribute('height'), 10);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fixDPI();
  window.addEventListener('resize', () => { fixDPI(); render(); });

  const COLS = 20;
  const ROWS = 20;
  function getTileSize() { const rect = canvas.getBoundingClientRect(); return Math.floor(rect.width / COLS) || 36; }
  let TILE = getTileSize();

  // state
  let budget = 50000;
  let population = 200;
  let mode = 'none';
  let running = false;
  let intervalId = null;
  let inspectedCell = null;
  let riskOverlay = false;
  let wind = 'none'; // 'none','up','down','left','right'

  // costs and behavior
  const COST = { tree: 50, shelter: 4000, firebreak: 200, well: 800, watchtower: 1500 };
  // spread probabilities base by tile type (per neighbor)
  const SPREAD_BASE = { dry: 0.72, tree: 0.45, land: 0.25, shelter: 0.02, water: 0, firebreak: 0 };

  // grid: type: 'land'|'dry'|'water'|'firebreak', building: null | {type:'shelter'|'tree'|...}
  const grid = [];
  function seedGridVariable() {
    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        const t = (r > ROWS - 5 && Math.random() > 0.25) ? 'dry' : (Math.random() < 0.03 ? 'water' : 'land');
        grid[r][c] = { type: t, building: null, burning: false, burned: false };
      }
    }
    // demo seed
    grid[4][4].building = { type: 'shelter', people: 18 };
    grid[8][6].building = { type: 'tree', people: 0 };
    grid[12][8].building = { type: 'tree', people: 0 };
  }

  seedGridVariable();

  // UI refs
  const elBudget = document.getElementById('budget');
  const elPopulation = document.getElementById('population');
  const elMode = document.getElementById('mode');
  const elTileInfo = document.getElementById('tileInfo');
  const elAdvisor = document.getElementById('advisorText');

  function updateHUD() {
    if (elBudget) elBudget.textContent = '₹ ' + budget.toLocaleString();
    if (elPopulation) elPopulation.textContent = population;
    if (elMode) elMode.textContent = mode;
  }

  // helper: nearby well reduces local risk
  function hasNearbyWell(r, c, radius = 2) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const b = grid[nr][nc].building;
          if (b && b.type === 'well') return true;
        }
      }
    }
    return false;
  }

  function hasNearbyShelter(r, c, radius = 2) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const b = grid[nr][nc].building;
          if (b && b.type === 'shelter') return true;
        }
      }
    }
    return false;
  }

  function evaluateSafety(r, c) {
    const tile = grid[r][c];
    if (tile.burning || tile.burned) return { status: 'unsafe', reason: 'Currently on fire / burned' };
    // water => safe (fire won't burn)
    if (tile.type === 'water') return { status: 'safe', reason: 'Water — safe from fire' };
    // building-level rules
    if (tile.building) {
      if (tile.building.type === 'shelter') return { status: 'safe', reason: 'Designated shelter (safe)' };
      if (tile.building.type === 'watchtower') return { status: 'safe', reason: 'Watchtower — early warning (safer)' };
      if (tile.building.type === 'well') return { status: 'safe', reason: 'Water source (well) — safer' };
      if (tile.building.type === 'tree') return { status: 'risky', reason: 'Tree — vegetation can burn' };
    }
    // tile-type rules
    if (tile.type === 'dry') {
      // well nearby can reduce classification
      if (hasNearbyWell(r,c,2)) return { status: 'risky', reason: 'Dry but water nearby' };
      return { status: 'unsafe', reason: 'Dry grass is highly flammable' };
    }
    if (tile.type === 'land' || tile.type === 'tree') {
      const nearShelter = hasNearbyShelter(r,c,2);
      if (nearShelter) return { status: 'risky', reason: 'Near shelter (may be evacuated)' };
      return { status: 'risky', reason: 'Vegetation / open land (moderate risk)' };
    }
    if (tile.type === 'firebreak') return { status: 'risky', reason: 'Firebreak (reduces spread)' };
    return { status: 'unsafe', reason: 'Unknown — treat as unsafe' };
  }

  function render() {
    TILE = getTileSize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE, y = r * TILE;
        const t = grid[r][c];

        // base
        if (t.type === 'water') ctx.fillStyle = '#5db3ff';
        else if (t.type === 'dry') ctx.fillStyle = '#f2c66a';
        else ctx.fillStyle = '#b6e39a';

        ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);

        // burned
        if (t.burned) {
          ctx.fillStyle = 'rgba(40,40,40,0.6)';
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        }

        // burning
        if (t.burning) {
          ctx.fillStyle = 'rgba(255,80,0,0.25)';
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
          ctx.font = `${Math.floor(TILE * 0.6)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ff3200'; ctx.fillText('🔥', x + TILE / 2, y + TILE / 2 + 2);
        }

        // building icons
        if (t.building) {
          ctx.font = `${Math.floor(TILE * 0.6)}px serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (t.building.type === 'shelter') ctx.fillText('🏨', x + TILE / 2, y + TILE / 2 + 2);
          else if (t.building.type === 'tree') ctx.fillText('🌲', x + TILE / 2, y + TILE / 2 + 2);
          else if (t.building.type === 'well') ctx.fillText('🪣', x + TILE / 2, y + TILE / 2 + 2);
          else if (t.building.type === 'watchtower') ctx.fillText('🔭', x + TILE / 2, y + TILE / 2 + 2);
        }

        // firebreak visual
        if (t.type === 'firebreak') {
          ctx.fillStyle = '#c7b29b';
          ctx.fillRect(x + 2, y + TILE / 2 - 6, TILE - 4, 12);
        }

        // grid
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE, TILE);

        // inspection overlay
        if (inspectedCell && inspectedCell.r === r && inspectedCell.c === c) {
          const s = inspectedCell.status;
          if (s === 'safe') ctx.fillStyle = 'rgba(0,200,0,0.28)';
          else if (s === 'risky') ctx.fillStyle = 'rgba(255,165,0,0.28)';
          else ctx.fillStyle = 'rgba(255,0,0,0.28)';
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        }

        // global risk overlay
        if (riskOverlay) {
          const ev = evaluateSafety(r, c);
          if (ev.status === 'safe') ctx.fillStyle = 'rgba(0,200,0,0.12)';
          else if (ev.status === 'risky') ctx.fillStyle = 'rgba(255,165,0,0.12)';
          else ctx.fillStyle = 'rgba(255,0,0,0.12)';
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        }
      }
    }
  }

  // click handling
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const col = Math.floor(cx / getTileSize());
    const row = Math.floor(cy / getTileSize());
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    handleClick(row, col);
  });

  function showTileInfo(r, c) {
    if (!elTileInfo) return;
    const tile = grid[r][c];
    let out = `Cell (${r},${c}) — Type: ${tile.type}${tile.burning ? ' (burning)' : tile.burned ? ' (burned)' : ''}. `;
    if (tile.building) out += `Building: ${tile.building.type}. People: ${tile.building.people || 0}.`;
    else out += 'Empty.';
    elTileInfo.textContent = out;
  }

  function handleClick(r, c) {
    const tile = grid[r][c];
    const safety = evaluateSafety(r, c);
    inspectedCell = { r, c, status: safety.status };
    showTileInfo(r, c);
    if (running) return;

    if (mode === 'clear') {
      if (tile.building) {
        const b = tile.building;
        budget += Math.floor((COST[b.type] || 0) * 0.3);
        population = Math.max(0, population - (b.people || 0));
        tile.building = null;
        updateHUD(); render();
      }
      return;
    }

    if (mode === 'tree') {
      if (budget < COST.tree) { alert('Not enough budget'); return; }
      if (tile.type === 'water') { alert('Cannot plant tree on water'); return; }
      tile.building = { type: 'tree', people: 0 };
      budget -= COST.tree;
      // recalc safety for this tile
      const newSafety = evaluateSafety(r, c);
      inspectedCell = { r, c, status: newSafety.status };
      showTileInfo(r, c);
      updateHUD(); render();
      return;
    }

    if (mode === 'shelter') {
      if (budget < COST.shelter) { alert('Not enough budget'); return; }
      if (tile.type === 'water') { alert('Cannot build shelter on water'); return; }
      tile.building = { type: 'shelter', people: 10 };
      budget -= COST.shelter;
      population += 10;
      const newSafety = evaluateSafety(r, c);
      inspectedCell = { r, c, status: newSafety.status };
      showTileInfo(r, c);
      updateHUD(); render();
      return;
    }

    if (mode === 'firebreak') {
      if (budget < COST.firebreak) { alert('Not enough budget'); return; }
      tile.type = 'firebreak';
      tile.building = null;
      budget -= COST.firebreak;
      const newSafety = evaluateSafety(r, c);
      inspectedCell = { r, c, status: newSafety.status };
      showTileInfo(r, c);
      updateHUD(); render();
      return;
    }

    // Additional new buildables: well & watchtower must have buttons in HTML to be used
    if (mode === 'well') {
      if (budget < COST.well) { alert('Not enough budget'); return; }
      if (tile.type === 'water') { alert('Cannot build well on water'); return; }
      tile.building = { type: 'well', people: 0 };
      budget -= COST.well;
      const newSafety = evaluateSafety(r, c);
      inspectedCell = { r, c, status: newSafety.status };
      showTileInfo(r, c);
      updateHUD(); render();
      return;
    }

    if (mode === 'watchtower') {
      if (budget < COST.watchtower) { alert('Not enough budget'); return; }
      if (tile.type === 'water') { alert('Cannot build watchtower on water'); return; }
      tile.building = { type: 'watchtower', people: 0 };
      budget -= COST.watchtower;
      const newSafety = evaluateSafety(r, c);
      inspectedCell = { r, c, status: newSafety.status };
      showTileInfo(r, c);
      updateHUD(); render();
      return;
    }

    // inspection only
    render();
  }

  // spread helpers (4-neighbors)
  function neighborCoords(r, c) { return [[1,0],[-1,0],[0,1],[0,-1]]; }

  function spreadProbability(fromR, fromC, toR, toC) {
    const target = grid[toR][toC];
    let base = SPREAD_BASE[target.type] || 0.2;
    // watchtower reduces nearby spread slightly (early warning)
    if (hasNearbyShelter(toR, toC, 1)) base *= 0.7;
    if (hasNearbyWell(toR, toC, 1)) base *= 0.6;
    // wind bias
    let windBoost = 0;
    if (wind !== 'none') {
      const dr = toR - fromR, dc = toC - fromC;
      if (wind === 'down' && dr > 0) windBoost = 0.18;
      if (wind === 'up' && dr < 0) windBoost = 0.18;
      if (wind === 'right' && dc > 0) windBoost = 0.18;
      if (wind === 'left' && dc < 0) windBoost = 0.18;
    }
    return Math.min(0.99, base + windBoost);
  }

  function igniteSeed() {
    const seeds = [];
    for (let i = 0; i < 6; i++) {
      const r = ROWS - 2 - Math.floor(Math.random()*2);
      const c = Math.floor(Math.random()*COLS);
      if (grid[r][c].type === 'dry' && !grid[r][c].burning && !grid[r][c].burned) seeds.push([r,c]);
    }
    seeds.forEach(([r,c]) => grid[r][c].burning = true);
    // ensure at least one burning
    if (!grid.some(row => row.some(cell => cell.burning))) grid[Math.floor(ROWS/2)][Math.floor(COLS/2)].burning = true;
    render();
  }

  function fireTick() {
    const toIgnite = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = grid[r][c];
        if (!tile.burning) continue;
        neighborCoords(r,c).forEach(([dr,dc]) => {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
          const nt = grid[nr][nc];
          if (nt.burning || nt.burned) return;
          if (nt.type === 'water' || nt.type === 'firebreak') return;
          const p = spreadProbability(r,c,nr,nc);
          if (Math.random() < p) toIgnite.push([nr,nc]);
        });
      }
    }

    toIgnite.forEach(([r,c]) => grid[r][c].burning = true);

    // burning -> burned & casualty logic
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = grid[r][c];
        if (t.burning) {
          if (t.building && t.building.type === 'shelter') {
            if (Math.random() < 0.05) {
              const lost = Math.max(0, Math.floor((t.building.people || 0) * 0.1));
              population = Math.max(0, population - lost);
            }
          } else if (t.building && t.building.type === 'tree') {
            t.building = null;
          } else if (t.building && t.building.type !== 'shelter') {
            const lost = Math.max(1, Math.floor((t.building.people || 0) * 0.6));
            population = Math.max(0, population - lost);
            t.building = null;
          }
          t.burning = false;
          t.burned = true;
        }
      }
    }

    // stop condition
    const anyBurning = grid.some(row => row.some(cell => cell.burning));
    if (!anyBurning) stopFire();
    render(); updateHUD(); advisorTick();
  }

  function startFire() {
    if (running) return;
    running = true;
    igniteSeed();
    intervalId = setInterval(fireTick, 600);
    advise('Fire started. Use firebreaks and shelters. Wind affects spread.');
  }

  function stopFire() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    running = false;
    const burned = grid.flat().filter(t => t.burned).length;
    const shelters = countTypeBuildings('shelter');
    const score = Math.max(0, population * 5 + shelters * 200 - burned * 10 + Math.floor(budget/1000));
    showEndModal({ populationRemaining: population, shelters, burned, budget, score });
    advise('Simulation ended.');
  }

  function countTypeBuildings(type) {
    let c = 0;
    for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) {
      const b = grid[r][cc].building;
      if (b && b.type === type) c++;
    }
    return c;
  }

  function advise(text){
    if (!elAdvisor) return;
    elAdvisor.textContent = text;
  }

  function advisorTick() {
    if (!running) {
      for (let r = ROWS-4; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (grid[r][c].type === 'dry') { advise('Suggestion: build firebreak near dry grass (bottom area).'); return; }
      }
      advise('Plan placements: wells reduce local spread; shelters reduce casualties; firebreaks block fire.');
    } else {
      advise('Fire is burning — watch downwind areas and build firebreaks.');
    }
  }

  // wind buttons wiring
  document.getElementById('wind-up')?.addEventListener('click', () => { wind = 'up'; advise('Wind: up'); render(); });
  document.getElementById('wind-down')?.addEventListener('click', () => { wind = 'down'; advise('Wind: down'); render(); });
  document.getElementById('wind-left')?.addEventListener('click', () => { wind = 'left'; advise('Wind: left'); render(); });
  document.getElementById('wind-right')?.addEventListener('click', () => { wind = 'right'; advise('Wind: right'); render(); });
  document.getElementById('wind-none')?.addEventListener('click', () => { wind = 'none'; advise('Wind: none'); render(); });

  // controls wiring (including optional well & watchtower buttons if present in HTML)
  document.getElementById('btn-tree')?.addEventListener('click', () => setMode('tree'));
  document.getElementById('btn-shelter')?.addEventListener('click', () => setMode('shelter'));
  document.getElementById('btn-firebreak')?.addEventListener('click', () => setMode('firebreak'));
  document.getElementById('btn-clear')?.addEventListener('click', () => setMode('clear'));
  document.getElementById('btn-none')?.addEventListener('click', () => setMode('none'));
  document.getElementById('btn-start')?.addEventListener('click', startFire);
  document.getElementById('btn-reset')?.addEventListener('click', () => { window._wildfire.resetMap(); advise('Map reset.'); });
  document.getElementById('btn-risk-toggle')?.addEventListener('click', () => { riskOverlay = !riskOverlay; render(); });

  // optional new buttons
  document.getElementById('btn-well')?.addEventListener('click', () => setMode('well'));
  document.getElementById('btn-watchtower')?.addEventListener('click', () => setMode('watchtower'));

  function setMode(m) {
    mode = m;
    if (elMode) elMode.textContent = m;
    document.querySelectorAll('.controls button').forEach(b => {
      const t = b.getAttribute('data-tool'); b.classList.toggle('active', t === m);
    });
    inspectedCell = null;
    render();
  }

  // end modal
  function showEndModal(stats) {
    let modal = document.getElementById('wfEndModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'wfEndModal';
      modal.style = 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:9999';
      const inner = document.createElement('div');
      inner.id = 'wfEndInner';
      inner.style = 'background:#fff;border-radius:10px;padding:18px;width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.25)';
      modal.appendChild(inner);
      document.body.appendChild(modal);
    }
    document.getElementById('wfEndInner').innerHTML = `
      <h2 style="margin-top:0">Wildfire Results</h2>
      <div>Population remaining: <strong>${stats.populationRemaining}</strong></div>
      <div>Shelters surviving: <strong>${stats.shelters}</strong></div>
      <div>Tiles burned: <strong>${stats.burned}</strong></div>
      <div>Budget left: <strong>₹ ${stats.budget.toLocaleString()}</strong></div>
      <div style="margin-top:12px;font-size:18px;">Score: <strong>${stats.score}</strong></div>
      <div style="text-align:right;margin-top:12px;">
        <button id="wfClose" style="padding:8px 12px;border-radius:8px;background:#4f46e5;color:#fff;border:none">Close</button>
        <button id="wfReset" style="padding:8px 12px;border-radius:8px;margin-left:8px;">Reset</button>
      </div>`;
    modal.style.display = 'flex';
    document.getElementById('wfClose').onclick = () => modal.style.display = 'none';
    document.getElementById('wfReset').onclick = () => { modal.style.display = 'none'; window._wildfire.resetMap(); };
  }

  // expose reset and helpers
  window._wildfire = {
    grid, render, updateHUD,
    resetMap: () => {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        grid[r][c].type = (r > ROWS - 5 && Math.random() > 0.25) ? 'dry' : (Math.random() < 0.03 ? 'water' : 'land');
        grid[r][c].building = null;
        grid[r][c].burning = false;
        grid[r][c].burned = false;
      }
      grid[4][4].building = { type: 'shelter', people: 18 };
      grid[8][6].building = { type: 'tree', people: 0 };
      budget = 50000; population = 200; mode = 'none'; riskOverlay = false; wind = 'none'; running = false;
      if (intervalId) clearInterval(intervalId);
      updateHUD(); render(); advise('Map reset.');
    }
  };

  // initial render & advisor
  updateHUD(); render(); advisorTick();
  setInterval(advisorTick, 6000);
})();
