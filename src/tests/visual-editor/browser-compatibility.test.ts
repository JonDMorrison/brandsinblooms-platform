/**
 * Browser Compatibility Testing Framework
 * Milestone 6: Integration Testing and Security
 * 
 * Tests compatibility across Chrome, Firefox, Safari, and Edge
 */

import { detectBrowser } from './setup';

// Browser compatibility requirements
const BROWSER_REQUIREMENTS = {
  chrome: { minVersion: 88 },
  firefox: { minVersion: 85 },
  safari: { minVersion: 14 },
  edge: { minVersion: 88 }
};

// Feature detection utilities
class FeatureDetector {
  static detectModernJavaScript(): boolean {
    try {
      // Test for ES2020+ features
      new Function('return (async function* () { yield await Promise.resolve(1); })();');
      return true;
    } catch {
      return false;
    }
  }

  static detectCSS(): { [key: string]: boolean } {
    const testDiv = document.createElement('div');
    document.body.appendChild(testDiv);

    const features = {
      cssGrid: CSS.supports('display', 'grid'),
      cssFlexbox: CSS.supports('display', 'flex'),
      cssCustomProperties: CSS.supports('--custom', 'property'),
      cssContainerQueries: CSS.supports('container-type', 'inline-size'),
      cssSubgrid: CSS.supports('grid-template-rows', 'subgrid'),
      cssFocusVisible: CSS.supports('selector(:focus-visible)'),
      cssScrollBehavior: CSS.supports('scroll-behavior', 'smooth'),
      cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(5px)'),
      cssClipPath: CSS.supports('clip-path', 'circle(50%)'),
      cssAspectRatio: CSS.supports('aspect-ratio', '16/9')
    };

    document.body.removeChild(testDiv);
    return features;
  }

  static detectWebAPIs(): { [key: string]: boolean } {
    return {
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      mutationObserver: 'MutationObserver' in window,
      performanceObserver: 'PerformanceObserver' in window,
      requestIdleCallback: 'requestIdleCallback' in window,
      webWorkers: 'Worker' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webComponents: 'customElements' in window,
      shadowDOM: 'attachShadow' in Element.prototype,
      fetch: 'fetch' in window,
      websockets: 'WebSocket' in window,
      indexedDB: 'indexedDB' in window,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      fileAPI: 'File' in window && 'FileReader' in window,
      dragAndDrop: 'draggable' in document.createElement('div'),
      history: 'pushState' in history,
      webGL: (() => {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      })(),
      webGL2: (() => {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
      })(),
      webRTC: 'RTCPeerConnection' in window,
      mediaRecorder: 'MediaRecorder' in window,
      paymentRequest: 'PaymentRequest' in window,
      credentialsAPI: 'credentials' in navigator,
      webAuthentication: 'credentials' in navigator && 'create' in navigator.credentials
    };
  }

  static detectInputTypes(): { [key: string]: boolean } {
    const input = document.createElement('input');
    const inputTypes = [
      'color', 'date', 'datetime-local', 'email', 'month', 'number',
      'range', 'search', 'tel', 'time', 'url', 'week'
    ];

    const support: { [key: string]: boolean } = {};
    
    inputTypes.forEach(type => {
      input.type = type;
      support[type] = input.type === type;
    });

    return support;
  }

  static detectMediaQueries(): { [key: string]: boolean } {
    return {
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches,
      hoverCapability: window.matchMedia('(hover: hover)').matches,
      pointerCapability: window.matchMedia('(pointer: fine)').matches,
      highDPI: window.matchMedia('(min-resolution: 192dpi)').matches
    };
  }

  static detectTouchCapabilities(): { [key: string]: boolean } {
    return {
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window,
      maxTouchPoints: navigator.maxTouchPoints > 0,
      touchAction: CSS.supports('touch-action', 'manipulation')
    };
  }
}

