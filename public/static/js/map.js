// map.js — safe, feature-rich Leaflet initializer for mini-map and full map pages
// Features:
//  - single initialization guard (no double init)
//  - demo + API zones (circle or GeoJSON polygon support)
//  - legend control
//  - user "locate me" button and weather marker integration
//  - exposes window.safeSphereMap helpers for debugging

(function () {
  // guard: avoid re-initializing if included multiple times
  if (window.safeSphereMap && window.safeSphereMap.mapInstance) {
    console.log("map.js: map already initialized — skipping re-init.");
    return;
  }

  // CONFIG
  const DEFAULT_CENTER = [23.2599, 77.4126];
  const DEFAULT_ZOOM = 11;
  const ZONES_API = "/api/zones/"; // expected array or GeoJSON
  const FETCH_TIMEOUT_MS = 5000;
  const demoZones = [
    // circle zone example
    { type: "circle", lat: 23.27, lng: 77.43, radius: 900, level: "high", msg: "Flood-prone area (demo)" },
    // circle
    { type: "circle", lat: 23.24, lng: 77.39, radius: 700, level: "medium", msg: "Traffic congestion (demo)" },
    // GeoJSON polygon example (small square)
    { type: "polygon", geojson: { "type": "Polygon", "coordinates": [[[77.408,23.245],[77.414,23.245],[77.414,23.238],[77.408,23.238],[77.408,23.245]]] }, level: "safe", msg: "Safe shelter (demo)" }
  ];

  // helpers
  function zoneColor(level) {
    if (!level) return "#888";
    return level === "high" ? "#e53e3e" :
           level === "medium" ? "#f6ad55" : "#48bb78";
  }

  function fetchWithTimeout(url, opts = {}, timeout = FETCH_TIMEOUT_MS) {
    return Promise.race([
      fetch(url, opts),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeout))
    ]);
  }

  async function fetchZonesFromApi() {
    try {
      const res = await fetchWithTimeout(ZONES_API, { credentials: "same-origin" });
      if (!res.ok) throw new Error("zones API returned " + res.status);
      const data = await res.json();
      // Accept both GeoJSON FeatureCollection or array of zones
      if (data && data.type === "FeatureCollection") {
        return data; // return GeoJSON directly
      }
      if (Array.isArray(data)) return data;
      throw new Error("Unexpected zones format");
    } catch (err) {
      console.warn("map.js: failed to fetch zones from API, using demo zones:", err);
      return null;
    }
  }

  // create zone layer (group) and add to map
  function addZoneToMap(map, zone, layerGroup) {
    try {
      if (!zone) return null;

      if (zone.type === "polygon" && zone.geojson) {
        const style = { color: zoneColor(zone.level), fillColor: zoneColor(zone.level), fillOpacity: 0.35 };
        const gjLayer = L.geoJSON(zone.geojson, { style }).addTo(layerGroup);
        if (zone.msg) gjLayer.bindPopup(zone.msg);
        return gjLayer;
      }

      // If it's a full GeoJSON feature (Feature or FeatureCollection)
      if (zone.type === "geojson" && zone.geojson) {
        const style = { color: zoneColor(zone.level), fillColor: zoneColor(zone.level), fillOpacity: 0.35 };
        const gjLayer = L.geoJSON(zone.geojson, { style }).addTo(layerGroup);
        if (zone.msg) gjLayer.bindPopup(zone.msg);
        return gjLayer;
      }

      // Otherwise assume circle style
      const lat = parseFloat(zone.lat);
      const lng = parseFloat(zone.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const radius = Number(zone.radius) || 900;
        const color = zoneColor(zone.level);
        const circle = L.circle([lat, lng], { color, fillColor: color, fillOpacity: 0.35, radius }).addTo(layerGroup);
        if (zone.msg) circle.bindPopup(zone.msg);
        return circle;
      }

      console.warn("map.js: unknown zone format", zone);
      return null;
    } catch (e) {
      console.warn("map.js addZoneToMap error", e);
      return null;
    }
  }

  // legend control
  function addLegend(map) {
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "map-legend");
      div.style.background = "white";
      div.style.padding = "8px";
      div.style.borderRadius = "6px";
      div.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
      div.innerHTML = `
        <strong>Legend</strong><br/>
        <div style="margin-top:6px"><span style="display:inline-block;width:12px;height:12px;background:${zoneColor('high')};margin-right:6px"></span>High risk</div>
        <div><span style="display:inline-block;width:12px;height:12px;background:${zoneColor('medium')};margin-right:6px"></span>Medium risk</div>
        <div><span style="display:inline-block;width:12px;height:12px;background:${zoneColor('safe')};margin-right:6px"></span>Safe</div>
      `;
      return div;
    };
    legend.addTo(map);
  }

  // small locate control
  function addLocateControl(map) {
    const LocateControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd: function () {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
        container.style.background = "white";
        container.style.cursor = "pointer";
        container.style.width = "34px";
        container.style.height = "34px";
        container.style.display = "flex";
        container.style.justifyContent = "center";
        container.style.alignItems = "center";
        container.title = "Locate me";
        container.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M17.7 6.3l1.4-1.4M4.9 19.1l1.4-1.4"/></svg>';
        L.DomEvent.on(container, "click", function (e) {
          e.stopPropagation();
          map.locate({ setView: true, maxZoom: 14 });
        });
        return container;
      }
    });
    map.addControl(new LocateControl());
  }

  // initialize map instance
  function initMap(el) {
    if (!el) return null;
    // set size if not provided
    if (!el.style.height) el.style.height = "360px";

    const map = L.map(el, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    // Using CartoDB tile server (more permissive, no referer required)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);
    addLegend(map);
    addLocateControl(map);
    return map;
  }

  // main bootstrap
  document.addEventListener("DOMContentLoaded", async () => {
    // require Leaflet
    if (typeof L === "undefined") {
      console.error("map.js: Leaflet (L) is not loaded. Include Leaflet before map.js");
      return;
    }

    const el = document.getElementById("mini-map");
    if (!el) {
      // not every page must have a map; expose helper anyway
      window.safeSphereMap = window.safeSphereMap || { mapInstance: null, addZone: () => {} };
      console.log("map.js: #mini-map not present on this page — skipping init.");
      return;
    }

    // initialize only once
    if (window.safeSphereMap && window.safeSphereMap.mapInstance) {
      console.log("map.js: map already present on page.");
      return;
    }

    const map = initMap(el);
    const zonesLayer = L.layerGroup().addTo(map);

    // try API zones, otherwise demo
    const apiZones = await fetchZonesFromApi();
    if (apiZones) {
      if (apiZones.type === "FeatureCollection") {
        // add GeoJSON features
        L.geoJSON(apiZones, {
          style: (feat) => ({ color: "#e53e3e", fillOpacity: 0.3 })
        }).addTo(zonesLayer);
      } else {
        apiZones.forEach(z => addZoneToMap(map, z, zonesLayer));
      }
    } else {
      demoZones.forEach(z => addZoneToMap(map, z, zonesLayer));
    }

    // weather marker support
    let weatherMarker = null;
    function showWeatherMarker(lat, lon) {
      try {
        if (weatherMarker) zonesLayer.removeLayer(weatherMarker);
        weatherMarker = L.marker([lat, lon], { title: "Weather location" }).addTo(zonesLayer);
        weatherMarker.bindPopup("Latest weather location").openPopup();
      } catch (e) { console.warn("map.js showWeatherMarker", e); }
    }

    // if weather already provided
    if (window.latestWeatherCoords && window.latestWeatherCoords.lat) {
      const { lat, lon } = window.latestWeatherCoords;
      map.setView([lat, lon], 12);
      showWeatherMarker(lat, lon);
    }

    // listen to weather updates
    document.addEventListener("weather:updated", (ev) => {
      const d = ev?.detail;
      if (d && d.lat && d.lon) {
        map.setView([d.lat, d.lon], 12, { animate: true });
        showWeatherMarker(d.lat, d.lon);
      }
    });

    // expose helpers
    window.safeSphereMap = {
      mapInstance: map,
      zonesLayer,
      addZone: (z) => addZoneToMap(map, z, zonesLayer),
      clearZones: () => zonesLayer.clearLayers()
    };

    console.log("map.js: initialized successfully", map);
  });
})();
