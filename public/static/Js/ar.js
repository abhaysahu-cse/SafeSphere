/* public/static/Js/ar.js */
(function () {
  console.log("AR helper loaded");

  const SCENARIOS = {
    flood:  { title: "Flood",      model: "/static/ar/models/flood.glb",      audio: "/static/ar/audio/flood.mp3",      info: "Flood — seek higher ground. Follow evacuation routes." },
    earthquake:{ title: "Earthquake", model: "/static/ar/models/earthquake.glb", audio: "/static/ar/audio/earthquake.mp3", info: "Earthquake — drop, cover, and hold on." },
    cyclone:{ title: "Cyclone",     model: "/static/ar/models/cyclone.glb",     audio: "/static/ar/audio/cyclone.mp3",     info: "Cyclone — secure loose objects and move to shelter." },
    wildfire:{ title: "Wildfire",   model: "/static/ar/models/wildfire.glb",    audio: "/static/ar/audio/wildfire.mp3",    info: "Wildfire — evacuate upwind and stay safe." },
    landslide:{ title: "Landslide", model: "/static/ar/models/landslide.glb",   audio: "/static/ar/audio/landslide.mp3",   info: "Landslide — move to higher ground quickly." },
    firstaid:{ title: "First Aid",  model: "/static/ar/models/firstaid.glb",    audio: "/static/ar/audio/firstaid.mp3",    info: "First aid — check breathing, stop bleeding, call for help." }
  };

  const enterBtn = document.getElementById('enter-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const infoTitle = document.getElementById('scenarioTitle');
  const infoText  = document.getElementById('scenarioText');
  const modelPathEl = document.getElementById('modelPath');
  const uiButtons = document.querySelectorAll('[data-scenario]');
  const marker = document.querySelector('#hiro-marker');
  const modelEntity = document.querySelector('#scenario-model');

  let current = null;
  let audioEl = null;

  function safeSetModel(url) {
    console.log("safeSetModel:", url);
    if (!modelEntity) { console.warn("No modelEntity element"); return; }
    // remove existing and set after tiny delay
    try {
      modelEntity.removeAttribute('gltf-model');
      setTimeout(() => modelEntity.setAttribute('gltf-model', url), 60);
    } catch (e) {
      console.warn('set model error', e);
    }
  }

  function hideAllFallbacks() {
    Object.keys(SCENARIOS).forEach(s => {
      const el = document.getElementById('fallback-' + s);
      if (el) el.setAttribute('visible', 'false');
    });
  }

  function showFallback(scenario) {
    hideAllFallbacks();
    const el = document.getElementById('fallback-' + scenario);
    if (el) el.setAttribute('visible', 'true');
  }

  function chooseScenario(key) {
    if (!SCENARIOS[key]) { console.warn("Invalid scenario:",key); return; }
    current = key;
    const cfg = SCENARIOS[key];
    infoTitle.textContent = cfg.title;
    infoText.textContent = cfg.info;
    modelPathEl.textContent = cfg.model;

    if (audioEl) { audioEl.pause(); audioEl = null; }

    safeSetModel(cfg.model);

    // quick test: attempt HEAD request to check availability (same-origin)
    fetch(cfg.model, { method: 'HEAD' }).then(res => {
      if (!res.ok) {
        console.warn("Model HEAD returned", res.status, "showing fallback");
        showFallback(key);
        modelEntity.setAttribute('visible','false');
      } else {
        console.log("Model available:", cfg.model);
        hideAllFallbacks();
      }
    }).catch(err => {
      // network error -> show fallback
      console.warn("Model fetch error (will use fallback):", err);
      showFallback(key);
    });

    if (cfg.audio) {
      audioEl = new Audio(cfg.audio);
      audioEl.preload = 'auto';
      audioEl.loop = false;
      audioEl.volume = 0.85;
    }
  }

  function startAR() {
    console.log("Start AR clicked");
    if (enterBtn) enterBtn.style.display = 'none';
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => s.getTracks().forEach(t => t.stop()))
      .catch(err => console.warn('camera permission request failed', err));
  }

  function attachMarkerListeners() {
    if (!marker) { console.warn("Marker element missing (#hiro-marker)"); return; }
    marker.addEventListener('markerFound', () => {
      console.log('markerFound event');
      if (!current) {
        infoText.textContent = 'Select a scenario first.';
        return;
      }
      // Try to show model
      const hasModel = modelEntity && modelEntity.getAttribute('gltf-model');
      if (hasModel) {
        modelEntity.setAttribute('visible', 'true');
        hideAllFallbacks();
      } else {
        showFallback(current);
      }
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.warn('audio play prevented', e));
      }
    });

    marker.addEventListener('markerLost', () => {
      console.log('markerLost');
      if (modelEntity) modelEntity.setAttribute('visible','false');
      hideAllFallbacks();
      if (audioEl) audioEl.pause();
    });
  }

  // model-loaded to detect success
  if (modelEntity) {
    modelEntity.addEventListener('model-loaded', () => {
      console.log('GLB loaded successfully');
      hideAllFallbacks();
      modelEntity.setAttribute('visible','true');
    });
  }

  // wire UI
  uiButtons.forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const key = btn.getAttribute('data-scenario');
      console.log('scenario clicked', key);
      chooseScenario(key);
      uiButtons.forEach(b => b.style.opacity = (b === btn ? '1' : '0.8'));
    });
  });

  if (enterBtn) enterBtn.addEventListener('click', startAR);
  if (fullscreenBtn) fullscreenBtn.addEventListener('click', function () {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
  });

  window.addEventListener('load', () => {
    setTimeout(() => { attachMarkerListeners(); console.log("AR helpers ready"); }, 600);
    // auto-select flood by default to make testing quick
    chooseScenario('flood');
  });

})();
