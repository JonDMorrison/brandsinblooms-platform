#!/usr/bin/env node

/**
 * Build optimization script for Railway deployment
 * Analyzes and optimizes the build process for faster deployments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

/**
 * Log with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check and optimize node_modules
 */
function optimizeNodeModules() {
  log('\n📦 Optimizing node_modules...', 'blue');
  
  // Remove unnecessary files from node_modules
  const unnecessaryPatterns = [
    'node_modules/**/*.md',
    'node_modules/**/*.markdown',
    'node_modules/**/*.txt',
    'node_modules/**/.github',
    'node_modules/**/test',
    'node_modules/**/tests',
    'node_modules/**/example',
    'node_modules/**/examples',
    'node_modules/**/.eslintrc*',
    'node_modules/**/.prettierrc*',
    'node_modules/**/.travis.yml',
    'node_modules/**/.gitlab-ci.yml',
    'node_modules/**/LICENSE*',
    'node_modules/**/CHANGELOG*',
    'node_modules/**/README*'
  ];
  
  let savedSpace = 0;
  
  try {
    // Use find command to locate and remove files
    unnecessaryPatterns.forEach(pattern => {
      try {
        const findCmd = `find ${pattern} -type f 2>/dev/null | wc -l`;
        const fileCount = parseInt(execSync(findCmd, { encoding: 'utf8' }).trim());
        
        if (fileCount > 0) {
          execSync(`find ${pattern} -type f -delete 2>/dev/null || true`);
          log(`  ✓ Removed ${fileCount} files matching ${pattern}`, 'green');
        }
      } catch (e) {
        // Ignore errors for patterns that don't match
      }
    });
    
    log('  ✓ Node modules optimized', 'green');
  } catch (error) {
    log('  ⚠ Could not fully optimize node_modules', 'yellow');
  }
}

/**
 * Optimize Next.js build output
 */
function optimizeNextBuild() {
  log('\n🚀 Optimizing Next.js build...', 'blue');
  
  const nextConfig = path.join(process.cwd(), 'next.config.js');
  
  // Check if standalone output is enabled
  const configContent = fs.readFileSync(nextConfig, 'utf8');
  if (!configContent.includes("output: 'standalone'")) {
    log('  ⚠ Standalone output not enabled in next.config.js', 'yellow');
    log('    Add "output: \'standalone\'" to your next.config.js for optimal Docker builds', 'yellow');
  } else {
    log('  ✓ Standalone output enabled', 'green');
  }
  
  // Check for bundle analyzer
  if (configContent.includes('@next/bundle-analyzer')) {
    log('  ✓ Bundle analyzer configured', 'green');
    log('    Run "pnpm analyze" to analyze bundle size', 'blue');
  }
  
  // Check for image optimization
  if (configContent.includes('images:')) {
    log('  ✓ Image optimization configured', 'green');
  } else {
    log('  ⚠ Consider configuring image optimization', 'yellow');
  }
}

/**
 * Create or update .dockerignore
 */
function optimizeDockerIgnore() {
  log('\n🐳 Optimizing .dockerignore...', 'blue');
  
  const dockerignorePath = path.join(process.cwd(), '.dockerignore');
  const dockerignoreContent = `# Dependencies
node_modules
.pnpm-store

# Testing
coverage
.nyc_output

# Next.js
.next
out
dist

# Environment
.env
.env.local
.env.*.local
!.env.example
!.env.production.example

# Supabase
supabase/.branches
supabase/.temp
supabase/.env*

# IDEs
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore
.github

# Docs
*.md
!README.md
docs
documentation

# Build artifacts
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Development
.eslintrc*
.prettierrc*
jest.config.*
tsconfig.tsbuildinfo
*.test.*
*.spec.*
__tests__
__mocks__

# CI/CD
.gitlab-ci.yml
.travis.yml
.circleci
azure-pipelines.yml

# Docker
Dockerfile*
docker-compose*
!Dockerfile.standalone

# Scripts (except necessary ones)
scripts/test-*.js
scripts/dev.js

# Misc
.npmrc
.yarnrc
.editorconfig
*.todo
TODO`;
  
  fs.writeFileSync(dockerignorePath, dockerignoreContent);
  log('  ✓ .dockerignore optimized', 'green');
}

/**
 * Analyze bundle size
 */
