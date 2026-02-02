// app.js for farm-flood
console.log('[SafeSphere] farm-flood loaded');
window.addEventListener('load', () => {
  const marker = document.getElementById('marker');
  const root = document.getElementById('root');
  const water = document.getElementById('water');
  const start = document.getElementById('start');
  const reset = document.getElementById('reset');
  const card = document.getElementById('card');
  const statusText = document.getElementById('statusText');

  let level = 0; // 0..1
  let flooding = false;
  let raf;

  marker.addEventListener('markerFound', () => {
    root.setAttribute('visible', true);
    card.style.display = 'block';
    statusText.textContent = 'Marker found — ready';
  });
  marker.addEventListener('markerLost', () => {
    card.style.display = 'none';
    stopFlood();
  });

  function speak(txt){
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(txt); u.rate = 0.95;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }
  }

  function floodStep(){
    if (!flooding) return;
    level += 0.0025;
    if (level > 1) level = 1;
    // use height (A-Frame box height) and position to simulate rise
    water.setAttribute('scale', `1  ${Math.max(0.01, level*1.5)} 1`);
    water.object3D.position.y = 0.01 + level * 0.28;
    start.textContent = 'Flooding...';
    if (level >= 0.6) {
      statusText.textContent = 'Danger: Move animals and people to higher ground';
      speak('Danger. Move animals and people to higher ground.');
    }
    if (level >= 1) {
      flooding = false; start.textContent = 'Flood Complete';
      speak('Flood complete. Practice evacuation.');
      return;
    }
    raf = requestAnimationFrame(floodStep);
  }

  function startFlood(){ if (flooding) return; flooding = true; floodStep(); }
  function stopFlood(){ flooding = false; if (raf) cancelAnimationFrame(raf); }
  function resetFlood(){ stopFlood(); level=0; water.setAttribute('scale','1 0.02 1'); water.object3D.position.y = 0.01; start.textContent='Start Flood'; statusText.textContent='Reset'; }

  start.onclick = startFlood;
  reset.onclick = resetFlood;

  // initial
  resetFlood();
});
