#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import boxen from 'boxen'
import { execa } from 'execa'

/**
 * 📊 Deployment Status Dashboard
 * 
 * Shows comprehensive status of all deployments and environments
 */

async function showDeploymentStatus() {
  console.clear()
  
  const statusBox = boxen(
    chalk.bold.blue('📊 Deployment Status Dashboard') + '\n\n' +
    chalk.gray('Real-time status of your Supabase deployments'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'blue'
    }
  )
  
  console.log(statusBox)

  try {
    // Get all environments from config
    const environments = await getEnvironments()
    
    for (const env of environments) {
      console.log(await getEnvironmentStatus(env))
    }
    
    // Show recent deployments
    console.log(await getRecentDeployments())
    
    // Show monitoring data
    console.log(await getMonitoringData())
    
  } catch (error) {
    console.error(chalk.red('❌ Error fetching deployment status:'), error.message)
  }
}

async function getEnvironments() {
  try {
    const configPath = path.join(process.cwd(), 'deploy.config.js')
    if (fs.existsSync(configPath)) {
      const { default: config } = await import(configPath)
      return Object.keys(config.environments)
    }
  } catch (error) {
    // Fall back to common environments
  }
  
  return ['staging', 'production']
}

async function getEnvironmentStatus(environment) {
  const status = {
    environment,
    supabase: await getSupabaseStatus(environment),
    frontend: await getFrontendStatus(environment),
    lastDeployment: await getLastDeployment(environment)
  }
  
  return formatEnvironmentStatus(status)
}

