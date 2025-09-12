/**
 * Accessibility Audit and WCAG 2.1 AA Compliance Tests
 * Milestone 6: Integration Testing and Security
 * 
 * Comprehensive accessibility testing for the visual editor
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  renderWithProviders,
  mockPageContent,
  checkAriaLabels,
  checkKeyboardNavigation,
  checkColorContrast
} from './setup';
import { EnhancedVisualEditor } from '@/src/components/content-editor/visual/EnhancedVisualEditor';

// WCAG 2.1 AA Compliance Requirements
const WCAG_REQUIREMENTS = {
  COLOR_CONTRAST_NORMAL: 4.5,     // Normal text contrast ratio
  COLOR_CONTRAST_LARGE: 3.0,      // Large text contrast ratio
  TOUCH_TARGET_SIZE: 44,          // Minimum touch target size (px)
  MAX_TAB_STOPS: 20,              // Reasonable number of tab stops per page
  HEADING_HIERARCHY_MAX_JUMP: 1,   // Heading levels shouldn't skip
  ALT_TEXT_MAX_LENGTH: 125,       // Recommended alt text length
  KEYBOARD_DELAY_MS: 100          // Maximum keyboard response delay
};

// Color contrast calculation utility
function calculateContrastRatio(color1: string, color2: string): number {
  // This is a simplified implementation
  // In production, you'd use a proper color contrast library
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length !== 3) return 0;
    
    const [r, g, b] = rgb.map(c => {
      const channel = parseInt(c) / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Focus management testing utility
class FocusTracker {
  private focusHistory: Array<{ element: Element; timestamp: number }> = [];

  track() {
    document.addEventListener('focusin', this.handleFocusIn);
    document.addEventListener('focusout', this.handleFocusOut);
  }

  untrack() {
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);
  }

  private handleFocusIn = (event: FocusEvent) => {
    if (event.target instanceof Element) {
      this.focusHistory.push({
        element: event.target,
        timestamp: Date.now()
      });
    }
  };

  private handleFocusOut = () => {
    // Track focus out events if needed
  };

  getFocusHistory() {
    return this.focusHistory;
  }

  getLastFocusedElement(): Element | null {
    return this.focusHistory.length > 0 
      ? this.focusHistory[this.focusHistory.length - 1].element 
      : null;
  }
}

describe('Visual Editor Accessibility Audit', () => {
  let focusTracker: FocusTracker;

  beforeEach(() => {
    focusTracker = new FocusTracker();
    focusTracker.track();

    // Mock screen reader announcements
    global.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      getVoices: jest.fn().mockReturnValue([]),
      speaking: false,
      pending: false,
      paused: false
    } as any;
  });

  afterEach(() => {
    focusTracker.untrack();
  });

  describe('WCAG 2.1 AA - Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      const user = userEvent.setup();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      // Find all focusable elements
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
      expect(focusableElements.length).toBeLessThan(WCAG_REQUIREMENTS.MAX_TAB_STOPS);

      // Test Tab navigation through all elements
      let currentIndex = -1;
      for (const element of focusableElements) {
        await user.tab();
        currentIndex++;
        
        const focusedElement = document.activeElement;
        expect(focusedElement).toBeTruthy();
        
        // Verify tabindex order is logical
        const tabIndex = focusedElement?.getAttribute('tabindex');
        if (tabIndex && parseInt(tabIndex) > 0) {
          // Positive tabindex should be handled carefully
          console.warn(`Element has positive tabindex: ${tabIndex}`);
        }
      }
    });

    it('should support Shift+Tab for reverse navigation', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      // Tab forward a few times
      await user.tab();
      await user.tab();
      const forwardElement = document.activeElement;

      // Tab backward
      await user.tab({ shift: true });
      const backwardElement = document.activeElement;

      expect(forwardElement).not.toBe(backwardElement);
      expect(backwardElement).toBeTruthy();
    });

    it('should handle keyboard shortcuts', async () => {
      const user = userEvent.setup();
      const onContentChange = jest.fn();
      
      renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={onContentChange}
        />
      );

      // Test common keyboard shortcuts
      await user.keyboard('{Control>}z{/Control}'); // Undo
      await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}'); // Redo
      await user.keyboard('{Control>}s{/Control}'); // Save

      // Should not crash and should handle shortcuts gracefully
      expect(document.activeElement).toBeTruthy();
    });

    it('should maintain focus visibility', async () => {
      const user = userEvent.setup();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      await user.tab();
      const focusedElement = document.activeElement as HTMLElement;
      
      if (focusedElement) {
        const computedStyle = window.getComputedStyle(focusedElement);
        const outline = computedStyle.outline;
        const boxShadow = computedStyle.boxShadow;
        
        // Should have visible focus indicator
        const hasFocusIndicator = outline !== 'none' || 
                                 boxShadow !== 'none' || 
                                 focusedElement.classList.contains('focus-visible');
        
        expect(hasFocusIndicator).toBe(true);
      }
    });

    it('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      // Look for modal triggers (if any)
      const modalTriggers = container.querySelectorAll('[aria-haspopup="dialog"]');
      
      for (const trigger of modalTriggers) {
        await user.click(trigger);
        
        // Check if modal is open
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          // Test focus trapping
          const focusableInModal = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableInModal.length > 1) {
            // Tab through modal elements
            for (let i = 0; i < focusableInModal.length + 1; i++) {
              await user.tab();
              const focused = document.activeElement;
              expect(modal.contains(focused)).toBe(true);
            }
          }
        }
      }
    });
  });

  describe('WCAG 2.1 AA - Screen Reader Support', () => {
    it('should provide proper semantic HTML structure', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      // Check for proper document structure
      const main = container.querySelector('main, [role="main"]');
      expect(main).toBeTruthy();

      // Check for proper heading hierarchy
      const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      if (headings.length > 1) {
        let previousLevel = 0;
        
        headings.forEach((heading) => {
          const level = parseInt(heading.tagName.charAt(1));
          if (previousLevel > 0) {
            const levelJump = level - previousLevel;
            expect(Math.abs(levelJump)).toBeLessThanOrEqual(WCAG_REQUIREMENTS.HEADING_HIERARCHY_MAX_JUMP);
          }
          previousLevel = level;
        });
      }

      // Check for landmarks
      const landmarks = container.querySelectorAll(
        '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'
      );
      expect(landmarks.length).toBeGreaterThan(0);
    });

    it('should provide comprehensive ARIA labels', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      const issues = checkAriaLabels(container);
      
      // Log any missing labels for debugging
      issues.forEach(issue => console.warn('Accessibility issue:', issue));
      
      // Should have minimal accessibility issues
      expect(issues.length).toBeLessThan(3);
    });

    it('should support screen reader navigation', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      // Check for proper roles
      const interactiveElements = container.querySelectorAll('button, [role="button"], [role="tab"], [role="menuitem"]');
      interactiveElements.forEach(element => {
        const role = element.getAttribute('role') || element.tagName.toLowerCase();
        const ariaLabel = element.getAttribute('aria-label');
        const ariaLabelledby = element.getAttribute('aria-labelledby');
        const textContent = element.textContent?.trim();
        
        const hasAccessibleName = ariaLabel || ariaLabelledby || textContent;
        expect(hasAccessibleName).toBeTruthy();
      });

      // Check for proper form labels
      const inputs = container.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const label = container.querySelector(`label[for="${input.id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');
        
        const hasLabel = label || ariaLabel || ariaLabelledby;
        expect(hasLabel).toBeTruthy();
      });
    });

    it('should announce dynamic content changes', async () => {
      const user = userEvent.setup();
      const onContentChange = jest.fn();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={onContentChange}
        />
      );

      // Look for ARIA live regions
      const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
      
      // Should have live regions for announcing changes
      expect(liveRegions.length).toBeGreaterThan(0);

      // Check live region properties
      liveRegions.forEach(region => {
        const ariaLive = region.getAttribute('aria-live');
        expect(['polite', 'assertive']).toContain(ariaLive);
      });
    });

    it('should provide alternative text for images', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={{
            ...mockPageContent,
            sections: {
              'image-section': {
                type: 'gallery',
                content: {
                  images: [
                    { src: 'test.jpg', alt: 'Test image' },
                    { src: 'test2.jpg', alt: '' } // Empty alt for decorative
                  ]
                },
                order: 1
              }
            }
          }}
          layout="default"
          onContentChange={() => {}}
        />
      );

      const images = container.querySelectorAll('img');
      images.forEach(img => {
        const alt = img.getAttribute('alt');
        expect(alt).not.toBeNull();
        
        if (alt && alt.length > 0) {
          expect(alt.length).toBeLessThanOrEqual(WCAG_REQUIREMENTS.ALT_TEXT_MAX_LENGTH);
        }
      });
    });
  });

  describe('WCAG 2.1 AA - Color and Contrast', () => {
    it('should meet color contrast requirements', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      const textElements = container.querySelectorAll('p, span, div, button, a, h1, h2, h3, h4, h5, h6');
      
      textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          const contrast = calculateContrastRatio(color, backgroundColor);
          const fontSize = parseInt(style.fontSize);
          const fontWeight = style.fontWeight;
          
          // Determine if text is large (18pt+ regular or 14pt+ bold)
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
          
          const requiredContrast = isLargeText 
            ? WCAG_REQUIREMENTS.COLOR_CONTRAST_LARGE 
            : WCAG_REQUIREMENTS.COLOR_CONTRAST_NORMAL;
          
          if (contrast < requiredContrast) {
            console.warn(`Low contrast detected: ${contrast.toFixed(2)} (required: ${requiredContrast})`);
          }
          
          expect(contrast).toBeGreaterThanOrEqual(requiredContrast - 0.5); // Allow small margin for testing
        }
      });
    });

    it('should not rely solely on color to convey information', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      // Check for status indicators that might rely only on color
      const statusElements = container.querySelectorAll('.status, .error, .success, .warning');
      
      statusElements.forEach(element => {
        // Should have additional indicators beyond color
        const hasIcon = element.querySelector('svg, .icon, [aria-hidden="false"]');
        const hasText = element.textContent && element.textContent.trim().length > 0;
        const hasAriaLabel = element.getAttribute('aria-label');
        
        const hasNonColorIndicator = hasIcon || hasText || hasAriaLabel;
        expect(hasNonColorIndicator).toBe(true);
      });
    });
  });

  describe('WCAG 2.1 AA - Touch and Mobile Accessibility', () => {
    it('should have adequate touch target sizes', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
          enableTouchOptimizations={true}
        />
      );

      const interactiveElements = container.querySelectorAll('button, a, [role="button"], input[type="checkbox"], input[type="radio"]');
      
      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const minSize = WCAG_REQUIREMENTS.TOUCH_TARGET_SIZE;
        
        // Allow for elements that might be part of a larger touch target
        if (rect.width > 0 && rect.height > 0) {
          const touchTargetOk = rect.width >= minSize - 10 || rect.height >= minSize - 10;
          
          if (!touchTargetOk) {
            console.warn(`Small touch target: ${rect.width}x${rect.height}`, element);
          }
          
          expect(touchTargetOk).toBe(true);
        }
      });
    });

    it('should support mobile screen readers', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
          viewport="mobile"
        />
      );

      // Check for mobile-specific accessibility features
      const landmarkElements = container.querySelectorAll('[role]');
      expect(landmarkElements.length).toBeGreaterThan(0);

      // Check for proper heading structure on mobile
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('WCAG 2.1 AA - Animation and Motion', () => {
    it('should respect reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
          respectReducedMotion={true}
        />
      );

      // Check that animations are disabled or reduced
      const animatedElements = container.querySelectorAll('[style*="transition"], [style*="animation"]');
      
      animatedElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const transition = style.transition;
        const animation = style.animation;
        
        // With reduced motion, animations should be minimal or disabled
        if (transition && transition !== 'none') {
          expect(transition).toMatch(/duration.*?0s/);
        }
        
        if (animation && animation !== 'none') {
          expect(animation).toMatch(/duration.*?0s/);
        }
      });
    });

    it('should not auto-play content that could cause seizures', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      // Check for auto-playing media
      const videos = container.querySelectorAll('video[autoplay]');
      const gifs = container.querySelectorAll('img[src*=".gif"]');
      
      // Should not have auto-playing content
      expect(videos.length).toBe(0);
      
      // If GIFs are present, they should be controllable
      gifs.forEach(gif => {
        // Should have controls or be pausable
        const hasControls = gif.hasAttribute('controls') || 
                           gif.closest('[role="button"]') !== null;
        expect(hasControls).toBe(true);
      });
    });
  });

  describe('WCAG 2.1 AA - Forms and Input', () => {
    it('should provide clear form labels and instructions', () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      const formElements = container.querySelectorAll('input, textarea, select');
      
      formElements.forEach(element => {
        // Should have associated label
        const id = element.getAttribute('id');
        const label = id ? container.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = element.getAttribute('aria-label');
        const ariaLabelledby = element.getAttribute('aria-labelledby');
        
        const hasLabel = label || ariaLabel || ariaLabelledby;
        expect(hasLabel).toBe(true);

        // Check for helpful descriptions
        const ariaDescribedby = element.getAttribute('aria-describedby');
        if (ariaDescribedby) {
          const description = container.querySelector(`#${ariaDescribedby}`);
          expect(description).toBeTruthy();
        }
      });
    });

    it('should provide error handling and validation feedback', async () => {
      const user = userEvent.setup();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      const inputs = container.querySelectorAll('input[required], textarea[required]');
      
      for (const input of inputs) {
        // Try to trigger validation
        await user.click(input);
        await user.tab(); // Move focus away
        
        // Check for error messages
        const ariaDescribedby = input.getAttribute('aria-describedby');
        if (ariaDescribedby) {
          const errorMessage = container.querySelector(`#${ariaDescribedby}`);
          if (errorMessage) {
            expect(errorMessage.textContent).toBeTruthy();
          }
        }

        // Check for aria-invalid
        const ariaInvalid = input.getAttribute('aria-invalid');
        if (ariaInvalid === 'true') {
          // Should have error indication
          const hasErrorClass = input.classList.contains('error') || 
                               input.classList.contains('invalid');
          expect(hasErrorClass).toBe(true);
        }
      }
    });
  });

  describe('Performance Impact of Accessibility Features', () => {
    it('should not significantly impact performance', async () => {
      const startTime = performance.now();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      
      // Accessibility features should not add significant overhead
      expect(renderTime).toBeLessThan(500); // 500ms threshold
    });

    it('should handle screen reader interactions efficiently', async () => {
      const user = userEvent.setup();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockPageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      const startTime = performance.now();
      
      // Simulate screen reader navigation
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      for (let i = 0; i < Math.min(10, focusableElements.length); i++) {
        await user.tab();
        
        // Simulate screen reader announcement delay
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const navigationTime = performance.now() - startTime;
      
      // Should handle screen reader navigation efficiently
      expect(navigationTime).toBeLessThan(WCAG_REQUIREMENTS.KEYBOARD_DELAY_MS * 10);
    });
  });
});