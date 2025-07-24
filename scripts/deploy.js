#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync, spawn } from 'child_process'
import inquirer from 'inquirer'
import chalk from 'chalk'
import boxen from 'boxen'
import ora from 'ora'
import { execa } from 'execa'
import { SupabaseManager } from './supabase-manager.js'
import { FrontendDeployer } from './frontend-deployer.js'
import { HealthChecker } from './health-checker.js'

// ✨ Welcome to the most delightful Supabase deployment experience ✨

class SupabaseDeployer {
  constructor() {
    this.config = null
    this.deploymentId = `deploy-${Date.now()}`
    this.startTime = Date.now()
    this.steps = []
    this.currentStep = 0
    this.supabaseManager = null
    this.frontendDeployer = null
    this.deploymentResults = {}
  }

  async init() {
    this.showWelcome()
    await this.loadConfig()
    await this.promptForEnvironment()
    await this.confirmDeployment()
    await this.deploy()
    this.showSuccess()
  }

  showWelcome() {
    console.clear()
    
    const welcomeBox = boxen(
      chalk.bold.blue('🚀 Supabase Magic Deploy') + '\n\n' +
      chalk.gray('Deploy your entire Supabase stack with zero friction') + '\n' +
      chalk.gray('Database • Auth • Storage • Functions • Frontend') + '\n\n' +
      chalk.yellow('✨ Sit back and enjoy the magic ✨'),
      {
        padding: 2,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'blue',
        backgroundColor: '#001122'
      }
    )
    
    console.log(welcomeBox)
  }

  async loadConfig() {
    const spinner = ora('Loading deployment configuration...').start()
    
    try {
      // Try to load deploy.config.js
      const configPath = path.join(process.cwd(), 'deploy.config.js')
      if (fs.existsSync(configPath)) {
        const { default: config } = await import(configPath)
        this.config = config
      } else {
        // Use smart defaults
        this.config = this.getDefaultConfig()
      }
      
      spinner.succeed('Configuration loaded')
    } catch (error) {
      spinner.fail('Failed to load configuration')
      console.error(chalk.red('Error:'), error.message)
      process.exit(1)
    }
  }

