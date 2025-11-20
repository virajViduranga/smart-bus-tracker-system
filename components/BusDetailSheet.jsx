import React, { useEffect, useState } from 'react';
import { ArrowLeft, Navigation, Users, Gauge, MapPin, Footprints } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Button from './Button';

// Helper: Calculate distance in km
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const BusDetailSheet = ({ bus, userLocation, onClose, onTrack }) => {
  const [locationName, setLocationName] = useState('Locating...');
  const [distanceAway, setDistanceAway] = useState(null);

  // Calculate Distance & Location Name
  useEffect(() => {
    if (!bus) return;

    // 1. Calculate Distance from User
    if (userLocation) {
      const dist = getDistance(userLocation.lat, userLocation.lng, bus.lat, bus.lng);
      setDistanceAway(dist.toFixed(1)); // e.g. "1.2"
    }

    // 2. Find Location Name
    // Use the 'nextStop' or 'currentRoad' from the backend if available
    if (bus.nextStop) {
      setLocationName(`Near ${bus.nextStop}`);
    } else if (bus.currentRoad) {
      setLocationName(`On ${bus.currentRoad}`);
    } else {
      setLocationName('In Transit');
    }

  }, [bus, userLocation]);

  if (!bus) return null;

  // Fallback values if data is missing
  const speed = bus.speed !== undefined ? Math.round(bus.speed) : 0;
  const crowd = bus.crowdLevel || 'Unknown';
  const people = bus.peopleCount !== undefined ? bus.peopleCount : '--';

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] animate-slide-up overflow-hidden">
      
      {/* Header Gradient */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-50 to-white pointer-events-none" />

      <div className="p-6 relative z-10">
        {/* Close Button */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-3xl font-black text-gray-900">{bus.routeNo}</h2>
                <p className="text-gray-500 font-medium">Towards {bus.destination}</p>
            </div>
            <button 
                onClick={onClose}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            >
                <ArrowLeft size={20} />
            </button>
        </div>

        {/* MAIN INFO: Current Location */}
        <div className="bg-blue-600 text-white rounded-3xl p-6 shadow-xl shadow-blue-200 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0">
                    <MapPin className="text-white" size={24} />
                </div>
                <div>
                    <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-1">Current Location</p>
                    <h3 className="text-2xl font-bold leading-tight">
                        {locationName}
                    </h3>
                    <p className="text-blue-200 text-sm mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Updating Live
                    </p>
                </div>
            </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-3 gap-3 mb-8">
            {/* Speed */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                <Gauge className="text-blue-600 mb-1" size={20} />
                <p className="text-lg font-bold text-gray-900">{speed}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">km/h</p>
            </div>

            {/* Crowd / People Count */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                <Users className="text-blue-600 mb-1" size={20} />
                <div className="flex flex-col">
                    <p className="text-lg font-bold text-gray-900">{crowd}</p>
                    <p className="text-[10px] text-gray-500">{people} Passengers</p>
                </div>
            </div>
            
            {/* Distance Away */}
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
                <Footprints className="text-blue-600 mb-1" size={20} />
                <p className="text-lg font-bold text-blue-900">
                  {distanceAway ? `${distanceAway} km` : '--'}
                </p>
                <p className="text-[10px] text-blue-600 font-bold uppercase">Away</p>
            </div>
        </div>

        <Button onClick={() => onTrack(bus)} variant="primary" className="w-full py-5 text-lg shadow-blue-500/40">
            <Navigation className="mr-2" /> Track Live on Map
        </Button>

      </div>
    </div>
  );
};

export default BusDetailSheet;