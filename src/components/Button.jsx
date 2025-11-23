import React from 'react';
import { Loader2 } from 'lucide-react'; // Importing a loading spinner icon from lucide-react

// Button component definition
const Button = ({
  children,        // The content/text inside the button
  onClick,         // Function to execute when the button is clicked
  variant = 'primary', // Button style variant, defaults to 'primary'
  className = '',      // Additional CSS classes that can be passed from parent
  loading = false,     // Boolean to indicate if the button is in loading state
  type = 'button',     // Button type (button, submit, reset), default is 'button'
}) => {
  
  // Base CSS styles applied to every button
  const baseStyle =
    'w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed';

  // Variants define different color schemes for the button
  const variants = {
    primary: 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700',
    secondary:
      'bg-white text-gray-800 border border-gray-100 shadow-gray-200/50 hover:bg-gray-50',
    accent: 'bg-amber-400 text-blue-900 shadow-amber-400/30 hover:bg-amber-500',
    ghost: 'bg-transparent text-blue-600 shadow-none hover:bg-blue-50',
  };

  return (
    <button
      type={type}              // Set button type
      onClick={onClick}        // Set click handler
      disabled={loading}       // Disable button if it's loading
      className={`${baseStyle} ${variants[variant]} ${className}`} // Combine base, variant, and extra classes
    >
      {/* Show loader spinner if loading, otherwise show button children */}
      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : children}
    </button>
  );
};

export default Button; // Export the Button component so it can be used elsewhere
