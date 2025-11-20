import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  loading = false,
  type = 'button',
}) => {
  const baseStyle =
    'w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700',
    secondary:
      'bg-white text-gray-800 border border-gray-100 shadow-gray-200/50 hover:bg-gray-50',
    accent: 'bg-amber-400 text-blue-900 shadow-amber-400/30 hover:bg-amber-500',
    ghost: 'bg-transparent text-blue-600 shadow-none hover:bg-blue-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : children}
    </button>
  );
};

export default Button;
