// static/webxr/flood/app.js
// Use CDN module imports so the browser can resolve them directly:
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.154.0/examples/jsm/loaders/GLTFLoader.js';

(() => {
  // === Config ===
  const DEFAULT_LAT = 23.2599;
  const DEFAULT_LON = 77.4126;
  const AQI_ENDPOINT = "https://air-quality-api.open-meteo.com/v1/air-quality";
  const WEATHER_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

  // UI elements
  const arView = document.getElementById("ar-view");
  const enterBtn = document.getElementById("enter-ar");
  const placeBtn = document.getElementById("place-btn");
  const startBtn = document.getElementById("start-flood");
  const stopBtn = document.getElementById("stop-flood");
  const placeStatus = document.getElementById("place-status");
  const floodLevelEl = document.getElementById("flood-level");
  const hint = document.getElementById("hint");

  const aqiVal = document.getElementById("aqi-val");
  const aqiCat = document.getElementById("aqi-cat");
  const aqiAdvice = document.getElementById("aqi-advice");
  const aqiTime = document.getElementById("aqi-time");
  const refreshAqiBtn = document.getElementById("refresh-aqi");

  const tempVal = document.getElementById("temp-val");
  const tempDesc = document.getElementById("temp-desc");
  const tempAdvice = document.getElementById("temp-advice");
  const weatherTime = document.getElementById("weather-time");
  const refreshWeatherBtn = document.getElementById("refresh-weather");

  // model url (index.html should be in same folder as app.js or set data-model-url on #ar-view)
  const MODEL_URL = arView?.dataset?.modelUrl || "./models/house.glb";

  // === Three / WebXR state ===
  let renderer, scene, camera, controller;
  let reticle;
  let currentModel = null;
  let xrSession = null;
  let hitTestSource = null;
  let referenceSpace = null;
  let floodPlane = null;
  let floodAnimating = false;
  let floodHeight = 0;

  function setText(el, s) { if (el) el.textContent = s === null ? "—" : s; }

  // --- AQI helpers ---
  function categorizePM25(v) {
    if (v === null || v === undefined || isNaN(v)) return { cat: "Unavailable", color: "#777", advice: "AQI unavailable." };
    const x = v;
    if (x <= 12) return { cat: "Good", color: "#2e8b57", advice: "Air is good. Normal activities ok." };
    if (x <= 35.4) return { cat: "Moderate", color: "#ffd24a", advice: "Sensitive people: reduce prolonged outdoor exertion." };
    if (x <= 55.4) return { cat: "Unhealthy for Sensitive Groups", color: "#ff8c00", advice: "Sensitive groups should limit prolonged exertion." };
    if (x <= 150.4) return { cat: "Unhealthy", color: "#ff3e3e", advice: "Reduce outdoor activity." };
    if (x <= 250.4) return { cat: "Very Unhealthy", color: "#99004c", advice: "Avoid outdoor activity; keep windows closed." };
    return { cat: "Hazardous", color: "#6b0018", advice: "Serious health risk: stay indoors." };
  }

  async function fetchAQI(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    try {
      const url = `${AQI_ENDPOINT}?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5&timezone=auto`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("AQI fetch failed");
      const j = await r.json();
      const times = j?.hourly?.time || [];
      const pm25 = j?.hourly?.pm2_5 || [];
      const pm10 = j?.hourly?.pm10 || [];
      if (!pm25.length) return null;
      for (let i = pm25.length - 1; i >= 0; i--) {
        if (pm25[i] !== null && pm25[i] !== undefined) {
          return { pm25: Number(pm25[i]), pm10: (pm10[i] !== undefined ? Number(pm10[i]) : null), time: times[i] || new Date().toISOString() };
        }
      }
      return null;
    } catch (e) {
      console.warn("fetchAQI error", e);
      return null;
    }
  }

  function displayAQI(aqiObj) {
    if (!aqiObj) {
      setText(aqiVal, "--");
      setText(aqiCat, "—");
      if (aqiCat) aqiCat.style.color = "#777";
      setText(aqiAdvice, "AQI data not available.");
      setText(aqiTime, "—");
      return;
    }
    const cat = categorizePM25(aqiObj.pm25);
    setText(aqiVal, Math.round(aqiObj.pm25));
    setText(aqiCat, cat.cat);
    if (aqiCat) aqiCat.style.color = cat.color;
    setText(aqiAdvice, cat.advice);
    try { setText(aqiTime, new Date(aqiObj.time).toLocaleString()); } catch (e) { setText(aqiTime, aqiObj.time); }
  }

  // --- Weather helpers ---
  async function fetchWeather(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    try {
      const url = `${WEATHER_ENDPOINT}?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Weather fetch failed");
      const j = await r.json();
      return j?.current_weather ? { temp: j.current_weather.temperature, windspeed: j.current_weather.windspeed, time: j.current_weather.time } : null;
    } catch (e) {
      console.warn("fetchWeather error", e);
      return null;
    }
  }

  function displayWeather(w) {
    if (!w) {
      setText(tempVal, "--°C");
      setText(tempDesc, "—");
      setText(tempAdvice, "Weather data unavailable.");
      setText(weatherTime, "—");
      return;
    }
    setText(tempVal, `${Math.round(w.temp)}°C`);
    setText(tempDesc, `Wind: ${w.windspeed} km/h`);
    setText(weatherTime, new Date(w.time).toLocaleString ? new Date(w.time).toLocaleString() : w.time);
    const t = Number(w.temp);
    if (!Number.isFinite(t)) { setText(tempAdvice, "Temperature data missing."); return; }
    if (t >= 40) setText(tempAdvice, "Extreme heat — avoid outdoor activity; hydrate and stay cool.");
    else if (t >= 33) setText(tempAdvice, "Very hot — reduce strenuous activity during midday.");
    else if (t >= 25) setText(tempAdvice, "Warm — stay hydrated, avoid midday sun for long runs.");
    else if (t >= 16) setText(tempAdvice, "Mild — good for outdoor drills/exercises.");
    else if (t >= 0) setText(tempAdvice, "Cool — wear layers; good for brisk walks.");
    else setText(tempAdvice, "Cold weather — dress warmly and limit exposure.");
  }

  // --- Three & AR setup ---
  function initThree() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(arView.clientWidth, arView.clientHeight);
    renderer.xr.enabled = true;
    renderer.setClearColor(0x000000, 0);
    arView.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, arView.clientWidth / arView.clientHeight, 0.01, 20);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(0.5, 1, 0.25);
    scene.add(dir);

    const ringGeo = new THREE.RingGeometry(0.08, 0.12, 32).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00aaff, opacity: 0.9, transparent: true });
    reticle = new THREE.Mesh(ringGeo, mat);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const waterGeo = new THREE.PlaneGeometry(5, 5);
    const waterMat = new THREE.MeshPhongMaterial({ color: 0x3fa9f5, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    floodPlane = new THREE.Mesh(waterGeo, waterMat);
    floodPlane.rotation.x = -Math.PI / 2;
    floodPlane.visible = false;
    scene.add(floodPlane);

    controller = renderer.xr.getController(0);
    scene.add(controller);

    window.addEventListener("resize", onWindowResize);
  }

  function onWindowResize() {
    if (!renderer || !camera) return;
    camera.aspect = arView.clientWidth / arView.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(arView.clientWidth, arView.clientHeight);
  }

  function animate() { renderer.setAnimationLoop(render); }

  function render(timestamp, frame) {
    if (floodAnimating && floodPlane.visible) {
      floodHeight = Math.min(5.0, floodHeight + 0.01);
      floodPlane.position.y = floodHeight;
      floodLevelEl.textContent = `${floodHeight.toFixed(2)} m`;
    }
    // update reticle if hit test had been done inside frame loop (handled elsewhere)
    renderer.render(scene, camera);
  }

  async function loadModel(url) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(url, gltf => resolve(gltf.scene), undefined, err => reject(err));
    });
  }

  async function placeModelAtReticle() {
    if (!reticle || !reticle.visible) return;
    if (currentModel) {
      currentModel.position.setFromMatrixPosition(reticle.matrix);
      currentModel.quaternion.setFromRotationMatrix(reticle.matrix);
      placeStatus.textContent = "Moved";
      return;
    }
    try {
      placeStatus.textContent = "Loading model...";
      const model = await loadModel(MODEL_URL);
      model.scale.setScalar(0.6);
      model.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }});
      const pos = new THREE.Vector3();
      pos.setFromMatrixPosition(reticle.matrix);
      model.position.copy(pos);
      model.quaternion.setFromRotationMatrix(reticle.matrix);
      scene.add(model);
      currentModel = model;

      const bbox = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      floodPlane.scale.set(Math.max(1.5, size.x * 1.5), Math.max(1.5, size.z * 1.5), 1);
      floodPlane.position.set(pos.x, pos.y - 0.01, pos.z);
      floodPlane.visible = true;
      floodPlane.position.y = 0;
      floodHeight = 0;
      setText(floodLevelEl, `${floodHeight.toFixed(2)} m`);
      placeStatus.textContent = "Placed";
      startBtn.disabled = false;
      stopBtn.disabled = false;
    } catch (e) {
      console.warn("placeModelAtReticle error", e);
      placeStatus.textContent = "Place failed";
    }
  }

  // --- AR session + hit-test setup ---
  async function startXR() {
    if (!navigator.xr) { alert("WebXR not available on this device/browser."); return; }
    try {
      xrSession = await navigator.xr.requestSession("immersive-ar", { requiredFeatures: ["hit-test", "local-floor"] });
    } catch (e) {
      console.warn("requestSession failed:", e);
      alert("AR session start failed. Use Chrome on Android with WebXR support.");
      return;
    }

    renderer.xr.setSession(xrSession);
    referenceSpace = await xrSession.requestReferenceSpace("local-floor");
    const viewerSpace = await xrSession.requestReferenceSpace("viewer");
    hitTestSource = await xrSession.requestHitTestSource({ space: viewerSpace });

    xrSession.addEventListener("end", onSessionEnd);

    animate();
    setText(placeStatus, "Ready to place");
    hint.style.display = "block";
    placeBtn.disabled = false;
    enterBtn.disabled = true;

    const originalRender = render;
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame && hitTestSource && referenceSpace) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);
          if (pose) {
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
            hint.style.display = "none";
          } else {
            reticle.visible = false;
            hint.style.display = "";
          }
        } else {
          reticle.visible = false;
          hint.style.display = "";
        }
      }
      originalRender(timestamp, frame);
    });

    controller.addEventListener("select", () => { if (reticle && reticle.visible) placeModelAtReticle(); });
  }

  function onSessionEnd() {
    hitTestSource = null;
    referenceSpace = null;
    xrSession = null;
    placeBtn.disabled = true;
    startBtn.disabled = true;
    stopBtn.disabled = true;
    enterBtn.disabled = false;
    hint.style.display = "block";
    reticle.visible = false;
    renderer.setAnimationLoop(null);
  }

  function startFlood() { if (!currentModel || !floodPlane) return; floodAnimating = true; startBtn.disabled = true; stopBtn.disabled = false; }
  function stopFlood() { floodAnimating = false; startBtn.disabled = false; stopBtn.disabled = true; }

  function attachUI() {
    enterBtn?.addEventListener("click", async () => {
      enterBtn.disabled = true;
      try { await startXR(); } catch (e) { console.warn("startXR error", e); enterBtn.disabled = false; }
    });

    placeBtn?.addEventListener("click", async () => { await placeModelAtReticle(); });
    startBtn?.addEventListener("click", () => startFlood());
    stopBtn?.addEventListener("click", () => stopFlood());

    refreshAqiBtn?.addEventListener("click", async () => {
      setText(aqiVal, "…"); const coords = await getCoordsOrDefault(); const aqi = await fetchAQI(coords.lat, coords.lon); displayAQI(aqi);
    });

    refreshWeatherBtn?.addEventListener("click", async () => {
      setText(tempVal, "…"); const coords = await getCoordsOrDefault(); const w = await fetchWeather(coords.lat, coords.lon); displayWeather(w);
    });
  }

  async function getCoordsOrDefault() {
    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject("no-geolocation");
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });
      return { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch (e) { return { lat: DEFAULT_LAT, lon: DEFAULT_LON }; }
  }

  async function initialDataLoad() {
    const coords = await getCoordsOrDefault();
    const [aqi, w] = await Promise.all([fetchAQI(coords.lat, coords.lon), fetchWeather(coords.lat, coords.lon)]);
    displayAQI(aqi);
    displayWeather(w);
  }

  function bootstrap() {
    try {
      initThree();
      attachUI();
      initialDataLoad().catch(e => console.warn("initial data load failed", e));
      renderer.render(scene, camera);
    } catch (e) {
      console.error("bootstrap error", e);
      alert("Initialization error: check console for details.");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!arView) { console.error("No #ar-view element found"); return; }
    bootstrap();
  });
})();
