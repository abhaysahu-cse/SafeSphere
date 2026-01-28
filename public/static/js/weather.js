// weather.js - full-featured Weather + AQI + Pupil-focused recommendations
// Supports: Open-Meteo (weather) + Open-Meteo (air-quality) by default.
// Optional: Put your OpenWeather API key if you prefer OpenWeather for weather.

// =================== CONFIG ===================
const OPENWEATHER_API_KEY = ""; // <-- optional: add key to use OpenWeather first
const DEFAULT_LAT = 23.2599;   // default (Bhopal) if geolocation blocked
const DEFAULT_LON = 77.4126;
const CACHE_KEY = "safesphere_weather_cache_v3";
const AQI_CACHE_KEY = "safesphere_aqi_cache_v3";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// =================== SAFE STUBS ===================
// Expose safe stubs immediately so any inline onClick won't throw while JS loads.
window.fetchWeather = window.fetchWeather || (async function (force = false) {
  console.warn("fetchWeather called before initialization finished.");
  const el = document.getElementById("weather-error");
  if (el) el.textContent = "Starting update...";
});
window.fetchAQIForCurrent = window.fetchAQIForCurrent || (async function (force = false) {
  console.warn("fetchAQIForCurrent called before initialization finished.");
  const el = document.getElementById("aqi-updated");
  if (el) el.textContent = "Updating...";
});

// =================== HELPERS ===================
function $id(id) { return document.getElementById(id); }
function nowStr() { return new Date().toLocaleString(); }
function safeJSONParse(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }
function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch (e) { /* ignore */ }
}
function loadCacheKey(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = safeJSONParse(raw);
    if (!obj || !obj.ts || !obj.data) return null;
    if (Date.now() - obj.ts > CACHE_TTL) return null;
    return obj.data;
  } catch (e) { return null; }
}

// =================== NORMALIZERS ===================
function normalizeOpenWeather(obj) {
  // If you enable OPENWEATHER_API_KEY and fetch /weather, this normalizer maps fields.
  return {
    ok: obj && (obj.cod === 200 || obj.cod === "200" || obj.cod === undefined),
    name: obj.name || `${obj.sys?.country || ""}`,
    coord: obj.coord || null,
    main: obj.main || {},
    weather: obj.weather || [{ description: "N/A", icon: null }],
    wind: obj.wind || {},
    raw: obj
  };
}
function normalizeOpenMeteo(obj, lat, lon) {
  const cw = obj?.current_weather || null;
  return {
    ok: !!cw,
    name: obj?.timezone || `Lat:${lat.toFixed(3)}, Lon:${lon.toFixed(3)}`,
    coord: { lat, lon },
    main: { temp: cw ? cw.temperature : null, feels_like: null, humidity: null },
    weather: [{ description: cw ? "Current conditions" : "Unknown", icon: null }],
    wind: { speed: cw ? cw.windspeed : null },
    raw: obj
  };
}

// =================== UI UPDATE HELPERS ===================
function updateWeatherUI(data) {
  if (!data) {
    if ($id("weather-location")) $id("weather-location").innerText = "Weather unavailable";
    if ($id("weather-temp")) $id("weather-temp").innerText = "--°C";
    if ($id("weather-desc")) $id("weather-desc").innerText = "—";
    if ($id("weather-wind")) $id("weather-wind").innerText = "—";
    if ($id("weather-feels")) $id("weather-feels").innerText = "—";
    if ($id("weather-humidity")) $id("weather-humidity").innerText = "—";
    if ($id("weather-updated")) $id("weather-updated").innerText = "—";
    if ($id("weather-error")) $id("weather-error").innerText = "No weather data available.";
    return;
  }

  const name = data.name || "Unknown location";
  const temp = data.main?.temp ?? null;
  const desc = (data.weather && data.weather[0]?.description) || "—";
  const wind = data.wind?.speed ?? null;
  const feels = data.main?.feels_like ?? null;
  const humidity = data.main?.humidity ?? null;

  if ($id("weather-location")) $id("weather-location").innerText = name;
  if ($id("weather-temp")) $id("weather-temp").innerText = (temp === null ? "--°C" : `${Math.round(temp)}°C`);
  if ($id("weather-desc")) $id("weather-desc").innerText = desc;
  if ($id("weather-wind")) $id("weather-wind").innerText = (wind === null ? "—" : `${wind} m/s`);
  if ($id("weather-feels")) $id("weather-feels").innerText = (feels === null ? "—" : `${Math.round(feels)}°C`);
  if ($id("weather-humidity")) $id("weather-humidity").innerText = (humidity === null ? "—" : `${humidity}%`);
  if ($id("weather-updated")) $id("weather-updated").innerText = nowStr();
  if ($id("weather-error")) $id("weather-error").innerText = "";

  // icon (openweathermap style if present)
  if ($id("weather-icon")) {
    const icon = data.weather?.[0]?.icon;
    if (icon) {
      $id("weather-icon").innerHTML = `<img alt="${desc}" src="https://openweathermap.org/img/wn/${icon}@2x.png" style="width:64px;height:64px">`;
    } else {
      $id("weather-icon").textContent = "⛅";
    }
  }

  // store coords for AQI fetching
  if (data.coord && (data.coord.lat !== undefined) && (data.coord.lon !== undefined)) {
    window.latestWeatherCoords = { lat: Number(data.coord.lat), lon: Number(data.coord.lon) };
    // notify listeners
    document.dispatchEvent(new CustomEvent("weather:updated", { detail: window.latestWeatherCoords }));
  }
}

