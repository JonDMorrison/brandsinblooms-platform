#!/usr/bin/env node

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const net = require('net')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

/**
 * 🚀 Unified Development Environment Launcher
 * 
 * Smart local development orchestrator that handles:
 * - Port conflict detection and resolution
 * - Existing service detection (PostgreSQL, etc.)
 * - Environment validation
 * - Service health checks
 * - Graceful startup/shutdown
 * - Next.js development server integration
 */

async function main() {
  // Dynamic imports for ESM-only packages
  const chalk = (await import('chalk')).default
  const inquirer = (await import('inquirer')).default
  const boxen = (await import('boxen')).default
  const ora = (await import('ora')).default

  class DevEnvironment {
    constructor(chalk, inquirer, boxen, ora) {
      this.chalk = chalk
      this.inquirer = inquirer
      this.boxen = boxen
      this.ora = ora
      this.services = []
      
      // Default to Supabase CLI ports
      this.supabaseCliConfig = {
        postgres: {
          local: 5432,
          supabase: 54322
        },
        api: {
          port: 54321
        },
        studio: {
          port: 54323
        },
        nextjs: {
          port: 3001
        }
      }
      
      // Docker Compose ports
      this.dockerComposeConfig = {
        postgres: {
          local: 5432,
          supabase: 5432
        },
        api: {
          port: 8000
        },
        studio: {
          port: 3000
        },
        nextjs: {
          port: 3001  // Default Next.js port
        }
      }
      
      // Will be set based on mode
      this.config = null
      
      this.mode = null // 'supabase-cli' or 'docker-compose'
      this.useExistingPostgres = false
      this.skipSupabase = false
      this.portsToUse = {}
    }

    async init() {
      this.showWelcome()
      
      // Run all checks
      await this.runChecks()
      
      // Start services
      await this.startServices()
      
      // Show success and keep running
      this.showSuccess()
      await this.keepRunning()
    }

    showWelcome() {
      console.clear()
      
      const welcomeBox = this.boxen(
        this.chalk.bold.cyan('🚀 Local Development Environment') + '\n\n' +
        this.chalk.gray('Starting your Supabase + Next.js stack') + '\n' +
        this.chalk.gray('Smart port management • Service orchestration'),
        {
          padding: 2,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'cyan',
          backgroundColor: '#001122'
        }
      )
      
      console.log(welcomeBox)
    }

    async runChecks() {
      console.log('\n' + this.chalk.bold.white('Running pre-flight checks...') + '\n')
      
      const checks = [
        { name: 'Check Node.js version', fn: () => this.checkNodeVersion() },
        { name: 'Check Docker/Supabase CLI', fn: () => this.checkBackend() },
        { name: 'Check environment setup', fn: () => this.checkEnvironment() },
        { name: 'Scan for port conflicts', fn: () => this.checkPorts() },
        { name: 'Detect existing services', fn: () => this.detectExistingServices() }
      ]
      
      for (const check of checks) {
        const spinner = this.ora(check.name).start()
        
        try {
          await check.fn()
          spinner.succeed()
        } catch (error) {
          spinner.fail()
          console.error(this.chalk.red('\n❌ Error:'), error.message)
          
          // Offer to continue anyway
          const { continueAnyway } = await this.inquirer.prompt([{
            type: 'confirm',
            name: 'continueAnyway',
            message: 'Continue anyway?',
            default: false
          }])
          
          if (!continueAnyway) {
            process.exit(1)
          }
        }
      }
    }

    checkNodeVersion() {
      const nodeVersion = process.version
      const major = parseInt(nodeVersion.split('.')[0].substring(1))
      
      if (major < 18) {
        throw new Error(`Node.js ${nodeVersion} is too old. Please upgrade to v18 or higher.`)
      }
    }

    checkEnvironment() {
      if (!fs.existsSync('.env.local')) {
        // Create .env.local with default values based on the mode
        const apiUrl = this.mode === 'docker-compose' 
          ? `http://localhost:${this.config.api.port}`
          : `http://localhost:${this.config.api.port}`
        
        const envContent = `# Local Supabase Configuration
# These values are for local development only
# For production, use your actual Supabase project credentials

NEXT_PUBLIC_SUPABASE_URL=${apiUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Optional: For deployment scripts
# SUPABASE_PROJECT_ID=your_project_id
# SUPABASE_ACCESS_TOKEN=your_access_token

# Frontend deployment (Vercel/Netlify)
# FRONTEND_URL=https://your-app.vercel.app
`
        fs.writeFileSync('.env.local', envContent)
        console.log(this.chalk.green(`  ✓ Created .env.local with ${this.mode} defaults (API: ${apiUrl})`))
      }
      
      // Reload environment variables after potentially creating the file
      dotenv.config({ path: '.env.local' })
      
      // Check for required env vars
      const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      const missing = required.filter(key => !process.env[key])
      
      if (missing.length > 0 && !this.isFirstRun()) {
        console.log(this.chalk.yellow(`  Missing environment variables: ${missing.join(', ')}`))
        console.log(this.chalk.gray('  (This is OK for first run with local Supabase)'))
      }
    }

    isFirstRun() {
      // Check if this looks like a fresh project
      return !fs.existsSync('.supabase') || !fs.existsSync('supabase/.temp')
    }

    async checkBackend() {
      // Check for Supabase CLI first (prefer over Docker Compose)
      try {
        execSync('supabase --version', { stdio: 'ignore' })
        this.mode = 'supabase-cli'
        this.config = this.supabaseCliConfig
        return
      } catch {}
      
      // Check for Docker as fallback
      try {
        execSync('docker --version', { stdio: 'ignore' })
        
        // Check if Docker is running
        try {
          execSync('docker info', { stdio: 'ignore' })
          
          // Check if docker-compose.yml exists
          if (fs.existsSync(path.join(process.cwd(), 'docker-compose.yml'))) {
            this.mode = 'docker-compose'
            this.config = this.dockerComposeConfig
            return
          }
        } catch {
          // Docker installed but not running
        }
      } catch {
        // Docker not installed
      }
      
      // Neither found
      if (this.mode === null) {
        throw new Error('Neither Docker nor Supabase CLI found. Please install one of them.')
      }
    }

    async checkPorts() {
      const portsToCheck = [
        { name: 'Supabase API', port: this.config.api.port, service: 'api' },
        { name: 'Supabase Studio', port: this.config.studio.port, service: 'studio' },
        { name: 'Next.js', port: this.config.nextjs.port, service: 'nextjs' }
      ]
      
      // Only check PostgreSQL port if using Supabase CLI
      if (this.mode === 'supabase-cli') {
        portsToCheck.unshift({ name: 'PostgreSQL', port: this.config.postgres.supabase, service: 'postgres' })
      }
      
      const conflicts = []
      
      for (const { name, port, service } of portsToCheck) {
        const inUse = await this.isPortInUse(port)
        if (inUse) {
          conflicts.push({ name, port, service })
        }
      }
      
      if (conflicts.length > 0) {
        console.log(this.chalk.yellow('\n⚠️  Port conflicts detected:'))
        conflicts.forEach(({ name, port }) => {
          console.log(this.chalk.gray(`  • Port ${port} (${name}) is already in use`))
        })
        
        await this.resolvePortConflicts(conflicts)
      }
    }

    async isPortInUse(port) {
      return new Promise((resolve) => {
        const server = net.createServer()
        
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            resolve(true)
          } else {
            resolve(false)
          }
        })
        
        server.once('listening', () => {
          server.close()
          resolve(false)
        })
        
        server.listen(port, '127.0.0.1')
      })
    }

    async resolvePortConflicts(conflicts) {
      const choices = conflicts.map(({ name, port, service }) => ({
        name: `${name} (port ${port})`,
        value: service
      }))
      
      const { resolution } = await this.inquirer.prompt([{
        type: 'list',
        name: 'resolution',
        message: 'How would you like to handle port conflicts?',
        choices: [
          { name: 'Use alternative ports (recommended)', value: 'alternative' },
          { name: 'Stop conflicting services', value: 'stop' },
          { name: 'Exit and resolve manually', value: 'exit' }
        ]
      }])
      
      if (resolution === 'exit') {
        console.log(this.chalk.yellow('\nPlease stop the conflicting services and try again.'))
        process.exit(0)
      }
      
      if (resolution === 'alternative') {
        // Find alternative ports
        for (const { service, port } of conflicts) {
          let newPort = port + 1
          while (await this.isPortInUse(newPort) && newPort < port + 100) {
            newPort++
          }
          this.portsToUse[service] = newPort
          console.log(this.chalk.green(`  ✓ Will use port ${newPort} for ${service}`))
        }
      }
      
      if (resolution === 'stop') {
        // Try to identify and stop services
        await this.stopConflictingServices(conflicts)
      }
    }

    async detectExistingServices() {
      // Skip PostgreSQL check for docker-compose mode
      // Docker Compose manages its own PostgreSQL container
      if (this.mode === 'supabase-cli') {
        // Check if PostgreSQL is running locally
        const pgRunning = await this.isPortInUse(5432)
        
        if (pgRunning) {
          console.log(this.chalk.yellow('\n📦 Detected existing PostgreSQL on port 5432'))
          
          const { useExisting } = await this.inquirer.prompt([{
            type: 'confirm',
            name: 'useExisting',
            message: 'Would you like to use the existing PostgreSQL instance?',
            default: false
          }])
          
          this.useExistingPostgres = useExisting
          
          if (useExisting) {
            console.log(this.chalk.gray('  Note: You\'ll need to ensure your database is properly configured'))
          }
        }
      }
      
      // Check if Supabase is already running
      const supabaseRunning = await this.isPortInUse(this.config.api.port)
      
      if (supabaseRunning) {
        console.log(this.chalk.yellow('\n🔥 Detected Supabase already running'))
        
        const { action } = await this.inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Use existing Supabase instance', value: 'use' },
            { name: 'Stop and restart Supabase', value: 'restart' },
            { name: 'Exit', value: 'exit' }
          ]
        }])
        
        if (action === 'exit') {
          process.exit(0)
        }
        
        if (action === 'restart') {
          await this.stopSupabase()
          this.skipSupabase = false
        }
        
        if (action === 'use') {
          this.skipSupabase = true
        }
      } else {
        // Supabase is not running, so we need to start it
        console.log(this.chalk.gray('\n📦 Supabase is not running. It will be started automatically.'))
        this.skipSupabase = false
      }
    }

    async stopSupabase() {
      const spinner = this.ora('Stopping existing Supabase instance...').start()
      
      try {
        if (this.mode === 'supabase-cli') {
          execSync('supabase stop', { stdio: 'ignore' })
        } else {
          execSync('docker compose down', { stdio: 'ignore' })
        }
        spinner.succeed()
      } catch (error) {
        spinner.fail()
        throw new Error('Failed to stop existing Supabase instance')
      }
    }

    async startServices() {
      console.log('\n' + this.chalk.bold.green('🚀 Starting services...') + '\n')
      
      // Start Supabase
      if (!this.skipSupabase) {
        await this.startSupabase()
      }
      
      // Start Next.js
      await this.startNextjs()
    }

    async startSupabase() {
      const spinner = this.ora('Starting Supabase...').start()
      
      try {
        // First check if Supabase is already running
        const alreadyRunning = await this.isPortInUse(this.config.api.port)
        
        if (alreadyRunning) {
          spinner.info('Supabase is already running')
          // Get and display connection info
          this.displaySupabaseInfo()
          return
        }
        
        if (this.mode === 'supabase-cli') {
          // Use Supabase CLI
          const supabase = spawn('supabase', ['start'], {
            stdio: 'pipe',
            shell: true
          })
          
          this.services.push({ name: 'Supabase', process: supabase })
          
          // Pipe Supabase output to show progress
          this.supabaseStarted = false
          supabase.stdout.on('data', (data) => {
            const output = data.toString()
            const lines = output.split('\n')
            for (const line of lines) {
              const trimmedLine = line.trim()
              if (trimmedLine) {
                console.log(this.chalk.gray(`  ${trimmedLine}`))
                // Check if Supabase has finished starting
                if (trimmedLine.includes('Started supabase') || 
                    trimmedLine.includes('API URL:') ||
                    trimmedLine.includes('Studio URL:')) {
                  this.supabaseStarted = true
                }
              }
            }
          })
          
          supabase.stderr.on('data', (data) => {
            const output = data.toString().trim()
            if (output && !output.includes('Unknown config fields')) {
              console.log(this.chalk.yellow(`  ${output}`))
            }
          })
          
          // Wait for Supabase to be ready
          await this.waitForSupabase()
          
          spinner.succeed('Supabase started')
          
          // Get and display connection info
          this.displaySupabaseInfo()
          
        } else {
          // Use Docker Compose
          const args = ['up', '-d']
          
          if (this.useExistingPostgres) {
            args.push('--scale', 'db=0')
          }
          
          const docker = spawn('docker', ['compose', ...args], {
            stdio: 'pipe',
            shell: true
          })
          
          this.services.push({ name: 'Docker Compose', process: docker })
          
          // Wait for services to be ready
          await this.waitForDocker()
          
          spinner.succeed('Docker services started')
        }
      } catch (error) {
        spinner.fail()
        throw error
      }
    }

    async waitForSupabase() {
      // Wait for Supabase API to be ready
      let attempts = 0
      const maxAttempts = 300 // 5 minutes for initial setup with image downloads
      
      console.log(this.chalk.gray('  Waiting for Supabase services to be ready...'))
      console.log(this.chalk.gray('  (First time setup may take several minutes to download images)'))
      
      while (attempts < maxAttempts) {
        // First check if Supabase CLI has reported it's ready
        if (this.supabaseStarted) {
          console.log(this.chalk.gray('  Supabase is ready!'))
          await new Promise(resolve => setTimeout(resolve, 2000))
          return
        }
        
        try {
          // Check if we can actually connect to the API
          const response = await fetch(`http://127.0.0.1:${this.config.api.port}/rest/v1/`, {
            method: 'GET',
            signal: AbortSignal.timeout(1000)
          }).catch(() => null)
          
          // API should return 401 or 400 with "No API key" message when it's ready
          if (response && (response.status === 401 || response.status === 400)) {
            const text = await response.text().catch(() => '')
            if (text.includes('No API key') || text.includes('apikey')) {
              // Give it a bit more time to fully initialize
              await new Promise(resolve => setTimeout(resolve, 2000))
              return
            }
          }
        } catch {}
        
        // Also check if port is in use as fallback
        const ready = await this.isPortInUse(this.config.api.port)
        if (ready && attempts > 15) { // After 15 seconds, port being in use is probably good enough
          await new Promise(resolve => setTimeout(resolve, 2000))
          return
        }
        
        // Show progress every 10 seconds
        if (attempts > 0 && attempts % 10 === 0) {
          console.log(this.chalk.gray(`  Still waiting... (${attempts}s)`))
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }
      
      throw new Error('Supabase failed to start within 5 minutes')
    }

    async waitForDocker() {
      // Wait for Docker Compose services to be ready
      let attempts = 0
      const maxAttempts = 60
      
      while (attempts < maxAttempts) {
        try {
          // Check if we can connect to the API
          const response = await fetch(`http://127.0.0.1:${this.config.api.port}/rest/v1/`, {
            method: 'GET',
            signal: AbortSignal.timeout(1000)
          }).catch(() => null)
          
          // API should return 401 or 400 with "No API key" message when it's ready
          if (response && (response.status === 401 || response.status === 400)) {
            const text = await response.text().catch(() => '')
            if (text.includes('No API key') || text.includes('apikey')) {
              // Give it a bit more time to fully initialize
              await new Promise(resolve => setTimeout(resolve, 2000))
              return
            }
          }
        } catch {}
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }
      
      throw new Error('Docker services failed to start within 60 seconds')
    }

    displaySupabaseInfo() {
      if (this.mode === 'supabase-cli') {
        try {
          const output = execSync('supabase status', { encoding: 'utf8' })
          
          // Parse and display relevant info
          const lines = output.split('\n')
          const apiUrl = lines.find(l => l.includes('API URL'))?.split(':')?.slice(1)?.join(':')?.trim() || 
                         lines.find(l => l.includes('API URL'))?.split('│')[1]?.trim()
          const anonKey = lines.find(l => l.includes('anon key'))?.split(':')?.slice(1)?.join(':')?.trim() ||
                          lines.find(l => l.includes('anon key'))?.split('│')[1]?.trim()
          
          if (apiUrl && anonKey) {
            console.log(this.chalk.cyan('\n📋 Local Supabase Credentials:'))
            console.log(this.chalk.gray('  Add these to your .env.local:\n'))
            console.log(this.chalk.white(`  NEXT_PUBLIC_SUPABASE_URL=${apiUrl}`))
            console.log(this.chalk.white(`  NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`))
          }
        } catch (error) {
          // Silently fail - status might not be available yet
          console.log(this.chalk.gray('\n  Supabase is starting up...'))
        }
      } else {
        // Docker Compose mode
        console.log(this.chalk.cyan('\n📋 Local Supabase Credentials:'))
        console.log(this.chalk.gray('  Using Docker Compose defaults:\n'))
        console.log(this.chalk.white(`  NEXT_PUBLIC_SUPABASE_URL=http://localhost:${this.config.api.port}`))
        console.log(this.chalk.white(`  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`))
        console.log(this.chalk.gray('\n  (See .env.local for full key)'))
      }
    }

    async startNextjs() {
      const spinner = this.ora('Starting Next.js development server...').start()
      
      const port = this.portsToUse.nextjs || this.config.nextjs.port
      
      const nextjs = spawn('pnpm', ['dev'], {
        stdio: 'pipe',
        shell: process.platform === 'win32',
        env: { ...process.env, FORCE_COLOR: '1' }
      })
      
      this.services.push({ name: 'Next.js', process: nextjs })
      
      // Pipe Next.js output
      nextjs.stdout.on('data', (data) => {
        const output = data.toString()
        if (output.includes('- ready') || output.includes('▲ Next.js')) {
          spinner.succeed('Next.js development server started')
        }
        // Show Next.js output
        process.stdout.write(this.chalk.gray(output))
      })
      
      nextjs.stderr.on('data', (data) => {
        process.stderr.write(this.chalk.red(data.toString()))
      })
    }

    showSuccess() {
      const port = this.portsToUse.nextjs || this.config.nextjs.port
      const studioPort = this.portsToUse.studio || this.config.studio.port
      
      const successBox = this.boxen(
        this.chalk.bold.green('✅ Development environment is running!') + '\n\n' +
        this.chalk.white('Access your services:') + '\n\n' +
        this.chalk.cyan(`  🌐 Next.js App:       ${this.chalk.bold(`http://localhost:${port}`)}`) + '\n' +
        this.chalk.cyan(`  🗄️  Supabase Studio:   ${this.chalk.bold(`http://localhost:${studioPort}`)}`) + '\n' +
        this.chalk.cyan(`  🔌 Supabase API:      ${this.chalk.bold(`http://localhost:${this.config.api.port}`)}`) + '\n\n' +
        this.chalk.yellow('Press Ctrl+C to stop all services'),
        {
          padding: 2,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'green',
          backgroundColor: '#002200'
        }
      )
      
      console.log('\n' + successBox)
    }

    async keepRunning() {
      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown())
      process.on('SIGTERM', () => this.shutdown())
      
      // Keep the process running
      await new Promise(() => {})
    }

    async shutdown() {
      console.log(this.chalk.yellow('\n\n🛑 Shutting down services...'))
      
      for (const service of this.services) {
        console.log(this.chalk.gray(`  Stopping ${service.name}...`))
        
        if (service.name === 'Supabase' && this.mode === 'supabase-cli') {
          // Use supabase stop for clean shutdown
          try {
            execSync('supabase stop', { stdio: 'ignore' })
          } catch {}
        } else {
          // Kill the process
          service.process.kill('SIGTERM')
        }
      }
      
      console.log(this.chalk.green('✅ All services stopped\n'))
      process.exit(0)
    }

    async stopConflictingServices(conflicts) {
      // Try to identify what's using the ports
      for (const { name, port } of conflicts) {
        try {
          let pid
          
          if (process.platform === 'darwin' || process.platform === 'linux') {
            // Use lsof on Unix-like systems
            const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim()
            pid = output.split('\n')[0]
          } else if (process.platform === 'win32') {
            // Use netstat on Windows
            const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
            const match = output.match(/\s+(\d+)$/m)
            pid = match ? match[1] : null
          }
          
          if (pid) {
            console.log(this.chalk.yellow(`  Found process ${pid} using port ${port}`))
            
            const { kill } = await this.inquirer.prompt([{
              type: 'confirm',
              name: 'kill',
              message: `Kill process ${pid} to free port ${port}?`,
              default: false
            }])
            
            if (kill) {
              process.kill(pid)
              console.log(this.chalk.green(`  ✓ Stopped process ${pid}`))
            }
          }
        } catch {
          console.log(this.chalk.red(`  ✗ Could not identify process using port ${port}`))
        }
      }
    }
  }

  // Start the development environment
  const dev = new DevEnvironment(chalk, inquirer, boxen, ora)
  dev.init().catch(error => {
    console.error(chalk.red('\n💥 Failed to start development environment:'), error.message)
    process.exit(1)
  })
}

// Run the main function
main().catch(error => {
  console.error('Failed to load dependencies:', error.message)
  console.error('Please run: pnpm install')
  process.exit(1)
})