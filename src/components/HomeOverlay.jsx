import React from 'react';
import { Search, LogOut } from 'lucide-react';

const HomeOverlay = ({ onSearch, onLogout }) => (
  <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
    {/* Gradient header */}
    <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-900/80 via-blue-900/40 to-transparent" />

    <div className="pt-14 px-6 pointer-events-auto relative z-10">
      <div className="flex justify-between items-start mb-8">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              Current Location
            </p>
            <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
              Colombo, Sri Lanka
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors border border-white/50"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2 drop-shadow-md">
          Where to
          <br />
          today?
        </h1>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] flex items-center transform transition-transform hover:scale-[1.02]">
        <div className="pl-4 text-blue-500">
          <Search size={24} />
        </div>
        <input
          type="text"
          placeholder="Search destination..."
          className="w-full p-4 outline-none text-gray-800 font-medium text-lg bg-transparent placeholder-gray-400"
          onChange={e => onSearch(e.target.value)}
        />
      </div>
    </div>
  </div>
);

export default HomeOverlay;