// =================== AQI HANDLING ===================
function categorizePM25(pm25) {
  if (pm25 === null || pm25 === undefined || isNaN(pm25)) {
    return { cat: "Unknown", color: "#777", health: "AQI data unavailable." };
  }
  const v = Number(pm25);
  if (v <= 12.0) return { cat: "Good", color: "#2e8b57", health: "Air is clean." };
  if (v <= 35.4) return { cat: "Moderate", color: "#ffd24a", health: "Sensitive people: reduce prolonged outdoor exertion." };
  if (v <= 55.4) return { cat: "Unhealthy for Sensitive Groups", color: "#ff8c00", health: "Sensitive groups should limit prolonged outdoor exertion." };
  if (v <= 150.4) return { cat: "Unhealthy", color: "#ff3e3e", health: "Reduce outdoor activity; consider masks if sensitive." };
  if (v <= 250.4) return { cat: "Very Unhealthy", color: "#99004c", health: "Avoid outdoor activity; keep windows closed; use filtration if possible." };
  return { cat: "Hazardous", color: "#6b0018", health: "Serious health risk. Stay indoors; seek medical help if symptoms appear." };
}
function updateAQIUI(aqiObj) {
  const valueEl = $id("aqi-value");
  const categoryEl = $id("aqi-category");
  const pm25El = $id("aqi-pm25");
  const pm10El = $id("aqi-pm10");
  const healthEl = $id("aqi-health");
  const updatedEl = $id("aqi-updated");

  if (!aqiObj) {
    if (valueEl) valueEl.innerText = "--";
    if (categoryEl) { categoryEl.innerText = "Unavailable"; categoryEl.style.color = "#777"; }
    if (pm25El) pm25El.innerText = "—";
    if (pm10El) pm10El.innerText = "—";
    if (healthEl) healthEl.innerText = "AQI data not available for your location.";
    if (updatedEl) updatedEl.innerText = "—";
    return;
  }

  const pm25 = aqiObj.pm25;
  const pm10 = aqiObj.pm10;
  const time = aqiObj.time || new Date().toISOString();
  const cat = categorizePM25(pm25);

  if (valueEl) valueEl.innerText = Number.isFinite(pm25) ? Math.round(pm25) : "--";
  if (categoryEl) { categoryEl.innerText = cat.cat; categoryEl.style.color = cat.color; }
  if (pm25El) pm25El.innerText = Number.isFinite(pm25) ? Math.round(pm25) : "—";
  if (pm10El) pm10El.innerText = Number.isFinite(pm10) ? Math.round(pm10) : "—";
  if (healthEl) healthEl.innerText = cat.health;
  if (updatedEl) {
    try { updatedEl.innerText = (new Date(time)).toLocaleString(); } catch (e) { updatedEl.innerText = nowStr(); }
  }
}

