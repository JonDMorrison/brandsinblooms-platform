/**
 * Security Audit and Validation Tests
 * Milestone 6: Integration Testing and Security
 * 
 * Comprehensive security testing for the visual editor
 */

import { 
  sanitizeHTML, 
  sanitizeUserContent, 
  sanitizeRichText,
  sanitizeSectionData,
  validateUploadedFile,
  ContentSanitizer,
  XSS_TEST_PATTERNS
} from '@/src/lib/content/content-sanitization';
import { XSS_PAYLOADS, SAFE_HTML_INPUTS } from './setup';

describe('Security Audit - Content Sanitization', () => {
  describe('XSS Prevention', () => {
    it('should block all common XSS attack vectors', () => {
      XSS_PAYLOADS.forEach((payload, index) => {
        const sanitized = sanitizeUserContent(payload);
        
        // Sanitized content should not contain the original payload
        expect(sanitized.toLowerCase()).not.toContain('<script');
        expect(sanitized.toLowerCase()).not.toContain('javascript:');
        expect(sanitized.toLowerCase()).not.toContain('onerror');
        expect(sanitized.toLowerCase()).not.toContain('onload');
        expect(sanitized.toLowerCase()).not.toContain('onclick');
        
        console.log(`XSS Payload ${index + 1} blocked:`, payload.slice(0, 50));
      });
    });

    it('should preserve safe HTML while blocking XSS', () => {
      SAFE_HTML_INPUTS.forEach((input, index) => {
        const sanitized = sanitizeHTML(input);
        
        // Safe content should be preserved (though may be normalized)
        expect(sanitized).toBeTruthy();
        expect(sanitized).not.toBe(''); // Should not be completely stripped
        
        console.log(`Safe HTML ${index + 1} preserved:`, input, '->', sanitized);
      });
    });

    it('should handle nested XSS attempts', () => {
      const nestedXSS = [
        '<div><script>alert("XSS")</script></div>',
        '<p>Safe text <img src=x onerror=alert("XSS")> more text</p>',
        '<strong><em><script>alert("nested")</script></em></strong>',
        '<ul><li onclick="alert(\'XSS\')">List item</li></ul>'
      ];

      nestedXSS.forEach(payload => {
        const sanitized = sanitizeUserContent(payload);
        
        expect(sanitized.toLowerCase()).not.toContain('<script');
        expect(sanitized.toLowerCase()).not.toContain('onerror');
        expect(sanitized.toLowerCase()).not.toContain('onclick');
      });
    });

    it('should handle URL-based XSS attempts', () => {
      const urlXSS = [
        '<a href="javascript:alert(\'XSS\')">Click me</a>',
        '<img src="javascript:alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<form action="javascript:alert(\'XSS\')">',
        '<a href="vbscript:alert(\'XSS\')">VBScript</a>',
        '<a href="data:text/html,<script>alert(\'XSS\')</script>">Data URL</a>'
      ];

      urlXSS.forEach(payload => {
        const sanitized = sanitizeRichText(payload);
        
        expect(sanitized.toLowerCase()).not.toContain('javascript:');
        expect(sanitized.toLowerCase()).not.toContain('vbscript:');
        expect(sanitized.toLowerCase()).not.toContain('data:text/html');
      });
    });

    it('should handle CSS-based XSS attempts', () => {
      const cssXSS = [
        '<div style="background-image: url(javascript:alert(\'XSS\'))">',
        '<p style="expression(alert(\'XSS\'))">',
        '<span style="behavior: url(xss.htc)">',
        '<div style="@import url(\'javascript:alert(\\\'XSS\\\')\')">',
        '<style>body { background: url(javascript:alert("XSS")); }</style>'
      ];

      cssXSS.forEach(payload => {
        const sanitized = sanitizeRichText(payload);
        
        expect(sanitized.toLowerCase()).not.toContain('javascript:');
        expect(sanitized.toLowerCase()).not.toContain('expression(');
        expect(sanitized.toLowerCase()).not.toContain('behavior:');
        expect(sanitized.toLowerCase()).not.toContain('@import');
        expect(sanitized.toLowerCase()).not.toContain('<style');
      });
    });

    it('should handle encoded XSS attempts', () => {
      const encodedXSS = [
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        '&#x3C;script&#x3E;alert("XSS")&#x3C;/script&#x3E;',
        '%3Cscript%3Ealert("XSS")%3C/script%3E',
        'javascript&#58;alert("XSS")',
        '&javascript:alert("XSS")'
      ];

      encodedXSS.forEach(payload => {
        const sanitized = sanitizeUserContent(payload);
        
        // Should not decode to dangerous content
        const decoded = sanitized.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x3C;/g, '<');
        expect(decoded.toLowerCase()).not.toContain('<script');
      });
    });
  });

  describe('Content Type Validation', () => {
    it('should enforce strict sanitization for user-generated content', () => {
      const userContent = '<h1>Title</h1><p>Content with <a href="https://example.com">link</a></p><script>alert("XSS")</script>';
      const sanitized = sanitizeUserContent(userContent);
      
      // Should preserve safe tags
      expect(sanitized).toContain('<h1>');
      expect(sanitized).toContain('<p>');
      
      // Should remove dangerous content
      expect(sanitized.toLowerCase()).not.toContain('<script');
      
      // Should sanitize attributes
      expect(sanitized).toContain('https://example.com');
    });

    it('should allow more tags for rich text content', () => {
      const richContent = '<div class="container"><img src="https://example.com/image.jpg" alt="Image"><video src="video.mp4"></video></div>';
      const sanitized = sanitizeRichText(richContent);
      
      // Should preserve rich content tags
      expect(sanitized).toContain('<div');
      expect(sanitized).toContain('<img');
      expect(sanitized).toContain('https://example.com/image.jpg');
    });

    it('should strip most HTML for plain text content', () => {
      const plainTextSanitizer = new ContentSanitizer({
        allowedTags: ['p', 'br'],
        allowedAttributes: {},
        allowedProtocols: ['https:'],
        maxLength: 1000,
        allowDataUrls: false
      });

      const content = '<h1>Title</h1><p>Paragraph</p><strong>Bold</strong><script>alert("XSS")</script>';
      const sanitized = plainTextSanitizer.sanitize(content, 'plain-text');
      
      // Should only preserve basic tags
      expect(sanitized).toContain('<p>');
      expect(sanitized.toLowerCase()).not.toContain('<h1>');
      expect(sanitized.toLowerCase()).not.toContain('<strong>');
      expect(sanitized.toLowerCase()).not.toContain('<script');
    });
  });

  describe('Section Data Sanitization', () => {
    it('should sanitize object properties recursively', () => {
      const sectionData = {
        title: '<h1>Safe Title</h1>',
        description: 'Safe description with <strong>formatting</strong>',
        malicious: '<script>alert("XSS")</script>',
        nested: {
          content: '<p>Nested content</p>',
          xss: '<img src=x onerror=alert("XSS")>'
        },
        array: [
          'Safe string',
          '<script>alert("Array XSS")</script>',
          { deep: '<iframe src="javascript:alert(\'Deep XSS\')"></iframe>' }
        ]
      };

      const sanitized = sanitizeSectionData(sectionData);
      
      // Should preserve safe content
      expect(sanitized.title).toContain('<h1>');
      expect(sanitized.description).toContain('<strong>');
      expect(sanitized.nested.content).toContain('<p>');
      
      // Should remove XSS
      expect(JSON.stringify(sanitized).toLowerCase()).not.toContain('<script');
      expect(JSON.stringify(sanitized).toLowerCase()).not.toContain('onerror');
      expect(JSON.stringify(sanitized).toLowerCase()).not.toContain('javascript:');
    });

    it('should handle circular references safely', () => {
      const obj: any = { name: 'test' };
      obj.circular = obj;
      
      // Should not crash with circular references
      expect(() => {
        sanitizeSectionData(obj);
      }).not.toThrow();
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = [
        null,
        undefined,
        '',
        0,
        false,
        { '': 'empty key' },
        { '<script>': 'malicious key' }
      ];

      malformedData.forEach(data => {
        expect(() => {
          sanitizeSectionData(data);
        }).not.toThrow();
      });
    });
  });

  describe('File Upload Validation', () => {
    it('should validate allowed file types', () => {
      const allowedFiles = [
        new File([''], 'image.jpg', { type: 'image/jpeg' }),
        new File([''], 'image.png', { type: 'image/png' }),
        new File([''], 'image.gif', { type: 'image/gif' }),
        new File([''], 'video.mp4', { type: 'video/mp4' }),
        new File([''], 'audio.mp3', { type: 'audio/mp3' })
      ];

      allowedFiles.forEach(file => {
        expect(validateUploadedFile(file)).toBe(true);
      });
    });

    it('should reject dangerous file types', () => {
      const dangerousFiles = [
        new File([''], 'script.js', { type: 'application/javascript' }),
        new File([''], 'executable.exe', { type: 'application/octet-stream' }),
        new File([''], 'document.html', { type: 'text/html' }),
        new File([''], 'style.css', { type: 'text/css' }),
        new File([''], 'data.xml', { type: 'text/xml' }),
        new File([''], 'archive.zip', { type: 'application/zip' })
      ];

      dangerousFiles.forEach(file => {
        expect(validateUploadedFile(file)).toBe(false);
      });
    });

    it('should enforce file size limits', () => {
      // Create a large file (over 50MB)
      const largeContent = new Array(51 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      
      expect(validateUploadedFile(largeFile)).toBe(false);
    });

    it('should validate file extensions match MIME types', () => {
      const mismatchedFiles = [
        new File([''], 'image.jpg', { type: 'text/html' }),
        new File([''], 'script.png', { type: 'application/javascript' }),
        new File([''], 'video.mp4', { type: 'text/plain' })
      ];

      mismatchedFiles.forEach(file => {
        expect(validateUploadedFile(file)).toBe(false);
      });
    });
  });

  describe('URL Sanitization', () => {
    it('should allow safe URLs', () => {
      const safeUrls = [
        'https://example.com',
        'https://subdomain.example.com/path?query=value#hash',
        'mailto:user@example.com',
        'tel:+1234567890'
      ];

      safeUrls.forEach(url => {
        const sanitized = sanitizeHTML(`<a href="${url}">Link</a>`);
        expect(sanitized).toContain(url);
      });
    });

    it('should block dangerous URLs', () => {
      const dangerousUrls = [
        'javascript:alert("XSS")',
        'vbscript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'file:///etc/passwd',
        'ftp://malicious.com/file'
      ];

      dangerousUrls.forEach(url => {
        const sanitized = sanitizeHTML(`<a href="${url}">Link</a>`);
        expect(sanitized).not.toContain(url);
        expect(sanitized).toContain('href="#"');
      });
    });

    it('should handle malformed URLs', () => {
      const malformedUrls = [
        'htp://missing-t.com',
        'https://',
        'https://.',
        '://noprotocol.com',
        'https://space in url.com',
        'https://[malformed'
      ];

      malformedUrls.forEach(url => {
        const sanitized = sanitizeHTML(`<a href="${url}">Link</a>`);
        // Should either sanitize to safe URL or block
        expect(sanitized.toLowerCase()).not.toContain('<script');
      });
    });
  });

  describe('Performance and DoS Protection', () => {
    it('should enforce content length limits', () => {
      const veryLongContent = 'a'.repeat(100000); // 100KB
      const sanitized = sanitizeUserContent(veryLongContent);
      
      // Should be truncated to configured limit
      expect(sanitized.length).toBeLessThanOrEqual(10000); // Strict config limit
    });

    it('should handle deeply nested HTML efficiently', () => {
      const deeplyNested = '<div>'.repeat(1000) + 'Content' + '</div>'.repeat(1000);
      
      const startTime = Date.now();
      const sanitized = sanitizeHTML(deeplyNested);
      const endTime = Date.now();
      
      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(sanitized).toBeTruthy();
    });

    it('should handle regex DoS attempts', () => {
      // Patterns that could cause catastrophic backtracking
      const maliciousInputs = [
        'a'.repeat(10000) + '<script>',
        '('.repeat(1000) + ')',
        '['.repeat(1000) + ']',
        '\\'.repeat(1000)
      ];

      maliciousInputs.forEach(input => {
        const startTime = Date.now();
        const sanitized = sanitizeUserContent(input);
        const endTime = Date.now();
        
        // Should not take excessive time
        expect(endTime - startTime).toBeLessThan(100);
        expect(typeof sanitized).toBe('string');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs', () => {
      expect(sanitizeHTML(null as any)).toBe('');
      expect(sanitizeHTML(undefined as any)).toBe('');
      expect(sanitizeUserContent('')).toBe('');
    });

    it('should handle non-string inputs', () => {
      const nonStringInputs = [123, true, {}, [], Symbol('test')];
      
      nonStringInputs.forEach(input => {
        expect(sanitizeHTML(input as any)).toBe('');
      });
    });

    it('should handle invalid HTML gracefully', () => {
      const invalidHTML = [
        '<invalid>tag</invalid>',
        '<p>unclosed tag',
        '</p>closing without opening',
        '<p attr=unquoted>',
        '<>'
      ];

      invalidHTML.forEach(html => {
        expect(() => {
          const result = sanitizeHTML(html);
          expect(typeof result).toBe('string');
        }).not.toThrow();
      });
    });

    it('should maintain character encoding', () => {
      const unicodeContent = '<p>Unicode: 🔒 安全 مرحبا безопасность</p>';
      const sanitized = sanitizeHTML(unicodeContent);
      
      expect(sanitized).toContain('🔒');
      expect(sanitized).toContain('安全');
      expect(sanitized).toContain('مرحبا');
      expect(sanitized).toContain('безопасность');
    });
  });

  describe('Multi-tenant Security', () => {
    it('should prevent cross-tenant data access through content injection', () => {
      const maliciousContent = `
        <script>
          fetch('/api/admin/sites').then(r => r.json()).then(data => {
            // Attempt to access other tenant data
            console.log(data);
          });
        </script>
        <img src="x" onerror="fetch('/api/other-tenant-data')">
      `;

      const sanitized = sanitizeUserContent(maliciousContent);
      
      expect(sanitized.toLowerCase()).not.toContain('<script');
      expect(sanitized.toLowerCase()).not.toContain('onerror');
      expect(sanitized.toLowerCase()).not.toContain('fetch');
    });

    it('should sanitize tenant-specific identifiers in content', () => {
      const contentWithIds = `
        <p data-tenant-id="secret123">Content</p>
        <div id="tenant-secret-data">Private data</div>
        <!-- tenant: private-info -->
      `;

      const sanitized = sanitizeUserContent(contentWithIds);
      
      // Should not contain private identifiers
      expect(sanitized).not.toContain('data-tenant-id');
      expect(sanitized).not.toContain('secret123');
    });
  });

  describe('Content Security Policy Validation', () => {
    it('should produce CSP-compliant content', () => {
      const content = `
        <p style="color: red;">Styled text</p>
        <img src="https://example.com/image.jpg" alt="Image">
        <a href="https://example.com">Link</a>
      `;

      const sanitized = sanitizeRichText(content);
      
      // Should not contain inline event handlers (violates CSP)
      expect(sanitized.toLowerCase()).not.toContain('onclick');
      expect(sanitized.toLowerCase()).not.toContain('onload');
      expect(sanitized.toLowerCase()).not.toContain('onerror');
      
      // Should not contain javascript: URLs (violates CSP)
      expect(sanitized.toLowerCase()).not.toContain('javascript:');
    });

    it('should handle SVG content safely', () => {
      const svgContent = `
        <svg onload="alert('XSS')">
          <circle cx="50" cy="50" r="40" />
          <script>alert('SVG XSS')</script>
        </svg>
      `;

      const sanitized = sanitizeRichText(svgContent);
      
      expect(sanitized.toLowerCase()).not.toContain('onload');
      expect(sanitized.toLowerCase()).not.toContain('<script');
    });
  });
});