#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  // Dynamic imports for ESM-only packages
  const chalk = (await import('chalk')).default
  const ora = (await import('ora')).default

  console.clear()
  console.log(chalk.bold.cyan('🚀 Starting Vite Development Server\n'))

  // Check environment
  if (!fs.existsSync('.env.local')) {
    // Create from example
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env.local')
      console.log(chalk.yellow('Created .env.local from .env.example'))
      console.log(chalk.yellow('Please add your Supabase credentials to .env.local\n'))
    } else {
      console.error(chalk.red('Error: .env.local not found'))
      process.exit(1)
    }
  }

  // Check for required env vars
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.log(chalk.yellow(`Missing environment variables: ${missing.join(', ')}`))
    console.log(chalk.gray('Please add them to your .env.local file\n'))
  }

  // Start Vite
  const spinner = ora('Starting Vite development server...').start()
  
  // Use pnpm to run vite
  const vite = spawn('pnpm', ['exec', 'vite'], {
    stdio: 'pipe',
    shell: process.platform === 'win32',
    env: { ...process.env, FORCE_COLOR: '1' },
    cwd: path.join(__dirname, '..')
  })
  
  let serverStarted = false
  
  vite.stdout.on('data', (data) => {
    const output = data.toString()
    if (!serverStarted && output.includes('Local:')) {
      spinner.succeed('Vite development server started')
      serverStarted = true
    }
    // Don't write output if spinner is still active
    if (serverStarted) {
      process.stdout.write(output)
    }
  })
  
  vite.stderr.on('data', (data) => {
    process.stderr.write(chalk.red(data.toString()))
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down...'))
    vite.kill('SIGTERM')
    process.exit(0)
  })
}

// Run the main function
main().catch(error => {
  console.error('Failed to start dev server:', error.message)
  process.exit(1)
})