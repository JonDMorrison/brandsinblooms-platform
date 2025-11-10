'use client';

/**
 * Save status indicator for inline editing mode
 * Shows real-time feedback about save status
 */

import React, { memo, useEffect, useState } from 'react';
import { Loader2, Check, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useEditMode } from '@/contexts/EditModeContext';

interface SaveIndicatorProps {
  className?: string;
  position?: 'fixed' | 'absolute' | 'relative';
  showDetails?: boolean;
}

const SaveIndicatorComponent = ({ 
  className,
  position = 'fixed',
  showDetails = true
}: SaveIndicatorProps) => {
  const { isDirty, isSaving, editMode } = useEditMode();
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Update last save time when saving completes
  useEffect(() => {
    if (!isSaving && !isDirty && editMode === 'inline') {
      setLastSaveTime(new Date());
    }
  }, [isSaving, isDirty, editMode]);
  
  // Don't show indicator if not in inline edit mode
  if (editMode !== 'inline') {
    return null;
  }
  
  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudOff className="h-4 w-4 text-red-500" />;
    }
    if (isSaving) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (isDirty) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    return <Check className="h-4 w-4 text-green-500" />;
  };
  
  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline - changes will sync when reconnected';
    }
    if (isSaving) {
      return 'Saving...';
    }
    if (isDirty) {
      return 'Unsaved changes';
    }
    if (lastSaveTime && showDetails) {
      const secondsAgo = Math.floor((Date.now() - lastSaveTime.getTime()) / 1000);
      if (secondsAgo < 5) {
        return 'Saved just now';
      }
      if (secondsAgo < 60) {
        return `Saved ${secondsAgo} seconds ago`;
      }
      const minutesAgo = Math.floor(secondsAgo / 60);
      if (minutesAgo === 1) {
        return 'Saved 1 minute ago';
      }
      if (minutesAgo < 60) {
        return `Saved ${minutesAgo} minutes ago`;
      }
      return 'All changes saved';
    }
    return 'All changes saved';
  };
  
  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-50 border-red-200 text-red-700';
    if (isSaving) return 'bg-blue-50 border-blue-200 text-blue-700';
    if (isDirty) return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-gray-100 border-green-200 text-green-700';
  };
  
  return (
    <div
      className={cn(
        'save-indicator flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm',
        'transition-all duration-200 animate-in fade-in slide-in-from-bottom-2',
        getStatusColor(),
        position === 'fixed' && 'bottom-4 right-4 z-50',
        className
      )}
      style={{
        position: position as any
      }}
    >
      {getStatusIcon()}
      <span className="text-sm font-medium">
        {getStatusText()}
      </span>
      
      {/* Cloud sync indicator for online status */}
      {isOnline && !isSaving && !isDirty && (
        <Cloud className="h-3.5 w-3.5 text-green-500 ml-1" />
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const SaveIndicator = memo(SaveIndicatorComponent);

SaveIndicator.displayName = 'SaveIndicator';