// =================== TEMPERATURE-BASED GUIDANCE ===================
// Returns { title, bullets[] } tailored for pupils/students
function tempGuidanceCelsius(tempC) {
  // tempC is a number (Celsius). If not finite, return neutral.
  if (!Number.isFinite(tempC)) {
    return {
      title: "Temperature unknown",
      bullets: ["Temperature data unavailable — follow standard common-sense precautions: hydrate, dress in layers, and supervise outdoor activities carefully."]
    };
  }

  const t = Math.round(tempC);
  // Guidance tailored for students/pupils and school activities
  if (t <= -10) {
    return {
      title: "Extreme Cold (≤ -10°C)",
      bullets: [
        "Cancel outdoor drills, keep students indoors.",
        "Ensure warm clothing (thermal layers, hats, gloves) and warm drinks.",
        "Check heating in classrooms and avoid prolonged exposure.",
        "Watch for hypothermia signs (shivering, confusion) and move affected students to warmth immediately."
      ]
    };
  }
  if (t <= 0) {
    return {
      title: "Severe Cold (0°C or below)",
      bullets: [
        "Move outdoor activities indoors. Minimize exposure outside.",
        "Students should wear warm layers and waterproof outer garments.",
        "Provide warm fluids; avoid cold packed meals.",
        "Monitor vulnerable students (young, medical conditions) closely."
      ]
    };
  }
  if (t <= 10) {
    return {
      title: "Cold (1–10°C)",
      bullets: [
        "Limit long outdoor drills; prefer short supervised sessions.",
        "Students should wear jackets, hats, and warm footwear.",
        "Encourage light warm-ups before physical activities to prevent strains.",
        "Provide warm breaks inside and warm refreshments as needed."
      ]
    };
  }
  if (t <= 16) {
    return {
      title: "Cool (11–16°C)",
      bullets: [
        "Suitable for most outdoor physical activities with light layers.",
        "Ensure students can remove layers if they warm up during activity.",
        "Keep a quick indoor warm-up plan for any prolonged outdoor event."
      ]
    };
  }
  if (t <= 22) {
    return {
      title: "Mild / Pleasant (17–22°C)",
      bullets: [
        "Excellent for outdoor drills, PE, and games. Hydration recommended.",
        "Avoid intense activity in direct sun for long periods; schedule breaks.",
        "Encourage light warm-up and cool-down to prevent injuries."
      ]
    };
  }
  if (t <= 28) {
    return {
      title: "Warm (23–28°C)",
      bullets: [
        "Good for outdoor training; increase water breaks and shade periods.",
        "Schedule strenuous drills in morning or late afternoon, avoid midday heat.",
        "Students should wear breathable clothing and hats."
      ]
    };
  }
  if (t <= 34) {
    return {
      title: "Hot (29–34°C)",
      bullets: [
        "Limit prolonged intense exercise; prefer low-intensity drills.",
        "Increase water/electrolyte breaks every 15–20 minutes.",
        "Watch for heat exhaustion signs (dizziness, headache); move affected students to shade & cool them."
      ]
    };
  }
  if (t <= 40) {
    return {
      title: "Very Hot (35–40°C)",
      bullets: [
        "Cancel strenuous outdoor drills; keep students indoors in cool areas.",
        "If outdoor presence is necessary, shorten sessions drastically and keep constant hydration.",
        "Consider rescheduling heavy activities to cooler days/times."
      ]
    };
  }
  // >40
  return {
    title: "Extreme Heat (>40°C)",
    bullets: [
      "Stop all outdoor activities; maintain indoor cooling and hydration.",
      "Use air-conditioned or shaded safe rooms; monitor students continuously.",
      "Seek medical help immediately for anyone showing severe heat illness signs."
    ]
  };
}

