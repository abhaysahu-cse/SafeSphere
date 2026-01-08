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
