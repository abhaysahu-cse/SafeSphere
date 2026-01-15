/* cyclone_simulation.js
   Grid-based cyclone drill. Build structures, embankments, shelters.
   Safe / risky / unsafe logic included.
*/
(() => {
  const canvas = document.getElementById('cyclone-canvas');
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

  // grid
  const COLS = 16, ROWS = 16;
  function getTileSize(){ const rect = canvas.getBoundingClientRect(); return Math.floor(rect.width / COLS); }
  let TILE = getTileSize();

  // state
  let budget = 50000;
  let population = 200;
  let mode = 'none';
  let running = false;
  let simInterval = null;
  let inspectedCell = null;
  let riskOverlay = false;

  // costs & vulnerability
  const COST = { kutcha: 300, pucca:1500, shelter:4000, tree:50, embank:1200 };
  const VULN = { kutcha: 0.9, pucca: 0.35, shelter:0.05 };

  // grid model: type:'land'|'sea'|'embank', building:null|{type,people}, flooded:false, damaged:false
  const grid = [];
  for (let r=0;r<ROWS;r++){
    grid[r]=[];
    for (let c=0;c<COLS;c++){
      const t = (r > ROWS - 4) ? 'sea' : 'land'; // bottom 3 rows sea
      grid[r][c] = { type: t, building: null, flooded: (t==='sea'), damaged: false };
    }
  }

  // seed demo buildings
  grid[4][4].building = { type:'pucca', people:8 };
  grid[6][6].building = { type:'kutcha', people:5 };
  grid[3][10].building = { type:'shelter', people:18 };

  // UI refs
  const elBudget = document.getElementById('budget');
  const elPopulation = document.getElementById('population');
  const elMode = document.getElementById('mode');
  const elTileInfo = document.getElementById('tileInfo');
  const elAdvisor = document.getElementById('advisorText');
  const selectStrength = document.getElementById('stormStrength');
  const shareSurge = document.getElementById('stormSurge');

  function updateHUD(){
    if (elBudget) elBudget.textContent = '₹ ' + budget.toLocaleString();
    if (elPopulation) elPopulation.textContent = population;
    if (elMode) elMode.textContent = mode;
  }

  // Safety evaluation logic:
  // - flooded OR damaged -> unsafe
  // - shelter -> safe
  // - pucca near sea (adjacent sea/flood) -> risky, else safe
  // - kutcha -> unsafe or risky if far from sea
  // - open land -> unsafe
  function evaluateSafety(r,c){
    const tile = grid[r][c];
    if (tile.flooded) return { status:'unsafe', reason:'Flooded / storm surge' };
    if (tile.damaged) return { status:'unsafe', reason:'Structurally damaged' };
    if (tile.building && tile.building.type === 'shelter') return { status:'safe', reason:'Designated cyclone shelter' };
    if (tile.building && tile.building.type === 'pucca') {
      const nearSea = hasNearbySea(r,c);
      return nearSea ? { status:'risky', reason:'Pucca building near coast (storm surge / wind risk)' } : { status:'safe', reason:'Pucca building (relatively safe)' };
    }
    if (tile.building && tile.building.type === 'kutcha') {
      const nearSea = hasNearbySea(r,c);
      return nearSea ? { status:'unsafe', reason:'Kutcha house near coast — very vulnerable' } : { status:'risky', reason:'Kutcha house — vulnerable' };
    }
    if (tile.type === 'embank') return { status:'risky', reason:'Embankment (protects behind it)' };
    return { status:'unsafe', reason:'Open land with no shelter' };
  }

  function hasNearbySea(r,c){
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++){
      const nr = r+dr, nc = c+dc;
      if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS){
        if (grid[nr][nc].type === 'sea' || grid[nr][nc].flooded) return true;
      }
    }
    return false;
  }

  // render
  function render(){
    TILE = getTileSize();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let r=0;r<ROWS;r++){
      for (let c=0;c<COLS;c++){
        const x = c*TILE, y = r*TILE;
        const t = grid[r][c];

        // base color
        if (t.type === 'sea' || t.flooded) ctx.fillStyle = '#3aa0ff';
        else ctx.fillStyle = '#c9f1c9';

        ctx.fillRect(x+1,y+1,TILE-2,TILE-2);

        // embank
        if (t.type === 'embank') {
          ctx.fillStyle = '#9c6b3a';
          ctx.fillRect(x+2,y+TILE/2-6,TILE-4,12);
        }

        // building icons
        if (t.building){
          ctx.font = `${Math.floor(TILE*0.6)}px serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          const cx = x + TILE/2, cy = y + TILE/2;
          if (t.building.type === 'kutcha') ctx.fillText('🏚️', cx, cy+2);
          else if (t.building.type === 'pucca') ctx.fillText('🏠', cx, cy+2);
          else if (t.building.type === 'shelter') ctx.fillText('🏨', cx, cy+2);
          else if (t.building.type === 'tree') ctx.fillText('🌳', cx, cy+2);
        }

        // damaged overlay
        if (t.damaged) {
          ctx.fillStyle = 'rgba(150,0,0,0.22)';
          ctx.fillRect(x+1,y+1,TILE-2,TILE-2);
        }

        // grid
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.strokeRect(x+0.5,y+0.5,TILE,TILE);

        // inspection highlight
        if (inspectedCell && inspectedCell.r === r && inspectedCell.c === c) {
          const s = inspectedCell.status;
          if (s === 'safe') ctx.fillStyle = 'rgba(0,200,0,0.28)';
          else if (s === 'risky') ctx.fillStyle = 'rgba(255,165,0,0.28)';
          else ctx.fillStyle = 'rgba(255,0,0,0.28)';
          ctx.fillRect(x+1,y+1,TILE-2,TILE-2);
        }

        // global risk overlay
        if (riskOverlay) {
          const ev = evaluateSafety(r,c);
          if (ev.status === 'safe') ctx.fillStyle='rgba(0,200,0,0.12)';
          else if (ev.status === 'risky') ctx.fillStyle='rgba(255,165,0,0.12)';
          else ctx.fillStyle='rgba(255,0,0,0.12)';
          ctx.fillRect(x+1,y+1,TILE-2,TILE-2);
        }
      }
    }
  }

  // click handling
  canvas.addEventListener('click', (ev)=>{
    const rect = canvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left, cy = ev.clientY - rect.top;
    const col = Math.floor(cx / getTileSize()), row = Math.floor(cy / getTileSize());
    if (row<0||row>=ROWS||col<0||col>=COLS) return;
    handleClick(row,col);
  });

  function showTileInfo(r,c){
    const t = grid[r][c];
    let txt = `Cell (${r},${c}) — Type: ${t.type}${t.flooded ? ' (flooded)' : ''}${t.damaged ? ' (damaged)' : ''}. `;
    if (t.building) txt += `Building: ${t.building.type}. People: ${t.building.people || 0}.`;
    else txt += 'Empty.';
    if (elTileInfo) elTileInfo.textContent = txt;
  }

  function handleClick(r,c){
    const tile = grid[r][c];
    const safety = evaluateSafety(r,c);
    inspectedCell = { r,c, status: safety.status };
    showTileInfo(r,c);
    if (running) return; // no building while running

    // tools
    if (mode === 'clear') {
      if (tile.building) {
        budget += Math.floor((COST[tile.building.type]||0)*0.4);
        population -= (tile.building.people || 0);
        tile.building = null;
        updateHUD(); render();
      }
      return;
    }

    if (mode === 'tree') {
      if (budget < COST.tree) { alert('Not enough budget'); return; }
      if (tile.type === 'sea') { alert('Cannot plant tree on sea'); return; }
      tile.building = { type:'tree', people:0 };
      budget -= COST.tree; updateHUD(); render(); return;
    }

    if (mode === 'kutcha' || mode === 'pucca' || mode === 'shelter') {
      const cost = COST[mode];
      if (budget < cost) { alert('Not enough budget'); return; }
      if (tile.type === 'sea') { alert('Cannot build on sea (place embankment on coastal tiles)'); return; }
      const people = (mode === 'kutcha' ? 4 : (mode === 'pucca' ? 8 : 18));
      tile.building = { type: mode, people };
      budget -= cost; population += people;
      updateHUD(); render(); return;
    }

    if (mode === 'embank') {
      const cost = COST.embank;
      if (budget < cost) { alert('Not enough budget'); return; }
      // only allow embank on land adjacent to sea (coastal strip rows)
      if (tile.type === 'land') {
        // set as embank to block surge (we use type 'embank' to mark it)
        tile.type = 'embank';
        tile.building = null;
        budget -= cost; updateHUD(); render(); return;
      } else { alert('Embankments must be built on coastal land'); return; }
    }

    // inspection mode (none) - already handled via inspectedCell
  }

  // simulation helpers
  function applyStormSurge(surgeLevel) {
    // surgeLevel: number of rows to flood from bottom (1..4)
    for (let c=0;c<COLS;c++){
      // check if embank exists in coastal band for this column (rows ROWS-1 down to ROWS-4)
      let embankFound = false;
      for (let r = ROWS-1; r >= Math.max(0, ROWS - 4); r--) {
        if (grid[r][c].type === 'embank') { embankFound = true; break; }
      }
      if (embankFound) continue; // column protected
      // flood column bottom surgeLevel rows (but not sea tiles—they're already sea/flooded)
      for (let rr = ROWS - 1; rr >= Math.max(0, ROWS - surgeLevel); rr--) {
        if (grid[rr][c].type !== 'sea') {
          grid[rr][c].flooded = true;
        }
      }
    }
  }

  function windDamageTick(strength) {
    // strength: multiplier 0.5 (low), 1 (med), 1.6 (high)
    const toDamage = [];
    for (let r=0;r<ROWS;r++){
      for (let c=0;c<COLS;c++){
        const tile = grid[r][c];
        if (tile.building && !tile.damaged) {
          // base vuln
          const btype = tile.building.type;
          const baseVul = VULN[btype] || 0.5;
          // extra if near sea or flooded
          const nearSea = hasNearbySea(r,c) || tile.flooded;
          const extra = nearSea ? 0.25 : 0;
          const chance = Math.random();
          if (chance < Math.min(0.99, baseVul * strength + extra)) toDamage.push([r,c]);
        }
      }
    }
    toDamage.forEach(([r,c])=>{
      const t = grid[r][c];
      // apply damage: remove building / mark damaged
      // shelters are more resilient: mark damaged but survive usually
      if (t.building.type === 'shelter') {
        // small chance to damage
        if (Math.random() < 0.12) { t.damaged = true; }
      } else {
        // remove building, reduce people
        const lost = Math.max(1, Math.floor((t.building.people||0) * 0.7));
        population = Math.max(0, population - lost);
        t.building = null;
        t.damaged = true;
        budget = Math.max(0, budget - (lost * 150));
      }
    });
  }

  function runCycloneStep(step, totalSteps, strengthMultiplier, surgeEnabled){
    // step-based simulation:
    //  - apply wind damage
    //  - after first step, optionally apply surge once
    windDamageTick(strengthMultiplier);

    if (surgeEnabled && step === 1){
      // surge level depends on strength: medium 2, high 3, low 1
      const level = (selectStrength.value === 'high') ? 3 : (selectStrength.value === 'low' ? 1 : 2);
      applyStormSurge(level);
    }

    updateHUD(); render();

    if (step >= totalSteps) {
      stopCyclone();
    }
  }

  function startCyclone(){
    if (running) return;
    running = true;
    // storm strength mapping
    const st = selectStrength ? selectStrength.value : 'medium';
    const strengthMultiplier = (st === 'low' ? 0.6 : st === 'high' ? 1.6 : 1.0);
    const steps = (st === 'low' ? 4 : st === 'high' ? 8 : 6);
    const surgeEnabled = shareSurge ? shareSurge.checked : false;

    // initial advisor
    advise('Cyclone starting — monitoring wind & surge. Shelters protect, embankments may block surge.');

    let step=0;
    simInterval = setInterval(()=>{
      step++;
      runCycloneStep(step, steps, strengthMultiplier, surgeEnabled);
    }, 650);

    // after start, set mode to none (inspect)
    setMode('none');
  }

  function stopCyclone(){
    if (simInterval) clearInterval(simInterval);
    simInterval = null;
    running = false;
    // compute metrics
    const shelters = countBuildingsOfType('shelter');
    const puccaLeft = countBuildingsOfType('pucca');
    const kutchaLeft = countBuildingsOfType('kutcha');
    const floodedCount = grid.flat().filter(t=>t.flooded).length;
    const score = Math.max(0, population*5 + shelters*200 + puccaLeft*30 - floodedCount*5 + Math.floor(budget/1000));
    showEndModal({ populationRemaining: population, shelters, puccaLeft, kutchaLeft, floodedCount, budget, score });
    advise('Cyclone ended. See results.');
  }

  function countBuildingsOfType(type){
    let cnt=0;
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
      if (grid[r][c].building && grid[r][c].building.type === type) cnt++;
    }
    return cnt;
  }

  function advise(text){ if (elAdvisor) elAdvisor.textContent = text; }

  // controls wiring
  document.getElementById('btn-kutcha').addEventListener('click', ()=> setMode('kutcha'));
  document.getElementById('btn-pucca').addEventListener('click', ()=> setMode('pucca'));
  document.getElementById('btn-shelter').addEventListener('click', ()=> setMode('shelter'));
  document.getElementById('btn-tree').addEventListener('click', ()=> setMode('tree'));
  document.getElementById('btn-embank').addEventListener('click', ()=> setMode('embank'));
  document.getElementById('btn-clear').addEventListener('click', ()=> setMode('clear'));
  document.getElementById('btn-none').addEventListener('click', ()=> setMode('none'));

  document.getElementById('btn-start').addEventListener('click', startCyclone);
  document.getElementById('btn-reset').addEventListener('click', ()=> { window._cyclone.resetMap(); advise('Map reset.'); });
  document.getElementById('btn-risk-toggle').addEventListener('click', ()=> { riskOverlay = !riskOverlay; render(); });

  function setMode(m){
    mode = m;
    if (elMode) elMode.textContent = m;
    document.querySelectorAll('.controls button').forEach(b=>{
      const tool = b.getAttribute('data-tool');
      b.classList.toggle('active', tool === m);
    });
    inspectedCell = null;
    render();
  }

  // end modal
  function showEndModal(stats){
    let modal = document.getElementById('cycloneEndModal');
    if (!modal){
      modal = document.createElement('div');
      modal.id = 'cycloneEndModal';
      modal.style = 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:9999';
      const inner = document.createElement('div');
      inner.id = 'cycloneInner';
      inner.style = 'background:#fff;border-radius:10px;padding:18px;width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.25)';
      modal.appendChild(inner);
      document.body.appendChild(modal);
    }
    document.getElementById('cycloneInner').innerHTML = `
      <h2 style="margin-top:0">Cyclone Results</h2>
      <div>Population remaining: <strong>${stats.populationRemaining}</strong></div>
      <div>Shelters surviving: <strong>${stats.shelters}</strong></div>
      <div>Pucca left: <strong>${stats.puccaLeft}</strong></div>
      <div>Kutcha left: <strong>${stats.kutchaLeft}</strong></div>
      <div>Tiles flooded: <strong>${stats.floodedCount}</strong></div>
      <div style="margin-top:12px;font-size:18px;">Score: <strong>${stats.score}</strong></div>
      <div style="text-align:right;margin-top:12px;">
        <button id="cyClose" style="padding:8px 12px;border-radius:8px;background:#0ea5e9;color:#fff;border:none">Close</button>
        <button id="cyReset" style="padding:8px 12px;border-radius:8px;margin-left:8px;">Reset</button>
      </div>
    `;
    modal.style.display = 'flex';
    document.getElementById('cyClose').onclick = ()=> modal.style.display = 'none';
    document.getElementById('cyReset').onclick = ()=> { modal.style.display='none'; window._cyclone.resetMap(); advise('Map reset.'); };
  }

  // expose reset
  window._cyclone = {
    grid, render, updateHUD,
    resetMap: ()=>{
      for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
        grid[r][c].type = (r > ROWS - 4) ? 'sea' : 'land';
        grid[r][c].building = null;
        grid[r][c].flooded = (grid[r][c].type === 'sea');
        grid[r][c].damaged = false;
      }
      // reseed demo
      grid[4][4].building = { type:'pucca', people:8 };
      grid[6][6].building = { type:'kutcha', people:5 };
      grid[3][10].building = { type:'shelter', people:18 };
      budget = 50000; population = 200; mode = 'none'; riskOverlay = false;
      if (simInterval) clearInterval(simInterval);
      simInterval = null; running = false;
      updateHUD(); render();
    }
  };

  // initial
  updateHUD(); render(); advise('Plan embankments and shelters. Inspect tiles to see safety status.');

})();
