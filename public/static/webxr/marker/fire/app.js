// app.js v3 — Fire drill behavior (extinguisher + truck + voice)
console.log('[SafeSphere] Fire AR v3 loaded');

window.addEventListener('load', () => {
  // CONFIG: tweak these if your GLBs are large/small or origin differs
  const SCHOOL_SCALE = 0.45;      // scale applied to school GLB by default (we keep school scale on index or set here)
  const FIRE_SCALE   = 0.28;      // initial flame scale
  const EXT_SCALE    = 0.5;       // extinguisher scale (bigger so it's visible)
  const TRUCK_SCALE  = 0.45;

  // Important DOM / A-Frame refs
  const marker = document.getElementById('marker');
  const root = document.getElementById('root');
  const school = document.getElementById('school');

  const fires = [
    document.getElementById('fire1'),
    document.getElementById('fire2'),
    document.getElementById('fire3')
  ];

  const ext = document.getElementById('ext');
  const truck = document.getElementById('truck');

  const card = document.getElementById('card');
  const extBtn = document.getElementById('extBtn');
  const truckBtn = document.getElementById('truckBtn');
  const status = document.getElementById('status');

  // Fire state
  let extinguishedCount = 0;
  let busy = false;

  // Utility: safe speak (uses SpeechSynthesis if available)
  function speak(text) {
    try {
      if ('speechSynthesis' in window) {
        const s = new SpeechSynthesisUtterance(text);
        s.rate = 0.95;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(s);
      } else {
        console.log('[TTS unavailable] ' + text);
      }
    } catch (e) {
      console.warn('TTS error', e);
    }
  }

  // Wait for model loaded (school visible when loaded)
  function onModelReady(entity, cb) {
    if (!entity) return cb && cb(new Error('missing entity'));
    // if model already present in object3D
    if (entity.getObject3D && entity.getObject3D('mesh')) {
      return cb && cb(null);
    }
    entity.addEventListener('model-loaded', () => cb && cb(null));
  }

  // Prepare initial scales & visibility
  function prepareScene() {
    // school
    if (school) {
      school.setAttribute('scale', `${SCHOOL_SCALE} ${SCHOOL_SCALE} ${SCHOOL_SCALE}`);
    }

    // fires
    fires.forEach((f) => {
      if (f) {
        f.setAttribute('scale', `${FIRE_SCALE} ${FIRE_SCALE} ${FIRE_SCALE}`);
        f.setAttribute('visible', true);
      }
    });

    // extinguisher & truck hidden by default & scale set
    if (ext) {
      ext.setAttribute('scale', `${EXT_SCALE} ${EXT_SCALE} ${EXT_SCALE}`);
      ext.setAttribute('visible', false);
    }
    if (truck) {
      truck.setAttribute('scale', `${TRUCK_SCALE} ${TRUCK_SCALE} ${TRUCK_SCALE}`);
      truck.setAttribute('visible', false);
    }
  }

  // Simple async delay
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Extinguisher animation: move extinguisher to a target fire, shrink the fire, then hide
  async function useExtinguisherOn(index) {
    if (busy) return;
    const fire = fires[index];
    if (!fire || !fire.getObject3D) return;

    busy = true;
    status.textContent = `Status: Aiming extinguisher at fire ${index+1}...`;
    speak('Aim at the base of the fire. Squeeze the handle. Sweep side to side.');

    // show extinguisher in scene
    ext.setAttribute('visible', true);

    // compute world-relative position of the fire, but we'll approximate by reading its local position
    const firePos = fire.getAttribute('position') || { x:0, y:0, z:0 };
    // place extinguisher a bit offset in front of fire
    const approachPos = { x: firePos.x - 0.18, y: firePos.y, z: firePos.z + 0.15 };

    // animate in steps (simple linear tween)
    const steps = 18;
    const startPos = ext.getAttribute('position') || { x: 0.7, y: 0, z: 0.3 };
    for (let i=1;i<=steps;i++){
      const t = i/steps;
      const x = startPos.x + (approachPos.x - startPos.x) * t;
      const y = startPos.y + (approachPos.y - startPos.y) * t;
      const z = startPos.z + (approachPos.z - startPos.z) * t;
      ext.setAttribute('position', `${x} ${y} ${z}`);
      await wait(20);
    }

    // extinguishing action: shrink fire progressively
    let s = FIRE_SCALE;
    const shrinkSteps = 14;
    for (let i=0;i<shrinkSteps;i++){
      s = s * 0.85;
      fire.setAttribute('scale', `${s} ${s} ${s}`);
      await wait(80);
    }

    // hide final
    fire.setAttribute('visible', false);
    extinguishedCount++;
    status.textContent = `Status: Fire ${index+1} extinguished. (${extinguishedCount}/${fires.length})`;
    speak('Fire put out. Good job.');

    // return extinguisher to original place slowly
    for (let i=1;i<=steps;i++){
      const t = i/steps;
      const x = approachPos.x + (startPos.x - approachPos.x) * t;
      const y = approachPos.y + (startPos.y - approachPos.y) * t;
      const z = approachPos.z + (startPos.z - approachPos.z) * t;
      ext.setAttribute('position', `${x} ${y} ${z}`);
      await wait(20);
    }

    busy = false;
  }

  // Call truck (arrive animation: show and move slightly)
  async function callTruck() {
    if (!truck) return;
    truck.setAttribute('visible', true);
    status.textContent = 'Status: Fire truck en route...';
    speak('Fire truck arriving. Keep clear of the area.');

    // simple arrival: slide truck toward school a little
    const start = truck.getAttribute('position') || { x:-0.9, y:0, z:0.6 };
    const end = { x: -0.45, y: 0, z: 0.4 };
    const steps = 40;
    for (let i=1;i<=steps;i++){
      const t = i/steps;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y;
      const z = start.z + (end.z - start.z) * t;
      truck.setAttribute('position', `${x} ${y} ${z}`);
      await wait(18);
    }

    status.textContent = 'Status: Fire truck arrived.';
  }

  // event handlers for UI
  extBtn.addEventListener('click', async () => {
    if (busy) return;
    // find next active fire
    const next = fires.findIndex(f => f && f.getAttribute('visible') !== false);
    if (next === -1) {
      status.textContent = 'Status: No active fires — all clear.';
      speak('There are no active fires.');
      return;
    }
    await useExtinguisherOn(next);

    // if all fires out, auto-enable/trigger truck arrival for demo
    if (extinguishedCount >= fires.length) {
      status.textContent = 'Status: All fires extinguished. Calling fire truck for inspection...';
      await wait(700);
      callTruck();
      extBtn.textContent = 'All Done';
      extBtn.disabled = true;
    } else {
      extBtn.textContent = 'Use Extinguisher';
    }
  });

  truckBtn.addEventListener('click', () => {
    if (truck.getAttribute('visible') === 'true') {
      status.textContent = 'Status: Truck already present.';
      return;
    }
    callTruck();
  });

  // Marker events
  marker.addEventListener('markerFound', () => {
    status.textContent = 'Status: Marker found — preparing scene...';
    card.style.display = 'block';
    // Wait until the school model loads before showing root (robust)
    onModelReady(school, (err) => {
      if (!err) {
        // set a default scale if model lacks correct scale
        school.setAttribute('scale', `${SCHOOL_SCALE} ${SCHOOL_SCALE} ${SCHOOL_SCALE}`);
        prepareScene();
        root.setAttribute('visible', true);
        status.textContent = 'Status: Scene ready. Use extinguisher when ready.';
        speak('Fire detected on the building. Use the extinguisher button to put out fires. Aim at the base, squeeze the handle, and sweep side to side.');
      } else {
        console.warn('School model failed to load', err);
        prepareScene();
        root.setAttribute('visible', true);
      }
    });
  });

  marker.addEventListener('markerLost', () => {
    card.style.display = 'none';
    status.textContent = 'Status: Marker lost.';
    // we keep objects visible (prevents flicker) but freeze actions
  });

  // small safety: stop TTS when page hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  // initial prepare in case models are cached
  prepareScene();

  // Expose for debugging in console
  window._SafeSphereFire = { fires, ext, truck, speak };
});
