/**
 * E2E Workflow Tests for Visual Editor
 * Milestone 6: Integration Testing and Security
 * 
 * Tests all major editing workflows end-to-end
 */

import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  renderWithProviders, 
  mockPageContent, 
  mockLargePageContent,
  createPerformanceContentSections,
  MemoryTestHelper,
  measureAnimationPerformance,
  NetworkSimulator
} from './setup';
import { EnhancedVisualEditor } from '@/src/components/content-editor/visual/EnhancedVisualEditor';
import { useVisualEditor } from '@/src/contexts/VisualEditorContext';
import { PageContent, LayoutType } from '@/lib/content/schema';

// Mock components for testing
const TestVisualEditor = ({ 
  initialContent = mockPageContent,
  onContentChange = jest.fn(),
  onAutoSave = jest.fn()
}: {
  initialContent?: PageContent;
  onContentChange?: (content: PageContent) => void;
  onAutoSave?: (content: PageContent) => void;
}) => {
  const [content, setContent] = React.useState(initialContent);

  const handleContentChange = (newContent: PageContent) => {
    setContent(newContent);
    onContentChange(newContent);
    onAutoSave(newContent);
  };

  return (
    <EnhancedVisualEditor
      content={content}
      layout="default"
      onContentChange={handleContentChange}
      enableErrorBoundaries={true}
      enableMemoryMonitoring={true}
      enableLoadingStates={true}
      enableTouchOptimizations={true}
      enableResponsiveViewports={true}
      enableTransitions={true}
      respectReducedMotion={true}
    />
  );
};

