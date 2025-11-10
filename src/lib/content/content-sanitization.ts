/**
 * Enhanced Content Sanitization with XSS Prevention
 * Milestone 6: Integration Testing and Security
 * 
 * Comprehensive content sanitization system for the visual editor
 * Prevents XSS attacks while preserving safe HTML formatting
 */

import { handleError } from '@/src/lib/types/error-handling';

// Configuration for allowed HTML tags and attributes
interface SanitizationConfig {
  allowedTags: string[];
  allowedAttributes: { [tag: string]: string[] };
  allowedProtocols: string[];
  maxLength: number;
  allowDataUrls: boolean;
}

// Default safe configuration
const DEFAULT_CONFIG: SanitizationConfig = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'q',
    'a', 'span', 'div',
    'hr',
    'small', 'mark', 'del', 'ins', 'sub', 'sup'
  ],
  allowedAttributes: {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'span': ['class', 'style'],
    'div': ['class', 'style'],
    'p': ['class', 'style'],
    'h1': ['class', 'style'],
    'h2': ['class', 'style'],
    'h3': ['class', 'style'],
    'h4': ['class', 'style'],
    'h5': ['class', 'style'],
    'h6': ['class', 'style'],
    'ul': ['class', 'style'],
    'ol': ['class', 'style'],
    'li': ['class', 'style'],
    'blockquote': ['class', 'style', 'cite'],
    'code': ['class'],
    'pre': ['class']
  },
  allowedProtocols: ['http:', 'https:', 'mailto:', 'tel:'],
  maxLength: 50000, // 50KB limit
  allowDataUrls: false
};

// Strict configuration for user-generated content
const STRICT_CONFIG: SanitizationConfig = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'code',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote'
  ],
  allowedAttributes: {
    'a': ['href', 'title'],
    'blockquote': ['cite']
  },
  allowedProtocols: ['https:', 'mailto:'],
  maxLength: 10000, // 10KB limit
  allowDataUrls: false
};

// Configuration for rich text areas
const RICH_TEXT_CONFIG: SanitizationConfig = {
  ...DEFAULT_CONFIG,
  allowedTags: [
    ...DEFAULT_CONFIG.allowedTags,
    'img', 'video', 'audio', 'iframe'
  ],
  allowedAttributes: {
    ...DEFAULT_CONFIG.allowedAttributes,
    'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    'video': ['src', 'width', 'height', 'controls', 'autoplay', 'muted'],
    'audio': ['src', 'controls', 'autoplay', 'muted']
  },
  maxLength: 100000 // 100KB limit for rich content
};

