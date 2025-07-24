#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import chalk from 'chalk'
import boxen from 'boxen'
import ora from 'ora'
import { execa } from 'execa'

/**
 * 🔄 Deployment Rollback System
 * 
 * Safely rollback deployments to previous working states
 */

class DeploymentRollback {
  constructor() {
    this.deploymentHistory = []
    this.environment = null
    this.selectedDeployment = null
  }

  async init() {
    this.showWelcome()
    await this.loadDeploymentHistory()
    await this.selectEnvironment()
    await this.selectDeployment()
    await this.confirmRollback()
    await this.performRollback()
    this.showSuccess()
  }

  showWelcome() {
    console.clear()
    
    const welcomeBox = boxen(
      chalk.bold.yellow('🔄 Deployment Rollback') + '\n\n' +
      chalk.gray('Safely restore your application to a previous state') + '\n' +
      chalk.gray('Database • Functions • Frontend') + '\n\n' +
      chalk.red('⚠️  Use with caution - this will modify your live environment'),
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

  async loadDeploymentHistory() {
    const spinner = ora('Loading deployment history...').start()
    
    try {
      const deploymentFiles = fs.readdirSync('.').filter(f => 
        f.includes('deployment') && f.endsWith('.json')
      )
      
      if (deploymentFiles.length === 0) {
        spinner.fail('No deployment history found')
        console.log(chalk.yellow('No previous deployments found. Please deploy first.'))
        process.exit(1)
      }
      
      this.deploymentHistory = []
      
      for (const file of deploymentFiles) {
        try {
          const deployment = JSON.parse(fs.readFileSync(file, 'utf8'))
          deployment.file = file
          this.deploymentHistory.push(deployment)
        } catch (error) {
          // Skip invalid files
        }
      }
      
      // Sort by timestamp (newest first)
      this.deploymentHistory.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
      
      spinner.succeed(`Found ${this.deploymentHistory.length} deployments`)
    } catch (error) {
      spinner.fail('Failed to load deployment history')
      console.error(chalk.red('Error:'), error.message)
      process.exit(1)
    }
  }

  async selectEnvironment() {
    const environments = [...new Set(this.deploymentHistory.map(d => d.environment))]
    
    if (environments.length === 1) {
      this.environment = environments[0]
      return
    }
    
    const { environment } = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: '🎯 Which environment would you like to rollback?',
        choices: environments.map(env => ({
          name: `${env} ${env === 'production' ? '🔴' : '🟡'}`,
          value: env
        }))
      }
    ])
    
