/**
 * Cloudflare Service Layer
 * High-level service for managing custom hostnames and worker routes
 */

import type {
  ServiceResult,
  CustomHostnameCreationResult,
  WorkerRouteCreationResult,
  SslStatus,
  DnsRecordsForCustomer,
  CustomHostnameResult,
  CreateCustomHostnameRequest,
  CreateWorkerRouteRequest,
} from './types';
import { CloudflareClient } from './client';
import { getCloudflareConfig, getProxyUrl, getWorkerPattern } from './config';
import {
  isAlreadyExistsError,
  isNotFoundError,
  isCloudflareError,
  CloudflareErrorCodes,
  isCloudflareErrorCode,
} from './errors';
import { createClient } from '@/lib/supabase/server';

/**
 * Cloudflare Service for managing custom domains
 */
export class CloudflareService {
  private static client: CloudflareClient | null = null;

  /**
   * Get or create Cloudflare client
   */
  private static getClient(): CloudflareClient {
    if (!this.client) {
      const config = getCloudflareConfig();
      this.client = new CloudflareClient(config);
    }
    return this.client;
  }

  /**
   * Add a custom hostname to Cloudflare zone
   * This creates the custom hostname and returns DNS records for customer configuration
   */
  static async addCustomHostname(
    domain: string,
    siteId: string
  ): Promise<ServiceResult<CustomHostnameCreationResult>> {
    try {
      const client = this.getClient();
      const config = getCloudflareConfig();

      // Prepare custom hostname request
      const request: CreateCustomHostnameRequest = {
        hostname: domain,
        ssl: {
          method: 'txt',
          type: 'dv',
          settings: {
            http2: 'on',
            min_tls_version: '1.2',
            tls_1_3: 'on',
          },
        },
      };

      console.log(`[CloudflareService] Creating custom hostname for domain: ${domain}`);

      // Create custom hostname
      const response = await client.createCustomHostname(request);

      if (!response.success || !response.result) {
        return {
          success: false,
          error: `Failed to create custom hostname: ${response.errors?.[0]?.message || 'Unknown error'}`,
        };
      }

      const result = response.result;

      // Extract DNS verification details
      const txtName = result.ownership_verification?.name || '';
      const txtValue = result.ownership_verification?.value || '';
      const cnameTarget = getProxyUrl(config);

      // Update site record with Cloudflare details
      const supabase = await createClient();
      const { error: updateError } = await supabase
        .from('sites')
        .update({
          cloudflare_hostname_id: result.id,
          cloudflare_ssl_status: result.ssl.status,
          cloudflare_txt_name: txtName,
          cloudflare_txt_value: txtValue,
          cloudflare_cname_target: cnameTarget,
          cloudflare_created_at: new Date().toISOString(),
        })
        .eq('id', siteId);

      if (updateError) {
        console.error('[CloudflareService] Failed to update site record:', updateError);
        // Don't fail the operation, but log the error
      }

      return {
        success: true,
        data: {
          hostnameId: result.id,
          txtName,
          txtValue,
          cnameTarget,
          sslStatus: result.ssl.status,
        },
      };
    } catch (error) {
      console.error('[CloudflareService] Error adding custom hostname:', error);

      // Check if hostname already exists
      if (isAlreadyExistsError(error)) {
        // Try to fetch existing hostname
        try {
          const existing = await this.getExistingHostname(domain);
          if (existing) {
            return {
              success: true,
              data: existing,
            };
          }
        } catch {
          // Ignore and return original error
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove a custom hostname from Cloudflare
   */
  static async removeCustomHostname(hostnameId: string): Promise<boolean> {
    try {
      const client = this.getClient();

      console.log(`[CloudflareService] Removing custom hostname: ${hostnameId}`);

      const response = await client.deleteCustomHostname(hostnameId);

      if (!response.success) {
        // If hostname not found, consider it a success (already deleted)
        if (response.errors?.some(e => e.code === CloudflareErrorCodes.CUSTOM_HOSTNAME_NOT_FOUND)) {
          return true;
        }

        console.error('[CloudflareService] Failed to delete custom hostname:', response.errors);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[CloudflareService] Error removing custom hostname:', error);

      // If hostname not found, consider it a success
      if (isNotFoundError(error)) {
        return true;
      }

      return false;
    }
  }

  /**
   * Check SSL certificate status for a custom hostname
   */
  static async checkSslStatus(hostnameId: string): Promise<ServiceResult<SslStatus>> {
    try {
      const client = this.getClient();

      console.log(`[CloudflareService] Checking SSL status for hostname: ${hostnameId}`);

      const response = await client.getCustomHostname(hostnameId);

      if (!response.success || !response.result) {
        return {
          success: false,
          error: 'Failed to get hostname details',
        };
      }

      const status = response.result.ssl.status;

      // Update database with new status if SSL is active
      if (status === 'active') {
        const supabase = await createClient();
        await supabase
          .from('sites')
          .update({
            cloudflare_ssl_status: status,
            cloudflare_activated_at: new Date().toISOString(),
          })
          .eq('cloudflare_hostname_id', hostnameId);
      }

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      console.error('[CloudflareService] Error checking SSL status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add a worker route for custom domain
   */
  static async addWorkerRoute(
    domain: string,
    workerName?: string
  ): Promise<ServiceResult<WorkerRouteCreationResult>> {
    try {
      const client = this.getClient();
      const config = getCloudflareConfig();

      const pattern = getWorkerPattern(domain);
      const scriptName = workerName || config.workerName;

      const request: CreateWorkerRouteRequest = {
        pattern,
        script: scriptName,
      };

      console.log(`[CloudflareService] Creating worker route for pattern: ${pattern}`);

      const response = await client.createWorkerRoute(request);

      if (!response.success || !response.result) {
        return {
          success: false,
          error: `Failed to create worker route: ${response.errors?.[0]?.message || 'Unknown error'}`,
        };
      }

      return {
        success: true,
        data: {
          routeId: response.result.id,
          pattern: response.result.pattern,
        },
      };
    } catch (error) {
      console.error('[CloudflareService] Error adding worker route:', error);

      // Check if route already exists
      if (isAlreadyExistsError(error)) {
        return {
          success: true,
          data: {
            routeId: 'existing',
            pattern: getWorkerPattern(domain),
          },
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove a worker route
   */
  static async removeWorkerRoute(routeId: string): Promise<boolean> {
    try {
      const client = this.getClient();

      console.log(`[CloudflareService] Removing worker route: ${routeId}`);

      const response = await client.deleteWorkerRoute(routeId);

      if (!response.success) {
        // If route not found, consider it a success (already deleted)
        if (response.errors?.some(e => e.code === CloudflareErrorCodes.WORKER_ROUTE_NOT_FOUND)) {
          return true;
        }

        console.error('[CloudflareService] Failed to delete worker route:', response.errors);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[CloudflareService] Error removing worker route:', error);

      // If route not found, consider it a success
      if (isNotFoundError(error)) {
        return true;
      }

      return false;
    }
  }

  /**
   * Get custom hostname details
   */
  static async getCustomHostname(
    hostnameId: string
  ): Promise<ServiceResult<CustomHostnameResult>> {
    try {
      const client = this.getClient();

      const response = await client.getCustomHostname(hostnameId);

      if (!response.success || !response.result) {
        return {
          success: false,
          error: 'Failed to get hostname details',
        };
      }

      return {
        success: true,
        data: response.result,
      };
    } catch (error) {
      console.error('[CloudflareService] Error getting custom hostname:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate DNS records for customer to configure
   */
  static async getDnsRecordsForDomain(
    domain: string,
    hostnameId: string
  ): Promise<ServiceResult<DnsRecordsForCustomer>> {
    try {
      const config = getCloudflareConfig();

      // Get hostname details to get TXT record values
      const hostnameResult = await this.getCustomHostname(hostnameId);

      if (!hostnameResult.success || !hostnameResult.data) {
        return {
          success: false,
          error: 'Failed to get hostname details',
        };
      }

      const hostname = hostnameResult.data;

      if (!hostname.ownership_verification) {
        return {
          success: false,
          error: 'Ownership verification details not available',
        };
      }

      const dnsRecords: DnsRecordsForCustomer = {
        cname: {
          type: 'CNAME',
          name: '@',
          value: getProxyUrl(config),
          ttl: 300,
        },
        txt: {
          type: 'TXT',
          name: hostname.ownership_verification.name,
          value: hostname.ownership_verification.value,
          ttl: 300,
        },
      };

      return {
        success: true,
        data: dnsRecords,
      };
    } catch (error) {
      console.error('[CloudflareService] Error generating DNS records:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Complete setup for a custom domain (hostname + worker route)
   */
  static async setupCustomDomain(
    domain: string,
    siteId: string
  ): Promise<ServiceResult<{
    hostname: CustomHostnameCreationResult;
    workerRoute: WorkerRouteCreationResult;
    dnsRecords: DnsRecordsForCustomer;
  }>> {
    try {
      // Step 1: Add custom hostname
      const hostnameResult = await this.addCustomHostname(domain, siteId);

      if (!hostnameResult.success || !hostnameResult.data) {
        return {
          success: false,
          error: hostnameResult.error || 'Failed to create custom hostname',
        };
      }

      // Step 2: Add worker route
      const routeResult = await this.addWorkerRoute(domain);

      if (!routeResult.success || !routeResult.data) {
        // Rollback: remove custom hostname
        await this.removeCustomHostname(hostnameResult.data.hostnameId);
        return {
          success: false,
          error: routeResult.error || 'Failed to create worker route',
        };
      }

      // Step 3: Generate DNS records
      const dnsResult = await this.getDnsRecordsForDomain(
        domain,
        hostnameResult.data.hostnameId
      );

      if (!dnsResult.success || !dnsResult.data) {
        // Rollback: remove both hostname and route
        await this.removeCustomHostname(hostnameResult.data.hostnameId);
        await this.removeWorkerRoute(routeResult.data.routeId);
        return {
          success: false,
          error: dnsResult.error || 'Failed to generate DNS records',
        };
      }

      // Update site with worker route ID
      const supabase = await createClient();
      await supabase
        .from('sites')
        .update({
          cloudflare_route_id: routeResult.data.routeId,
        })
        .eq('id', siteId);

      return {
        success: true,
        data: {
          hostname: hostnameResult.data,
          workerRoute: routeResult.data,
          dnsRecords: dnsResult.data,
        },
      };
    } catch (error) {
      console.error('[CloudflareService] Error setting up custom domain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove complete custom domain setup
   */
  static async removeCustomDomain(
    hostnameId: string,
    routeId?: string
  ): Promise<boolean> {
    try {
      const results = await Promise.allSettled([
        this.removeCustomHostname(hostnameId),
        routeId ? this.removeWorkerRoute(routeId) : Promise.resolve(true),
      ]);

      // Check if all operations succeeded
      return results.every(
        result => result.status === 'fulfilled' && result.value === true
      );
    } catch (error) {
      console.error('[CloudflareService] Error removing custom domain:', error);
      return false;
    }
  }

  /**
   * Get existing hostname by domain name
   */
  private static async getExistingHostname(
    domain: string
  ): Promise<CustomHostnameCreationResult | null> {
    try {
      const client = this.getClient();
      const config = getCloudflareConfig();

      const response = await client.listCustomHostnames({ hostname: domain });

      if (!response.success || !response.result || response.result.length === 0) {
        return null;
      }

      const hostname = response.result[0];

      return {
        hostnameId: hostname.id,
        txtName: hostname.ownership_verification?.name || '',
        txtValue: hostname.ownership_verification?.value || '',
        cnameTarget: getProxyUrl(config),
        sslStatus: hostname.ssl.status,
      };
    } catch (error) {
      console.error('[CloudflareService] Error getting existing hostname:', error);
      return null;
    }
  }
}