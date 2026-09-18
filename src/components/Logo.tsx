import React from 'react';
import { Leaf } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-md shadow-emerald-500/20">
        <Leaf className={`${iconSizes[size]} transform -rotate-12 stroke-[2.2]`} />
      </div>
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 bg-clip-text text-transparent ${textSizes[size]}`}>
          Nutri<span className="text-emerald-500 font-extrabold">Smart</span>
        </span>
      </div>
    </div>
  );
};
