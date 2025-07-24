#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import chalk from 'chalk'
import boxen from 'boxen'
import ora from 'ora'

/**
 * 🧹 Starter Cleanup Script
 * 
 * Removes demo content and starter-specific files
 */

class StarterCleanup {
  constructor() {
    this.filesToRemove = [
      'demo.js',
      'start.sh',
      'improvement-plan.md',
      'scripts/init-project.js',
      'scripts/cleanup-starter.js' // Remove this script after running
    ]
    
    this.scriptsToRemove = [
      'init-project',
      'cleanup-starter',
      'demo'
    ]
    
    this.force = process.argv.includes('--force')
  }

  async init() {
    if (!this.force) {
      this.showWelcome()
    }
    await this.confirmCleanup()
    await this.performCleanup()
    if (!this.force) {
      this.showSuccess()
    }
  }

  showWelcome() {
    console.clear()
    
    const welcomeBox = boxen(
      chalk.bold.yellow('🧹 Starter Cleanup') + '\n\n' +
      chalk.gray('Remove demo content and starter-specific files') + '\n' +
      chalk.gray('Clean • Optimize • Prepare for production') + '\n\n' +
      chalk.red('⚠️  This will permanently delete starter files'),
      {
        padding: 2,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'yellow',
        backgroundColor: '#332200'
      }
    )
    
    console.log(welcomeBox)
  }

  async confirmCleanup() {
    if (this.force) {
      // Skip confirmation in force mode
      return
    }
    
    console.log('\n' + boxen(
      chalk.bold.white('📋 Cleanup Plan') + '\n\n' +
      chalk.yellow('Files to be removed:') + '\n' +
      this.filesToRemove.map(f => chalk.gray(`  • ${f}`)).join('\n') + '\n\n' +
      chalk.yellow('Package.json scripts to be removed:') + '\n' +
      this.scriptsToRemove.map(s => chalk.gray(`  • ${s}`)).join('\n') + '\n\n' +
      chalk.blue('CLAUDE.md will be updated to remove starter context'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow'
      }
    ))

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '🗑️  Are you sure you want to remove starter content?',
        default: false
      }
    ])

    if (!confirm) {
      console.log(chalk.yellow('Cleanup cancelled. Starter files remain unchanged. 👍'))
      process.exit(0)
    }
  }

  async performCleanup() {
    console.log('\n' + chalk.bold.green('🧹 Starting cleanup...') + '\n')

    const steps = [
      { name: 'Remove Demo Files', emoji: '🗑️', fn: () => this.removeFiles() },
      { name: 'Update Package.json', emoji: '📦', fn: () => this.updatePackageJson() },
      { name: 'Clean CLAUDE.md', emoji: '📝', fn: () => this.cleanClaudeMd() }
    ]

    for (const step of steps) {
      const spinner = ora(`${step.emoji} ${step.name}...`).start()
      
      try {
        await step.fn()
        spinner.succeed(`${step.emoji} ${step.name} completed`)
      } catch (error) {
        spinner.fail(`${step.emoji} ${step.name} failed`)
        console.error(chalk.red('❌ Error:'), error.message)
        process.exit(1)
      }
    }
  }

  async removeFiles() {
    let removedCount = 0
    
    for (const file of this.filesToRemove) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
        removedCount++
        console.log(chalk.gray(`  Removed: ${file}`))
      }
    }
    
    if (removedCount === 0) {
      console.log(chalk.yellow('  No files to remove'))
    }
  }

  async updatePackageJson() {
    const packagePath = 'package.json'
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    
    let removedCount = 0
    
    // Remove starter-specific scripts
    for (const script of this.scriptsToRemove) {
      if (packageJson.scripts[script]) {
        delete packageJson.scripts[script]
        removedCount++
        console.log(chalk.gray(`  Removed script: ${script}`))
      }
    }
    
    if (removedCount > 0) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
    } else {
      console.log(chalk.yellow('  No scripts to remove'))
    }
  }

  async cleanClaudeMd() {
    if (!fs.existsSync('CLAUDE.md')) {
      console.log(chalk.yellow('  CLAUDE.md not found, skipping'))
      return
    }

    let claudeMd = fs.readFileSync('CLAUDE.md', 'utf8')
    
    // Remove the specific starter project context
    const originalLength = claudeMd.length
    
    claudeMd = claudeMd.replace(
      /This is the \*\*Supabase Starter\*\* repository - an internal development tool for ClusterA[\s\S]*?### Key Components[\s\S]*?(?=## Core Identity)/,
      `This is your Supabase application project.

### Key Components
- Complete Supabase application with Vite + React frontend
- TypeScript-first approach with auto-generated database types
- Docker Compose for local development
- Automated deployment system with health monitoring

`
    )
    
    if (claudeMd.length !== originalLength) {
      fs.writeFileSync('CLAUDE.md', claudeMd)
      console.log(chalk.gray('  Updated CLAUDE.md project context'))
    } else {
      console.log(chalk.yellow('  No changes needed in CLAUDE.md'))
    }
  }

  showSuccess() {
    const successBox = boxen(
      chalk.bold.green('🎉 Cleanup Completed!') + '\n\n' +
      chalk.white('Your project is now clean and ready for development') + '\n\n' +
      chalk.blue('✨ All starter-specific content has been removed') + '\n' +
      chalk.blue('🚀 Your project is ready for customization'),
      {
        padding: 2,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green',
        backgroundColor: '#002200'
      }
    )
    
    console.log('\n' + successBox)
    
    console.log(chalk.bold.blue('\n📱 Next Steps:'))
    console.log(chalk.gray('  1. Start development: pnpm docker:up && pnpm dev'))
    console.log(chalk.gray('  2. Create your database schema in supabase/migrations/'))
    console.log(chalk.gray('  3. Add your own components and features'))
    console.log(chalk.gray('  4. Deploy when ready: pnpm deploy'))
  }
}

// Start the cleanup
const cleanup = new StarterCleanup()
cleanup.init().catch(error => {
  console.error(chalk.red('💥 Cleanup failed:'), error.message)
  process.exit(1)
})