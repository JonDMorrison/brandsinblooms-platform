#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execa } from 'execa'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

/**
 * Test script to verify project creation works correctly
 */

async function testProjectCreation() {
  console.log(chalk.blue('🧪 Testing project creation flow...\n'))
  
  const testProjectName = 'test-project-' + Date.now()
  const testProjectPath = path.join(rootDir, '..', testProjectName)
  
  // Create test configuration
  const testConfig = {
    projectName: testProjectName,
    projectPath: testProjectPath,
    projectDescription: 'Test project for template validation',
    authorName: 'Test Author',
    authorEmail: 'test@example.com',
    supabaseProjectName: testProjectName,
    includeDocker: true,
    packageManager: 'pnpm',
    gitInit: false // Skip git for faster testing
  }
  
  const configPath = path.join(rootDir, 'test-config.json')
  
  try {
    // Write test configuration
    console.log(chalk.gray('📝 Creating test configuration...'))
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2))
    
    // Run create-project script
    console.log(chalk.gray('🚀 Running create-project script...'))
    await execa('node', ['scripts/create-project.js', '--answers', configPath], {
      cwd: rootDir,
      stdio: 'inherit'
    })
    
    // Verify project was created
    console.log(chalk.gray('\n🔍 Verifying project structure...'))
    
    const requiredFiles = [
      'package.json',
      'README.md',
      'tsconfig.json',
      'vite.config.ts',
      '.env.example',
      'src/main.tsx',
      'src/App.tsx',
      'supabase/config.toml',
      'scripts/deploy.js'
    ]
    
    const requiredDirs = [
      'src',
      'src/components',
      'src/lib',
      'src/pages',
      'supabase',
      'scripts',
      'docs'
    ]
    
    let allValid = true
    
    // Check files
    for (const file of requiredFiles) {
      const filePath = path.join(testProjectPath, file)
      if (fs.existsSync(filePath)) {
        console.log(chalk.green(`  ✓ ${file}`))
      } else {
        console.log(chalk.red(`  ✗ ${file} - MISSING`))
        allValid = false
      }
    }
    
    // Check directories
    for (const dir of requiredDirs) {
      const dirPath = path.join(testProjectPath, dir)
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        console.log(chalk.green(`  ✓ ${dir}/`))
      } else {
        console.log(chalk.red(`  ✗ ${dir}/ - MISSING`))
        allValid = false
      }
    }
    
    // Check package.json was updated
    console.log(chalk.gray('\n📦 Checking package.json updates...'))
    const packageJson = JSON.parse(fs.readFileSync(path.join(testProjectPath, 'package.json'), 'utf8'))
    
    if (packageJson.name === testProjectName) {
      console.log(chalk.green(`  ✓ Project name updated to: ${testProjectName}`))
    } else {
      console.log(chalk.red(`  ✗ Project name not updated (found: ${packageJson.name})`))
      allValid = false
    }
    
    if (packageJson.description === testConfig.projectDescription) {
      console.log(chalk.green(`  ✓ Description updated`))
    } else {
      console.log(chalk.red(`  ✗ Description not updated`))
      allValid = false
    }
    
    // Check that template-specific files were removed
    console.log(chalk.gray('\n🧹 Checking cleanup...'))
    const filesToBeRemoved = [
      'scripts/create-project.js',
      'scripts/init-project.js',
      'demo.js',
      'start.sh',
      'create-new-project.sh'
    ]
    
    for (const file of filesToBeRemoved) {
      const filePath = path.join(testProjectPath, file)
      if (!fs.existsSync(filePath)) {
        console.log(chalk.green(`  ✓ ${file} removed`))
      } else {
        console.log(chalk.red(`  ✗ ${file} still exists`))
        allValid = false
      }
    }
    
    // Test result
    console.log('\n' + chalk.bold('Test Result:'))
    if (allValid) {
      console.log(chalk.green('✅ All tests passed! Project creation works correctly.'))
    } else {
      console.log(chalk.red('❌ Some tests failed. Please check the output above.'))
    }
    
    // Cleanup
    console.log(chalk.gray('\n🧹 Cleaning up test files...'))
    fs.rmSync(configPath)
    fs.rmSync(testProjectPath, { recursive: true, force: true })
    
    console.log(chalk.green('✓ Cleanup complete'))
    
    process.exit(allValid ? 0 : 1)
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed with error:'), error.message)
    
    // Cleanup on error
    if (fs.existsSync(configPath)) fs.rmSync(configPath)
    if (fs.existsSync(testProjectPath)) fs.rmSync(testProjectPath, { recursive: true, force: true })
    
    process.exit(1)
  }
}

// Run the test
testProjectCreation()