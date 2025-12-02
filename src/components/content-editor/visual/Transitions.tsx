'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';

/**
 * Smooth transition states for mode switching
 */
export enum TransitionState {
  IDLE = 'idle',
  ENTERING_EDIT = 'entering_edit',
  IN_EDIT = 'in_edit',
  EXITING_EDIT = 'exiting_edit',
  IN_VIEW = 'in_view'
}

/**
 * Animation presets for different transitions
 */
export const transitionPresets = {
  fast: {
    duration: 0.15,
    ease: [0.25, 0.46, 0.45, 0.94]
  },
  medium: {
    duration: 0.2,
    ease: [0.25, 0.46, 0.45, 0.94]
  },
  slow: {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94]
  },
  spring: {
    type: "spring",
    stiffness: 500,
    damping: 30
  }
} as const;

/**
 * Hook for managing transition states and animations
 */
export function useEditModeTransition(isEditing: boolean, delay = 0) {
  const [transitionState, setTransitionState] = useState<TransitionState>(
    isEditing ? TransitionState.IN_EDIT : TransitionState.IN_VIEW
  );
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isEditing && transitionState !== TransitionState.IN_EDIT) {
      setTransitionState(TransitionState.ENTERING_EDIT);

      timeoutRef.current = setTimeout(() => {
        setTransitionState(TransitionState.IN_EDIT);
      }, delay + 200); // 200ms for transition
    } else if (!isEditing && transitionState !== TransitionState.IN_VIEW) {
      setTransitionState(TransitionState.EXITING_EDIT);

      timeoutRef.current = setTimeout(() => {
        setTransitionState(TransitionState.IN_VIEW);
      }, delay + 200);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isEditing, delay, transitionState]);

  return {
    transitionState,
    isTransitioning: transitionState === TransitionState.ENTERING_EDIT ||
      transitionState === TransitionState.EXITING_EDIT,
    isInEditMode: transitionState === TransitionState.IN_EDIT ||
      transitionState === TransitionState.ENTERING_EDIT,
    isInViewMode: transitionState === TransitionState.IN_VIEW ||
      transitionState === TransitionState.EXITING_EDIT
  };
}

/**
 * Animated container for edit mode transitions using CSS
 */
interface EditModeContainerProps {
  isEditing: boolean;
  children: React.ReactNode;
  className?: string;
  animationPreset?: keyof typeof transitionPresets;
  onTransitionComplete?: (isEditing: boolean) => void;
}

export function EditModeContainer({
  isEditing,
  children,
  className,
  animationPreset = 'medium',
  onTransitionComplete
}: EditModeContainerProps) {
  const { transitionState, isTransitioning } = useEditModeTransition(isEditing);
  const [hasTransitioned, setHasTransitioned] = useState(false);

  const getTransitionClasses = () => {
    const preset = transitionPresets[animationPreset];
    // Spring preset doesn't have a fixed duration, default to 300ms
    const durationValue = 'duration' in preset ? preset.duration : 0.3;
    const duration = `duration-[${Math.round(durationValue * 1000)}ms]`;

    const baseClasses = `transition-all ${duration} ease-out`;

    switch (transitionState) {
      case TransitionState.ENTERING_EDIT:
        return `${baseClasses} scale-[1.02] opacity-95 rounded-lg ring-2 ring-violet-500/20`;
      case TransitionState.IN_EDIT:
        return `${baseClasses} scale-100 opacity-100 rounded-lg ring-2 ring-violet-500/50`;
      case TransitionState.EXITING_EDIT:
        return `${baseClasses} scale-[0.98] opacity-95 rounded ring-0 ring-violet-500/0`;
      default:
        return `${baseClasses} scale-100 opacity-100 rounded ring-0 ring-violet-500/0`;
    }
  };

  useEffect(() => {
    if (isTransitioning) {
      setHasTransitioned(true);
      const timer = setTimeout(() => {
        onTransitionComplete?.(isEditing);
        setHasTransitioned(false);
      }, ('duration' in transitionPresets[animationPreset] ? transitionPresets[animationPreset].duration : 0.3) * 1000);

      return () => clearTimeout(timer);
    }
  }, [isTransitioning, isEditing, onTransitionComplete, animationPreset]);

  return (
    <div
      className={cn(
        'transition-container relative',
        getTransitionClasses(),
        isTransitioning && 'pointer-events-none',
        className
      )}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      {children}
    </div>
  );
}