  getDefaultConfig() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    return {
      project: {
        name: packageJson.name || 'my-supabase-app'
      },
      environments: {
        staging: {
          projectRef: null,
          database: { migrations: true, seed: false },
          auth: { providers: ['email'], signupEnabled: true },
          storage: { buckets: [{ name: 'uploads', public: true }] },
          functions: { deploy: true },
          frontend: { platform: 'vercel' }
        },
        production: {
          projectRef: null,
          database: { migrations: true, seed: false, backupBeforeDeploy: true },
          auth: { providers: ['email'], signupEnabled: true, confirmationRequired: true },
          storage: { buckets: [{ name: 'uploads', public: true }] },
          functions: { deploy: true },
          frontend: { platform: 'vercel' }
        }
      }
    }
  }

  async promptForEnvironment() {
    const environments = Object.keys(this.config.environments)
    
    // Handle preview deployments
    if (process.argv.includes('--preview')) {
      return await this.setupPreviewDeployment()
    }
    
    if (process.argv.includes('--env')) {
      const envIndex = process.argv.indexOf('--env')
      this.selectedEnv = process.argv[envIndex + 1]
      this.envConfig = this.config.environments[this.selectedEnv]
      return
    }

    const choices = environments.map(env => ({
      name: `${env} ${env === 'production' ? '🔴' : '🟡'}`,
      value: env,
      short: env
    }))
    
    // Add preview option
    choices.push({
      name: 'preview (branch deployment) 🔀',
      value: 'preview',
      short: 'preview'
    })

    const { environment } = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: '🎯 Which environment would you like to deploy to?',
        choices,
        default: 'staging'
      }
    ])

    if (environment === 'preview') {
      return await this.setupPreviewDeployment()
    }

    this.selectedEnv = environment
    this.envConfig = this.config.environments[environment]
  }

  async setupPreviewDeployment() {
    // Get current branch
    const { stdout: currentBranch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
    
    const { branchName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'branchName',
        message: '🌿 Enter branch name for preview deployment:',
        default: currentBranch,
        validate: (input) => input.trim().length > 0 || 'Branch name is required'
      }
    ])
    
    // Create preview environment config based on staging
    this.selectedEnv = `preview-${branchName.replace(/[^a-zA-Z0-9-]/g, '-')}`
    this.envConfig = {
      ...this.config.environments.staging,
      projectRef: `${this.config.project.name}-preview-${branchName.replace(/[^a-zA-Z0-9-]/g, '-')}`,
      database: {
        ...this.config.environments.staging.database,
        resetOnDeploy: true // Always reset preview DBs
      },
      frontend: {
        ...this.config.environments.staging.frontend,
        domain: null // No custom domain for previews
      }
    }
    
    console.log(chalk.blue(`🔀 Setting up preview deployment for branch: ${branchName}`))
  }

  async confirmDeployment() {
    const deploymentPlan = this.generateDeploymentPlan()
    
    console.log('\n' + boxen(
      chalk.bold.white('📋 Deployment Plan') + '\n\n' + deploymentPlan,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow'
      }
    ))

    if (this.config.advanced?.confirmBeforeDeploy !== false) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '🚀 Ready to deploy? This will update your live environment!',
          default: true
        }
      ])

      if (!confirm) {
        console.log(chalk.yellow('Deployment cancelled. Come back when you\'re ready! 👋'))
        process.exit(0)
      }
    }
  }

  generateDeploymentPlan() {
    const plan = []
    const env = this.envConfig

    plan.push(chalk.blue('🗄️  Database:') + ' Deploy migrations' + (env.database?.seed ? ' + seed data' : ''))
    
    if (env.auth) {
      plan.push(chalk.green('🔐 Authentication:') + ` ${env.auth.providers?.join(', ') || 'email'} providers`)
    }
    
    if (env.storage?.buckets?.length) {
      plan.push(chalk.purple('📦 Storage:') + ` ${env.storage.buckets.length} bucket(s)`)
    }
    
    if (env.functions?.deploy) {
      plan.push(chalk.orange('⚡ Edge Functions:') + ' Deploy all functions')
    }
    
    if (env.frontend?.platform) {
      plan.push(chalk.cyan('🌐 Frontend:') + ` Deploy to ${env.frontend.platform}`)
    }

    return plan.join('\n')
  }

  async deploy() {
    console.log('\n' + chalk.bold.green('🚀 Starting deployment...') + '\n')

    this.steps = [
      { name: 'Setup', emoji: '⚙️', fn: () => this.setupDeployment() },
      { name: 'Database', emoji: '🗄️', fn: () => this.deployDatabase() },
      { name: 'Auth', emoji: '🔐', fn: () => this.setupAuth() },
      { name: 'Storage', emoji: '📦', fn: () => this.setupStorage() },
      { name: 'Functions', emoji: '⚡', fn: () => this.deployFunctions() },
      { name: 'Frontend', emoji: '🌐', fn: () => this.deployFrontend() },
      { name: 'Health Check', emoji: '🏥', fn: () => this.healthCheck() }
    ]

    for (let i = 0; i < this.steps.length; i++) {
      this.currentStep = i
      const step = this.steps[i]
      
      const spinner = ora(`${step.emoji} ${step.name}...`).start()
      
      try {
        await step.fn()
        spinner.succeed(`${step.emoji} ${step.name} completed`)
      } catch (error) {
        spinner.fail(`${step.emoji} ${step.name} failed`)
        
        if (this.config.advanced?.rollbackOnFailure) {
          console.log(chalk.yellow('🔄 Rolling back deployment...'))
          await this.rollback()
        }
        
        console.error(chalk.red('❌ Deployment failed:'), error.message)
        process.exit(1)
      }
    }
  }

  async setupDeployment() {
    // Initialize managers
    this.supabaseManager = new SupabaseManager(this.config, this.selectedEnv)
    this.frontendDeployer = new FrontendDeployer(this.config, this.selectedEnv, this.supabaseManager)
    
    // Ensure Supabase project exists
    const projectResult = await this.supabaseManager.ensureProjectExists()
    this.deploymentResults.project = projectResult
    
    if (projectResult.created) {
      console.log(chalk.green(`✨ Created new Supabase project: ${projectResult.projectRef}`))
    } else {
      console.log(chalk.blue(`🔗 Using existing project: ${projectResult.projectRef}`))
    }
    
    // Update config with actual project reference
    this.envConfig.projectRef = projectResult.projectRef
  }

  async deployDatabase() {
    await this.supabaseManager.deployDatabase()
    this.deploymentResults.database = { deployed: true }
  }

  async setupAuth() {
    await this.supabaseManager.setupAuth()
    this.deploymentResults.auth = { configured: true }
  }

  async setupStorage() {
    await this.supabaseManager.setupStorage()
    this.deploymentResults.storage = { configured: true }
  }

  async deployFunctions() {
    await this.supabaseManager.deployFunctions()
    this.deploymentResults.functions = { deployed: true }
  }

  async deployFrontend() {
    const result = await this.frontendDeployer.deploy()
    this.deploymentResults.frontend = result
    
    if (result.deployed) {
      console.log(chalk.green(`🌐 Frontend deployed to: ${result.url}`))
    }
  }

  async healthCheck() {
    const healthChecker = new HealthChecker(this.config, this.selectedEnv, this.supabaseManager)
    this.supabaseManager.deploymentResults = this.deploymentResults // Pass results for frontend check
    
    const healthResult = await healthChecker.performHealthCheck()
    this.deploymentResults.health = healthResult
    
    if (!healthResult.allPassed) {
      throw new Error(`Health check failed: ${healthResult.summary.failed} checks failed`)
    }
    
    // Generate health report
    await healthChecker.generateHealthReport()
    
    return healthResult
  }

  async rollback() {
    // Implement rollback logic
    console.log(chalk.yellow('Rollback functionality coming soon...'))
  }

  showSuccess() {
    const deployTime = Math.round((Date.now() - this.startTime) / 1000)
    
    const successBox = boxen(
      chalk.bold.green('🎉 Deployment Successful!') + '\n\n' +
      chalk.white(`Environment: ${chalk.bold(this.selectedEnv)}`) + '\n' +
      chalk.white(`Time taken: ${chalk.bold(deployTime + 's')}`) + '\n' +
      chalk.white(`Project: ${chalk.bold(this.envConfig.projectRef)}`) + '\n\n' +
      chalk.blue('🔗 Your app is now live and ready to use!') + '\n\n' +
      this.generateAccessLinks(),
      {
        padding: 2,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green',
        backgroundColor: '#002200'
      }
    )
    
    console.log('\n' + successBox)
    
    // Show quick access commands
    console.log(chalk.bold.blue('\n📱 Quick Commands:'))
    console.log(chalk.gray('  pnpm deployment:status') + ' - Check deployment status')
    console.log(chalk.gray('  pnpm deployment:rollback') + ' - Rollback if needed')
    console.log(chalk.gray('  supabase projects list') + ' - View all projects')
  }

  generateAccessLinks() {
    const links = []
    
    // Supabase Dashboard
    links.push(chalk.cyan('📊 Dashboard: ') + `https://supabase.com/dashboard/project/${this.envConfig.projectRef}`)
    
    // Frontend URL (if deployed)
    if (this.deploymentResults.frontend?.deployed) {
      links.push(chalk.cyan('🌐 Frontend: ') + this.deploymentResults.frontend.url)
    }
    
    // Database URL
    if (this.deploymentResults.project?.projectRef) {
      links.push(chalk.blue('🗄️  Database: ') + `postgresql://[user]:[password]@db.${this.deploymentResults.project.projectRef}.supabase.co:5432/postgres`)
    }
    
    // API Base URL
    links.push(chalk.green('🔌 API Base: ') + `https://${this.envConfig.projectRef}.supabase.co/rest/v1/`)
    
    return links.join('\n')
  }
}

// Handle CLI arguments
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.bold.blue('Supabase Magic Deploy') + '\n')
  console.log('Usage:')
  console.log('  pnpm deploy                       # Interactive deployment')
  console.log('  pnpm deploy:staging               # Deploy to staging')
  console.log('  pnpm deploy:production            # Deploy to production')
  console.log('  pnpm deploy -- --preview          # Create preview deployment')
  console.log('')
  console.log('Options:')
  console.log('  --env <environment>              # Specify environment')
  console.log('  --preview                        # Create preview deployment')
  console.log('  --help, -h                       # Show this help')
  process.exit(0)
}

// Start the magic ✨
const deployer = new SupabaseDeployer()
deployer.init().catch(error => {
  console.error(chalk.red('💥 Something went wrong:'), error.message)
  process.exit(1)
})