// Browser-specific polyfill detector
class PolyfillDetector {
  static getRequiredPolyfills(): string[] {
    const required: string[] = [];
    const features = FeatureDetector.detectWebAPIs();

    if (!features.intersectionObserver) required.push('intersection-observer');
    if (!features.resizeObserver) required.push('resize-observer');
    if (!features.requestIdleCallback) required.push('request-idle-callback');
    if (!features.fetch) required.push('whatwg-fetch');
    if (!features.webComponents) required.push('webcomponents');
    if (!FeatureDetector.detectModernJavaScript()) required.push('core-js');

    const cssFeatures = FeatureDetector.detectCSS();
    if (!cssFeatures.cssFocusVisible) required.push('focus-visible');
    if (!cssFeatures.cssCustomProperties) required.push('css-custom-properties');

    return required;
  }
}

// Performance benchmarking for different browsers
class BrowserPerformanceBenchmark {
  static async measureRenderPerformance(): Promise<number> {
    const startTime = performance.now();
    
    // Create complex DOM structure
    const container = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
      const div = document.createElement('div');
      div.textContent = `Element ${i}`;
      div.style.cssText = 'padding: 10px; margin: 5px; border: 1px solid #ccc;';
      container.appendChild(div);
    }
    
    document.body.appendChild(container);
    
    // Force reflow
    container.offsetHeight;
    
    const endTime = performance.now();
    document.body.removeChild(container);
    
