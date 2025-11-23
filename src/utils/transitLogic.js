// src/utils/transitLogic.js
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// 1. SEARCH PLACES (Nominatim API - Free)
export const searchLocation = async (query) => {
  if (!query) return [];
  try {
    // Bounded to Sri Lanka (viewbox) to improve accuracy
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=lk&limit=5`;
    const response = await fetch(url);
    const data = await response.json();
    
    return data.map(place => ({
      name: place.display_name.split(',')[0], // Simplify name
      fullName: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    }));
  } catch (error) {
    console.error("Location search failed:", error);
    return [];
  }
};

// 2. MATH: Calculate Distance (Haversine Formula)
export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
};

const deg2rad = (deg) => deg * (Math.PI/180);

// 3. THE ALGORITHM: Find Best Bus
export const findBestRoutes = async (userLat, userLng, destLat, destLng) => {
  // A. Fetch all routes from Firebase
  // (In a real app, you'd cache this or use geo-queries to fetch only nearby ones)
  const routesSnap = await getDocs(collection(db, 'routes'));
  const allRoutes = routesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const recommendations = allRoutes.map(route => {
    if (!route.stops || route.stops.length < 2) return null;

    // B. Find closest entry point (Where user gets ON)
    let startStop = null;
    let minStartDist = Infinity;
    let startIndex = -1;

    route.stops.forEach((stop, index) => {
      const dist = getDistance(userLat, userLng, stop.lat, stop.lng);
      if (dist < 1.0 && dist < minStartDist) { // Within 1km
        minStartDist = dist;
        startStop = stop;
        startIndex = index;
      }
    });

    // C. Find closest exit point (Where user gets OFF)
    let endStop = null;
    let minEndDist = Infinity;
    let endIndex = -1;

    route.stops.forEach((stop, index) => {
      const dist = getDistance(destLat, destLng, stop.lat, stop.lng);
      if (dist < 1.0 && dist < minEndDist) { // Within 1km
        minEndDist = dist;
        endStop = stop;
        endIndex = index;
      }
    });

    // D. VALIDATION: Must have valid start & end, and direction must be correct
    if (!startStop || !endStop) return null;
    if (startIndex >= endIndex) return null; // Bus is going the wrong way!

    // E. SCORING: Calculate "Efficiency"
    // Fewer stops usually means a more direct route (The "Maradana Road" vs "Town Hall" logic)
    const stopsCount = endIndex - startIndex;
    const distance = getDistance(startStop.lat, startStop.lng, endStop.lat, endStop.lng);

    return {
      ...route,
      matchType: 'direct',
      score: stopsCount, // Lower score = Better
      tripDetails: {
        getOn: startStop.name,
        getOff: endStop.name,
        stops: stopsCount,
        distance: distance.toFixed(1)
      }
    };
  }).filter(Boolean); // Remove nulls

  // F. Sort by Score (Best route first)
  return recommendations.sort((a, b) => a.score - b.score);
};