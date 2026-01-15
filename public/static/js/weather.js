// weather.js — robust, fallback-friendly
// 1) Put your OpenWeather API key here (optional). If not provided, code falls back to Open-Meteo (no key).
// 2) This file immediately defines window.fetchWeather so the button will never throw "not defined".

/* ========= CONFIG ========= */
const OPENWEATHER_API_KEY = ""; // <-- put your OpenWeather key here (optional)
const DEFAULT_LAT = 23.2599;
const DEFAULT_LON = 77.4126;
const CACHE_KEY = "safesphere_weather_cache_v2";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes



/* ======= SAFETY: define stub immediately so onclick won't fail ======= */
window.fetchWeather = async function (force = false) {
  // temporary safe no-op until real implementation loads/overrides
  console.warn("fetchWeather called before weather.js initialization finished.");
  const errEl = document.getElementById("weather-error");
  if (errEl) errEl.textContent = "Updating...";

  // If the real implementation hasn't loaded within 1s, try to reload the page
  setTimeout(() => {
    if (window.__weather_initialized !== true) {
      console.warn("weather.js initialization delayed — reloading to recover.");
      // don't forcibly reload during dev; comment out if unwanted:
      // location.reload();
    }
  }, 1000);
};

/* ======= Helper DOM funcs ======= */
function $id(id) { return document.getElementById(id); }
function nowStr() { return new Date().toLocaleString(); }
function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch(e) {}
}
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj.ts || !obj.data) return null;
    if (Date.now() - obj.ts > CACHE_TTL) return null;
    return obj.data;
  } catch(e) { return null; }
}

/* ======= Normalizer: make a unified "weather-like" object for updateUI ======= */
function normalizeOpenWeather(obj) {
  // obj is the OpenWeather response
  return {
    ok: obj && obj.cod === 200,
    name: obj.name || `${obj.sys?.country || ""}`,
    coord: obj.coord || null,
    main: obj.main || {},
    weather: obj.weather || [{ description: "N/A", icon: null }],
    wind: obj.wind || {},
    raw: obj
  };
}

function normalizeOpenMeteo(obj, lat, lon) {
  // open-meteo current_weather: {temperature, windspeed, winddirection, time}
  const cw = obj?.current_weather || null;
  return {
    ok: !!cw,
    name: `Lat:${lat.toFixed(3)}, Lon:${lon.toFixed(3)}`,
    coord: { lat, lon },
    main: { temp: cw ? cw.temperature : null, feels_like: null, humidity: null },
    weather: [{ description: cw ? "Current conditions" : "Unknown", icon: null }],
    wind: { speed: cw ? cw.windspeed : null },
    raw: obj
  };
}

