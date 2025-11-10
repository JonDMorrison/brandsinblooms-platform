/**
 * Example usage of EventStorageAdapter
 * This file demonstrates how to use the EventStorageAdapter for event file uploads
 */

import React, { useState } from 'react';
import { EventStorageAdapter } from './event-storage';

/**
 * Example: Upload event media (images/videos)
 */
export function EventMediaUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Create adapter instance
      const adapter = new EventStorageAdapter({
        siteId: 'your-site-id',
        eventId: 'your-event-id',
      });

      // Validate file first
      const validation = adapter.validateFile(file, 'event-media');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Upload the media file
      const cdnUrl = await adapter.uploadEventMedia(
        file,
        'your-event-id',
        'your-site-id'
      );

      setUploadedUrl(cdnUrl);
      console.log('Media uploaded successfully:', cdnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3>Event Media Upload</h3>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleMediaUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedUrl && (
        <div>
          <p>Upload successful!</p>
          <p>CDN URL: {uploadedUrl}</p>
          <img src={uploadedUrl} alt="Uploaded media" style={{ maxWidth: 200 }} />
        </div>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

/**
 * Example: Upload event attachments (documents)
 */
export function EventAttachmentUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      // Create adapter instance
      const adapter = new EventStorageAdapter({
        siteId: 'your-site-id',
        eventId: 'your-event-id',
      });

      // Upload multiple attachments
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        const validation = adapter.validateFile(file, 'event-attachment');
        if (!validation.isValid) {
          throw new Error(`${file.name}: ${validation.error}`);
        }

        // Upload attachment
        const cdnUrl = await adapter.uploadEventAttachment(
          file,
          'your-event-id',
          'your-site-id'
        );

        return { name: file.name, url: cdnUrl };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);

      console.log('Attachments uploaded successfully:', uploadedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    try {
      const adapter = new EventStorageAdapter({
        siteId: 'your-site-id',
        eventId: 'your-event-id',
      });

      await adapter.deleteEventFile(url);
      setAttachments(prev => prev.filter(a => a.url !== url));
      console.log('File deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div>
      <h3>Event Attachment Upload</h3>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
        multiple
        onChange={handleAttachmentUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading attachments...</p>}
      {attachments.length > 0 && (
        <div>
          <h4>Uploaded Attachments:</h4>
          <ul>
            {attachments.map((attachment, index) => (
              <li key={index}>
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  {attachment.name}
                </a>
                <button onClick={() => handleDelete(attachment.url)} style={{ marginLeft: 10 }}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

/**
 * Example: Batch upload with progress tracking
 */
export function EventBatchUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [results, setResults] = useState<Array<{ fileName: string; status: 'success' | 'error'; url?: string; error?: string }>>([]);

  const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setResults([]);
    setProgress({ completed: 0, total: files.length });

    try {
      const adapter = new EventStorageAdapter({
        siteId: 'your-site-id',
        eventId: 'your-event-id',
      });

      const uploadResults = await adapter.uploadMultipleFiles(
        Array.from(files),
        'event-media',
        (completed, total) => {
          setProgress({ completed, total });
        }
      );

      const formattedResults = uploadResults.map(result => ({
        fileName: result.file.name,
        status: result.url ? 'success' as const : 'error' as const,
        url: result.url,
        error: result.error,
      }));

      setResults(formattedResults);
      console.log('Batch upload completed:', formattedResults);
    } catch (err) {
      console.error('Batch upload error:', err);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <div>
      <h3>Batch Event Media Upload</h3>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleBatchUpload}
        disabled={uploading}
      />
      {progress && (
        <div>
          <p>Uploading: {progress.completed} / {progress.total}</p>
          <progress value={progress.completed} max={progress.total} />
        </div>
      )}
      {results.length > 0 && (
        <div>
          <h4>Upload Results:</h4>
          <ul>
            {results.map((result, index) => (
              <li key={index} style={{ color: result.status === 'success' ? 'green' : 'red' }}>
                {result.fileName}: {result.status === 'success' ? '✓' : '✗'}
                {result.error && ` - ${result.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Check if URL is from Supabase (for migration detection)
 */
export function CheckSupabaseUrlExample() {
  const [url, setUrl] = useState('');
  const [isSupabase, setIsSupabase] = useState<boolean | null>(null);

  const checkUrl = () => {
    const adapter = new EventStorageAdapter({
      siteId: 'your-site-id',
      eventId: 'your-event-id',
    });

    const result = adapter.isSupabaseUrl(url);
    setIsSupabase(result);
  };

  return (
    <div>
      <h3>Check Supabase URL</h3>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to check"
        style={{ width: 300 }}
      />
      <button onClick={checkUrl}>Check</button>
      {isSupabase !== null && (
        <p>
          This {isSupabase ? 'IS' : 'IS NOT'} a Supabase storage URL
          {isSupabase && ' (will need migration to CDN)'}
        </p>
      )}
    </div>
  );
}