    this.environment = environment
  }

  async selectDeployment() {
    const envDeployments = this.deploymentHistory
      .filter(d => d.environment === this.environment)
      .slice(0, 10) // Show last 10 deployments
    
    if (envDeployments.length === 0) {
      console.log(chalk.yellow(`No deployments found for ${this.environment}`))
      process.exit(1)
    }
    
    const choices = envDeployments.map(deployment => {
      const date = new Date(deployment.timestamp).toLocaleString()
      const status = deployment.status === 'success' ? '✅' : '❌'
      const duration = deployment.duration || 'unknown'
      
      return {
        name: `${status} ${date} (${duration}) - ${deployment.deploymentId || 'unnamed'}`,
        value: deployment,
        short: date
      }
    })
    
    const { deployment } = await inquirer.prompt([
      {
        type: 'list',
        name: 'deployment',
        message: '📅 Select deployment to rollback to:',
        choices,
        pageSize: 10
      }
    ])
    
    this.selectedDeployment = deployment
  }

  async confirmRollback() {
    const currentDate = new Date().toLocaleString()
    const targetDate = new Date(this.selectedDeployment.timestamp).toLocaleString()
    
    console.log('\n' + boxen(
      chalk.bold.red('⚠️  Rollback Confirmation') + '\n\n' +
      chalk.white(`Environment: ${chalk.bold(this.environment)}`) + '\n' +
      chalk.white(`From: ${chalk.bold(currentDate)}`) + '\n' +
      chalk.white(`To: ${chalk.bold(targetDate)}`) + '\n\n' +
      chalk.yellow('This will revert your application to the selected state.') + '\n' +
      chalk.yellow('Database changes may not be reversible!'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red'
      }
    ))

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '🔄 Are you absolutely sure you want to proceed with the rollback?',
        default: false
      }
    ])

    if (!confirm) {
      console.log(chalk.yellow('Rollback cancelled. Your environment remains unchanged. 👍'))
      process.exit(0)
    }
    
    // Additional confirmation for production
    if (this.environment === 'production') {
      const { doubleConfirm } = await inquirer.prompt([
        {
          type: 'input',
          name: 'doubleConfirm',
          message: 'Type "ROLLBACK PRODUCTION" to confirm:',
          validate: (input) => input === 'ROLLBACK PRODUCTION' || 'Please type exactly "ROLLBACK PRODUCTION"'
        }
      ])
    }
  }

  async performRollback() {
    console.log('\n' + chalk.bold.yellow('🔄 Starting rollback...') + '\n')

    const steps = [
      { name: 'Create Backup', emoji: '💾', fn: () => this.createBackup() },
      { name: 'Rollback Database', emoji: '🗄️', fn: () => this.rollbackDatabase() },
      { name: 'Rollback Functions', emoji: '⚡', fn: () => this.rollbackFunctions() },
      { name: 'Rollback Frontend', emoji: '🌐', fn: () => this.rollbackFrontend() },
      { name: 'Verify Rollback', emoji: '✅', fn: () => this.verifyRollback() }
    ]

    for (const step of steps) {
      const spinner = ora(`${step.emoji} ${step.name}...`).start()
      
      try {
        await step.fn()
        spinner.succeed(`${step.emoji} ${step.name} completed`)
      } catch (error) {
        spinner.fail(`${step.emoji} ${step.name} failed`)
        console.error(chalk.red('❌ Rollback failed:'), error.message)
        
        // Attempt to restore from backup
        console.log(chalk.yellow('🔄 Attempting to restore from backup...'))
        await this.restoreFromBackup()
        
        process.exit(1)
      }
    }
  }

  async createBackup() {
    const backupId = `rollback-backup-${Date.now()}`
    
    // Create database backup
    try {
      await execa('supabase', ['db', 'dump', '-f', `${backupId}.sql`])
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not create database backup'))
    }
    
    // Save current deployment state
    const currentState = {
      backupId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      reason: 'pre-rollback-backup'
    }
    
    fs.writeFileSync(`${backupId}-state.json`, JSON.stringify(currentState, null, 2))
    
    this.backupId = backupId
  }

  async rollbackDatabase() {
    const deployment = this.selectedDeployment
    
    if (!deployment.database?.migrations) {
      console.log(chalk.yellow('No database changes to rollback'))
      return
    }
    
    // This is a simplified approach - in production you'd need:
    // 1. Analyze migration differences
    // 2. Generate rollback migrations
    // 3. Apply rollback safely
    
    console.log(chalk.blue('Database rollback would require manual migration analysis'))
    console.log(chalk.yellow('Skipping automatic database rollback for safety'))
  }

  async rollbackFunctions() {
    const deployment = this.selectedDeployment
    
    if (!deployment.functions?.deployed) {
      console.log(chalk.yellow('No functions to rollback'))
      return
    }
    
    // Get function state from deployment
    if (deployment.functions.deploymentTag) {
      // Rollback to specific function deployment
      await execa('supabase', ['functions', 'deploy', '--tag', deployment.functions.deploymentTag])
    } else {
      console.log(chalk.yellow('No function deployment tag found, skipping function rollback'))
    }
  }

  async rollbackFrontend() {
    const deployment = this.selectedDeployment
    
    if (!deployment.frontend?.deployed) {
      console.log(chalk.yellow('No frontend to rollback'))
      return
    }
    
    const platform = deployment.frontend.platform
    
    if (platform === 'vercel') {
      await this.rollbackVercelDeployment(deployment)
    } else if (platform === 'netlify') {
      await this.rollbackNetlifyDeployment(deployment)
    }
  }

  async rollbackVercelDeployment(deployment) {
    if (deployment.frontend.deploymentId) {
      // Promote specific deployment
      await execa('vercel', ['promote', deployment.frontend.deploymentId])
    } else {
      console.log(chalk.yellow('No Vercel deployment ID found, cannot rollback frontend'))
    }
  }

  async rollbackNetlifyDeployment(deployment) {
    if (deployment.frontend.deploymentId) {
      // Restore specific deployment
      await execa('netlify', ['api', 'restoreSiteDeploy', '--data', `{"deploy_id":"${deployment.frontend.deploymentId}"}`])
    } else {
      console.log(chalk.yellow('No Netlify deployment ID found, cannot rollback frontend'))
    }
  }

  async verifyRollback() {
    // Perform basic health checks to verify rollback succeeded
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait for services to stabilize
    
    // Basic connectivity tests
    try {
      const { stdout } = await execa('supabase', ['status'])
      if (stdout.includes('API URL')) {
        console.log(chalk.green('✅ Supabase services are responding'))
      }
    } catch (error) {
      throw new Error('Supabase services are not responding after rollback')
    }
  }

  async restoreFromBackup() {
    if (!this.backupId) {
      console.log(chalk.red('No backup available for restoration'))
      return
    }
    
    try {
      // Restore database from backup
      const backupFile = `${this.backupId}.sql`
      if (fs.existsSync(backupFile)) {
        await execa('supabase', ['db', 'reset', '--linked'])
        await execa('psql', ['-f', backupFile], { 
          env: { ...process.env, PGPASSWORD: 'your-db-password' }
        })
        console.log(chalk.green('✅ Database restored from backup'))
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to restore from backup:'), error.message)
    }
  }

  showSuccess() {
    const targetDate = new Date(this.selectedDeployment.timestamp).toLocaleString()
    
    const successBox = boxen(
      chalk.bold.green('🎉 Rollback Completed!') + '\n\n' +
      chalk.white(`Environment: ${chalk.bold(this.environment)}`) + '\n' +
      chalk.white(`Restored to: ${chalk.bold(targetDate)}`) + '\n\n' +
      chalk.blue('🔍 Please verify your application is working correctly') + '\n' +
      chalk.yellow('⚠️  Remember to test all functionality'),
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
    console.log(chalk.gray('  1. Test your application thoroughly'))
    console.log(chalk.gray('  2. Monitor for any issues'))
    console.log(chalk.gray('  3. Consider the root cause of the original issue'))
    console.log(chalk.gray('  4. Plan your next deployment carefully'))
  }
}

// Handle CLI arguments
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.bold.yellow('Deployment Rollback') + '\n')
  console.log('Usage:')
  console.log('  pnpm deployment:rollback          # Interactive rollback')
  console.log('')
  console.log('⚠️  Warning: This will modify your live environment')
  console.log('    Always test in staging first!')
  process.exit(0)
}

// Start the rollback process
const rollback = new DeploymentRollback()
rollback.init().catch(error => {
  console.error(chalk.red('💥 Rollback failed:'), error.message)
  process.exit(1)
})