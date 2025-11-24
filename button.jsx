import React from 'react';
import { Loader2 } from 'lucide-react'; // Import a spinner icon for loading state

// Reusable button component
const Button = ({
  children,        // Content inside the button (text or JSX)
  onClick,         // Function to call when button is clicked
  variant = 'primary', // Style variant (primary, secondary, accent, ghost)
  className = '',      // Additional classes from parent component
  loading = false,     // If true, shows loading spinner and disables button
  type = 'button',     // Button type: button, submit, or reset
}) => {
  // Base styling for all buttons
  const baseStyle =
    'w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed';

  // Variant styles for different visual appearances
  const variants = {
    primary: 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700', // Blue button
    secondary:
      'bg-white text-gray-800 border border-gray-100 shadow-gray-200/50 hover:bg-gray-50', // White button
    accent: 'bg-amber-400 text-blue-900 shadow-amber-400/30 hover:bg-amber-500', // Amber button
    ghost: 'bg-transparent text-blue-600 shadow-none hover:bg-blue-50', // Transparent button
  };

  return (
    <button
      type={type}              // Set button type
      onClick={onClick}        // Set click handler
      disabled={loading}       // Disable while loading to prevent double clicks
      className={`${baseStyle} ${variants[variant]} ${className}`} // Combine base, variant, and extra classes
    >
      {/* Show loader spinner if loading; otherwise show children */}
      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : children}
    </button>
  );
};

export default Button; // Export the Button component