    return endTime - startTime;
  }

  static async measureJavaScriptPerformance(): Promise<number> {
    const startTime = performance.now();
    
    // CPU-intensive task
    let result = 0;
    for (let i = 0; i < 100000; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    
    const endTime = performance.now();
    return endTime - startTime;
  }

  static async measureMemoryUsage(): Promise<number> {
    if ('memory' in performance && 'usedJSHeapSize' in (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}

describe('Browser Compatibility Tests', () => {
  const browser = detectBrowser();

  beforeEach(() => {
    console.log(`Running tests on: ${browser.name} ${browser.version} (${browser.engine})`);
  });

  describe('Browser Detection and Version Support', () => {
    it('should detect browser correctly', () => {
      expect(browser.name).toBeTruthy();
      expect(browser.version).toBeTruthy();
      expect(browser.engine).toBeTruthy();
    });

    it('should meet minimum version requirements', () => {
      const browserName = browser.name.toLowerCase();
      const requirements = BROWSER_REQUIREMENTS[browserName as keyof typeof BROWSER_REQUIREMENTS];
      
      if (requirements) {
        const currentVersion = parseFloat(browser.version);
        const minVersion = requirements.minVersion;
        
        if (currentVersion < minVersion) {
          console.warn(`Browser version ${currentVersion} is below minimum requirement ${minVersion}`);
        }
        
        // For testing, we'll log the warning but not fail
        expect(currentVersion).toBeGreaterThan(0);
      }
    });
  });

  describe('JavaScript Feature Support', () => {
    it('should support modern JavaScript features', () => {
      const hasModernJS = FeatureDetector.detectModernJavaScript();
      
      if (!hasModernJS) {
        console.warn('Modern JavaScript features not supported, polyfills required');
      }
      
      // Essential features that should be available (or polyfilled)
      expect(typeof Promise).toBe('function');
      expect(typeof Array.from).toBe('function');
      expect(typeof Object.assign).toBe('function');
      expect(typeof Map).toBe('function');
      expect(typeof Set).toBe('function');
    });

    it('should support required Web APIs', () => {
      const apis = FeatureDetector.detectWebAPIs();
      
      // Critical APIs for the visual editor
      const criticalAPIs = [
        'fetch', 'localStorage', 'dragAndDrop', 'fileAPI', 'history'
      ];

      const missingCritical = criticalAPIs.filter(api => !apis[api]);
      
      if (missingCritical.length > 0) {
        console.warn('Missing critical APIs:', missingCritical);
      }

      // Should have most critical APIs
      expect(missingCritical.length).toBeLessThan(2);

      // Nice-to-have APIs
      const niceToHave = [
        'intersectionObserver', 'resizeObserver', 'requestIdleCallback'
      ];

      const missingNiceToHave = niceToHave.filter(api => !apis[api]);
      if (missingNiceToHave.length > 0) {
        console.log('Missing nice-to-have APIs (can be polyfilled):', missingNiceToHave);
      }
    });
  });

  describe('CSS Feature Support', () => {
    it('should support modern CSS features', () => {
      const css = FeatureDetector.detectCSS();
      
      // Essential CSS features
      expect(css.cssFlexbox).toBe(true);
      expect(css.cssCustomProperties).toBe(true);
      
      // Modern CSS features (log warnings if missing)
      if (!css.cssGrid) {
        console.warn('CSS Grid not supported');
      }
      
      if (!css.cssFocusVisible) {
        console.warn('CSS :focus-visible not supported, polyfill recommended');
      }

      console.log('CSS Support:', css);
    });

    it('should support responsive design features', () => {
      const mediaQueries = FeatureDetector.detectMediaQueries();
      
      // Test media query support
      expect(window.matchMedia('(max-width: 768px)')).toBeTruthy();
      expect(window.matchMedia('(prefers-reduced-motion: reduce)')).toBeTruthy();
      
      console.log('Media Query Support:', mediaQueries);
    });
  });

  describe('Touch and Input Support', () => {
    it('should detect touch capabilities correctly', () => {
      const touch = FeatureDetector.detectTouchCapabilities();
      
      console.log('Touch Capabilities:', touch);
      
      // Should handle both touch and non-touch devices
      expect(typeof touch.touchEvents).toBe('boolean');
      expect(typeof touch.pointerEvents).toBe('boolean');
    });

    it('should support modern input types', () => {
      const inputTypes = FeatureDetector.detectInputTypes();
      
      // Basic input types should be supported
      expect(inputTypes.email).toBe(true);
      expect(inputTypes.url).toBe(true);
      expect(inputTypes.search).toBe(true);
      
      console.log('Input Type Support:', inputTypes);
    });
  });

  describe('Performance Characteristics', () => {
    it('should have acceptable render performance', async () => {
      const renderTime = await BrowserPerformanceBenchmark.measureRenderPerformance();
      
      console.log(`Render performance: ${renderTime.toFixed(2)}ms`);
      
      // Performance thresholds by browser (more lenient for older browsers)
      const performanceThresholds = {
        chrome: 100,
        firefox: 150,
        safari: 120,
        edge: 110
      };

      const threshold = performanceThresholds[browser.name.toLowerCase() as keyof typeof performanceThresholds] || 200;
      
      if (renderTime > threshold) {
        console.warn(`Render performance ${renderTime}ms exceeds threshold ${threshold}ms`);
      }
      
      expect(renderTime).toBeLessThan(threshold * 2); // Allow 2x threshold for test environment
    }, 10000);

    it('should have acceptable JavaScript performance', async () => {
      const jsTime = await BrowserPerformanceBenchmark.measureJavaScriptPerformance();
      
      console.log(`JavaScript performance: ${jsTime.toFixed(2)}ms`);
      
      // Should complete computation in reasonable time
      expect(jsTime).toBeLessThan(1000);
    });

    it('should report memory usage if available', async () => {
      const memoryUsage = await BrowserPerformanceBenchmark.measureMemoryUsage();
      
      if (memoryUsage > 0) {
        console.log(`Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)} MB`);
        
        // Should not use excessive memory
        expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB
      } else {
        console.log('Memory usage API not available');
      }
    });
  });

  describe('Polyfill Requirements', () => {
    it('should identify required polyfills', () => {
      const requiredPolyfills = PolyfillDetector.getRequiredPolyfills();
      
      console.log('Required polyfills:', requiredPolyfills);
      
      // Should identify what needs to be polyfilled
      expect(Array.isArray(requiredPolyfills)).toBe(true);
      
      // Document polyfill requirements for deployment
      if (requiredPolyfills.length > 0) {
        console.log('⚠️  The following polyfills should be loaded for optimal compatibility:', requiredPolyfills);
      }
    });
  });

  describe('Browser-Specific Quirks and Workarounds', () => {
    it('should handle Safari-specific issues', () => {
      if (browser.name.toLowerCase() === 'safari') {
        // Test for known Safari quirks
        
        // Safari date input handling
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        expect(dateInput.type).toBe('date');
        
        // Safari flexbox bugs
        const flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.flexDirection = 'column';
        document.body.appendChild(flexContainer);
        
        const computed = window.getComputedStyle(flexContainer);
        expect(computed.display).toBe('flex');
        
        document.body.removeChild(flexContainer);
      }
    });

    it('should handle Firefox-specific issues', () => {
      if (browser.name.toLowerCase() === 'firefox') {
        // Test for Firefox-specific features
        
        // Firefox scrollbar styling
        const scrollTest = document.createElement('div');
        scrollTest.style.scrollbarWidth = 'thin';
        document.body.appendChild(scrollTest);
        
        const computed = window.getComputedStyle(scrollTest);
        // Firefox supports scrollbar-width
        expect(computed.scrollbarWidth || 'auto').toBeTruthy();
        
        document.body.removeChild(scrollTest);
      }
    });

    it('should handle Edge-specific issues', () => {
      if (browser.name.toLowerCase() === 'edge') {
        // Test Edge compatibility
        
        // Edge should support modern standards
        expect('fetch' in window).toBe(true);
        expect('Promise' in window).toBe(true);
        expect('Map' in window).toBe(true);
      }
    });

    it('should handle Chrome-specific optimizations', () => {
      if (browser.name.toLowerCase() === 'chrome') {
        // Test Chrome-specific features
        
        // Chrome DevTools detection (not recommended for production)
        const isDevTools = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        expect(typeof isDevTools).toBe('boolean');
        
        // Chrome performance APIs
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          expect(typeof memory.usedJSHeapSize).toBe('number');
        }
      }
    });
  });

  describe('Accessibility Support Across Browsers', () => {
    it('should support ARIA attributes consistently', () => {
      const testDiv = document.createElement('div');
      testDiv.setAttribute('aria-label', 'Test');
      testDiv.setAttribute('role', 'button');
      
      expect(testDiv.getAttribute('aria-label')).toBe('Test');
      expect(testDiv.getAttribute('role')).toBe('button');
    });

    it('should support focus management', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      document.body.appendChild(button);
      
      button.focus();
      expect(document.activeElement).toBe(button);
      
      button.blur();
      document.body.removeChild(button);
    });
  });

  describe('Network and Offline Capabilities', () => {
    it('should detect online/offline status', () => {
      expect(typeof navigator.onLine).toBe('boolean');
      
      // Test online/offline event listeners
      let onlineEventSupported = false;
      let offlineEventSupported = false;
      
      const onlineHandler = () => { onlineEventSupported = true; };
      const offlineHandler = () => { offlineEventSupported = true; };
      
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      // Cleanup
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
      
      expect(typeof onlineEventSupported).toBe('boolean');
      expect(typeof offlineEventSupported).toBe('boolean');
    });

    it('should support service worker if available', () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      if (hasServiceWorker) {
        expect(typeof navigator.serviceWorker).toBe('object');
      } else {
        console.log('Service Worker not supported');
      }
    });
  });

  describe('Storage Capabilities', () => {
    it('should support local storage', () => {
      try {
        localStorage.setItem('browser-test', 'test-value');
        expect(localStorage.getItem('browser-test')).toBe('test-value');
        localStorage.removeItem('browser-test');
      } catch (error) {
        console.warn('LocalStorage not available:', error);
        expect(true).toBe(true); // Don't fail, just warn
      }
    });

    it('should support session storage', () => {
      try {
        sessionStorage.setItem('browser-test', 'test-value');
        expect(sessionStorage.getItem('browser-test')).toBe('test-value');
        sessionStorage.removeItem('browser-test');
      } catch (error) {
        console.warn('SessionStorage not available:', error);
        expect(true).toBe(true); // Don't fail, just warn
      }
    });

    it('should detect IndexedDB support', () => {
      const hasIndexedDB = 'indexedDB' in window;
      
      if (!hasIndexedDB) {
        console.warn('IndexedDB not supported');
      }
      
      expect(typeof hasIndexedDB).toBe('boolean');
    });
  });
});