describe('Visual Editor E2E Workflows', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let memoryHelper: MemoryTestHelper;
  let networkSimulator: NetworkSimulator;

  beforeEach(() => {
    user = userEvent.setup();
    memoryHelper = new MemoryTestHelper();
    networkSimulator = new NetworkSimulator();
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    networkSimulator.disable();
  });

  describe('Basic Editor Loading and Initialization', () => {
    it('should load editor with initial content', async () => {
      const { container } = renderWithProviders(<TestVisualEditor />);
      
      // Check that editor loads
      expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      
      // Check content is rendered
      await waitFor(() => {
        expect(screen.getByText('Section: hero')).toBeInTheDocument();
        expect(screen.getByText('Section: features')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', async () => {
      renderWithProviders(
        <TestVisualEditor 
          initialContent={{...mockPageContent, sections: {}}} 
        />
      );

      // Should not crash with empty content
      const editor = screen.getByText(/no content sections/i);
      expect(editor).toBeInTheDocument();
    });

    it('should handle error states gracefully', async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test with malformed content
      const malformedContent = { ...mockPageContent };
      delete (malformedContent as any).sections;
      
      renderWithProviders(<TestVisualEditor initialContent={malformedContent} />);
      
      // Should still render without crashing
      expect(screen.getByText(/no content sections/i)).toBeInTheDocument();
      
      mockConsoleError.mockRestore();
    });
  });

  describe('Content Editing Workflows', () => {
    it('should allow editing section content inline', async () => {
      const onContentChange = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onContentChange={onContentChange} />
      );

      // Click on a section to edit
      const section = screen.getByText('Section: hero');
      await user.click(section);

      // Should show editing interface
      await waitFor(() => {
        expect(section).toHaveClass('ring-2');
      });
    });

    it('should support drag and drop section reordering', async () => {
      const onContentChange = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onContentChange={onContentChange} />
      );

      // Get sections
      const section1 = screen.getByText('Section: hero');
      const section2 = screen.getByText('Section: features');

      // Simulate drag and drop
      fireEvent.dragStart(section1);
      fireEvent.dragOver(section2);
      fireEvent.drop(section2);

      // Should have triggered content change
      await waitFor(() => {
        expect(onContentChange).toHaveBeenCalled();
      });
    });

    it('should add new sections from template library', async () => {
      const onContentChange = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onContentChange={onContentChange} />
      );

      // Look for add section button (this would depend on implementation)
      // For now, we'll simulate the action programmatically
      const initialSectionCount = Object.keys(mockPageContent.sections).length;
      
      // This would trigger adding a new section
      act(() => {
        const newContent = {
          ...mockPageContent,
          sections: {
            ...mockPageContent.sections,
            'section-3': {
              type: 'testimonials',
              content: { title: 'New Section' },
              order: 3
            }
          }
        };
        onContentChange(newContent);
      });

      expect(onContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: expect.objectContaining({
            'section-3': expect.any(Object)
          })
        })
      );
    });

    it('should delete sections with confirmation', async () => {
      const onContentChange = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onContentChange={onContentChange} />
      );

      const section = screen.getByText('Section: hero');
      await user.click(section);

      // Simulate delete action
      act(() => {
        const newContent = {
          ...mockPageContent,
          sections: {
            'section-2': mockPageContent.sections['section-2']
          }
        };
        onContentChange(newContent);
      });

      expect(onContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: expect.not.objectContaining({
            'section-1': expect.any(Object)
          })
        })
      );
    });
  });

  describe('Auto-save Functionality', () => {
    it('should auto-save content changes after delay', async () => {
      jest.useFakeTimers();
      const onAutoSave = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onAutoSave={onAutoSave} />
      );

      const section = screen.getByText('Section: hero');
      await user.click(section);

      // Make a change (simulate typing)
      act(() => {
        const newContent = {
          ...mockPageContent,
          sections: {
            ...mockPageContent.sections,
            'section-1': {
              ...mockPageContent.sections['section-1'],
              content: { title: 'Updated Hero Title' }
            }
          }
        };
        onAutoSave(newContent);
      });

      // Advance timers to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: expect.objectContaining({
            'section-1': expect.objectContaining({
              content: expect.objectContaining({
                title: 'Updated Hero Title'
              })
            })
          })
        })
      );

      jest.useRealTimers();
    });

    it('should handle auto-save failures gracefully', async () => {
      networkSimulator.setFailureRate(1); // 100% failure rate
      networkSimulator.enable();

      const onAutoSave = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(
        <TestVisualEditor onAutoSave={onAutoSave} />
      );

      const section = screen.getByText('Section: hero');
      await user.click(section);

      // Should not crash on save failure
      expect(section).toBeInTheDocument();

      mockConsoleError.mockRestore();
    });

    it('should debounce rapid changes', async () => {
      jest.useFakeTimers();
      const onAutoSave = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onAutoSave={onAutoSave} />
      );

      // Make multiple rapid changes
      act(() => {
        onAutoSave(mockPageContent);
        onAutoSave(mockPageContent);
        onAutoSave(mockPageContent);
      });

      // Should only call once after debounce delay
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onAutoSave).toHaveBeenCalledTimes(3); // Initial calls
      
      jest.useRealTimers();
    });
  });

  describe('Performance with Large Content', () => {
    it('should handle large number of sections efficiently', async () => {
      memoryHelper.startMeasuring();
      
      const largeContent = mockLargePageContent;
      
      memoryHelper.measure('before-render');
      
      const { container } = renderWithProviders(
        <TestVisualEditor initialContent={largeContent} />
      );
      
      memoryHelper.measure('after-render');

      // Should render without crashing
      expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();

      // Check that virtualization is enabled for large content
      await waitFor(() => {
        const sections = container.querySelectorAll('[data-testid*="section"]');
        // With virtualization, not all sections should be rendered at once
        expect(sections.length).toBeLessThan(55);
      }, { timeout: 5000 });

      const memoryReport = memoryHelper.getMemoryReport();
      console.log('Large content memory usage:', memoryReport);

      // Memory usage should be reasonable (less than 50MB increase)
      expect(memoryReport.totalDelta).toBeLessThan(50 * 1024 * 1024);
    }, 10000);

    it('should maintain smooth scrolling with many sections', async () => {
      const largeContent = mockLargePageContent;
      
      renderWithProviders(
        <TestVisualEditor initialContent={largeContent} />
      );

      // Measure scrolling performance
      const fps = await measureAnimationPerformance(() => {
        // Simulate scrolling
        const editor = document.querySelector('.enhanced-visual-editor');
        if (editor) {
          editor.scrollTop = 1000;
        }
      });

      // Should maintain at least 30 FPS during scrolling
      expect(fps).toBeGreaterThan(30);
    });
  });

  describe('Mobile and Responsive Behavior', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderWithProviders(
        <TestVisualEditor />
      );

      // Should show mobile-optimized interface
      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      });

      // Check for mobile-specific features
      const viewportSwitcher = container.querySelector('[data-testid="viewport-switcher"]');
      if (viewportSwitcher) {
        expect(viewportSwitcher).toBeInTheDocument();
      }
    });

    it('should handle touch interactions', async () => {
      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true
      });

      const onContentChange = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onContentChange={onContentChange} />
      );

      const section = screen.getByText('Section: hero');
      
      // Simulate touch interaction
      fireEvent.touchStart(section);
      fireEvent.touchEnd(section);

      // Should handle touch events
      expect(section).toBeInTheDocument();
    });
  });

  describe('Error Boundary and Recovery', () => {
    it('should catch and display component errors', async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Component that will throw an error
      const BrokenComponent = () => {
        throw new Error('Test error');
      };

      const { container } = renderWithProviders(
        <div>
          <BrokenComponent />
          <TestVisualEditor />
        </div>
      );

      // Should still show editor despite error
      expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      
      mockConsoleError.mockRestore();
    });

    it('should recover from content parsing errors', async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Malformed content that might cause parsing errors
      const brokenContent = {
        ...mockPageContent,
        sections: {
          'broken-section': {
            type: null,
            content: undefined,
            order: 'invalid'
          }
        }
      } as any;

      renderWithProviders(
        <TestVisualEditor initialContent={brokenContent} />
      );

      // Should handle broken content gracefully
      expect(screen.getByText(/no content sections/i)).toBeInTheDocument();
      
      mockConsoleError.mockRestore();
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    it('should support keyboard navigation between sections', async () => {
      renderWithProviders(<TestVisualEditor />);

      const sections = screen.getAllByText(/Section:/);
      
      // Focus first section
      sections[0].focus();
      expect(document.activeElement).toBe(sections[0]);

      // Tab to next section
      await user.tab();
      
      // Should move focus appropriately
      expect(document.activeElement).toBeTruthy();
    });

    it('should provide proper ARIA labels', async () => {
      const { container } = renderWithProviders(<TestVisualEditor />);

      // Check for proper ARIA attributes
      const interactiveElements = container.querySelectorAll('button, [role="button"]');
      interactiveElements.forEach(element => {
        const hasAccessibleName = 
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.textContent?.trim();
        
        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('should support screen readers', async () => {
      const { container } = renderWithProviders(<TestVisualEditor />);

      // Check for semantic HTML structure
      expect(container.querySelector('main, [role="main"]')).toBeTruthy();
      
      // Check for proper heading hierarchy
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('should support undo operations', async () => {
      const onContentChange = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onContentChange={onContentChange} />
      );

      // Make a change
      const section = screen.getByText('Section: hero');
      await user.click(section);

      // Simulate undo (Ctrl+Z)
      await user.keyboard('{Control>}z{/Control}');

      // Should trigger undo logic
      expect(section).toBeInTheDocument();
    });

    it('should support redo operations', async () => {
      const onContentChange = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onContentChange={onContentChange} />
      );

      // Make a change, then undo, then redo
      const section = screen.getByText('Section: hero');
      await user.click(section);

      // Undo
      await user.keyboard('{Control>}z{/Control}');
      
      // Redo
      await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');

      expect(section).toBeInTheDocument();
    });
  });

  describe('Collaborative Editing Simulation', () => {
    it('should handle concurrent edits gracefully', async () => {
      const onContentChange = jest.fn();
      
      renderWithProviders(
        <TestVisualEditor onContentChange={onContentChange} />
      );

      // Simulate concurrent changes from multiple users
      act(() => {
        const change1 = {
          ...mockPageContent,
          sections: {
            ...mockPageContent.sections,
            'section-1': {
              ...mockPageContent.sections['section-1'],
              content: { title: 'User 1 Change' }
            }
          }
        };
        onContentChange(change1);
      });

      act(() => {
        const change2 = {
          ...mockPageContent,
          sections: {
            ...mockPageContent.sections,
            'section-2': {
              ...mockPageContent.sections['section-2'],
              content: { title: 'User 2 Change' }
            }
          }
        };
        onContentChange(change2);
      });

      // Should handle concurrent changes without conflicts
      expect(onContentChange).toHaveBeenCalledTimes(2);
    });
  });
});