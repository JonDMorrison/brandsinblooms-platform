/**
 * Simple test for storage infrastructure
 * Run with: npx tsx src/lib/storage/test.ts
 */

import { isStorageConfigured, getClientConfig } from './s3-client';

console.log('🧪 Testing S3/Storage Infrastructure...');

// Test configuration
console.log('📋 Storage Configuration:');
try {
  const config = getClientConfig();
  console.log('✅ Config loaded:', {
    endpoint: config.endpoint || 'default',
    bucketName: config.bucketName,
    region: config.region,
    hasCredentials: !!(config.accessKeyId && config.secretAccessKey),
  });
} catch (error) {
  console.error('❌ Config error:', error);
}

// Test if storage is properly configured
console.log('\n🔍 Configuration Check:');
const isConfigured = isStorageConfigured();
console.log(isConfigured ? '✅ Storage is configured' : '❌ Storage is not configured');

// Environment check
console.log('\n🌍 Environment Variables:');
const envVars = [
  'NODE_ENV',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY', 
  'MINIO_ENDPOINT',
  'MINIO_BUCKET_NAME',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'NEXT_PUBLIC_CDN_URL',
];

envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${value ? '✅' : '❌'} ${varName}: ${value ? '***' : 'not set'}`);
});

console.log('\n✨ Test completed!');