// =================== COMBINED GUIDANCE (Weather + AQI) ===================
// This function decides final message for pupils by merging temperature guidance and AQI guidance.
// It returns HTML string to insert into safety-text container.
function combinedSafetyHtml(tempC, windKmhOrMs, aqiObj) {
  // Normalize wind to km/h for human readable (if wind seems small assume m/s convert *3.6)
  let windNum = Number(windKmhOrMs);
  if (Number.isFinite(windNum)) {
    if (windNum <= 25) windNum = Math.round(windNum * 3.6); // treat as m/s -> km/h
    else windNum = Math.round(windNum); // treat as km/h already
  } else {
    windNum = null;
  }

  // Temperature guidance
  const tempBlock = tempGuidanceCelsius(tempC);

  // AQI guidance
  let aqiBlock;
  if (!aqiObj || !Number.isFinite(aqiObj.pm25)) {
    aqiBlock = {
      title: "Air quality: Unknown",
      bullets: ["AQI data unavailable. If local alerts say air pollution is high, reduce outdoor activity and use masks for vulnerable students."]
    };
  } else {
    const cat = categorizePM25(aqiObj.pm25);
    // Pupils-specific advice by AQI category
    switch (cat.cat) {
      case "Good":
        aqiBlock = {
          title: "Air quality: Good",
          bullets: ["Air quality is good. Normal outdoor activities are safe for all pupils.", "No special precautions required."]
        };
        break;
      case "Moderate":
        aqiBlock = {
          title: "Air quality: Moderate",
          bullets: ["Air quality is acceptable for most pupils.", "Unusually sensitive students (asthma, severe allergies) should consider reducing prolonged outdoor exertion."]
        };
        break;
      case "Unhealthy for Sensitive Groups":
        aqiBlock = {
          title: "Air quality: Unhealthy for Sensitive Groups",
          bullets: ["Sensitive pupils (asthma, respiratory/cardiac conditions) should avoid prolonged outdoor exertion.", "Consider smaller groups outdoors and provide masks if available."]
        };
        break;
      case "Unhealthy":
        aqiBlock = {
          title: "Air quality: Unhealthy",
          bullets: ["Reduce outdoor activities for all pupils; postpone strenuous drills.", "Keep windows closed in classrooms if outside air is dusty; run indoor air filtration if available."]
        };
        break;
      case "Very Unhealthy":
        aqiBlock = {
          title: "Air quality: Very Unhealthy",
          bullets: ["Avoid outdoor activity; keep pupils indoors.", "Use masks (N95) for essential movements outside; arrange indoor activities instead."]
        };
        break;
      case "Hazardous":
        aqiBlock = {
          title: "Air quality: Hazardous",
          bullets: ["Serious health risk — keep everyone indoors and avoid physical exertion.", "If symptoms occur (wheezing, chest pain), seek medical attention immediately."]
        };
        break;
      default:
        aqiBlock = {
          title: "Air quality: Unknown",
          bullets: ["AQI category unclear — when in doubt limit outdoor exertion for vulnerable pupils."]
        };
    }
  }

  // Combine and pick stricter actions:
  // Strategy: If AQI suggests "Avoid outdoor activity" or temp suggests "Cancel outdoor", pick highest restriction.
  const restrictionPriority = { "Unknown": 0, "Good": 1, "Moderate": 2, "Unhealthy for Sensitive Groups": 3, "Unhealthy": 4, "Very Unhealthy": 5, "Hazardous": 6 };
  const aqCat = (aqiObj && Number.isFinite(aqiObj.pm25)) ? categorizePM25(aqiObj.pm25).cat : "Unknown";
  const aqPriority = restrictionPriority[aqCat] ?? 0;

  // From temp guidance, set a numeric priority (rough):
  let tempPriority = 1;
  if (!Number.isFinite(tempC)) tempPriority = 1;
  else if (tempC <= 0) tempPriority = 5;
  else if (tempC <= 10) tempPriority = 3;
  else if (tempC <= 22) tempPriority = 1;
  else if (tempC <= 34) tempPriority = 2;
  else if (tempC <= 40) tempPriority = 4;
  else tempPriority = 5;

  // Decide final note — pick more restrictive from AQI vs Temp
  const finalPriority = Math.max(aqPriority, tempPriority);

  // Build an HTML block with: headline, top-line combined advice, then breakdown with temp + AQI details and bullets
  let topLine = "";
  if (finalPriority >= 5) {
    topLine = "🚨 High risk: Cancel or move outdoor activities indoors. Follow strict precautions.";
  } else if (finalPriority >= 4) {
    topLine = "⚠️ Very cautious: Avoid intense outdoor activity; prioritize indoor activities.";
  } else if (finalPriority >= 3) {
    topLine = "⚠️ Caution: Limit prolonged outdoor exertion for sensitive pupils.";
  } else {
    topLine = "✅ Conditions acceptable: Normal supervised outdoor activities permitted with standard precautions.";
  }

  // Compose lists (merge both bullet arrays but emphasize the higher-priority items)
  const combinedBullets = [];
  // If AQI is severe (priority >=4), include AQI bullets first
  if (aqPriority >= tempPriority) {
    (aqiBlock.bullets || []).forEach(b => combinedBullets.push({ source: "AQI", text: b }));
    (tempBlock.bullets || []).forEach(b => combinedBullets.push({ source: "Temp", text: b }));
  } else {
    (tempBlock.bullets || []).forEach(b => combinedBullets.push({ source: "Temp", text: b }));
    (aqiBlock.bullets || []).forEach(b => combinedBullets.push({ source: "AQI", text: b }));
  }

  // Helper to render bullets as HTML
  function bulletsHtml(list) {
    if (!list || !list.length) return "";
    return `<ul style="margin:8px 0 0 18px;padding:0;">` +
      list.map(item => `<li style="margin:6px 0;line-height:1.45">${escapeHtml(item.text)}</li>`).join("") +
      `</ul>`;
  }

  // Small info lines with numeric readout
  const tempLine = Number.isFinite(tempC) ? `Temp: ${Math.round(tempC)}°C` : "Temp: —";
  const windLine = (windNum !== null) ? `Wind: ${windNum} km/h` : "Wind: —";
  const aqiLine = (aqiObj && Number.isFinite(aqiObj.pm25)) ? `PM2.5: ${Math.round(aqiObj.pm25)} µg/m³` : "PM2.5: —";

  // Build final HTML
  const html = `
    <div style="font-size:0.98rem;">
      <strong style="display:block;margin-bottom:8px;">${topLine}</strong>
      <div style="font-size:0.95rem;color:#333;margin-bottom:6px;">
        <em>${escapeHtml(tempBlock.title)} • ${escapeHtml(aqiBlock.title)}</em>
      </div>
      ${bulletsHtml(combinedBullets)}
      <div style="margin-top:10px;font-size:0.90rem;color:#444">
        <div style="margin-top:6px;"><strong>Quick readouts:</strong> ${escapeHtml(tempLine)} · ${escapeHtml(windLine)} · ${escapeHtml(aqiLine)}</div>
      </div>
    </div>
  `;
  return html;
}