/* ======= UI updater ======= */
function updateUI(data) {
  if (!data) {
    if ($id("weather-location")) $id("weather-location").innerText = "Weather unavailable";
    if ($id("weather-error")) $id("weather-error").innerText = "No data";
    return;
  }

  const name = data.name || "Unknown location";
  const temp = data.main?.temp ?? "--";
  const desc = (data.weather && data.weather[0]?.description) || "—";
  const wind = data.wind?.speed ?? "—";
  const feels = data.main?.feels_like ?? "—";
  const humidity = data.main?.humidity ?? "—";

  if ($id("weather-location")) $id("weather-location").innerText = name;
  if ($id("weather-temp")) $id("weather-temp").innerText = (temp === null ? "--°C" : `${Math.round(temp)}°C`);
  if ($id("weather-desc")) $id("weather-desc").innerText = desc;
  if ($id("weather-wind")) $id("weather-wind").innerText = `Wind: ${wind} m/s`;
  if ($id("weather-feels")) $id("weather-feels").innerText = (feels === null ? "—" : `${Math.round(feels)}°C`);
  if ($id("weather-humidity")) $id("weather-humidity").innerText = (humidity === null ? "—" : `${humidity}%`);
  if ($id("weather-updated")) $id("weather-updated").innerText = nowStr();

  // ✅ SAFETY GUIDANCE (CORRECT PLACE)
  if (typeof updateSafetyGuidance === "function") {
    if (Number.isFinite(temp) && Number.isFinite(wind)) {
      updateSafetyGuidance(temp, wind);
    } else {
      const box = document.getElementById("safety-text");
      if (box) box.innerText = "⚠️ Safety guidance unavailable (invalid data).";
    }
  }

  // icon if available
  if ($id("weather-icon")) {
    const icon = data.weather?.[0]?.icon;
    if (icon) {
      $id("weather-icon").innerHTML = `<img alt="${desc}" src="https://openweathermap.org/img/wn/${icon}@2x.png" style="width:48px;height:48px">`;
    } else {
      // keep simple text/icon
      $id("weather-icon").textContent = "⛅";
    }
  }

  // clear error
  if ($id("weather-error")) $id("weather-error").textContent = "";

  // notify map
  if (data.coord && data.coord.lat && data.coord.lon) {
    window.latestWeatherCoords = { lat: parseFloat(data.coord.lat), lon: parseFloat(data.coord.lon) };
    document.dispatchEvent(new CustomEvent("weather:updated", { detail: window.latestWeatherCoords }));
  }
}

/* ======= Fetch helpers ======= */
async function fetchOpenWeather(lat, lon) {
  if (!OPENWEATHER_API_KEY) throw new Error("No OpenWeather key configured");
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text().catch(()=>"");
    throw new Error(`OpenWeather failed: ${r.status} ${text}`);
  }
  const j = await r.json();
  return normalizeOpenWeather(j);
}

async function fetchOpenMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Open-Meteo failed");
  const j = await r.json();
  return normalizeOpenMeteo(j, lat, lon);
}

/* ======= Main obtainWeather flow ======= */
async function obtainWeather(force = false) {
  // try cache
  if (!force) {
    const cached = loadCache();
    if (cached) {
      console.log("weather.js: using cache");
      updateUI(cached);
      return cached;
    }
  }

  let lat = DEFAULT_LAT, lon = DEFAULT_LON;
  // try geolocation
  try {
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("no-geolocation");
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
    });
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    console.log("weather.js: geolocation success", lat, lon);
  } catch (e) {
    console.warn("weather.js: geolocation failed, using defaults.", e);
  }

  // try OpenWeather first (if key provided), otherwise Open-Meteo
  try {
    let normalized;
    if (OPENWEATHER_API_KEY) {
      try {
        normalized = await fetchOpenWeather(lat, lon);
        console.log("weather.js: fetched from OpenWeather");
      } catch (owErr) {
        console.warn("OpenWeather failed, falling back to Open-Meteo:", owErr);
        normalized = await fetchOpenMeteo(lat, lon);
      }
    } else {
      // no key -> directly use open-meteo
      normalized = await fetchOpenMeteo(lat, lon);
      console.log("weather.js: fetched from Open-Meteo (no key)");
    }

    if (normalized && normalized.ok !== false) {
      saveCache(normalized);
      updateUI(normalized);
      return normalized;
    } else {
      throw new Error("No valid weather payload");
    }
  } catch (err) {
    console.error("weather.js: obtainWeather error:", err);
    if ($id("weather-error")) $id("weather-error").textContent = "⚠ Could not fetch weather. Try refresh or check network.";
    // still update UI with some fallback text
    updateUI(null);
    return null;
  }
}

/* ======= Bootstrap ======= */
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("✅ weather.js loaded successfully");
    // override the safe stub with the real function
    window.fetchWeather = async function (force = false) {
      // small UI feedback
      if ($id("weather-updated")) $id("weather-updated").textContent = "Updating...";
      await obtainWeather(force);
    };

    // mark initialized
    window.__weather_initialized = true;

    // auto-run
    window.fetchWeather(false).catch(e => {
      console.warn("Initial weather fetch failed:", e);
    });
  } catch (e) {
    console.error("weather.js initialization error:", e);
    // keep stub in place so onclick won't throw
    if ($id("weather-error")) $id("weather-error").textContent = "Initialization error";
  }
});

