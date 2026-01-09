/*
  Drill Simulation – Flood Preparedness
  Canvas-based simulation
  Status: Working (DPI + click fixed)
  Author: SafeSphere Team
*/


(() => {
  const canvas = document.getElementById('map-canvas');
  const ctx = canvas.getContext('2d');

  // ensure crispness on high-dpi screens
  function fixDPI() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.getAttribute('width');
    const h = canvas.getAttribute('height');
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fixDPI();
  window.addEventListener('resize', () => {
    // keep canvas size constant visually; you can adapt if you want responsive scaling
    fixDPI();
    render();
  });

  // grid size
  const COLS = 16;
  const ROWS = 16;
  function getTileSize() {
  const rect = canvas.getBoundingClientRect();
  return Math.floor(rect.width / COLS);
}


  // state
  let budget = 50000;
  let population = 200;
  let mode = 'none';
  let floodRunning = false;
  let floodInterval = null;
  let inspectedCell = null; // {r,c,status}
  let riskOverlay = false;

  // costs & vulnerability
  const COST = { wood: 500, concrete: 2500, levee: 1200, tree: 50, shelter: 4000 };
  const VULN = { wood: 0.8, concrete: 0.2, shelter: 0.05 };

  // grid model
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      const t = (r > ROWS - 4) ? 'water' : 'land'; // bottom rows water
      grid[r][c] = { type: t, building: null, flooded: (t === 'water') };
    }
  }

  // demo seed: a few buildings and trees
  grid[6][6].building = { type: 'wood', people: 5 };
  grid[6][8].building = { type: 'concrete', people: 12 };
  grid[8][10].building = { type: 'wood', people: 4 };
  grid[10][4].building = { type: 'wood', people: 6 };
  grid[5][5].building = { type: 'tree', people: 0 };
  grid[3][3].building = { type: 'shelter', people: 18 };

  // UI elements
  const elBudget = document.getElementById('budget');
  const elPopulation = document.getElementById('population');
  const elMode = document.getElementById('mode');
  const elTileInfo = document.getElementById('simulationTileInfo');
  const elAdvisorText = document.getElementById('advisorText');

  // utility: update HUD
  function updateHUD() {
    elBudget.textContent = '₹ ' + budget.toLocaleString();
    elPopulation.textContent = population;
    elMode.textContent = mode;
  }

  // evaluate safety for a tile
  function evaluateSafety(r, c) {
    const tile = grid[r][c];

    if (tile.flooded) return { status: 'unsafe', reason: 'Flooded area' };
    if (tile.type === 'water') return { status: 'unsafe', reason: 'Water body' };

    // empty land -> unsafe (no shelter)
    if (!tile.building) {
      // but if near shelter or concrete we might consider it 'risky' instead of fully unsafe
      const nearSafe = hasNearbyShelterOrConcrete(r, c);
      return nearSafe ? { status: 'risky', reason: 'Open land near safe structures' } : { status: 'unsafe', reason: 'Open land has no shelter' };
    }

    // building specific
    if (tile.building.type === 'wood') {
      // if near water, risk increases
      const nearWater = hasNearbyWater(r, c);
      return nearWater ? { status: 'risky', reason: 'Wooden house near water' } : { status: 'risky', reason: 'Wooden house (low resistance)' };
    }

    if (tile.building.type === 'concrete') {
      return { status: 'safe', reason: 'Concrete structure (strong shelter)' };
    }

    if (tile.building.type === 'shelter') {
      return { status: 'safe', reason: 'Designated shelter (very safe)' };
    }

    if (tile.building.type === 'tree') {
      return { status: 'unsafe', reason: 'Tree only — not a shelter' };
    }

    return { status: 'unsafe', reason: 'Unknown condition' };
  }

  function hasNearbyWater(r, c) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (grid[nr][nc].flooded || grid[nr][nc].type === 'water') return true;
        }
      }
    }
    return false;
  }

  function hasNearbyShelterOrConcrete(r, c) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const b = grid[nr][nc].building;
          if (b && (b.type === 'shelter' || b.type === 'concrete')) return true;
        }
      }
    }
    return false;
  }

  // rendering
  const TILE = getTileSize();

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const tile = grid[r][c];

        // base
        if (tile.type === 'water' || tile.flooded) {
          ctx.fillStyle = '#2b87d6';
        } else {
          ctx.fillStyle = '#87d086';
        }
        ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);

        // levee draw
        if (tile.type === 'levee') {
          ctx.fillStyle = '#9c6b3a';
          ctx.fillRect(x + 2, y + TILE / 2 - 6, TILE - 4, 12);
        }

        // grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE, TILE);

        // building icons
        if (tile.building) {
          const b = tile.building;
          ctx.font = `${Math.floor(TILE * 0.6)}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const cx = x + TILE / 2, cy = y + TILE / 2;
          if (b.type === 'wood') ctx.fillText('🏚️', cx, cy + 2);
          else if (b.type === 'concrete') ctx.fillText('🏥', cx, cy + 2);
          else if (b.type === 'tree') ctx.fillText('🌳', cx, cy + 2);
          else if (b.type === 'shelter') ctx.fillText('🏨', cx, cy + 2);
        }

        // small people icons/count (if building has people)
        if (tile.building && tile.building.people > 0) {
          // draw count bottom-right small
          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#222';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          const peopleText = tile.building.people > 3 ? '👥 ' + tile.building.people : '👤'.repeat(Math.min(3, tile.building.people));
          ctx.fillText(peopleText, x + TILE - 6, y + TILE - 6);
        }

        // flood shimmer overlay
        if (tile.flooded) {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        }

        // safety inspection highlight
        if (inspectedCell && inspectedCell.r === r && inspectedCell.c === c) {
          if (inspectedCell.status === 'safe') ctx.fillStyle = 'rgba(0,200,0,0.28)';
          else if (inspectedCell.status === 'risky') ctx.fillStyle = 'rgba(255,165,0,0.28)';
          else ctx.fillStyle = 'rgba(255,0,0,0.28)';
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        }

        // risk overlay (global) - color each tile by its own evaluation
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
  const tileSize = getTileSize();

  const cx = ev.clientX - rect.left;
  const cy = ev.clientY - rect.top;

  const col = Math.floor(cx / tileSize);
  const row = Math.floor(cy / tileSize);

  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  handleClickCell(row, col);
});

  function showTileInfo(r, c) {
    const t = grid[r][c];
    let text = `Cell (${r},${c}) — Type: ${t.type}${t.flooded ? ' (flooded)' : ''}. `;
    if (t.building) text += `Building: ${t.building.type}. People: ${t.building.people || 0}.`;
    else text += 'Empty.';
    elTileInfo.textContent = text;
  }

  function handleClickCell(r, c) {
    const tile = grid[r][c];

    // set inspectedCell always (shows overlay)
    const safety = evaluateSafety(r, c);
    inspectedCell = { r, c, status: safety.status };

    showTileInfo(r, c);

    if (floodRunning) return; // don't allow building while flood running

    // tools
    if (mode === 'clear') {
      if (tile.building) {
        const b = tile.building;
        let refund = 0;
        if (b.type === 'wood') refund = Math.floor(COST.wood * 0.5);
        if (b.type === 'concrete') refund = Math.floor(COST.concrete * 0.5);
        if (b.type === 'tree') refund = Math.floor(COST.tree * 0.5);
        if (b.type === 'shelter') refund = Math.floor(COST.shelter * 0.4);
        budget += refund;
        population -= (b.people || 0);
        if (population < 0) population = 0;
        tile.building = null;
        updateHUD(); render();
      }
      return;
    }

    if (mode === 'wood' || mode === 'concrete' || mode === 'tree' || mode === 'shelter') {
      const cost = COST[mode];
      if (budget < cost) { alert('Not enough budget'); return; }
      if (tile.type === 'water' && mode !== 'levee') {
        alert('Cannot place building on water. Place levee or pick land tile.');
        return;
      }
      const people = (mode === 'wood' ? 5 : (mode === 'concrete' ? 10 : (mode === 'shelter' ? 18 : 0)));
      tile.building = { type: mode, people };
      budget -= cost;
      population += people;
      updateHUD(); render();
      return;
    }

    if (mode === 'levee') {
      const cost = COST.levee;
      if (budget < cost) { alert('Not enough budget'); return; }
      tile.type = 'levee';
      tile.flooded = false;
      budget -= cost;
      updateHUD(); render();
      return;
    }

    // inspection mode (none) - already handled by inspectedCell & showTileInfo
  }

  // controls wiring
  document.getElementById('btn-wood').addEventListener('click', () => setMode('wood'));
  document.getElementById('btn-concrete').addEventListener('click', () => setMode('concrete'));
  document.getElementById('btn-levee').addEventListener('click', () => setMode('levee'));
  document.getElementById('btn-tree').addEventListener('click', () => setMode('tree'));
  document.getElementById('btn-clear').addEventListener('click', () => setMode('clear'));
  document.getElementById('btn-none').addEventListener('click', () => setMode('none'));
  document.getElementById('btn-shelter').addEventListener('click', () => setMode('shelter'));

  document.getElementById('btn-start').addEventListener('click', () => {
    if (floodRunning) return;
    floodRunning = true;
    floodInterval = setInterval(floodTick, 600);
    setMode('none');
    advise('Flood started — watch the spread. Levees can block flow.');
  });

  // risk overlay toggle
  document.getElementById('btn-risk-toggle').addEventListener('click', () => {
    riskOverlay = !riskOverlay;
    document.getElementById('btn-risk-toggle').classList.toggle('active', riskOverlay);
    render();
  });

  function setMode(m) {
    mode = m;
    elMode.textContent = m;
    // highlight active button
    document.querySelectorAll('.controls button').forEach(b => {
      const id = b.getAttribute('id');
      b.classList.toggle('active', id && ('btn-' + m) === id); // best-effort (we keep visual via manual toggles below)
    });
    // manual highlight: search button with data-tool
    document.querySelectorAll('.controls button').forEach(b => {
      const tool = b.getAttribute('data-tool');
      if (tool) b.classList.toggle('active', tool === m);
    });
  }

  // simple advisor system: suggests levee placement or shelter placement
  function advise(text) {
    if (!elAdvisorText) return;
    elAdvisorText.textContent = text;
  }

  function updateAdvisorHint() {
    if (floodRunning) {
      // watch if flood is near populated cells
      const nearPop = findNearestPopulatedNearFlood();
      if (nearPop) {
        advise(`Flood approaching populated area at (${nearPop.r},${nearPop.c}). Consider building levee or moving people to shelter.`);
        return;
      }
      advise('Flood in progress. Monitor and use levees.');
      return;
    }
    // pre-flood advice: find a spot where a levee would block well
    const spot = findGoodLeveeSpot();
    if (spot) {
      advise(`Build levee near (${spot.r},${spot.c}) to protect inland areas.`);
      return;
    }
    advise('No immediate suggestion. Inspect tiles and plan placements (shelters, levees).');
  }

  function findGoodLeveeSpot() {
    // find a land tile adjacent to water without a levee or building
    for (let r = ROWS - 4; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].type === 'land') {
          // tile adjacent to water?
          if (hasNearbyWater(r, c) && !grid[r][c].building && grid[r][c].type !== 'levee') {
            return { r, c };
          }
        }
      }
    }
    return null;
  }

  function findNearestPopulatedNearFlood() {
    // find a populated tile near any flooded tile within 2 steps
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].flooded) {
          for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              const b = grid[nr][nc].building;
              if (b && (b.people || 0) > 0) return { r: nr, c: nc };
            }
          }
        }
      }
    }
    return null;
  }

  // flood tick sim
  function floodTick() {
    const toFlood = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].flooded) {
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              const nt = grid[nr][nc];
              if (!nt.flooded) {
                if (nt.type === 'levee') return; // levees block
                toFlood.push([nr, nc]);
              }
            }
          });
        }
      }
    }

    const newlyFlooded = [];
    toFlood.forEach(([r, c]) => {
      const tile = grid[r][c];
      tile.flooded = true;
      newlyFlooded.push([r, c]);
    });

    newlyFlooded.forEach(([r, c]) => {
      const tile = grid[r][c];
      if (tile.building && (tile.building.type === 'wood' || tile.building.type === 'concrete' || tile.building.type === 'shelter')) {
        const type = tile.building.type;
        const vuln = (type === 'wood') ? VULN.wood : (type === 'concrete' ? VULN.concrete : VULN.shelter);
        const chance = Math.random();
        if (chance < vuln) {
          const loss = Math.max(1, Math.floor((tile.building.people || 0) * vuln));
          population -= loss;
          if (population < 0) population = 0;
          tile.building = null;
          budget = Math.max(0, budget - Math.floor(loss * 200));
        } else {
          const loss = Math.random() < 0.25 ? 1 : 0;
          population -= loss;
          if (population < 0) population = 0;
        }
      }
    });

    // check end condition
    let floodedCount = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c].flooded) floodedCount++;
    if (floodedCount === ROWS * COLS || newlyFlooded.length === 0) {
      endFlood();
    }
    render(); updateHUD();
    updateAdvisorHint();
  }

  function endFlood() {
    clearInterval(floodInterval);
    floodInterval = null;
    floodRunning = false;
    // compute score: population preserved + shelters survived + budget left
    const popLeft = population;
    const shelters = countBuildingsOfType('shelter');
    const concreteLeft = countBuildingsOfType('concrete');
    const score = Math.max(0, popLeft * 5 + shelters * 200 + concreteLeft * 50 + Math.floor(budget / 1000));
    showEndModal({ populationRemaining: popLeft, shelters, concreteLeft, budget, score });
    advise('Simulation ended. See results.');
    elMode.textContent = 'none';
  }

  function countBuildingsOfType(type) {
    let cnt = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c].building && grid[r][c].building.type === type) cnt++;
    }
    return cnt;
  }

  // end-screen modal
  function showEndModal(stats) {
    // create if not exist
    let modal = document.getElementById('endModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'endModal';
      modal.style.position = 'fixed';
      modal.style.left = 0;
      modal.style.top = 0;
      modal.style.right = 0;
      modal.style.bottom = 0;
      modal.style.background = 'rgba(0,0,0,0.55)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = 9999;
      const inner = document.createElement('div');
      inner.id = 'endInner';
      inner.style.background = '#fff';
      inner.style.borderRadius = '12px';
      inner.style.padding = '20px';
      inner.style.width = '420px';
      inner.style.boxShadow = '0 14px 40px rgba(0,0,0,0.25)';
      modal.appendChild(inner);
      document.body.appendChild(modal);
    }
    const inner = document.getElementById('endInner');
    inner.innerHTML = `
      <h2 style="margin-top:0">Simulation Results</h2>
      <div>Population remaining: <strong>${stats.populationRemaining}</strong></div>
      <div>Shelters surviving: <strong>${stats.shelters}</strong></div>
      <div>Concrete buildings: <strong>${stats.concreteLeft}</strong></div>
      <div>Budget left: <strong>₹ ${stats.budget.toLocaleString()}</strong></div>
      <div style="margin-top:12px; font-size:18px;">Preparedness score: <strong>${stats.score}</strong></div>
      <div style="margin-top:16px; text-align:right;">
        <button id="endClose" style="padding:8px 12px; border-radius:8px; border:none; background:#4f46e5; color:#fff">Close</button>
        <button id="endReset" style="padding:8px 12px; border-radius:8px; margin-left:8px;">Reset Map</button>
      </div>
    `;
    modal.style.display = 'flex';
    document.getElementById('endClose').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('endReset').onclick = () => {
      modal.style.display = 'none';
      window._drill.resetMap();
      advise('Map reset. Start planning again.');
    };
  }

  // expose debug and reset
  window._drill = {
    grid, render, updateHUD,
    resetMap: () => {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        grid[r][c].type = (r > ROWS - 4) ? 'water' : 'land';
        grid[r][c].building = null;
        grid[r][c].flooded = (grid[r][c].type === 'water');
      }
      budget = 50000; population = 200; mode = 'none'; riskOverlay = false; inspectedCell = null;
      updateHUD(); render();
    }
  };

  // initial render and advisor
  updateHUD();
  render();
  updateAdvisorHint();

  // small periodic advisor refresh
  setInterval(updateAdvisorHint, 5000);
})();