async function getSupabaseStatus(environment) {
  try {
    // Check if project is linked
    const { stdout } = await execa('supabase', ['status'])
    
    const apiUrl = stdout.match(/API URL: (https?:\/\/[^\s]+)/)?.[1]
    const dbUrl = stdout.match(/DB URL: (postgresql:\/\/[^\s]+)/)?.[1]
    
    if (apiUrl) {
      // Test API accessibility
      const response = await fetch(apiUrl, { method: 'HEAD', timeout: 5000 })
      
      return {
        status: response.ok ? 'healthy' : 'error',
        apiUrl,
        dbUrl,
        responseTime: response.ok ? 'OK' : 'Error'
      }
    }
    
    return { status: 'not-deployed', message: 'No linked project found' }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
}

async function getFrontendStatus(environment) {
  try {
    // Check for environment-specific URLs in deployment files
    const deploymentFiles = fs.readdirSync('.').filter(f => 
      f.includes('deployment') && f.includes(environment) && f.endsWith('.json')
    )
    
    if (deploymentFiles.length > 0) {
      const latestFile = deploymentFiles.sort().reverse()[0]
      const deployment = JSON.parse(fs.readFileSync(latestFile, 'utf8'))
      
      if (deployment.frontend?.url) {
        const response = await fetch(deployment.frontend.url, { 
          method: 'HEAD', 
          timeout: 5000 
        })
        
        return {
          status: response.ok ? 'healthy' : 'error',
          url: deployment.frontend.url,
          platform: deployment.frontend.platform,
          lastUpdate: deployment.timestamp
        }
      }
    }
    
    return { status: 'not-deployed', message: 'No frontend deployment found' }
  } catch (error) {
    return { status: 'error', message: error.message }
  }
}

async function getLastDeployment(environment) {
  try {
    const deploymentFiles = fs.readdirSync('.').filter(f => 
      f.includes('deployment') && f.includes(environment) && f.endsWith('.json')
    )
    
    if (deploymentFiles.length > 0) {
      const latestFile = deploymentFiles.sort().reverse()[0]
      const deployment = JSON.parse(fs.readFileSync(latestFile, 'utf8'))
      
      return {
        timestamp: deployment.timestamp,
        duration: deployment.duration,
        status: deployment.status,
        deployer: deployment.deployer || 'unknown'
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

function formatEnvironmentStatus(status) {
  const { environment, supabase, frontend, lastDeployment } = status
  
  let output = '\n' + chalk.bold.white(`🌍 ${environment.toUpperCase()}`) + '\n'
  
  // Supabase status
  const supabaseIcon = supabase.status === 'healthy' ? '🟢' : 
                      supabase.status === 'error' ? '🔴' : '🟡'
  output += `  ${supabaseIcon} Supabase: ${supabase.status}`
  
  if (supabase.apiUrl) {
    output += ` (${supabase.apiUrl})`
  }
  
  if (supabase.message) {
    output += ` - ${supabase.message}`
  }
  
  output += '\n'
  
  // Frontend status
  const frontendIcon = frontend.status === 'healthy' ? '🟢' : 
                      frontend.status === 'error' ? '🔴' : '🟡'
  output += `  ${frontendIcon} Frontend: ${frontend.status}`
  
  if (frontend.url) {
    output += ` (${frontend.url})`
  }
  
  if (frontend.message) {
    output += ` - ${frontend.message}`
  }
  
  output += '\n'
  
  // Last deployment
  if (lastDeployment) {
    const deployTime = new Date(lastDeployment.timestamp).toLocaleString()
    output += `  📅 Last deployed: ${deployTime}`
    
    if (lastDeployment.duration) {
      output += ` (${lastDeployment.duration})`
    }
  } else {
    output += `  📅 Last deployed: Never`
  }
  
  return output
}

async function getRecentDeployments() {
  try {
    const deploymentFiles = fs.readdirSync('.').filter(f => 
      f.includes('deployment') && f.endsWith('.json')
    )
    
    if (deploymentFiles.length === 0) {
      return '\n' + chalk.yellow('📝 No deployment history found')
    }
    
    const recentFiles = deploymentFiles
      .sort()
      .reverse()
      .slice(0, 5)
    
    let output = '\n' + chalk.bold.blue('📝 Recent Deployments') + '\n'
    
    for (const file of recentFiles) {
      try {
        const deployment = JSON.parse(fs.readFileSync(file, 'utf8'))
        const time = new Date(deployment.timestamp).toLocaleString()
        const status = deployment.status === 'success' ? '✅' : '❌'
        
        output += `  ${status} ${deployment.environment} - ${time}`
        
        if (deployment.duration) {
          output += ` (${deployment.duration})`
        }
        
        output += '\n'
      } catch (error) {
        // Skip invalid files
      }
    }
    
    return output
  } catch (error) {
    return '\n' + chalk.yellow('📝 Could not load deployment history')
  }
}

async function getMonitoringData() {
  try {
    const healthFiles = fs.readdirSync('.').filter(f => 
      f.includes('health-report') && f.endsWith('.json')
    )
    
    if (healthFiles.length === 0) {
      return '\n' + chalk.yellow('🏥 No health reports found')
    }
    
    const latestHealthFile = healthFiles.sort().reverse()[0]
    const healthReport = JSON.parse(fs.readFileSync(latestHealthFile, 'utf8'))
    
    const score = healthReport.summary.score
    const scoreColor = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red'
    
    let output = '\n' + chalk.bold.blue('🏥 Health Status') + '\n'
    output += `  📊 Health Score: ${chalk[scoreColor](score + '%')}\n`
    output += `  ✅ Passed: ${healthReport.summary.passed}\n`
    output += `  ❌ Failed: ${healthReport.summary.failed}\n`
    
    if (healthReport.recommendations.length > 0) {
      output += `  💡 Recommendations: ${healthReport.recommendations.length}\n`
    }
    
    return output
  } catch (error) {
    return '\n' + chalk.yellow('🏥 Could not load health data')
  }
}

async function watchMode() {
  console.log(chalk.blue('👀 Watching for changes... (Press Ctrl+C to exit)'))
  
  setInterval(async () => {
    console.clear()
    await showDeploymentStatus()
  }, 30000) // Update every 30 seconds
}

// Handle CLI arguments
const args = process.argv.slice(2)

if (args.includes('--watch') || args.includes('-w')) {
  await showDeploymentStatus()
  await watchMode()
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.bold.blue('Deployment Status Dashboard') + '\n')
  console.log('Usage:')
  console.log('  pnpm deployment:status           # Show current status')
  console.log('  pnpm deployment:status -- -w     # Watch mode (auto-refresh)')
  console.log('')
  console.log('Options:')
  console.log('  --watch, -w                      # Enable watch mode')
  console.log('  --help, -h                       # Show this help')
} else {
  await showDeploymentStatus()
}