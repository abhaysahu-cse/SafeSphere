console.log('[SafeSphere] Flood AR v7 loaded');

window.addEventListener('load', () => {

  const marker = document.getElementById('marker');
  const root   = document.getElementById('root');
  const water  = document.getElementById('water');
  const card   = document.getElementById('card');
  const start  = document.getElementById('start');
  const reset  = document.getElementById('reset');
  const bar    = document.getElementById('bar');

  let locked = false;
  let flooding = false;
  let level = 0;
  let raf;

  /* ---------- Marker handling ---------- */

  marker.addEventListener('markerFound', () => {
    console.log('[SafeSphere] Marker found');

    if (!locked) {
      root.object3D.position.set(0, 0, 0);
      root.object3D.rotation.set(0, 0, 0);
      root.setAttribute('visible', true);
      locked = true;
    }

    card.style.display = 'block';
  });

  marker.addEventListener('markerLost', () => {
    console.log('[SafeSphere] Marker lost');
    // DO NOT hide root → prevents jitter & flicker
    card.style.display = 'none';
    stopFlood();
  });

  /* ---------- Flood logic ---------- */

  function floodStep() {
    if (!flooding) return;

    level += 0.003;
    if (level > 1) level = 1;

water.object3D.scale.y = Math.max(0.01, level * 2);
water.object3D.position.y = -0.2 + (level * 0.9);


    bar.style.width = `${level * 100}%`;

    if (level >= 1) {
      flooding = false;
      start.textContent = 'Flood Complete';
      return;
    }
    raf = requestAnimationFrame(floodStep);
  }

  function startFlood() {
    if (flooding) return;
    flooding = true;
    start.textContent = 'Flooding...';
    raf = requestAnimationFrame(floodStep);
  }

  function stopFlood() {
    flooding = false;
    if (raf) cancelAnimationFrame(raf);
  }

  function resetFlood() {
    stopFlood();
    level = 0;
    bar.style.width = '0%';
water.object3D.scale.y = 0.01;
water.object3D.position.y = -0.2;

    start.textContent = 'Start Flood';
  }

  start.onclick = startFlood;
  reset.onclick = resetFlood;
});
