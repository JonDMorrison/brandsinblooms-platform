'use client';

/**
 * Wrapper component that detects editable fields and provides visual indicators
 * Works with InlineTextEditor to enable click-to-edit functionality
 */

import React, { ReactNode, useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Edit2, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditableWrapperProps {
  children: ReactNode;
  isEnabled: boolean;
  fieldPath: string;
  fieldLabel?: string;
  showIndicator?: boolean;
  className?: string;
  onClick?: () => void;
}

const EditableWrapperComponent = ({
  children,
  isEnabled,
  fieldPath,
  fieldLabel,
  showIndicator = true,
  className,
  onClick
}: EditableWrapperProps) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const handleMouseEnter = useCallback(() => {
    if (isEnabled && showIndicator) {
      setIsHovering(true);
    }
  }, [isEnabled, showIndicator]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isEnabled && onClick) {
      e.stopPropagation();
      onClick();
    }
  }, [isEnabled, onClick]);
  
  return (
    <TooltipProvider>
      <div
        className={cn(
          'editable-wrapper relative group',
          isEnabled && 'cursor-text',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        data-editable={isEnabled}
        data-field={fieldPath}
      >
        {children}
        
        {/* Edit indicator */}
        {isEnabled && showIndicator && isHovering && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'absolute -top-2 -right-2 z-10',
                'flex items-center justify-center',
                'w-6 h-6 rounded-full',
                'bg-primary text-primary-foreground',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-200',
                'pointer-events-none'
              )}>
                <Edit2 className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">
                Click to edit {fieldLabel || fieldPath}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Locked indicator for non-editable fields */}
        {!isEnabled && showIndicator && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'absolute -top-2 -right-2 z-10',
                'flex items-center justify-center',
                'w-6 h-6 rounded-full',
                'bg-muted text-gray-500',
                'opacity-0 group-hover:opacity-50',
                'transition-opacity duration-200',
                'pointer-events-none'
              )}>
                <Lock className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">
                This field is not editable
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Visual outline on hover (only when enabled) */}
        {isEnabled && isHovering && (
          <div className={cn(
            'absolute inset-0 pointer-events-none',
            'border-2 border-dashed border-primary/30 rounded',
            'animate-in fade-in duration-200'
          )} />
        )}
      </div>
    </TooltipProvider>
  );
};

// Memoize to prevent unnecessary re-renders
export const EditableWrapper = memo(EditableWrapperComponent, (prevProps, nextProps) => {
  return (
    prevProps.isEnabled === nextProps.isEnabled &&
    prevProps.fieldPath === nextProps.fieldPath &&
    prevProps.fieldLabel === nextProps.fieldLabel &&
    prevProps.showIndicator === nextProps.showIndicator &&
    prevProps.className === nextProps.className &&
    prevProps.children === nextProps.children
  );
});

EditableWrapper.displayName = 'EditableWrapper';