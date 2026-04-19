# Emergency Locations Feature - Safety Map

## Overview
Added real-time emergency location features to the Safety Map page. Users can now see nearby hospitals and community centers/shelters based on their current location and danger zones.

## Features Implemented

### 1. Hospital Markers (🏥)
- **15 hospitals** across Madhya Pradesh
- Major cities covered: Bhopal, Indore, Gwalior, Jabalpur, Sagar, Rewa, Chhindwara
- Each marker shows:
  - Hospital name
  - City
  - Type (Government/Private)
  - Phone number (clickable to call)
  - "Get Directions" button

### 2. Community Center/Shelter Markers (🏛️)
- **8 community centers** across MP
- Emergency shelters with capacity information
- Each marker shows:
  - Center name
  - City
  - Capacity (number of people)
  - Available facilities (Water, Electricity, Medical Aid, Food, Toilets)
  - "Get Directions" button

### 3. User Location Tracking (📍)
- Click the locate button (📍) in top-left corner
- Shows your current location with animated marker
- Automatically finds and displays:
  - **3 nearest hospitals** with distances
  - **2 nearest shelters** with distances
  - Direct links to get directions to each facility

### 4. Google Maps Integration
- "Get Directions" button on each location
- Opens Google Maps with route from user's location
- Works on both mobile and desktop
- Fallback if location access denied

### 5. Distance Calculation
- Real-time distance calculation using Haversine formula
- Shows distance in kilometers (km)
- Sorted by proximity to user

## Hospital Locations

### Bhopal (4 hospitals)
1. AIIMS Bhopal - Government
2. Hamidia Hospital - Government
3. Chirayu Medical College - Private
4. Bansal Hospital - Private

### Indore (3 hospitals)
1. MY Hospital Indore - Government
2. Bombay Hospital Indore - Private
3. CHL Hospital Indore - Private

### Gwalior (2 hospitals)
1. Jaya Arogya Hospital - Government
2. Birla Hospital Gwalior - Private

### Jabalpur (2 hospitals)
1. Netaji Subhash Chandra Bose Medical College - Government
2. Sanjivani Hospital Jabalpur - Private

### Other Cities (4 hospitals)
1. District Hospital Sagar
2. District Hospital Rewa
3. District Hospital Chhindwara

## Community Centers/Shelters

### Major Shelters
1. **Bhopal Municipal Corporation Community Hall** - 500 people
2. **Nehru Stadium Shelter Bhopal** - 1000 people
3. **Indore Municipal Corporation Hall** - 800 people
4. **Nehru Stadium Indore** - 1500 people
5. **Gwalior Community Center** - 600 people
6. **Jabalpur Municipal Hall** - 700 people
7. **Sagar Community Hall** - 400 people
8. **Rewa Community Center** - 500 people

## How to Use

### For Users:
1. **Open Safety Map** - Navigate to Map page from dashboard
2. **See All Locations** - Hospitals (red) and Shelters (blue) are visible on map
3. **Find Your Location** - Click the 📍 button in top-left
4. **View Nearest Facilities** - Popup shows 3 nearest hospitals and 2 nearest shelters
5. **Get Directions** - Click "Get Directions" to open Google Maps with route

### For Developers:
The system uses:
- Leaflet.js for map rendering
- Custom div icons for markers
- Geolocation API for user location
- Haversine formula for distance calculation
- Google Maps API for directions

## Technical Details

### Data Structure
```javascript
{
  hospitals: [
    {
      name: "Hospital Name",
      lat: 23.2156,
      lng: 77.4128,
      city: "City Name",
      phone: "0755-1234567",
      type: "Government/Private"
    }
  ],
  communityCenters: [
    {
      name: "Center Name",
      lat: 23.2599,
      lng: 77.4026,
      city: "City Name",
      capacity: "500 people",
      facilities: "Water, Electricity, Toilets"
    }
  ]
}
```

### Functions Added
- `addEmergencyLocations(map, layerGroup)` - Adds all markers to map
- `getDirections(destLat, destLng)` - Opens Google Maps with directions
- `findNearestLocations(userLat, userLng, locations, count)` - Finds nearest facilities
- `showUserLocation(map, layerGroup)` - Shows user location and nearest facilities

### Custom Icons
- **Hospital Icon**: Red circle (🏥) with white border
- **Community Center Icon**: Blue circle (🏛️) with white border
- **User Location Icon**: Green circle (📍) with pulse animation

## UI Controls

### Top Bar Buttons
- **⬅ Dashboard** - Return to main dashboard
- **Hide/Show Zones** - Toggle heatwave zones
- **🏥 Hospitals** - Toggle hospital markers (visual feedback)
- **🏛️ Shelters** - Toggle shelter markers (visual feedback)

### Info Panel (Bottom Left)
- Heatwave safety guide
- Zone color legend
- Instructions to find nearest facilities

### Legend (Bottom Right)
- Extreme Heat (Red) - 45°C+
- High Heat (Yellow) - 42-45°C
- Moderate (Green) - 38-42°C

## Mobile Responsive
- Touch-friendly buttons (44px minimum)
- Responsive layout for all screen sizes
- Works on iOS and Android
- Handles orientation changes
- Safe area insets for notched devices

## Browser Compatibility
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- Requires geolocation permission for user location

## Privacy & Permissions
- Location access requested only when user clicks locate button
- No location data stored or transmitted
- Works without location access (shows all markers)
- Fallback to destination-only directions if location denied

## Future Enhancements (Optional)

1. **Real-time Availability**
   - Hospital bed availability
   - Shelter occupancy status
   - Emergency contact status

2. **Route Optimization**
   - Avoid danger zones in route
   - Suggest safest route
   - Traffic-aware routing

3. **Emergency Alerts**
   - Push notifications for nearby dangers
   - Automatic rerouting during emergencies
   - Real-time updates

4. **Offline Support**
   - Download map tiles for offline use
   - Cached location data
   - Works without internet

5. **User Contributions**
   - Report new facilities
   - Update facility information
   - Rate and review locations

## Testing
1. Open map page
2. See hospital and shelter markers
3. Click locate button (📍)
4. Grant location permission
5. See your location and nearest facilities
6. Click "Get Directions" on any facility
7. Verify Google Maps opens with route

## Files Modified
- `safespera-old/safespera/public/static/js/map.js` - Added emergency locations data and functions
- `safespera-old/safespera/safe/templates/map.html` - Added toggle buttons and updated info panel
