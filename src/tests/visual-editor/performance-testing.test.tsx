/**
 * Performance Testing Suite for Visual Editor
 * Milestone 6: Integration Testing and Security
 * 
 * Tests performance with realistic content sizes and usage patterns
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  renderWithProviders,
  mockLargePageContent,
  createPerformanceContentSections,
  MemoryTestHelper,
  measureAnimationPerformance,
  NetworkSimulator
} from './setup';
import { EnhancedVisualEditor } from '@/src/components/content-editor/visual/EnhancedVisualEditor';
import { PageContent } from '@/lib/content/schema';

// Performance benchmarks
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_MS: 1000,      // Initial render should be under 1s
  MEMORY_LIMIT_MB: 100,       // Memory usage should stay under 100MB
  SCROLL_FPS: 30,            // Scrolling should maintain at least 30 FPS
  INTERACTION_DELAY_MS: 100,  // User interactions should respond within 100ms
  AUTO_SAVE_DELAY_MS: 2000,  // Auto-save should complete within 2s
  LARGE_CONTENT_SECTIONS: 100 // Test with up to 100 sections
};

// Mock performance monitoring
const mockPerformanceObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn().mockReturnValue([])
};

// Performance testing utilities
class PerformanceBenchmark {
  private measurements: Array<{
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    data?: any;
  }> = [];

  start(name: string, data?: any): void {
    this.measurements.push({
      name,
      startTime: performance.now(),
      data
    });
  }

  end(name: string): number {
    const measurement = this.measurements.find(m => m.name === name && !m.endTime);
    if (measurement) {
      measurement.endTime = performance.now();
      measurement.duration = measurement.endTime - measurement.startTime;
      return measurement.duration;
    }
    return 0;
  }

  getResults() {
    return this.measurements.filter(m => m.duration !== undefined);
  }

  getAverageDuration(name: string): number {
    const measurements = this.measurements.filter(m => m.name === name && m.duration);
    if (measurements.length === 0) return 0;
    
    const total = measurements.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / measurements.length;
  }
}

describe('Visual Editor Performance Tests', () => {
  let benchmark: PerformanceBenchmark;
  let memoryHelper: MemoryTestHelper;
  let networkSimulator: NetworkSimulator;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
    memoryHelper = new MemoryTestHelper();
    networkSimulator = new NetworkSimulator();

    // Mock performance APIs
    global.PerformanceObserver = jest.fn().mockImplementation(() => mockPerformanceObserver);
    
    // Mock IntersectionObserver for virtualization
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn().mockImplementation(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    networkSimulator.disable();
  });

  describe('Initial Render Performance', () => {
    it('should render small content quickly', async () => {
      const smallContent = {
        ...mockLargePageContent,
        sections: Object.fromEntries(
          Object.entries(mockLargePageContent.sections).slice(0, 5)
        )
      };

      benchmark.start('small-content-render');
      memoryHelper.startMeasuring();

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={smallContent}
          layout="default"
          onContentChange={() => {}}
          enablePerformanceMonitoring={true}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      });

      const renderTime = benchmark.end('small-content-render');
      memoryHelper.measure('after-small-render');

      console.log(`Small content render time: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS / 2); // Should be much faster for small content
    });

    it('should render medium content within acceptable time', async () => {
      const mediumContent = {
        ...mockLargePageContent,
        sections: Object.fromEntries(
          Object.entries(mockLargePageContent.sections).slice(0, 25)
        )
      };

      benchmark.start('medium-content-render');
      memoryHelper.startMeasuring();

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mediumContent}
          layout="default"
          onContentChange={() => {}}
          enableVirtualization={true}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      }, { timeout: PERFORMANCE_THRESHOLDS.RENDER_TIME_MS });

      const renderTime = benchmark.end('medium-content-render');
      memoryHelper.measure('after-medium-render');

      console.log(`Medium content render time: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS);
    });

    it('should handle large content with virtualization', async () => {
      const largeContent = mockLargePageContent; // 55 sections

      benchmark.start('large-content-render');
      memoryHelper.startMeasuring();

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={largeContent}
          layout="default"
          onContentChange={() => {}}
          enableVirtualization={true}
          enableMemoryMonitoring={true}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      }, { timeout: PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 2 });

      const renderTime = benchmark.end('large-content-render');
      memoryHelper.measure('after-large-render');

      console.log(`Large content render time: ${renderTime.toFixed(2)}ms`);
      
      // Should render within reasonable time even with virtualization overhead
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS * 1.5);

      // Should not render all sections at once (virtualization working)
      const renderedSections = container.querySelectorAll('.section-content');
      expect(renderedSections.length).toBeLessThan(Object.keys(largeContent.sections).length);
    });

    it('should handle extremely large content efficiently', async () => {
      const extremelyLargeContent: PageContent = {
        title: 'Performance Test',
        subtitle: 'Extreme Load Test',
        seo: { title: 'Test', description: 'Test', keywords: [] },
        sections: Array.from({ length: PERFORMANCE_THRESHOLDS.LARGE_CONTENT_SECTIONS }, (_, i) => [
          `section-${i}`,
          {
            type: 'content',
            content: {
              title: `Section ${i}`,
              description: `Performance test section ${i} with lots of content to simulate real-world usage patterns and stress test the editor.`,
              items: Array.from({ length: 5 }, (_, j) => ({
                title: `Item ${j}`,
                description: `Item description ${j} with more content`
              }))
            },
            order: i + 1
          }
        ]).reduce((acc, [key, section]) => {
          acc[key as string] = section;
          return acc;
        }, {} as Record<string, any>)
      };

      benchmark.start('extreme-content-render');
      memoryHelper.startMeasuring();

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={extremelyLargeContent}
          layout="default"
          onContentChange={() => {}}
          enableVirtualization={true}
          enableMemoryMonitoring={true}
          maxMemoryUsage={150}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      }, { timeout: 5000 });

      const renderTime = benchmark.end('extreme-content-render');
      memoryHelper.measure('after-extreme-render');
      const memoryReport = memoryHelper.getMemoryReport();

      console.log(`Extreme content render time: ${renderTime.toFixed(2)}ms`);
      console.log(`Memory usage: ${JSON.stringify(memoryReport, null, 2)}`);

      // Should still render within reasonable time
      expect(renderTime).toBeLessThan(3000);

      // Memory usage should be controlled
      expect(memoryReport.totalDelta).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LIMIT_MB * 1024 * 1024);
    });
  });

  describe('Scrolling Performance', () => {
    it('should maintain smooth scrolling with many sections', async () => {
      const largeContent = mockLargePageContent;

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={largeContent}
          layout="default"
          onContentChange={() => {}}
          enableVirtualization={true}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      });

      const editor = container.querySelector('.enhanced-visual-editor') as HTMLElement;
      
      // Measure scrolling performance
      const fps = await measureAnimationPerformance(() => {
        // Simulate smooth scrolling
        for (let i = 0; i < 10; i++) {
          fireEvent.scroll(editor, { target: { scrollTop: i * 100 } });
        }
      });

      console.log(`Scrolling FPS: ${fps.toFixed(2)}`);
      expect(fps).toBeGreaterThan(PERFORMANCE_THRESHOLDS.SCROLL_FPS);
    });

    it('should handle rapid scrolling without performance degradation', async () => {
      const largeContent = mockLargePageContent;

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={largeContent}
          layout="default"
          onContentChange={() => {}}
          enableVirtualization={true}
        />
      );

      const editor = container.querySelector('.enhanced-visual-editor') as HTMLElement;
      
      benchmark.start('rapid-scroll');
      memoryHelper.startMeasuring();

      // Simulate rapid scrolling
      for (let i = 0; i < 50; i++) {
        fireEvent.scroll(editor, { target: { scrollTop: Math.random() * 5000 } });
      }

      const scrollTime = benchmark.end('rapid-scroll');
      memoryHelper.measure('after-rapid-scroll');

      console.log(`Rapid scroll time: ${scrollTime.toFixed(2)}ms`);
      expect(scrollTime).toBeLessThan(500); // Should handle rapid scrolling quickly
    });
  });

  describe('Interaction Performance', () => {
    it('should respond to clicks quickly', async () => {
      const user = userEvent.setup();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      });

      const sections = container.querySelectorAll('.section-content');
      
      // Test multiple click interactions
      for (let i = 0; i < Math.min(5, sections.length); i++) {
        benchmark.start(`click-response-${i}`);
        
        await user.click(sections[i] as HTMLElement);
        
        benchmark.end(`click-response-${i}`);
      }

      const averageClickTime = benchmark.getAverageDuration('click-response-0');
      console.log(`Average click response time: ${averageClickTime.toFixed(2)}ms`);
      
      expect(averageClickTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_DELAY_MS);
    });

    it('should handle rapid typing without lag', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      const onContentChange = jest.fn();
      
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={onContentChange}
        />
      );

      const section = container.querySelector('.section-content') as HTMLElement;
      await user.click(section);

      benchmark.start('rapid-typing');

      // Simulate rapid typing
      const text = 'This is a test of rapid typing performance in the visual editor';
      for (const char of text) {
        fireEvent.input(section, { target: { textContent: section.textContent + char } });
      }

      const typingTime = benchmark.end('rapid-typing');
      
      console.log(`Rapid typing time: ${typingTime.toFixed(2)}ms`);
      expect(typingTime).toBeLessThan(100); // Should handle rapid typing smoothly

      jest.useRealTimers();
    });

    it('should handle drag and drop operations efficiently', async () => {
      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      const sections = container.querySelectorAll('.section-content');
      
      if (sections.length >= 2) {
        benchmark.start('drag-drop-operation');
        
        // Simulate drag and drop
        fireEvent.dragStart(sections[0]);
        fireEvent.dragOver(sections[1]);
        fireEvent.drop(sections[1]);
        
        const dragTime = benchmark.end('drag-drop-operation');
        
        console.log(`Drag and drop time: ${dragTime.toFixed(2)}ms`);
        expect(dragTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_DELAY_MS);
      }
    });
  });

  describe('Auto-save Performance', () => {
    it('should auto-save efficiently under normal load', async () => {
      jest.useFakeTimers();
      const onContentChange = jest.fn();
      networkSimulator.setDelay(100); // Simulate network latency
      networkSimulator.enable();

      renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={onContentChange}
        />
      );

      benchmark.start('auto-save-operation');
      
      // Trigger content change
      act(() => {
        onContentChange({
          ...mockLargePageContent,
          sections: {
            ...mockLargePageContent.sections,
            'new-section': { type: 'content', content: { title: 'New' }, order: 100 }
          }
        });
      });

      // Wait for auto-save delay
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const autoSaveTime = benchmark.end('auto-save-operation');
      
      console.log(`Auto-save time: ${autoSaveTime.toFixed(2)}ms`);
      expect(autoSaveTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTO_SAVE_DELAY_MS);

      jest.useRealTimers();
    });

    it('should handle auto-save with slow network', async () => {
      jest.useFakeTimers();
      const onContentChange = jest.fn();
      networkSimulator.setDelay(1000); // Slow network
      networkSimulator.enable();

      renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={onContentChange}
        />
      );

      // Should not block UI during slow save
      act(() => {
        onContentChange(mockLargePageContent);
        jest.advanceTimersByTime(2000);
      });

      // UI should remain responsive
      expect(document.querySelector('.enhanced-visual-editor')).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during normal operations', async () => {
      memoryHelper.startMeasuring();
      
      const { unmount } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={() => {}}
          enableMemoryMonitoring={true}
        />
      );

      memoryHelper.measure('after-mount');

      // Simulate multiple operations
      for (let i = 0; i < 10; i++) {
        const sections = document.querySelectorAll('.section-content');
        if (sections.length > 0) {
          fireEvent.click(sections[0]);
        }
        memoryHelper.measure(`operation-${i}`);
      }

      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      memoryHelper.measure('after-unmount');
      const memoryReport = memoryHelper.getMemoryReport();

      console.log('Memory usage report:', memoryReport);

      // Memory should not grow excessively
      expect(memoryReport.totalDelta).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LIMIT_MB * 1024 * 1024);
    });

    it('should clean up resources on unmount', async () => {
      const { unmount } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={() => {}}
          enableMemoryMonitoring={true}
        />
      );

      // Verify component is mounted
      expect(document.querySelector('.enhanced-visual-editor')).toBeInTheDocument();

      unmount();

      // Verify cleanup
      expect(document.querySelector('.enhanced-visual-editor')).not.toBeInTheDocument();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous interactions', async () => {
      const user = userEvent.setup();
      const onContentChange = jest.fn();

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={onContentChange}
        />
      );

      const sections = container.querySelectorAll('.section-content');

      benchmark.start('concurrent-operations');

      // Simulate multiple concurrent interactions
      const promises = [];
      for (let i = 0; i < Math.min(5, sections.length); i++) {
        promises.push(user.click(sections[i] as HTMLElement));
      }

      await Promise.all(promises);

      const concurrentTime = benchmark.end('concurrent-operations');
      
      console.log(`Concurrent operations time: ${concurrentTime.toFixed(2)}ms`);
      expect(concurrentTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_DELAY_MS * 2);
    });

    it('should maintain performance under stress load', async () => {
      const onContentChange = jest.fn();

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={onContentChange}
          enableMemoryMonitoring={true}
        />
      );

      benchmark.start('stress-test');
      memoryHelper.startMeasuring();

      // Simulate stress conditions
      for (let i = 0; i < 50; i++) {
        // Random interactions
        const sections = container.querySelectorAll('.section-content');
        if (sections.length > 0) {
          const randomSection = sections[Math.floor(Math.random() * sections.length)];
          fireEvent.click(randomSection);
        }

        // Random scrolling
        const editor = container.querySelector('.enhanced-visual-editor') as HTMLElement;
        fireEvent.scroll(editor, { target: { scrollTop: Math.random() * 1000 } });

        if (i % 10 === 0) {
          memoryHelper.measure(`stress-${i}`);
        }
      }

      const stressTime = benchmark.end('stress-test');
      const memoryReport = memoryHelper.getMemoryReport();

      console.log(`Stress test time: ${stressTime.toFixed(2)}ms`);
      console.log(`Stress test memory delta: ${memoryReport.totalDelta / 1024 / 1024} MB`);

      // Should handle stress reasonably well
      expect(stressTime).toBeLessThan(2000);
      expect(memoryReport.totalDelta).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LIMIT_MB * 1024 * 1024);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should benchmark key operations for regression testing', async () => {
      const benchmarks = {
        initialRender: 0,
        firstInteraction: 0,
        scrollPerformance: 0,
        memoryUsage: 0
      };

      // Initial render benchmark
      benchmark.start('regression-render');
      memoryHelper.startMeasuring();

      const { container } = renderWithProviders(
        <EnhancedVisualEditor
          content={mockLargePageContent}
          layout="default"
          onContentChange={() => {}}
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.enhanced-visual-editor')).toBeInTheDocument();
      });

      benchmarks.initialRender = benchmark.end('regression-render');
      memoryHelper.measure('regression-after-render');

      // First interaction benchmark
      benchmark.start('regression-interaction');
      const firstSection = container.querySelector('.section-content') as HTMLElement;
      fireEvent.click(firstSection);
      benchmarks.firstInteraction = benchmark.end('regression-interaction');

      // Scroll performance benchmark
      const fps = await measureAnimationPerformance(() => {
        const editor = container.querySelector('.enhanced-visual-editor') as HTMLElement;
        fireEvent.scroll(editor, { target: { scrollTop: 500 } });
      });
      benchmarks.scrollPerformance = fps;

      // Memory usage
      const memoryReport = memoryHelper.getMemoryReport();
      benchmarks.memoryUsage = memoryReport.totalDelta / 1024 / 1024; // MB

      console.log('Performance Benchmarks:', benchmarks);

      // Store benchmarks for regression comparison
      expect(benchmarks.initialRender).toBeGreaterThan(0);
      expect(benchmarks.firstInteraction).toBeGreaterThan(0);
      expect(benchmarks.scrollPerformance).toBeGreaterThan(0);

      // Assert against thresholds
      expect(benchmarks.initialRender).toBeLessThan(PERFORMANCE_THRESHOLDS.RENDER_TIME_MS);
      expect(benchmarks.firstInteraction).toBeLessThan(PERFORMANCE_THRESHOLDS.INTERACTION_DELAY_MS);
      expect(benchmarks.scrollPerformance).toBeGreaterThan(PERFORMANCE_THRESHOLDS.SCROLL_FPS);
      expect(benchmarks.memoryUsage).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LIMIT_MB);
    });
  });
});