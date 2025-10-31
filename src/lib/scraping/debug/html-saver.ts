/**
 * HTML Saver - Development Debugging Utility
 *
 * Saves scraped HTML to disk for manual inspection during development.
 * This helps debug why content extraction might be failing by allowing
 * developers to inspect the actual HTML that was scraped.
 *
 * Files are saved to: .tmp/scrapes/{scrapeId}/
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { DiscoveredPage } from '../page-discovery';

export interface SavedHtmlResult {
  scrapeId: string;
  basePath: string;
  savedFiles: Array<{
    pageType: string;
    index: number;
    filePath: string;
    url: string;
  }>;
}

interface ScrapeMetadata {
  scrapeId: string;
  baseUrl: string;
  timestamp: string;
  totalPages: number;
  environment: string;
  savedFiles: string[];
}

interface CleanupConfig {
  maxAgeHours: number;      // Default: 24
  maxTotalSizeMB: number;   // Default: 500
  maxSessions: number;      // Default: 50
}

/**
 * Generates a unique scrape session ID
 * Format: {ISO timestamp}_{shortId}
 */
function generateScrapeId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomId = Math.random().toString(36).substring(2, 6);
  return `${timestamp}_${randomId}`;
}

/**
 * Saves scraped HTML pages to disk for debugging
 *
 * @param pages - Array of scraped pages from discovery
 * @param baseUrl - The base URL being scraped
 * @returns Result with scrape ID and saved file paths, or null if disabled
 */
export async function saveScrapedHtmlForDebug(
  pages: DiscoveredPage[],
  baseUrl: string
): Promise<SavedHtmlResult | null> {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  let scrapeDir: string | undefined;

  try {
    const scrapeId = generateScrapeId();
    const basePath = path.join(process.cwd(), '.tmp', 'scrapes', scrapeId);
    scrapeDir = basePath;

    // Ensure directory exists
    await fs.mkdir(basePath, { recursive: true });

    const savedFiles: SavedHtmlResult['savedFiles'] = [];

    // Save each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const filename = `page-${page.pageType}-${i}.html`;
      const filePath = path.join(basePath, filename);

      await fs.writeFile(filePath, page.html, 'utf-8');

      savedFiles.push({
        pageType: page.pageType,
        index: i,
        filePath,
        url: page.url,
      });
    }

    // Save metadata
    const metadata: ScrapeMetadata = {
      scrapeId,
      baseUrl,
      timestamp: new Date().toISOString(),
      totalPages: pages.length,
      environment: process.env.NODE_ENV || 'development',
      savedFiles: savedFiles.map(f => f.filePath),
    };

    await fs.writeFile(
      path.join(basePath, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Run cleanup (async, don't wait)
    cleanupOldScrapes().catch(err => {
      console.error('[HTML_SAVER] Cleanup failed:', err);
    });

    return {
      scrapeId,
      basePath,
      savedFiles,
    };
  } catch (error: unknown) {
    // Log but don't throw - this is a debug feature
    console.error('[HTML_SAVER] Failed to save HTML:', error);

    // Try to clean up partial saves
    if (scrapeDir) {
      try {
        await fs.rm(scrapeDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    return null;
  }
}

/**
 * Cleans up old scrape directories to prevent disk bloat
 *
 * @param config - Cleanup configuration
 */
export async function cleanupOldScrapes(config?: Partial<CleanupConfig>): Promise<void> {
  const finalConfig: CleanupConfig = {
    maxAgeHours: config?.maxAgeHours ?? 24,
    maxTotalSizeMB: config?.maxTotalSizeMB ?? 500,
    maxSessions: config?.maxSessions ?? 50,
  };

  try {
    const scrapesDir = path.join(process.cwd(), '.tmp', 'scrapes');

    // Check if directory exists
    try {
      await fs.access(scrapesDir);
    } catch {
      // Directory doesn't exist, nothing to clean
      return;
    }

    const entries = await fs.readdir(scrapesDir, { withFileTypes: true });
    const directories = entries.filter(e => e.isDirectory());

    if (directories.length === 0) {
      return;
    }

    // Get directory stats
    const dirStats = await Promise.all(
      directories.map(async (dir) => {
        const dirPath = path.join(scrapesDir, dir.name);
        const stats = await fs.stat(dirPath);
        return {
          name: dir.name,
          path: dirPath,
          mtimeMs: stats.mtimeMs,
          size: await getDirSize(dirPath),
        };
      })
    );

    // Sort by modification time (newest first)
    dirStats.sort((a, b) => b.mtimeMs - a.mtimeMs);

    const now = Date.now();
    const maxAgeMs = finalConfig.maxAgeHours * 60 * 60 * 1000;
    let totalSize = dirStats.reduce((sum, d) => sum + d.size, 0);
    const maxTotalBytes = finalConfig.maxTotalSizeMB * 1024 * 1024;

    const toDelete: string[] = [];

    // Remove old scrapes
    for (let i = 0; i < dirStats.length; i++) {
      const dir = dirStats[i];
      const age = now - dir.mtimeMs;

      // Keep if within age limit, size limit, and session limit
      if (
        i < finalConfig.maxSessions &&
        age < maxAgeMs &&
        totalSize <= maxTotalBytes
      ) {
        continue;
      }

      toDelete.push(dir.path);
      totalSize -= dir.size;
    }

    // Delete directories
    if (toDelete.length > 0) {
      console.log(`[HTML_SAVER] Cleaning up ${toDelete.length} old scrape session(s)`);
      await Promise.all(
        toDelete.map(dirPath =>
          fs.rm(dirPath, { recursive: true, force: true })
        )
      );
    }
  } catch (error: unknown) {
    console.error('[HTML_SAVER] Cleanup failed:', error);
    // Don't throw - cleanup failures shouldn't break anything
  }
}

/**
 * Recursively calculates directory size
 */
async function getDirSize(dirPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const sizes = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          return getDirSize(entryPath);
        }
        const stats = await fs.stat(entryPath);
        return stats.size;
      })
    );
    return sizes.reduce((sum, size) => sum + size, 0);
  } catch {
    return 0;
  }
}
