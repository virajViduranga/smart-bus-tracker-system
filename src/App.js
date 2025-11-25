import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import { collection, query, onSnapshot } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { db, auth } from './firebase'; 
import { searchLocation, findBestRoutes } from './utils/transitLogic';

import AuthScreen from './components/AuthScreen';
import HomeOverlay from './components/HomeOverlay';
import SearchResults from './components/SearchResults';
import BusDetailSheet from './components/BusDetailSheet';
import { Crosshair } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('auth');
  const [authMode, setAuthMode] = useState('login');

  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [trackingBusId, setTrackingBusId] = useState(null);
  
  const [userLocation, setUserLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);

 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      if (currentUser) setView('home');
      else setView('auth');
    });
    return unsubscribe;
  }, []);

  const handleAuth = async (email, password, isSignup) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Auth Error:', error);
      setAuthError('Authentication failed. Check email/password.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('auth');
    setTrackingBusId(null);
    setSelectedBus(null);
    setSearchResults([]);
  };

  //---------------- USER LOCATION ----------------
  
  
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported");
      return;
    }
    
    setGpsError("Locating...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setGpsError(null);
        
   
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        if (error.code === 1) setGpsError("Permission denied. Enable GPS in Settings.");
        else if (error.code === 2) setGpsError("Position unavailable.");
        else if (error.code === 3) setGpsError("GPS timeout.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (user) requestLocation();
  }, [user]);

  // ---------------- FIRE STORE ----------------
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'public', 'data', 'buses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBuses(docs);
        if (selectedBus) {
          const updatedSelected = docs.find(b => b.id === selectedBus.id);
          if (updatedSelected) setSelectedBus(updatedSelected);
        }
      }, 
      (error) => console.error("Firestore Error:", error)
    );
    return () => unsubscribe();
  }, [user, selectedBus]);


  useEffect(() => {
    if (window.L) {
      setMapReady(true);
      return;
    }
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setMapReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || mapInstanceRef.current || !mapContainerRef.current || !window.L) return;

    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([6.9271, 79.8612], 13);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; OSM & CartoDB' }
    ).addTo(map);

    mapInstanceRef.current = map;
  }, [mapReady]);

  // ---------------- MAP MARKERS ----------------
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-marker-icon',
          html: `<div style="background-color:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(34,197,94,0.3);"></div>`,
          iconSize: [16, 16],
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
      }
    }

    
    let busesToDisplay = buses;
    if (trackingBusId) {
      busesToDisplay = buses.filter(b => b.id === trackingBusId);
    } else if (view === 'results') {
      busesToDisplay = searchResults;
    }

    Object.keys(markersRef.current).forEach(id => {
      if (!busesToDisplay.find(b => b.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    busesToDisplay.forEach(bus => {
      const lat = bus.lat || 6.9;
      const lng = bus.lng || 79.85;
      const route = bus.routeNo || '?';

      if (markersRef.current[bus.id]) {
        markersRef.current[bus.id].setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color:#2563eb;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;border:3px solid white;box-shadow:0 4px 10px rgba(37,99,235,0.4);font-size:14px;">${route}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.on('click', () => {
          setSelectedBus(bus);
          setView('detail');
          map.flyTo([lat, lng], 15, { duration: 0.8 });
        });
        markersRef.current[bus.id] = marker;
      }
    });

    if (trackingBusId && busesToDisplay.length > 0) {
      const bus = busesToDisplay[0];
      if (userLocation) {
        const bounds = L.latLngBounds(
          [bus.lat, bus.lng],
          [userLocation.lat, userLocation.lng]
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else {
        map.flyTo([bus.lat, bus.lng], 16, { animate: true, duration: 1 });
      }
    }

  }, [buses, searchResults, trackingBusId, view, userLocation]);

  // ---------------- HANDLERS Data ----------------
  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setView('home');
      setSearchResults([]);
      return;
    }
    const locations = await searchLocation(q);
    if (locations.length > 0) {
      const destination = locations[0];
      const myLat = userLocation?.lat || 6.9120; 
      const myLng = userLocation?.lng || 79.8850;

      const bestRoutes = await findBestRoutes(myLat, myLng, destination.lat, destination.lng);
      const recommendedRouteNos = bestRoutes.map(r => r.routeNo);

      const matches = buses.filter(bus => {
        if (recommendedRouteNos.includes(bus.routeNo)) return true;
        if (bus.routeNo.toLowerCase().includes(q.toLowerCase())) return true;
        if (bus.destination?.toLowerCase().includes(q.toLowerCase())) return true;
        if (bus.nextStop?.toLowerCase().includes(q.toLowerCase())) return true;
        return false;
      });
      setSearchResults(matches);
      setView('results');
      if (mapInstanceRef.current) mapInstanceRef.current.flyTo([destination.lat, destination.lng], 14);
    } else {
      const simpleMatches = buses.filter(b => 
        b.routeNo.includes(q) || 
        b.destination?.toLowerCase().includes(q.toLowerCase()) ||
        b.nextStop?.toLowerCase().includes(q.toLowerCase())
      );
      setSearchResults(simpleMatches);
      setView('results');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {view === 'auth' && (
        <AuthScreen
          mode={authMode}
          setMode={setAuthMode}
          onLogin={(e, p) => handleAuth(e, p, false)}
          onSignup={(e, p) => handleAuth(e, p, true)}
          error={authError}
          loading={authLoading}
        />
      )}

      {view !== 'auth' && (
        <>
         
          {view === 'home' && !trackingBusId && (
            <button
              onClick={requestLocation}
              className="absolute bottom-24 right-4 z-[400] w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-blue-600 hover:bg-gray-50 active:scale-95 transition"
            >
              <Crosshair size={24} />
            </button>
          )}

    
          {gpsError && !userLocation && (
            <div className="absolute top-24 left-4 right-4 z-[500] bg-white/90 backdrop-blur border border-red-200 p-3 rounded-xl shadow-xl text-center animate-bounce">
              <p className="text-red-600 text-xs font-bold">{gpsError}</p>
            </div>
          )}

          {view === 'home' && !trackingBusId && (
            <HomeOverlay onSearch={handleSearch} onLogout={handleLogout} />
          )}

          {view === 'results' && (
            <SearchResults
              query={searchQuery}
              buses={searchResults} 
              onSelectBus={bus => {
                setSelectedBus(bus);
                setView('detail');
              }}
              onBack={() => {
                setView('home');
                setSearchQuery('');
              }}
            />
          )}

          {view === 'detail' && selectedBus && (
            <BusDetailSheet
              bus={selectedBus}
              userLocation={userLocation}
              onClose={() => {
                setSelectedBus(null);
                setView('home');
              }}
              onTrack={(bus) => {
                setSelectedBus(null);
                setTrackingBusId(bus.id);
                setView('home');
              }}
            />
          )}

          {trackingBusId && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000]">
               <button 
                  onClick={() => {
                    setTrackingBusId(null);
                    setView('home');
                    if (mapInstanceRef.current) mapInstanceRef.current.flyTo([6.9271, 79.8612], 13);
                  }}
                  className="bg-white text-red-600 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:bg-red-50 border border-gray-100"
              >
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"/>
                  Stop Tracking
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}