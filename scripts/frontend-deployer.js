import fs from 'fs'
import path from 'path'
import { execa } from 'execa'
import chalk from 'chalk'

/**
 * 🌐 Frontend Magic Deployer
 * 
 * Handles automatic frontend deployment to Vercel, Netlify, and other platforms
 * with automatic environment variable injection and domain configuration
 */
export class FrontendDeployer {
  constructor(config, environment, supabaseManager) {
    this.config = config
    this.environment = environment
    this.envConfig = config.environments[environment]
    this.frontendConfig = this.envConfig.frontend
    this.supabaseManager = supabaseManager
  }

  async deploy() {
    if (!this.frontendConfig || this.frontendConfig.platform === false) {
      console.log(chalk.yellow('Frontend deployment disabled, skipping...'))
      return { deployed: false }
    }

    const platform = this.frontendConfig.platform.toLowerCase()
    
    switch (platform) {
      case 'vercel':
        return await this.deployToVercel()
      case 'netlify':
        return await this.deployToNetlify()
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  async deployToVercel() {
    console.log(chalk.blue('🚀 Deploying to Vercel...'))
    
    try {
      // Ensure Vercel is authenticated
      await this.ensureVercelAuth()
      
      // Set up environment variables
      await this.setupVercelEnvironment()
      
      // Build and deploy
      const deployResult = await this.executeVercelDeploy()
      
      // Configure custom domain if specified
      if (this.frontendConfig.domain) {
        await this.configureVercelDomain(deployResult.url)
      }
      
      return {
        deployed: true,
        platform: 'vercel',
        url: deployResult.url,
        domain: this.frontendConfig.domain || deployResult.url
      }
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`)
    }
  }

  async deployToNetlify() {
    console.log(chalk.blue('🚀 Deploying to Netlify...'))
    
    try {
      // Ensure Netlify is authenticated
      await this.ensureNetlifyAuth()
      
      // Create or update site
      const siteInfo = await this.setupNetlifySite()
      
      // Set up environment variables
      await this.setupNetlifyEnvironment(siteInfo.siteId)
      
      // Build and deploy
      const deployResult = await this.executeNetlifyDeploy(siteInfo.siteId)
      
      return {
        deployed: true,
        platform: 'netlify',
        url: deployResult.url,
        domain: this.frontendConfig.domain || deployResult.url
      }
    } catch (error) {
      throw new Error(`Netlify deployment failed: ${error.message}`)
    }
  }

  async ensureVercelAuth() {
    try {
      await execa('vercel', ['whoami'])
    } catch (error) {
      console.log(chalk.yellow('Please authenticate with Vercel...'))
      await execa('vercel', ['login'], { stdio: 'inherit' })
    }
  }

  async ensureNetlifyAuth() {
    try {
      await execa('netlify', ['status'])
    } catch (error) {
      console.log(chalk.yellow('Please authenticate with Netlify...'))
      await execa('netlify', ['login'], { stdio: 'inherit' })
    }
  }

  async setupVercelEnvironment() {
    const envVars = await this.generateEnvironmentVariables()
    const projectName = this.getProjectName()
    
    for (const [key, value] of Object.entries(envVars)) {
      try {
        // Add environment variable to Vercel project
        await execa('vercel', [
          'env', 'add', key,
          this.environment === 'production' ? 'production' : 'preview',
          '--force'
        ], {
          input: value,
          stdio: ['pipe', 'pipe', 'pipe']
        })
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not set ${key}:`, error.message))
      }
    }
    