function updateSafetyGuidance(temp, wind) {
  // temp = Celsius number, wind = either m/s or km/h (we try to detect & normalize to km/h)
  const box = document.getElementById("safety-text");
  if (!box) return;

  // helper to render an array as a bullet list
  function makeList(arr) {
    return '<ul style="margin:6px 0 0 18px;padding:0;">' + arr.map(i => `<li style="margin:6px 0">${i}</li>`).join('') + '</ul>';
  }

  // --- Normalize inputs ---
  const tempNum = (temp === null || temp === undefined) ? NaN : Number(temp);
  let windNum = (wind === null || wind === undefined) ? NaN : Number(wind);

  // Heuristic to decide unit:
  // - OpenWeather gives wind in m/s (typical values 0-30)
  // - Open-Meteo gives wind in km/h (typical values 0-100)
  // If windNum <= 25 => likely m/s, convert to km/h (x3.6). If >25 assume it's already km/h.
  // This heuristic works well in practice for mixed sources.
  let windKmh = NaN;
  if (!Number.isFinite(windNum)) {
    windKmh = NaN;
  } else if (windNum <= 25) {
    windKmh = Math.round(windNum * 3.6); // assume m/s -> km/h
  } else {
    windKmh = Math.round(windNum); // assume already km/h
  }

  // fallback defaults for display if missing
  const tempForLogic = Number.isFinite(tempNum) ? tempNum : null;
  const windForLogic = Number.isFinite(windKmh) ? windKmh : null;

  const advice = [];
  const details = [];

  // TEMPERATURE-BASED GUIDANCE (kept all original messages)
  if (tempForLogic !== null && tempForLogic >= 40) {
    advice.push("🔥 Extreme heat: Avoid outdoor activity, stay hydrated, and seek cool shaded/air-conditioned places.");
    details.push(
      "Limit outdoor work between 11:00–16:00.",
      "Drink water regularly (even before feeling thirsty).",
      "Wear light, loose, breathable clothing and a hat.",
      "Use sunscreen (SPF 30+) on exposed skin.",
      "Recognize heat exhaustion: headache, nausea, dizziness — rest immediately.",
      "Avoid heavy meals & alcohol during peak heat.",
      "Cool towels or showers help lower body temperature.",
      "Keep vulnerable people (elderly, infants) in cool places.",
      "Have a fan or cooling plan; seek medical help if needed.",
      "Never leave anyone in a parked vehicle."
    );
  } else if (tempForLogic !== null && tempForLogic >= 33) {
    advice.push("🔥 Very hot: Reduce strenuous activity, hydrate frequently, and seek shade during peak sun.");
    details.push(
      "Reduce exercise intensity; move workouts to early morning/evening.",
      "Hydrate and replace electrolytes if sweating heavily.",
      "Wear UV-protective clothing and sunglasses.",
      "Check on neighbors who may be vulnerable."
    );
  } else if (tempForLogic !== null && tempForLogic >= 25) {
    advice.push("🌤 Warm (good for jogging/walks): stay hydrated and avoid the midday sun for long runs.");
    details.push(
      "Best activities: jogging, brisk walking, outdoor sports (avoid midday if sunny).",
      "Wear breathable activewear, keep water with you.",
      "Take short rest breaks to cool down."
    );
  } else if (tempForLogic !== null && tempForLogic >= 16) {
    advice.push("🙂 Mild/pleasant (great for outdoor exercise): jogging, cycling, long walks are fine.");
    details.push(
      "Recommended: jogging, walking, cycling, outdoor drills.",
      "Light warm-up and cool-down to prevent muscle strain."
    );
  } else if (tempForLogic !== null && tempForLogic >= 11) {
    advice.push("🧥 Cool: Wear light layers; consider a warm jacket for longer outdoor sessions.");
    details.push(
      "Layer clothing so you can remove layers as you warm up.",
      "Good for brisk walks and moderate exercise with a light jacket."
    );
  } else if (tempForLogic !== null && tempForLogic >= 0) {
    advice.push("❄ Cold: Dress warmly and limit exposure — wind can make it feel much colder.");
    // Ten specific safety precautions for cold (user requested)
    details.push(
      "Layer clothing (base thermal + insulating mid-layer + windproof outer).",
      "Cover head, hands, and feet — extremities lose heat fast.",
      "Keep clothing dry (wet clothes lose insulation).",
      "Stay active to maintain circulation, but avoid sweating heavily.",
      "Eat warm, high-energy foods and drink warm fluids (no alcohol).",
      "Carry emergency blanket / warm pack if going far from shelter.",
      "Insulate sleeping/bedding if overnight (use closed cells or foam).",
      "Use safe heating sources and ensure ventilation (avoid CO risk).",
      "Check on vulnerable people (elderly, infants) frequently.",
      "Know hypothermia signs: shivering, slurred speech, confusion — seek help."
    );
  } else if (tempForLogic !== null) { // temp < 0
    advice.push("❄ Severe cold: Minimize outdoor time, extreme precautions required.");
    details.push(
      "All cold precautions above PLUS:",
      "Limit time outdoors to short, essential tasks only.",
      "Watch for frostbite on exposed skin (numbness, white/gray skin).",
      "Have a communication plan and emergency kit (food, water, warm clothing)."
    );
  } else {
    // temp unknown: provide neutral suggestion
    advice.push("ℹ️ Temperature data unavailable — follow local common-sense precautions.");
    details.push("If unsure, dress in layers and avoid prolonged exposure until conditions are known.");
  }

  // WIND-BASED ADVICE (appended to temperature guidance) — kept original messages
  if (windForLogic !== null && windForLogic >= 80) {
    advice.push("🌬️ Very severe winds (>=80 km/h): Danger — avoid outdoors, stay in sturdy shelter.");
  } else if (windForLogic !== null && windForLogic >= 60) {
    advice.push("🌪 Very strong winds (60–79 km/h): Secure loose objects, avoid travel if possible.");
  } else if (windForLogic !== null && windForLogic >= 40) {
    advice.push("💨 Strong winds (40–59 km/h): Avoid open areas and unsecured structures.");
  } else if (windForLogic !== null && windForLogic >= 20) {
    advice.push("🌬 Breezy (20–39 km/h): Caution for bikes, light debris possible.");
  } else if (windForLogic !== null) {
    advice.push("🍃 Light winds: no special wind safety required.");
  } else {
    // wind unknown
    advice.push("ℹ️ Wind data unavailable.");
  }

  // Compose output
  // Primary short advice (first 2 items)
  const topAdvice = advice.slice(0, 2).join(" — ");
  let html = `<strong>${topAdvice}</strong><br>`;

  // Additional bulleted details for clarity (show up to 10)
  if (details.length) {
    html += makeList(details.slice(0, 10));
  }

  // Add explicit wind number if available
  if (windForLogic !== null) {
    html += `<div style="margin-top:8px;font-size:0.92rem;color:#333"><em>Wind: ${windForLogic} km/h</em></div>`;
  }

  // Add temperature readout if available
  if (tempForLogic !== null) {
    html += `<div style="margin-top:6px;font-size:0.92rem;color:#333"><em>Temp: ${Math.round(tempForLogic)}°C</em></div>`;
  }

  // Small note if units were guessed
  if (Number.isFinite(windNum) && windNum <= 25) {
    html += `<div style="margin-top:6px;font-size:0.85rem;color:#666">Note: wind value interpreted as m/s and converted to km/h.</div>`;
  }

  box.innerHTML = html;
}
