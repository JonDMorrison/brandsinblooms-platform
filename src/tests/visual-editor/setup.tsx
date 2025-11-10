/**
 * Test setup utilities for Visual Editor testing
 * Milestone 6: Integration Testing and Security
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { VisualEditorProvider } from '@/contexts/VisualEditorContext';
import { EditModeProvider } from '@/contexts/EditModeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageContent, LayoutType } from '@/src/lib/content/schema';

// Mock data for testing
export const mockPageContent: PageContent = {
  title: 'Test Page',
  subtitle: 'Test Subtitle',
  seo: {
    title: 'Test SEO Title',
    description: 'Test SEO Description',
    keywords: []
  },
  sections: {
    'section-1': {
      type: 'hero',
      content: {
        title: 'Hero Title',
        subtitle: 'Hero Subtitle',
        buttonText: 'Click Me'
      },
      order: 1
    },
    'section-2': {
      type: 'features',
      content: {
        title: 'Features',
        items: [
          { title: 'Feature 1', description: 'Description 1' },
          { title: 'Feature 2', description: 'Description 2' }
        ]
      },
      order: 2
    }
  }
};

export const mockLargePageContent: PageContent = {
  title: 'Large Test Page',
  subtitle: 'Performance Testing',
  seo: {
    title: 'Large Test Page',
    description: 'Testing with large content',
    keywords: []
  },
  sections: Array.from({ length: 55 }, (_, i) => [`section-${i}`, {
    type: i % 3 === 0 ? 'hero' : i % 3 === 1 ? 'features' : 'testimonials',
    content: {
      title: `Section ${i} Title`,
      subtitle: `Section ${i} Subtitle`,
      description: `This is section ${i} with some content for performance testing.`
    },
    order: i + 1
  }]).reduce((acc, [key, section]) => {
    acc[key as string] = section;
    return acc;
  }, {} as Record<string, any>)
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialContent?: PageContent;
  layout?: LayoutType;
  editMode?: 'inline' | 'sidebar' | 'disabled';
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialContent = mockPageContent,
    layout = 'default',
    editMode = 'inline',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <EditModeProvider defaultMode={editMode}>
          <VisualEditorProvider>
            {children}
          </VisualEditorProvider>
        </EditModeProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Security testing helpers
export const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  'javascript:alert("XSS")',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  '<object data="javascript:alert(\'XSS\')"></object>',
  '<embed src="javascript:alert(\'XSS\')">',
  '<form><input type="submit" formaction="javascript:alert(\'XSS\')" value="Submit">',
  '<details open ontoggle="alert(\'XSS\')">',
  '<marquee onstart="alert(\'XSS\')">test</marquee>',
  // HTML entities that might bypass sanitization
  '&lt;script&gt;alert(\"XSS\")&lt;/script&gt;',
  // CSS-based XSS
  '<div style="background-image: url(javascript:alert(\'XSS\'))">',
  '<div style="expression(alert(\'XSS\'))">',
  // Event handlers
  '<button onclick="alert(\'XSS\')">Click</button>',
  '<div onmouseover="alert(\'XSS\')">Hover</div>',
  // Data URLs
  '<img src="data:text/html,<script>alert(\'XSS\')</script>">',
  // Protocol handlers
  'vbscript:alert("XSS")',
  'data:text/html,<script>alert("XSS")</script>'
];

export const SAFE_HTML_INPUTS = [
  '<p>Safe paragraph</p>',
  '<strong>Bold text</strong>',
  '<em>Italic text</em>',
  '<ul><li>List item</li></ul>',
  '<ol><li>Numbered item</li></ol>',
  '<blockquote>Quote</blockquote>',
  '<h1>Heading 1</h1>',
  '<h2>Heading 2</h2>',
  '<a href="https://example.com">Safe link</a>',
  '<br>',
  '<hr>',
  '<code>Code snippet</code>',
  '<pre>Preformatted text</pre>'
];

// Performance testing utilities
export function createPerformanceContentSections(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    key: `perf-section-${i}`,
    section: {
      type: i % 4 === 0 ? 'hero' : i % 4 === 1 ? 'features' : i % 4 === 2 ? 'testimonials' : 'content',
      content: {
        title: `Performance Section ${i}`,
        subtitle: `Subtitle for section ${i}`,
        description: `This is a detailed description for performance testing section ${i}. It contains enough content to simulate realistic usage patterns and test the editor's performance under load.`,
        items: Array.from({ length: 3 }, (_, j) => ({
          id: `item-${i}-${j}`,
          title: `Item ${j} in Section ${i}`,
          description: `Description for item ${j} in performance test section ${i}`
        }))
      },
      order: i + 1
    }
  }));
}

// Memory testing utilities
export class MemoryTestHelper {
  private initialMemory: number = 0;
  private measurements: Array<{ timestamp: number; memory: number; action: string }> = [];

  startMeasuring() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      this.initialMemory = (window.performance as any).memory.usedJSHeapSize;
      this.measurements = [];
    }
  }

  measure(action: string) {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const currentMemory = (window.performance as any).memory.usedJSHeapSize;
      this.measurements.push({
        timestamp: Date.now(),
        memory: currentMemory,
        action
      });
    }
  }

  getMemoryDelta(): number {
    if (this.measurements.length === 0) return 0;
    const latest = this.measurements[this.measurements.length - 1];
    return latest.memory - this.initialMemory;
  }

  getMemoryReport() {
    return {
      initialMemory: this.initialMemory,
      measurements: this.measurements,
      totalDelta: this.getMemoryDelta(),
      averagePerAction: this.measurements.length > 0 ? this.getMemoryDelta() / this.measurements.length : 0
    };
  }
}

// Accessibility testing helpers
export function checkAriaLabels(container: HTMLElement): string[] {
  const issues: string[] = [];
  
  // Check for missing aria-labels on interactive elements
  const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
  interactiveElements.forEach((element, index) => {
    const hasLabel = element.getAttribute('aria-label') || 
                     element.getAttribute('aria-labelledby') ||
                     element.textContent?.trim();
    
    if (!hasLabel) {
      issues.push(`Interactive element at index ${index} (${element.tagName}) lacks accessible name`);
    }
  });

  return issues;
}

export function checkKeyboardNavigation(container: HTMLElement): string[] {
  const issues: string[] = [];
  
  // Check for focusable elements without tabindex or with negative tabindex
  const focusableElements = container.querySelectorAll('button, a, input, select, textarea, [tabindex]');
  focusableElements.forEach((element, index) => {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) < 0 && element.tagName !== 'DIV') {
      issues.push(`Element at index ${index} (${element.tagName}) has negative tabindex but is interactive`);
    }
  });

  return issues;
}

export function checkColorContrast(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.color;
  const backgroundColor = computedStyle.backgroundColor;
  
  // This is a simplified check - in a real implementation, you'd use a proper contrast calculation
  // For now, we just check that both colors are defined
  return color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)';
}

// Browser compatibility testing
export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) {
    return { name: 'Chrome', version: userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown', engine: 'Blink' };
  } else if (userAgent.includes('Firefox')) {
    return { name: 'Firefox', version: userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'unknown', engine: 'Gecko' };
  } else if (userAgent.includes('Safari')) {
    return { name: 'Safari', version: userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'unknown', engine: 'WebKit' };
  } else if (userAgent.includes('Edge')) {
    return { name: 'Edge', version: userAgent.match(/Edge\/([0-9.]+)/)?.[1] || 'unknown', engine: 'EdgeHTML' };
  }
  
  return { name: 'Unknown', version: 'unknown', engine: 'unknown' };
}

// Animation performance testing
export function measureAnimationPerformance(callback: () => void): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();
    
    function measureFrame() {
      frameCount++;
      const elapsed = performance.now() - startTime;
      
      if (elapsed < 1000) { // Measure for 1 second
        requestAnimationFrame(measureFrame);
      } else {
        const fps = (frameCount * 1000) / elapsed;
        resolve(fps);
      }
    }
    
    callback(); // Start the animation
    requestAnimationFrame(measureFrame);
  });
}

// Network simulation for auto-save testing
export class NetworkSimulator {
  private originalFetch = window.fetch;
  private delay = 0;
  private failureRate = 0;

  setDelay(ms: number) {
    this.delay = ms;
  }

  setFailureRate(rate: number) {
    this.failureRate = rate;
  }

  enable() {
    window.fetch = async (...args) => {
      // Simulate network delay
      if (this.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }

      // Simulate network failures
      if (Math.random() < this.failureRate) {
        throw new Error('Simulated network error');
      }

      return this.originalFetch(...args);
    };
  }

  disable() {
    window.fetch = this.originalFetch;
  }
}

export const testHelpers = {
  renderWithProviders,
  mockPageContent,
  mockLargePageContent,
  XSS_PAYLOADS,
  SAFE_HTML_INPUTS,
  createPerformanceContentSections,
  MemoryTestHelper,
  checkAriaLabels,
  checkKeyboardNavigation,
  checkColorContrast,
  detectBrowser,
  measureAnimationPerformance,
  NetworkSimulator
};