async function analyzeBundleSize() {
  log('\n📊 Analyzing bundle size...', 'blue');
  
  try {
    const buildDir = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(buildDir)) {
      log('  ⚠ No build found. Run "pnpm build" first', 'yellow');
      return;
    }
    
    // Get build size
    const getDirSize = (dir) => {
      let size = 0;
      try {
        const output = execSync(`du -sk "${dir}" 2>/dev/null`, { encoding: 'utf8' });
        size = parseInt(output.split('\t')[0]) * 1024; // Convert KB to bytes
      } catch (e) {
        // Ignore errors
      }
      return size;
    };
    
    const totalSize = getDirSize(buildDir);
    const standaloneSize = getDirSize(path.join(buildDir, 'standalone'));
    const staticSize = getDirSize(path.join(buildDir, 'static'));
    
    log(`  Total build size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`, 'bright');
    
    if (standaloneSize > 0) {
      log(`  Standalone size: ${(standaloneSize / 1024 / 1024).toFixed(2)} MB`, 'bright');
    }
    
    if (staticSize > 0) {
      log(`  Static assets: ${(staticSize / 1024 / 1024).toFixed(2)} MB`, 'bright');
    }
    
    // Size recommendations
    if (totalSize > 100 * 1024 * 1024) { // > 100MB
      log('  ⚠ Build size is large. Consider:', 'yellow');
      log('    - Removing unused dependencies', 'yellow');
      log('    - Implementing code splitting', 'yellow');
      log('    - Optimizing images', 'yellow');
      log('    - Running "pnpm analyze" to identify large modules', 'yellow');
    } else if (totalSize > 50 * 1024 * 1024) { // > 50MB
      log('  ✓ Build size is acceptable but could be optimized', 'green');
    } else {
      log('  ✓ Build size is optimal', 'green');
    }
    
  } catch (error) {
    log('  ⚠ Could not analyze bundle size', 'yellow');
  }
}

/**
 * Generate build report
 */
function generateBuildReport() {
  log('\n📋 Generating build report...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    node_version: process.version,
    platform: process.platform,
    recommendations: []
  };
  
  // Check package.json for optimization opportunities
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for unnecessary dependencies
  const devDepsInDeps = [];
  const commonDevPackages = ['eslint', 'prettier', 'jest', '@types/', 'webpack', 'babel'];
  
  Object.keys(packageJson.dependencies || {}).forEach(dep => {
    if (commonDevPackages.some(devPkg => dep.includes(devPkg))) {
      devDepsInDeps.push(dep);
    }
  });
  
  if (devDepsInDeps.length > 0) {
    report.recommendations.push({
      priority: 'high',
      message: `Move these packages to devDependencies: ${devDepsInDeps.join(', ')}`
    });
  }
  
  // Check for duplicate packages
  try {
    const duplicates = execSync('pnpm ls --depth=0 --json 2>/dev/null', { encoding: 'utf8' });
    const parsed = JSON.parse(duplicates);
    
    // Simple duplicate detection (this is a simplified version)
    const packageCounts = {};
    const checkDuplicates = (deps) => {
      Object.keys(deps || {}).forEach(pkg => {
        const baseName = pkg.split('/').pop();
        packageCounts[baseName] = (packageCounts[baseName] || 0) + 1;
      });
    };
    
    checkDuplicates(parsed.dependencies);
    checkDuplicates(parsed.devDependencies);
    
    const duplicatePackages = Object.entries(packageCounts)
      .filter(([_, count]) => count > 1)
      .map(([name]) => name);
    
    if (duplicatePackages.length > 0) {
      report.recommendations.push({
        priority: 'medium',
        message: `Potential duplicate packages detected: ${duplicatePackages.join(', ')}`
      });
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Check for large dependencies
  const largePackages = ['@aws-sdk', 'monaco-editor', 'moment', 'lodash'];
  const foundLargePackages = largePackages.filter(pkg => 
    Object.keys(packageJson.dependencies || {}).some(dep => dep.includes(pkg))
  );
  
  if (foundLargePackages.length > 0) {
    report.recommendations.push({
      priority: 'medium',
      message: `Consider alternatives for large packages: ${foundLargePackages.join(', ')}`
    });
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'build-optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('  ✓ Report saved to build-optimization-report.json', 'green');
  
  // Display recommendations
  if (report.recommendations.length > 0) {
    log('\n📌 Optimization Recommendations:', 'yellow');
    report.recommendations.forEach(rec => {
      const icon = rec.priority === 'high' ? '❗' : '💡';
      log(`  ${icon} ${rec.message}`, rec.priority === 'high' ? 'red' : 'yellow');
    });
  } else {
    log('\n✨ No optimization recommendations found!', 'green');
  }
}

/**
 * Main execution
 */
async function main() {
  log('\n🔧 Railway Build Optimization Tool', 'bright');
  log('=====================================\n', 'bright');
  
  try {
    // Run optimization steps
    optimizeDockerIgnore();
    optimizeNextBuild();
    
    // Only optimize node_modules if --aggressive flag is passed
    if (process.argv.includes('--aggressive')) {
      optimizeNodeModules();
    }
    
    await analyzeBundleSize();
    generateBuildReport();
    
    log('\n✅ Optimization complete!', 'green');
    log('\nNext steps:', 'blue');
    log('  1. Review build-optimization-report.json', 'bright');
    log('  2. Run "pnpm build" to test optimizations', 'bright');
    log('  3. Run "docker build -f Dockerfile.standalone -t test ." to test Docker build', 'bright');
    log('  4. Deploy to Railway with "railway up"', 'bright');
    
  } catch (error) {
    log(`\n❌ Error during optimization: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };