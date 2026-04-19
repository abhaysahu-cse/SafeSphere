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
  const DEFAULT_CENTER = [23.2599, 77.4126]; // Sage University, Bhopal
  const DEFAULT_ZOOM = 7; // Zoom to show MP region
  const ZONES_API = "/api/zones/"; // expected array or GeoJSON
  const FETCH_TIMEOUT_MS = 5000;
  
  // HOSPITALS & COMMUNITY CENTERS IN MADHYA PRADESH
  const emergencyLocations = {
    hospitals: [
      // Bhopal
      { name: "AIIMS Bhopal", lat: 23.2156, lng: 77.4128, city: "Bhopal", phone: "0755-2672355", type: "Government" },
      { name: "Hamidia Hospital", lat: 23.2599, lng: 77.4126, city: "Bhopal", phone: "0755-2740381", type: "Government" },
      { name: "Chirayu Medical College", lat: 23.1685, lng: 77.4513, city: "Bhopal", phone: "0755-4097100", type: "Private" },
      { name: "Bansal Hospital", lat: 23.2156, lng: 77.4328, city: "Bhopal", phone: "0755-4027000", type: "Private" },
      
      // Indore
      { name: "MY Hospital Indore", lat: 22.7196, lng: 75.8577, city: "Indore", phone: "0731-2537777", type: "Government" },
      { name: "Bombay Hospital Indore", lat: 22.7532, lng: 75.8937, city: "Indore", phone: "0731-4222222", type: "Private" },
      { name: "CHL Hospital Indore", lat: 22.7279, lng: 75.8897, city: "Indore", phone: "0731-4044444", type: "Private" },
      
      // Gwalior
      { name: "Jaya Arogya Hospital", lat: 26.2183, lng: 78.1828, city: "Gwalior", phone: "0751-2423999", type: "Government" },
      { name: "Birla Hospital Gwalior", lat: 26.2124, lng: 78.1772, city: "Gwalior", phone: "0751-2341111", type: "Private" },
      
      // Jabalpur
      { name: "Netaji Subhash Chandra Bose Medical College", lat: 22.9734, lng: 78.6569, city: "Jabalpur", phone: "0761-2672855", type: "Government" },
      { name: "Sanjivani Hospital Jabalpur", lat: 23.1765, lng: 79.9339, city: "Jabalpur", phone: "0761-4005555", type: "Private" },
      
      // Other cities
      { name: "District Hospital Sagar", lat: 24.5854, lng: 77.7064, city: "Sagar", phone: "07582-226666", type: "Government" },
      { name: "District Hospital Rewa", lat: 24.5330, lng: 81.3019, city: "Rewa", phone: "07662-222222", type: "Government" },
      { name: "District Hospital Chhindwara", lat: 21.1702, lng: 79.0950, city: "Chhindwara", phone: "07162-222222", type: "Government" }
    ],
    
    communityCenters: [
      // Bhopal
      { name: "Bhopal Municipal Corporation Community Hall", lat: 23.2599, lng: 77.4026, city: "Bhopal", capacity: "500 people", facilities: "Water, Electricity, Toilets" },
      { name: "Nehru Stadium Shelter", lat: 23.2456, lng: 77.4128, city: "Bhopal", capacity: "1000 people", facilities: "Medical Aid, Food" },
      
      // Indore
      { name: "Indore Municipal Corporation Hall", lat: 22.7196, lng: 75.8477, city: "Indore", capacity: "800 people", facilities: "Water, Medical Aid" },
      { name: "Nehru Stadium Indore", lat: 22.7096, lng: 75.8777, city: "Indore", capacity: "1500 people", facilities: "Full Facilities" },
      
      // Gwalior
      { name: "Gwalior Community Center", lat: 26.2083, lng: 78.1728, city: "Gwalior", capacity: "600 people", facilities: "Water, Electricity" },
      
      // Jabalpur
      { name: "Jabalpur Municipal Hall", lat: 22.9634, lng: 78.6469, city: "Jabalpur", capacity: "700 people", facilities: "Water, Food, Medical" },
      
      // Other cities
      { name: "Sagar Community Hall", lat: 24.5754, lng: 77.6964, city: "Sagar", capacity: "400 people", facilities: "Basic Facilities" },
      { name: "Rewa Community Center", lat: 24.5230, lng: 81.2919, city: "Rewa", capacity: "500 people", facilities: "Water, Electricity" }
    ]
  };
  
  // HEATWAVE ZONES FOR MADHYA PRADESH (April-May 2026)
  // Red = Extreme Heat (45°C+), Yellow = High Heat (42-45°C), Green = Moderate (38-42°C)
  const demoZones = [
    // EXTREME HEAT ZONES (RED) - Western & Central MP
    { type: "circle", lat: 23.2599, lng: 77.4126, radius: 25000, level: "high", msg: "🔥 BHOPAL - Extreme Heatwave Alert<br>Temp: 43-45°C<br>Risk: CRITICAL<br>Stay indoors 11 AM - 4 PM" },
    { type: "circle", lat: 22.7196, lng: 75.8577, radius: 22000, level: "high", msg: "🔥 INDORE - Extreme Heat<br>Temp: 44-46°C<br>Risk: CRITICAL" },
    { type: "circle", lat: 26.2183, lng: 78.1828, radius: 20000, level: "high", msg: "🔥 GWALIOR - Severe Heatwave<br>Temp: 45-47°C<br>Risk: CRITICAL" },
    { type: "circle", lat: 22.9734, lng: 78.6569, radius: 18000, level: "high", msg: "🔥 JABALPUR - Extreme Heat<br>Temp: 43-45°C<br>Risk: HIGH" },
    { type: "circle", lat: 23.1765, lng: 79.9339, radius: 16000, level: "high", msg: "🔥 KATNI - Severe Heat<br>Temp: 44-46°C<br>Risk: HIGH" },
    
    // HIGH HEAT ZONES (YELLOW) - Northern & Eastern MP
    { type: "circle", lat: 24.5854, lng: 77.7064, radius: 18000, level: "medium", msg: "⚠️ SAGAR - High Heat<br>Temp: 42-44°C<br>Risk: MODERATE<br>Drink 3-4L water daily" },
    { type: "circle", lat: 25.4484, lng: 78.5685, radius: 17000, level: "medium", msg: "⚠️ TIKAMGARH - High Heat<br>Temp: 42-44°C<br>Risk: MODERATE" },
    { type: "circle", lat: 24.5330, lng: 81.3019, radius: 16000, level: "medium", msg: "⚠️ REWA - High Heat<br>Temp: 41-43°C<br>Risk: MODERATE" },
    { type: "circle", lat: 23.8388, lng: 78.7378, radius: 15000, level: "medium", msg: "⚠️ DAMOH - High Heat<br>Temp: 42-44°C<br>Risk: MODERATE" },
    { type: "circle", lat: 22.5726, lng: 75.7217, radius: 14000, level: "medium", msg: "⚠️ DEWAS - High Heat<br>Temp: 42-44°C<br>Risk: MODERATE" },
    
    // MODERATE HEAT ZONES (GREEN) - Southern MP (relatively cooler)
    { type: "circle", lat: 21.1702, lng: 79.0950, radius: 16000, level: "safe", msg: "✅ CHHINDWARA - Moderate Heat<br>Temp: 39-41°C<br>Risk: LOW<br>Still stay hydrated" },
    { type: "circle", lat: 21.7679, lng: 78.1382, radius: 15000, level: "safe", msg: "✅ SEONI - Moderate Heat<br>Temp: 38-40°C<br>Risk: LOW" },
    { type: "circle", lat: 22.0797, lng: 79.5183, radius: 14000, level: "safe", msg: "✅ BALAGHAT - Moderate Heat<br>Temp: 39-41°C<br>Risk: LOW" },
    
    // SAGE UNIVERSITY SPECIFIC MARKER (Highlighted)
    { type: "circle", lat: 23.2599, lng: 77.4126, radius: 3000, level: "high", msg: "📍 SAGE UNIVERSITY BHOPAL<br>🌡️ Current: 43-45°C<br>🚨 EXTREME HEAT ALERT<br><br>Safety Measures:<br>• Stay indoors during peak hours<br>• Drink water every 30 mins<br>• Wear light cotton clothes<br>• Watch for heat exhaustion signs" }
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
        <strong>Heatwave Alert</strong><br/>
        <div style="margin-top:6px"><span style="display:inline-block;width:12px;height:12px;background:${zoneColor('high')};margin-right:6px"></span>Extreme (45°C+)</div>
        <div><span style="display:inline-block;width:12px;height:12px;background:${zoneColor('medium')};margin-right:6px"></span>High (42-45°C)</div>
        <div><span style="display:inline-block;width:12px;height:12px;background:${zoneColor('safe')};margin-right:6px"></span>Moderate (38-42°C)</div>
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

  // Add hospitals and community centers to map
  function addEmergencyLocations(map, layerGroup) {
    // Custom icons
    const hospitalIcon = L.divIcon({
      html: '<div style="background:#ef4444;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏥</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const communityIcon = L.divIcon({
      html: '<div style="background:#3b82f6;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏛️</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Add hospitals
    emergencyLocations.hospitals.forEach(hospital => {
      const marker = L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon }).addTo(layerGroup);
      marker.bindPopup(`
        <div style="min-width:200px">
          <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#ef4444;">🏥 ${hospital.name}</h3>
          <p style="margin:4px 0;font-size:12px;"><strong>City:</strong> ${hospital.city}</p>
          <p style="margin:4px 0;font-size:12px;"><strong>Type:</strong> ${hospital.type}</p>
          <p style="margin:4px 0;font-size:12px;"><strong>Phone:</strong> <a href="tel:${hospital.phone}" style="color:#3b82f6;">${hospital.phone}</a></p>
          <button onclick="getDirections(${hospital.lat}, ${hospital.lng})" style="margin-top:8px;padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;width:100%;">Get Directions</button>
        </div>
      `);
    });

    // Add community centers
    emergencyLocations.communityCenters.forEach(center => {
      const marker = L.marker([center.lat, center.lng], { icon: communityIcon }).addTo(layerGroup);
      marker.bindPopup(`
        <div style="min-width:200px">
          <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#3b82f6;">🏛️ ${center.name}</h3>
          <p style="margin:4px 0;font-size:12px;"><strong>City:</strong> ${center.city}</p>
          <p style="margin:4px 0;font-size:12px;"><strong>Capacity:</strong> ${center.capacity}</p>
          <p style="margin:4px 0;font-size:12px;"><strong>Facilities:</strong> ${center.facilities}</p>
          <button onclick="getDirections(${center.lat}, ${center.lng})" style="margin-top:8px;padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;width:100%;">Get Directions</button>
        </div>
      `);
    });
  }

  // Get directions using Google Maps
  window.getDirections = function(destLat, destLng) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${destLat},${destLng}`;
          window.open(url, '_blank');
        },
        (error) => {
          // If location access denied, just open destination
          const url = `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
          window.open(url, '_blank');
        }
      );
    } else {
      // Fallback if geolocation not supported
      const url = `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
      window.open(url, '_blank');
    }
  };

  // Find nearest locations based on user location
  function findNearestLocations(userLat, userLng, locations, count = 3) {
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    return locations
      .map(loc => ({
        ...loc,
        distance: calculateDistance(userLat, userLng, loc.lat, loc.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count);
  }

  // Show user location and nearest facilities
  function showUserLocation(map, layerGroup) {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Add user location marker
        const userIcon = L.divIcon({
          html: '<div style="background:#10b981;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);animation:pulse 2s infinite;">📍</div><style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style>',
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(layerGroup);
        
        // Find nearest hospitals and community centers
        const nearestHospitals = findNearestLocations(userLat, userLng, emergencyLocations.hospitals, 3);
        const nearestCenters = findNearestLocations(userLat, userLng, emergencyLocations.communityCenters, 2);

        let popupContent = `
          <div style="min-width:250px">
            <h3 style="margin:0 0 8px;font-size:15px;font-weight:700;color:#10b981;">📍 Your Location</h3>
            <p style="margin:8px 0 4px;font-size:13px;font-weight:700;">Nearest Hospitals:</p>
        `;

        nearestHospitals.forEach((h, i) => {
          popupContent += `<p style="margin:2px 0;font-size:11px;">
            ${i+1}. ${h.name} - ${h.distance.toFixed(1)} km
            <a href="#" onclick="getDirections(${h.lat}, ${h.lng}); return false;" style="color:#3b82f6;margin-left:4px;">→</a>
          </p>`;
        });

        popupContent += `<p style="margin:8px 0 4px;font-size:13px;font-weight:700;">Nearest Shelters:</p>`;

        nearestCenters.forEach((c, i) => {
          popupContent += `<p style="margin:2px 0;font-size:11px;">
            ${i+1}. ${c.name} - ${c.distance.toFixed(1)} km
            <a href="#" onclick="getDirections(${c.lat}, ${c.lng}); return false;" style="color:#3b82f6;margin-left:4px;">→</a>
          </p>`;
        });

        popupContent += `</div>`;

        userMarker.bindPopup(popupContent).openPopup();
        map.setView([userLat, userLng], 12);
      },
      (error) => {
        alert('Unable to get your location. Please enable location services.');
        console.error('Geolocation error:', error);
      }
    );
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

    // Add emergency locations (hospitals & community centers)
    addEmergencyLocations(map, zonesLayer);

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

    // Update locate button to show nearest facilities
    map.on('locationfound', function(e) {
      showUserLocation(map, zonesLayer);
    });

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
