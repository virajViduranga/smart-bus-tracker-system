import React from "react";

/*
  Input Component
  ---------------
  Reusable input with:
  ✔ Optional left icon
  ✔ Tailwind styling
  ✔ Spread props for flexibility (placeholder, type, onChange, etc.)

  Props:
    icon → React icon component (from lucide-react or others)
    ...props → All additional input attributes
*/

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    
    {/* Icon Container */}
    {Icon && (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <Icon size={20} />
      </div>
    )}

    {/* Input Field */}
    <input
      {...props}
      className="
        w-full
        pl-12 pr-4 py-4
        rounded-2xl
        border border-gray-200
        bg-gray-50
        text-gray-800
        placeholder-gray-400
        focus:outline-none
        focus:ring-2 focus:ring-blue-500/50
        focus:border-blue-500
        transition-all
      "
    />
  </div>
);

export default Input;