    console.log(chalk.green(`✅ Environment variables configured for ${projectName}`))
  }

  async setupNetlifyEnvironment(siteId) {
    const envVars = await this.generateEnvironmentVariables()
    
    for (const [key, value] of Object.entries(envVars)) {
      try {
        await execa('netlify', [
          'env:set', key, value,
          '--site', siteId
        ])
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not set ${key}:`, error.message))
      }
    }
    
    console.log(chalk.green('✅ Environment variables configured'))
  }

  async generateEnvironmentVariables() {
    const projectUrl = await this.supabaseManager.getProjectUrl()
    const { anonKey, serviceKey } = await this.supabaseManager.getProjectKeys()
    
    const baseEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: projectUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
      SUPABASE_SERVICE_ROLE_KEY: serviceKey,
      NODE_ENV: this.environment === 'production' ? 'production' : 'development'
    }
    
    // Merge with custom environment variables from config
    const customEnvVars = this.frontendConfig.envVars || {}
    
    return { ...baseEnvVars, ...customEnvVars }
  }

  async executeVercelDeploy() {
    const deployArgs = ['deploy']
    
    if (this.environment === 'production') {
      deployArgs.push('--prod')
    }
    
    // Add build command if specified
    if (this.frontendConfig.buildCommand) {
      deployArgs.push('--build-env', `BUILD_COMMAND=${this.frontendConfig.buildCommand}`)
    }
    
    const { stdout } = await execa('vercel', deployArgs)
    
    // Extract deployment URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+/)
    const url = urlMatch ? urlMatch[0] : null
    
    if (!url) {
      throw new Error('Could not extract deployment URL from Vercel output')
    }
    
    console.log(chalk.green(`✅ Deployed to: ${url}`))
    
    return { url }
  }

  async executeNetlifyDeploy(siteId) {
    const deployArgs = ['deploy']
    
    if (this.environment === 'production') {
      deployArgs.push('--prod')
    }
    
    deployArgs.push('--site', siteId)
    deployArgs.push('--dir', this.getBuildDirectory())
    
    // Build first if build command specified
    if (this.frontendConfig.buildCommand) {
      console.log(chalk.blue('Building application...'))
      await execa('pnpm', ['run', 'build'])
    }
    
    const { stdout } = await execa('netlify', deployArgs)
    
    // Extract deployment URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+/)
    const url = urlMatch ? urlMatch[0] : null
    
    if (!url) {
      throw new Error('Could not extract deployment URL from Netlify output')
    }
    
    console.log(chalk.green(`✅ Deployed to: ${url}`))
    
    return { url }
  }

  async setupNetlifySite() {
    const siteName = this.getProjectName()
    
    try {
      // Try to get existing site
      const { stdout } = await execa('netlify', ['sites:list'])
      
      if (stdout.includes(siteName)) {
        // Site exists, extract site ID
        const lines = stdout.split('\n')
        const siteLine = lines.find(line => line.includes(siteName))
        const siteId = siteLine ? siteLine.split(' ')[0] : null
        
        if (siteId) {
          return { siteId, created: false }
        }
      }
      
      // Create new site
      const createResult = await execa('netlify', [
        'sites:create',
        '--name', siteName,
        '--manual'
      ])
      
      const siteIdMatch = createResult.stdout.match(/Site ID:\s+([^\s]+)/)
      const siteId = siteIdMatch ? siteIdMatch[1] : null
      
      if (!siteId) {
        throw new Error('Could not extract site ID from Netlify output')
      }
      
      return { siteId, created: true }
    } catch (error) {
      throw new Error(`Failed to setup Netlify site: ${error.message}`)
    }
  }

  async configureVercelDomain(deploymentUrl) {
    try {
      const domain = this.frontendConfig.domain
      
      // Add domain to Vercel project
      await execa('vercel', ['domains', 'add', domain])
      
      // Set up domain alias
      await execa('vercel', ['alias', deploymentUrl, domain])
      
      console.log(chalk.green(`✅ Custom domain configured: ${domain}`))
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not configure domain: ${error.message}`))
    }
  }

  getProjectName() {
    const baseName = this.config.project.name
    return this.environment === 'production' ? baseName : `${baseName}-${this.environment}`
  }

  getBuildDirectory() {
    // Detect build directory based on framework
    const possibleDirs = ['dist', 'build', 'out']
    
    for (const dir of possibleDirs) {
      if (fs.existsSync(path.join(process.cwd(), dir))) {
        return dir
      }
    }
    
    return '.next' // Default for Next.js build
  }

  async createVercelConfig() {
    const vercelConfig = {
      name: this.getProjectName(),
      env: await this.generateEnvironmentVariables(),
      build: {
        env: await this.generateEnvironmentVariables()
      }
    }
    
    if (this.frontendConfig.buildCommand) {
      vercelConfig.buildCommand = this.frontendConfig.buildCommand
    }
    
    // Write vercel.json
    const configPath = path.join(process.cwd(), 'vercel.json')
    fs.writeFileSync(configPath, JSON.stringify(vercelConfig, null, 2))
    
    console.log(chalk.green('✅ Vercel configuration created'))
  }

  async createNetlifyConfig() {
    const netlifyConfig = {
      build: {
        command: this.frontendConfig.buildCommand || 'pnpm build',
        publish: this.getBuildDirectory(),
        environment: await this.generateEnvironmentVariables()
      }
    }
    
    // Write netlify.toml
    const configPath = path.join(process.cwd(), 'netlify.toml')
    const tomlContent = this.objectToToml(netlifyConfig)
    fs.writeFileSync(configPath, tomlContent)
    
    console.log(chalk.green('✅ Netlify configuration created'))
  }

  objectToToml(obj, section = '') {
    let toml = ''
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const sectionName = section ? `${section}.${key}` : key
        toml += `[${sectionName}]\n`
        toml += this.objectToToml(value, sectionName)
      } else if (Array.isArray(value)) {
        toml += `${key} = [${value.map(v => `"${v}"`).join(', ')}]\n`
      } else {
        toml += `${key} = "${value}"\n`
      }
    }
    
    return toml
  }

  async getDeploymentInfo() {
    return {
      platform: this.frontendConfig.platform,
      environment: this.environment,
      domain: this.frontendConfig.domain,
      buildCommand: this.frontendConfig.buildCommand
    }
  }
}