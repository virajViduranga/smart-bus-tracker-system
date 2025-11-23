import React from 'react';
import { ArrowLeft, Bus, Navigation, Users } from 'lucide-react';

const SearchResults = ({ query, buses, onSelectBus, onBack }) => (
  <div className="absolute inset-x-0 bottom-0 h-[85vh] bg-gray-50 z-30 rounded-t-[2.5rem] shadow-2xl flex flex-col animate-slide-up overflow-hidden">
    {/* Drag handle */}
    <div className="w-full flex justify-center pt-3 pb-1">
      <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
    </div>

    {/* Header */}
    <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-100 bg-white">
      <button
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <ArrowLeft size={20} className="text-gray-700" />
      </button>
      <div className="flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          Destination
        </p>
        <p className="font-bold text-xl text-gray-900 truncate">{query || 'Anywhere'}</p>
      </div>
    </div>

    <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
      <div className="flex justify-between items-end mb-4">
        <h3 className="font-bold text-gray-800 text-lg">Available Buses</h3>
        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
          {buses.length} Active
        </span>
      </div>

      {buses.map(bus => {
        const routeName =
          bus.routeNo === '154'
            ? 'Angulana'
            : bus.routeNo === '177'
            ? 'Kollupitiya'
            : 'Route ' + bus.routeNo;

        const crowd = bus.crowdLevel || 'Moderate';
        const crowdIsVery = crowd.toLowerCase().includes('very');

        return (
          <div
            key={bus.id}
            onClick={() => onSelectBus(bus)}
            className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 hover:shadow-md hover:border-blue-200 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-10 -mt-10 z-0 transition-colors group-hover:bg-blue-100" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white font-black text-xl w-14 h-14 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center">
                    {bus.routeNo}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{routeName}</p>
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-md w-fit mt-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      Live GPS
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-black text-2xl">
                    {Math.round(bus.speed || 0)}
                  </p>
                  <p className="text-xs text-gray-400 font-medium uppercase">km/h</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <Navigation size={14} />
                  <span>200m to stop</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${
                    crowdIsVery ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <Users size={14} />
                  <span>{crowd}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {buses.length === 0 && (
        <div className="text-center py-10 opacity-50">
          <Bus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Scanning for buses...</p>
        </div>
      )}
    </div>
  </div>
);

export default SearchResults;
