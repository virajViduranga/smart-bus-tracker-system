import React from 'react';

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
      {Icon && <Icon size={20} />}
    </div>
    <input
      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
      {...props}
    />
  </div>
);

export default Input;