// small helper to escape HTML
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// Update safety guidance DOM element
function updateSafetyGuidance(tempC, windRaw, aqiObj) {
  const box = $id("safety-text");
  if (!box) return;
  try {
    const html = combinedSafetyHtml(tempC, windRaw, aqiObj);
    box.innerHTML = html;
  } catch (e) {
    console.warn("updateSafetyGuidance error:", e);
    box.innerText = "Safety guidance unavailable.";
  }
}

// =================== FETCH IMPLEMENTATIONS ===================
async function fetchOpenWeather(lat, lon) {
  if (!OPENWEATHER_API_KEY) throw new Error("No OpenWeather key configured");
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OpenWeather failed: ${r.status}`);
  const j = await r.json();
  return normalizeOpenWeather(j);
}
async function fetchOpenMeteoWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Open-Meteo weather failed");
  const j = await r.json();
  return normalizeOpenMeteo(j, lat, lon);
}

// Open-Meteo Air Quality endpoint (hourly pm2_5 and pm10)
async function fetchAQI(lat, lon) {
  try {
    const endpoint = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5&timezone=auto`;
    const r = await fetch(endpoint);
    if (!r.ok) throw new Error("Air-quality API failed");
    const j = await r.json();
    const times = j?.hourly?.time || [];
    const pm25Arr = j?.hourly?.pm2_5 || [];
    const pm10Arr = j?.hourly?.pm10 || [];

    if (!pm25Arr.length || !times.length) return null;
    // find last non-null sample
    for (let i = pm25Arr.length - 1; i >= 0; --i) {
      const val = pm25Arr[i];
      if (val !== null && val !== undefined) {
        const time = times[i] || new Date().toISOString();
        const pm10v = (pm10Arr && pm10Arr[i] !== undefined) ? pm10Arr[i] : null;
        return { pm25: Number(val), pm10: (pm10v === null ? null : Number(pm10v)), time };
      }
    }
    return null;
  } catch (e) {
    console.warn("fetchAQI error:", e);
    return null;
  }
}