// XSS attack patterns to detect and block
const XSS_PATTERNS = [
  // Script injection
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  
  // Event handlers
  /\bon\w+\s*=/gi,
  
  // Meta refreshes
  /<meta\s+http-equiv\s*=\s*["']?refresh["']?/gi,
  
  // Object/embed tags
  /<(object|embed|applet)\b/gi,
  
  // Form elements that could be used for attacks
  /<(form|input|textarea|select|button)\b/gi,
  
  // CSS expression
  /expression\s*\(/gi,
  /@import\s+/gi,
  /behavior\s*:/gi,
  
  // SVG XSS vectors
  /<svg\b[^>]*\bon\w+\s*=/gi,
  /<use\b[^>]*\bhref\s*=\s*["']?javascript:/gi
];

// CSS property patterns that could be dangerous
const DANGEROUS_CSS_PATTERNS = [
  /expression\s*\(/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /behavior\s*:/gi,
  /@import/gi,
  /binding\s*:/gi,
  /-moz-binding/gi
];

// URL validation patterns
const URL_PATTERNS = {
  http: /^https?:\/\/[^\s<>"']+$/i,
  mailto: /^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
  tel: /^tel:\+?[1-9]\d{1,14}$/i
};

class ContentSanitizer {
  private config: SanitizationConfig;

  constructor(config: SanitizationConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Main sanitization method
   */
  sanitize(content: string, context: 'rich-text' | 'plain-text' | 'user-generated' = 'rich-text'): string {
    try {
      if (typeof content !== 'string') {
        return '';
      }

      // Apply appropriate configuration
      const config = this.getConfigForContext(context);
      this.config = config;

      // Length check
      if (content.length > config.maxLength) {
        content = content.substring(0, config.maxLength);
      }

      // Pre-sanitization XSS detection
      this.detectXSSAttempts(content);

      // HTML sanitization
      content = this.sanitizeHTML(content);

      // CSS sanitization
      content = this.sanitizeCSS(content);

      // URL sanitization
      content = this.sanitizeURLs(content);

      // Post-sanitization validation
      this.validateSanitizedContent(content);

      return content;

    } catch (error: unknown) {
      handleError(error, {
        context: 'content-sanitization',
        contentLength: content?.length || 0,
        sanitizationContext: context
      });
      
      // Return empty string on any sanitization error for security
      return '';
    }
  }

  /**
   * Get configuration based on context
   */
  private getConfigForContext(context: 'rich-text' | 'plain-text' | 'user-generated'): SanitizationConfig {
    switch (context) {
      case 'user-generated':
        return STRICT_CONFIG;
      case 'rich-text':
        return RICH_TEXT_CONFIG;
      case 'plain-text':
        return {
          ...STRICT_CONFIG,
          allowedTags: ['p', 'br', 'strong', 'em'],
          allowedAttributes: {}
        };
      default:
        return DEFAULT_CONFIG;
    }
  }

  /**
   * Detect XSS attempts before sanitization
   */
  private detectXSSAttempts(content: string): void {
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(content)) {
        throw new Error(`Potential XSS attack detected: ${pattern.source}`);
      }
    }
  }

  /**
   * Sanitize HTML tags and attributes
   */
  private sanitizeHTML(content: string): string {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Traverse all elements
    const walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    const elementsToRemove: Element[] = [];
    let node: Node | null = walker.nextNode();

    while (node) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Check if tag is allowed
      if (!this.config.allowedTags.includes(tagName)) {
        elementsToRemove.push(element);
      } else {
        // Sanitize attributes
        this.sanitizeAttributes(element);
      }

      node = walker.nextNode();
    }

    // Remove disallowed elements
    elementsToRemove.forEach(element => {
      // Move children to parent before removing
      while (element.firstChild) {
        element.parentNode?.insertBefore(element.firstChild, element);
      }
      element.remove();
    });

    return doc.body.innerHTML;
  }

  /**
   * Sanitize element attributes
   */
  private sanitizeAttributes(element: Element): void {
    const tagName = element.tagName.toLowerCase();
    const allowedAttrs = this.config.allowedAttributes[tagName] || [];
    const attributesToRemove: string[] = [];

    // Check each attribute
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      const attrName = attr.name.toLowerCase();

      if (!allowedAttrs.includes(attrName)) {
        attributesToRemove.push(attr.name);
      } else {
        // Sanitize attribute value
        const sanitizedValue = this.sanitizeAttributeValue(attrName, attr.value);
        if (sanitizedValue !== attr.value) {
          element.setAttribute(attr.name, sanitizedValue);
        }
      }
    }

    // Remove disallowed attributes
    attributesToRemove.forEach(attrName => {
      element.removeAttribute(attrName);
    });
  }

  /**
   * Sanitize attribute values
   */
  private sanitizeAttributeValue(attrName: string, value: string): string {
    // URL attributes
    if (['href', 'src', 'cite', 'action'].includes(attrName)) {
      return this.sanitizeURL(value);
    }

    // Style attributes
    if (attrName === 'style') {
      return this.sanitizeInlineCSS(value);
    }

    // Class attributes
    if (attrName === 'class') {
      return this.sanitizeClassName(value);
    }

    // Target attribute
    if (attrName === 'target') {
      return ['_blank', '_self', '_parent', '_top'].includes(value) ? value : '_self';
    }

    // Rel attribute
    if (attrName === 'rel') {
      const allowedRels = ['nofollow', 'noreferrer', 'noopener', 'external'];
      const rels = value.split(' ').filter(rel => allowedRels.includes(rel.trim()));
      return rels.join(' ');
    }

    // Default: remove potentially dangerous characters
    return value.replace(/[<>"'&]/g, (char) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
  }

  /**
   * Sanitize CSS content
   */
  private sanitizeCSS(content: string): string {
    return content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  }

  /**
   * Sanitize inline CSS
   */
  private sanitizeInlineCSS(css: string): string {
    // Remove dangerous CSS patterns
    for (const pattern of DANGEROUS_CSS_PATTERNS) {
      css = css.replace(pattern, '');
    }

    // Parse and validate individual CSS properties
    const properties = css.split(';').map(prop => prop.trim()).filter(Boolean);
    const safeProp = properties.filter(prop => {
      const [property] = prop.split(':').map(p => p.trim());
      return this.isAllowedCSSProperty(property);
    });

    return safeProp.join('; ');
  }

  /**
   * Check if CSS property is allowed
   */
  private isAllowedCSSProperty(property: string): boolean {
    const allowedProperties = [
      'color', 'background-color', 'font-size', 'font-weight', 'font-family',
      'text-align', 'text-decoration', 'margin', 'padding',
      'border', 'border-radius', 'width', 'height', 'max-width', 'max-height',
      'display', 'float', 'clear', 'line-height', 'letter-spacing'
    ];

    return allowedProperties.some(allowed => 
      property === allowed || property.startsWith(allowed + '-')
    );
  }

  /**
   * Sanitize class names
   */
  private sanitizeClassName(className: string): string {
    return className.replace(/[^a-zA-Z0-9\s_-]/g, '').trim();
  }

  /**
   * Sanitize URLs in content
   */
  private sanitizeURLs(content: string): string {
    // This would typically be done during attribute sanitization
    // But we add an extra layer here for any missed URLs
    const urlPattern = /(https?:\/\/[^\s<>"']+)/gi;
    
    return content.replace(urlPattern, (match) => {
      return this.sanitizeURL(match);
    });
  }

  /**
   * Sanitize individual URL
   */
  private sanitizeURL(url: string): string {
    // Remove dangerous protocols
    const dangerousProtocols = /^(javascript|vbscript|data|file|ftp):/i;
    if (dangerousProtocols.test(url)) {
      return '#';
    }

    // Validate against allowed protocols
    const hasValidProtocol = this.config.allowedProtocols.some(protocol => 
      url.toLowerCase().startsWith(protocol)
    );

    if (!hasValidProtocol) {
      // If no protocol, assume https
      if (!url.includes(':')) {
        url = 'https://' + url;
      } else {
        return '#';
      }
    }

    // Additional URL validation
    try {
      const parsedUrl = new URL(url);
      
      // Block suspicious domains
      const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
      if (suspiciousDomains.includes(parsedUrl.hostname)) {
        return '#';
      }

      return parsedUrl.toString();
    } catch {
      return '#';
    }
  }

  /**
   * Final validation of sanitized content
   */
  private validateSanitizedContent(content: string): void {
    // Final XSS pattern check
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(content)) {
        throw new Error('Content still contains potential XSS after sanitization');
      }
    }

    // Check for suspicious patterns that might have been encoded
    const suspiciousEncodedPatterns = [
      /&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;/gi, // 'javascript'
      /\x3cscript/gi,
      /\u003cscript/gi
    ];

    for (const pattern of suspiciousEncodedPatterns) {
      if (pattern.test(content)) {
        throw new Error('Content contains encoded XSS patterns');
      }
    }
  }

  /**
   * Sanitize JSON content (for section data)
   */
  sanitizeJSON(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeJSON(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeAttributeValue('class', key);
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitize(value, 'user-generated');
      } else {
        sanitized[sanitizedKey] = this.sanitizeJSON(value);
      }
    }

    return sanitized;
  }

  /**
   * Validate file uploads
   */
  validateFileUpload(file: File): boolean {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg'
    ];

    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.mp4', '.webm',
      '.mp3', '.wav', '.ogg'
    ];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return false;
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return false;
    }

    return true;
  }
}

// Export singleton instances for different contexts
export const defaultSanitizer = new ContentSanitizer(DEFAULT_CONFIG);
export const strictSanitizer = new ContentSanitizer(STRICT_CONFIG);
export const richTextSanitizer = new ContentSanitizer(RICH_TEXT_CONFIG);

// Export the class for custom configurations
export { ContentSanitizer };

// Convenience functions
export function sanitizeHTML(content: string, context: 'rich-text' | 'plain-text' | 'user-generated' = 'rich-text'): string {
  return defaultSanitizer.sanitize(content, context);
}

export function sanitizeUserContent(content: string): string {
  return strictSanitizer.sanitize(content, 'user-generated');
}

export function sanitizeRichText(content: string): string {
  return richTextSanitizer.sanitize(content, 'rich-text');
}

export function sanitizeSectionData(data: any): any {
  return defaultSanitizer.sanitizeJSON(data);
}

export function validateUploadedFile(file: File): boolean {
  return defaultSanitizer.validateFileUpload(file);
}

// Export XSS test patterns for testing purposes
export const XSS_TEST_PATTERNS = XSS_PATTERNS;