/**
 * Fade transition component for content switching using CSS
 */
interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function FadeTransition({
  show,
  children,
  className,
  duration = 200
}: FadeTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay to ensure DOM is updated before showing
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), duration);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        'transition-opacity ease-in-out',
        `duration-[${duration}ms]`,
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Slide transition for sidebar panels using CSS
 */
interface SlideTransitionProps {
  show: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function SlideTransition({
  show,
  direction = 'right',
  children,
  className,
  duration = 200
}: SlideTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), duration);
    }
  }, [show, duration]);

  const getSlideClasses = () => {
    const baseClasses = `transition-all ease-out duration-[${duration}ms]`;

    if (!isVisible) {
      const hiddenClasses = {
        left: '-translate-x-full opacity-0',
        right: 'translate-x-full opacity-0',
        up: '-translate-y-full opacity-0',
        down: 'translate-y-full opacity-0'
      };
      return `${baseClasses} ${hiddenClasses[direction]}`;
    }

    return `${baseClasses} translate-x-0 translate-y-0 opacity-100`;
  };

  if (!shouldRender) return null;

  return (
    <div className={cn(getSlideClasses(), className)}>
      {children}
    </div>
  );
}

/**
 * Scale transition for modals and overlays
 */
interface ScaleTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
  origin?: 'center' | 'top' | 'bottom';
}

export function ScaleTransition({
  show,
  children,
  className,
  duration = 200,
  origin = 'center'
}: ScaleTransitionProps) {
  const originClasses = {
    center: 'origin-center',
    top: 'origin-top',
    bottom: 'origin-bottom'
  };

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={cn(originClasses[origin], className)}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{
            duration: duration / 1000,
            ease: transitionPresets.medium.ease
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Stagger children animation for lists
 */
interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className
}: StaggerContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: transitionPresets.medium
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Loading spinner with smooth transitions
 */
interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function LoadingTransition({
  isLoading,
  children,
  fallback = <div className="h-32 bg-gray-100 rounded animate-pulse" />,
  className
}: LoadingTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {fallback}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          className={className}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            ease: transitionPresets.medium.ease
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * CSS-only transitions for better performance (fallback for low-end devices)
 */
export const cssTransitions = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  slideInRight: 'animate-in slide-in-from-right duration-200',
  slideOutRight: 'animate-out slide-out-to-right duration-200',
  slideInLeft: 'animate-in slide-in-from-left duration-200',
  slideOutLeft: 'animate-out slide-out-to-left duration-200',
  slideInUp: 'animate-in slide-in-from-bottom duration-200',
  slideOutDown: 'animate-out slide-out-to-bottom duration-200',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200'
};

/**
 * Performance-aware transition wrapper
 */
interface PerformantTransitionProps {
  children: React.ReactNode;
  className?: string;
  useCSS?: boolean;
  cssTransition?: keyof typeof cssTransitions;
}

export function PerformantTransition({
  children,
  className,
  useCSS = false,
  cssTransition = 'fadeIn'
}: PerformantTransitionProps) {
  if (useCSS) {
    return (
      <div className={cn(cssTransitions[cssTransition], className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hook for detecting reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Global transition settings
 */
export const transitionConfig = {
  // Standard durations in milliseconds
  durations: {
    fast: 150,
    medium: 200,
    slow: 300,
    extraSlow: 500
  },

  // Easing functions
  easings: {
    easeOut: [0.25, 0.46, 0.45, 0.94],
    easeInOut: [0.25, 0.46, 0.45, 0.94],
    spring: { type: "spring", stiffness: 500, damping: 30 },
    bounce: { type: "spring", stiffness: 300, damping: 10 }
  },

  // Common animation variants
  variants: {
    page: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    modal: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    },
    sidebar: {
      initial: { x: -300, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -300, opacity: 0 }
    }
  }
};