// Public AQI wrapper (exposed)
async function fetchAQIForCurrentImpl(force = false) {
  try {
    const coords = window.latestWeatherCoords || { lat: DEFAULT_LAT, lon: DEFAULT_LON };
    const cached = loadCacheKey(AQI_CACHE_KEY);
    if (!force && cached) {
      updateAQIUI(cached);
      // update safety guidance using cached + cached weather (if present)
      const cachedWeather = loadCacheKey(CACHE_KEY);
      updateSafetyGuidance(cachedWeather?.main?.temp ?? null, cachedWeather?.wind?.speed ?? null, cached);
      return cached;
    }
    const a = await fetchAQI(coords.lat, coords.lon);
    if (a) {
      saveCache(AQI_CACHE_KEY, a);
      updateAQIUI(a);
      // update safety guidance with new AQI + latest weather (from cache/last weather)
      const cachedWeather = loadCacheKey(CACHE_KEY);
      updateSafetyGuidance(cachedWeather?.main?.temp ?? null, cachedWeather?.wind?.speed ?? null, a);
      return a;
    } else {
      updateAQIUI(null);
      return null;
    }
  } catch (e) {
    console.warn("fetchAQIForCurrentImpl error:", e);
    updateAQIUI(null);
    return null;
  }
}
window.fetchAQIForCurrent = fetchAQIForCurrentImpl; // expose globally

// =================== MAIN WEATHER FLOW ===================
async function obtainWeather(force = false) {
  // try cached first
  if (!force) {
    const cached = loadCacheKey(CACHE_KEY);
    if (cached) {
      updateWeatherUI(cached);
      // if AQI cached, show that too
      const cachedAQI = loadCacheKey(AQI_CACHE_KEY);
      if (cachedAQI) updateAQIUI(cachedAQI);
      // Update safety guidance using cache (both)
      updateSafetyGuidance(cached?.main?.temp ?? null, cached?.wind?.speed ?? null, cachedAQI ?? null);
      return cached;
    }
  }

  let lat = DEFAULT_LAT, lon = DEFAULT_LON;
  // try geolocation (non-blocking fallback)
  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("no-geolocation");
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
    });
    lat = pos.coords.latitude;
    lon = pos.coords.longitude;
    console.log("weather.js: geolocation success", lat, lon);
  } catch (e) {
    console.warn("geolocation failed or denied — using defaults", e);
  }

  try {
    let normalized;
    if (OPENWEATHER_API_KEY) {
      try {
        normalized = await fetchOpenWeather(lat, lon);
        console.log("weather.js: fetched from OpenWeather");
      } catch (owErr) {
        console.warn("OpenWeather failed, falling back to Open-Meteo:", owErr);
        normalized = await fetchOpenMeteoWeather(lat, lon);
      }
    } else {
      normalized = await fetchOpenMeteoWeather(lat, lon);
      console.log("weather.js: fetched from Open-Meteo (no key)");
    }

    if (normalized && normalized.ok !== false) {
      saveCache(CACHE_KEY, normalized);
      updateWeatherUI(normalized);
    } else {
      updateWeatherUI(null);
    }

    // async: fetch AQI after weather (do not block page)
    fetchAQIForCurrent(false).catch(e => console.warn("AQI fetch error:", e));

    return normalized;
  } catch (err) {
    console.error("obtainWeather error:", err);
    if ($id("weather-error")) $id("weather-error").textContent = "⚠ Could not fetch weather. Try refresh.";
    updateWeatherUI(null);
    updateAQIUI(null);
    updateSafetyGuidance(null, null, null);
    return null;
  }
}

// expose fetchWeather globally (override stub)
window.fetchWeather = async function (force = false) {
  try {
    if ($id("weather-updated")) $id("weather-updated").innerText = "Updating...";
    await obtainWeather(force);
    if ($id("weather-updated")) $id("weather-updated").innerText = nowStr();
  } catch (e) {
    console.warn("global fetchWeather wrapper error:", e);
  }
};

// =================== BOOTSTRAP: DOM wiring ===================
document.addEventListener("DOMContentLoaded", () => {
  try {
    // button wiring: check presence first to avoid 'null'.addEventListener errors
    const bW = $id("btn-refresh-weather");
    if (bW) bW.addEventListener("click", () => window.fetchWeather(true));
    const bA = $id("btn-refresh-aqi");
    if (bA) bA.addEventListener("click", () => window.fetchAQIForCurrent(true));
    const bA2 = $id("btn-refresh-aqi-2");
    if (bA2) bA2.addEventListener("click", () => window.fetchAQIForCurrent(true));

    // Auto-run initial fetch
    window.__weather_initialized = true;
    window.fetchWeather(false).catch(e => console.warn("Initial weather fetch failed:", e));
    console.log("✅ weather.js initialized");
  } catch (e) {
    console.error("weather.js DOMContentLoaded error:", e);
    if ($id("weather-error")) $id("weather-error").textContent = "Initialization error";
  }
});
