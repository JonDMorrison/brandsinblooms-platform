#!/usr/bin/env node

/**
 * Railway environment configuration manager
 * Handles secure environment variable setup and validation
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'

class RailwayEnvManager {
  constructor() {
    this.envFile = '.env.production'
    this.exampleFile = '.env.example'
    this.requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_APP_DOMAIN'
    ]
    this.sensitiveVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'REDIS_URL',
      'CSRF_SECRET_KEY',
      'CRON_SECRET'
    ]
  }

  async init() {
    console.log(chalk.blue.bold('\n🚂 Railway Environment Configuration\n'))
    
    const action = await this.selectAction()
    
    switch (action) {
      case 'setup':
        await this.setupEnvironment()
        break
      case 'validate':
        await this.validateEnvironment()
        break
      case 'sync':
        await this.syncWithRailway()
        break
      case 'export':
        await this.exportToRailway()
        break
    }
  }

  async selectAction() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🔧 Setup new environment', value: 'setup' },
          { name: '✅ Validate current environment', value: 'validate' },
          { name: '🔄 Sync with Railway', value: 'sync' },
          { name: '📤 Export to Railway', value: 'export' }
        ]
      }
    ])
    return action
  }

  async setupEnvironment() {
    const spinner = ora('Loading environment template...').start()
    
    // Load example file
    const examplePath = path.join(process.cwd(), this.exampleFile)
    if (!fs.existsSync(examplePath)) {
      spinner.fail('Example environment file not found')
      return
    }
    
    const exampleContent = fs.readFileSync(examplePath, 'utf8')
    spinner.succeed('Template loaded')
    
    // Parse variables
    const variables = this.parseEnvFile(exampleContent)
    
    // Prompt for values
    console.log(chalk.yellow('\n📝 Enter your environment values:\n'))
    
    const values = {}
    for (const [key, defaultValue] of Object.entries(variables)) {
      const isSensitive = this.sensitiveVars.includes(key)
      const isRequired = this.requiredVars.includes(key)
      
      const { value } = await inquirer.prompt([
        {
          type: isSensitive ? 'password' : 'input',
          name: 'value',
          message: `${key}${isRequired ? ' (required)' : ''}:`,
          default: defaultValue && !isSensitive ? defaultValue : undefined,
          validate: (input) => {
            if (isRequired && !input) {
              return `${key} is required`
            }
            return true
          }
        }
      ])
      
      values[key] = value
    }
    
    // Generate environment file
    await this.generateEnvFile(values)
    
    console.log(chalk.green('\n✅ Environment configuration created successfully!'))
    console.log(chalk.gray('Run "pnpm railway:env export" to push to Railway'))
  }

  async validateEnvironment() {
    const spinner = ora('Validating environment...').start()
    
    const envPath = path.join(process.cwd(), this.envFile)
    if (!fs.existsSync(envPath)) {
      spinner.fail('Production environment file not found')
      console.log(chalk.yellow('Run "pnpm railway:env setup" to create one'))
      return
    }
    
    const content = fs.readFileSync(envPath, 'utf8')
    const vars = this.parseEnvFile(content)
    
    // Check required variables
    const missing = []
    const invalid = []
    
    for (const required of this.requiredVars) {
      if (!vars[required] || vars[required] === '') {
        missing.push(required)
      }
    }
    
    // Validate Supabase URLs
    if (vars.NEXT_PUBLIC_SUPABASE_URL && !vars.NEXT_PUBLIC_SUPABASE_URL.includes('supabase')) {
      invalid.push('NEXT_PUBLIC_SUPABASE_URL: Invalid Supabase URL')
    }
    
    // Validate Redis URL
    if (vars.REDIS_URL && !vars.REDIS_URL.startsWith('redis://')) {
      invalid.push('REDIS_URL: Must start with redis://')
    }
    
    spinner.stop()
    
    if (missing.length === 0 && invalid.length === 0) {
      console.log(chalk.green('\n✅ Environment validation passed!\n'))
      
      // Show summary
      console.log(chalk.blue('Configuration Summary:'))
      console.log(`  Domain: ${vars.NEXT_PUBLIC_APP_DOMAIN}`)
      console.log(`  Supabase: ${vars.NEXT_PUBLIC_SUPABASE_URL}`)
      console.log(`  Redis: ${vars.REDIS_URL ? 'Configured' : 'Not configured'}`)
      console.log(`  Analytics: ${vars.ANALYTICS_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`)
      console.log(`  Environment: ${vars.NODE_ENV}`)
    } else {
      console.log(chalk.red('\n❌ Validation failed:\n'))
      
      if (missing.length > 0) {
        console.log(chalk.yellow('Missing required variables:'))
        missing.forEach(v => console.log(`  - ${v}`))
      }
      
      if (invalid.length > 0) {
        console.log(chalk.yellow('\nInvalid values:'))
        invalid.forEach(v => console.log(`  - ${v}`))
      }
    }
  }

  async syncWithRailway() {
    const spinner = ora('Fetching Railway variables...').start()
    
    try {
      // Get current Railway project
      const project = execSync('railway status --json', { encoding: 'utf8' })
      const projectData = JSON.parse(project)
      
      if (!projectData.projectId) {
        spinner.fail('No Railway project linked')
        console.log(chalk.yellow('Run "railway link" first'))
        return
      }
      
      // Get variables from Railway
      const varsJson = execSync('railway variables --json', { encoding: 'utf8' })
      const railwayVars = JSON.parse(varsJson)
      
      spinner.succeed('Railway variables fetched')
      
      // Compare with local
      const localPath = path.join(process.cwd(), this.envFile)
      const localVars = fs.existsSync(localPath) 
        ? this.parseEnvFile(fs.readFileSync(localPath, 'utf8'))
        : {}
      
      // Find differences
      const onlyInRailway = Object.keys(railwayVars).filter(k => !localVars[k])
      const onlyInLocal = Object.keys(localVars).filter(k => !railwayVars[k])
      const different = Object.keys(localVars).filter(k => 
        railwayVars[k] && railwayVars[k] !== localVars[k] && !this.sensitiveVars.includes(k)
      )
      
      // Show differences
      console.log(chalk.blue('\n📊 Sync Status:\n'))
      
      if (onlyInRailway.length > 0) {
        console.log(chalk.yellow('Variables only in Railway:'))
        onlyInRailway.forEach(v => console.log(`  + ${v}`))
      }
      
      if (onlyInLocal.length > 0) {
        console.log(chalk.yellow('\nVariables only in local:'))
        onlyInLocal.forEach(v => console.log(`  - ${v}`))
      }
      
      if (different.length > 0) {
        console.log(chalk.yellow('\nVariables with different values:'))
        different.forEach(v => console.log(`  ~ ${v}`))
      }
      
      if (onlyInRailway.length === 0 && onlyInLocal.length === 0 && different.length === 0) {
        console.log(chalk.green('✅ Local and Railway are in sync!'))
      } else {
        // Offer to sync
        const { sync } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'sync',
            message: 'Would you like to push local variables to Railway?',
            default: false
          }
        ])
        
        if (sync) {
          await this.exportToRailway()
        }
      }
    } catch (error) {
      spinner.fail('Failed to sync with Railway')
      console.error(chalk.red(error.message))
    }
  }

  async exportToRailway() {
    const spinner = ora('Exporting to Railway...').start()
    
    const envPath = path.join(process.cwd(), this.envFile)
    if (!fs.existsSync(envPath)) {
      spinner.fail('Production environment file not found')
      return
    }
    
    try {
      // Check Railway link
      execSync('railway status', { stdio: 'ignore' })
      
      // Set variables one by one (Railway CLI limitation)
      const content = fs.readFileSync(envPath, 'utf8')
      const vars = this.parseEnvFile(content)
      
      spinner.text = 'Setting Railway variables...'
      
      for (const [key, value] of Object.entries(vars)) {
        if (value && value !== '') {
          execSync(`railway variables set ${key}="${value}"`, { stdio: 'ignore' })
        }
      }
      
      spinner.succeed('Variables exported to Railway')
      
      console.log(chalk.green('\n✅ Railway environment updated successfully!'))
      console.log(chalk.gray('Run "railway up" to deploy with new configuration'))
      
    } catch (error) {
      spinner.fail('Failed to export to Railway')
      console.error(chalk.red(error.message))
      console.log(chalk.yellow('\nMake sure you have:'))
      console.log('  1. Railway CLI installed')
      console.log('  2. Logged in with "railway login"')
      console.log('  3. Linked project with "railway link"')
    }
  }

  parseEnvFile(content) {
    const vars = {}
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          vars[key.trim()] = value
        }
      }
    }
    
    return vars
  }

  async generateEnvFile(values) {
    const examplePath = path.join(process.cwd(), this.exampleFile)
    const exampleContent = fs.readFileSync(examplePath, 'utf8')
    
    // Replace values in template
    let content = exampleContent
    
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`^${key}=.*$`, 'gm')
      content = content.replace(regex, `${key}=${value}`)
    }
    
    // Write file
    const envPath = path.join(process.cwd(), this.envFile)
    fs.writeFileSync(envPath, content)
    
    // Add to .gitignore if not already there
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8')
      if (!gitignore.includes(this.envFile)) {
        fs.appendFileSync(gitignorePath, `\n${this.envFile}\n`)
      }
    }
  }
}

// Run the manager
const manager = new RailwayEnvManager()
manager.init().catch(error => {
  console.error(chalk.red('Error:', error.message))
  process.exit(1)
})