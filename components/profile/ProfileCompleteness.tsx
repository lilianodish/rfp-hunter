'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/lib/stores/profileStore';

interface ProfileCompletenessProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProfileCompleteness({ 
  size = 'md', 
  showLabel = false,
  className 
}: ProfileCompletenessProps) {
  const [mounted, setMounted] = useState(false);
  const { getCompleteness, getMissingFields } = useProfileStore();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const completeness = getCompleteness();
  const missingFields = getMissingFields();
  const percentage = Math.round(completeness.overall);
  
  const sizes = {
    sm: {
      container: 'h-12 w-12',
      svg: 'h-12 w-12',
      text: 'text-xs',
      strokeWidth: 4,
    },
    md: {
      container: 'h-20 w-20',
      svg: 'h-20 w-20',
      text: 'text-sm',
      strokeWidth: 6,
    },
    lg: {
      container: 'h-28 w-28',
      svg: 'h-28 w-28',
      text: 'text-lg',
      strokeWidth: 8,
    },
  };

  const currentSize = sizes[size];
  const radius = size === 'sm' ? 16 : size === 'md' ? 28 : 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on percentage
  const getColor = (percent: number) => {
    if (percent < 30) return 'text-red-500';
    if (percent < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const color = getColor(percentage);

  // Get missing sections for tooltip
  const incompleteSections = Object.entries(completeness.sections)
    .filter(([_, percent]) => percent < 100)
    .map(([section, percent]) => ({
      section,
      percent: Math.round(percent),
    }));

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative group">
        <div className={cn('relative', currentSize.container)}>
          <svg
            className={cn(currentSize.svg, 'transform -rotate-90')}
            viewBox={`0 0 ${(radius + currentSize.strokeWidth / 2) * 2} ${(radius + currentSize.strokeWidth / 2) * 2}`}
          >
            {/* Background circle */}
            <circle
              cx={radius + currentSize.strokeWidth / 2}
              cy={radius + currentSize.strokeWidth / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={currentSize.strokeWidth}
              className="text-gray-200"
            />
            
            {/* Progress circle */}
            <circle
              cx={radius + currentSize.strokeWidth / 2}
              cy={radius + currentSize.strokeWidth / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={currentSize.strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn(color, 'transition-all duration-500 ease-out')}
            />
          </svg>
          
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold', currentSize.text, color.replace('text-', 'text-'))}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Tooltip */}
        {incompleteSections.length > 0 && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold mb-1">Incomplete Sections:</div>
            {incompleteSections.map(({ section, percent }) => (
              <div key={section} className="capitalize">
                {section}: {percent}%
              </div>
            ))}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>

      {showLabel && (
        <div className="text-center">
          <p className="font-medium">Profile Complete</p>
          {missingFields.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {missingFields.length} field{missingFields.length !== 1 ? 's' : ''} missing
            </p>
          )}
        </div>
      )}
    </div>
  );
}