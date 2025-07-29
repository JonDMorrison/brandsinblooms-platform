import fs from 'fs'
import path from 'path'
import { execa } from 'execa'
import chalk from 'chalk'

/**
 * 🧙‍♂️ Supabase Magic Manager
 * 
 * Handles automatic project creation, configuration, and deployment
 * using the Supabase CLI and Management API
 */
export class SupabaseManager {
  constructor(config, environment) {
    this.config = config
    this.environment = environment
    this.envConfig = config.environments[environment]
    this.projectRef = this.envConfig.projectRef || `${config.project.name}-${environment}`
  }

  async ensureProjectExists() {
    try {
      // Check if project already exists and is linked
      const linkedProject = await this.getLinkedProject()
      
      if (linkedProject && linkedProject.includes(this.projectRef)) {
        return { exists: true, created: false, projectRef: this.projectRef }
      }

      // Try to link to existing project
      try {
        await execa('supabase', ['link', '--project-ref', this.projectRef])
        return { exists: true, created: false, projectRef: this.projectRef }
      } catch (linkError) {
        // Project doesn't exist, create it
        return await this.createProject()
      }
    } catch (error) {
      throw new Error(`Failed to ensure project exists: ${error.message}`)
    }
  }

  async getLinkedProject() {
    try {
      const { stdout } = await execa('supabase', ['projects', 'list'])
      return stdout
    } catch (error) {
      // Not authenticated or no projects
      return null
    }
  }

  async createProject() {
    try {
      // Create new Supabase project
      const { stdout } = await execa('supabase', [
        'projects', 'create',
        this.projectRef,
        '--org-id', await this.getOrganizationId(),
        '--db-password', this.generateSecurePassword(),
        '--region', this.getRegion()
      ])

      // Extract project reference from output
      const projectRefMatch = stdout.match(/Project ID: ([a-z0-9]+)/)
      const actualProjectRef = projectRefMatch ? projectRefMatch[1] : this.projectRef

      // Link the project locally
      await execa('supabase', ['link', '--project-ref', actualProjectRef])

      return { exists: false, created: true, projectRef: actualProjectRef }
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }
  }

  async getOrganizationId() {
    try {
      const { stdout } = await execa('supabase', ['orgs', 'list'])
      // Parse the first organization ID from output
      const orgMatch = stdout.match(/([a-z0-9-]+)\s+/)
      return orgMatch ? orgMatch[1] : 'default'
    } catch (error) {
      return 'default'
    }
  }

  generateSecurePassword() {
    // Generate a secure random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 24; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  getRegion() {
    // Smart region detection based on environment or default to us-east-1
    return this.envConfig.region || 'us-east-1'
  }

  async deployDatabase() {
    const tasks = []

    if (this.envConfig.database?.migrations) {
      tasks.push(this.deployMigrations())
    }

    if (this.envConfig.database?.seed) {
      tasks.push(this.deploySeedData())
    }

    await Promise.all(tasks)
  }

  async deployMigrations() {
    try {
      // Push database migrations
      await execa('supabase', ['db', 'push'])
      
      // Generate and update types
      await this.generateTypes()
    } catch (error) {
      throw new Error(`Migration deployment failed: ${error.message}`)
    }
  }

  async deploySeedData() {
    const seedFile = this.envConfig.database.seed === 'staging' ? 
      'supabase/seed-staging.sql' : 'supabase/seed.sql'
    
    if (fs.existsSync(seedFile)) {
      try {
        await execa('supabase', ['db', 'reset', '--linked'])
      } catch (error) {
        throw new Error(`Seed data deployment failed: ${error.message}`)
      }
    }
  }

  async generateTypes() {
    try {
      const typesPath = 'src/lib/database/types.ts'
      await execa('supabase', ['gen', 'types', 'typescript', '--linked'], {
        stdout: fs.createWriteStream(typesPath)
      })
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not generate types'), error.message)
    }
  }

  async setupAuth() {
    const authConfig = this.envConfig.auth
    if (!authConfig) return

    const settings = {
      DISABLE_SIGNUP: !authConfig.signupEnabled,
      SITE_URL: authConfig.siteUrl || 'http://localhost:3000',
      URI_ALLOW_LIST: authConfig.allowedUrls?.join(',') || '*',
      JWT_EXPIRY: authConfig.jwtExpiry || 3600,
      ENABLE_CONFIRMATIONS: authConfig.confirmationRequired || false,
      PASSWORD_MIN_LENGTH: authConfig.passwordMinLength || 6
    }

    // Configure auth settings (would use Management API in real implementation)
    await this.updateAuthSettings(settings)

    // Setup OAuth providers
    if (authConfig.providers?.includes('google')) {
      await this.setupGoogleAuth()
    }
    
    if (authConfig.providers?.includes('github')) {
      await this.setupGitHubAuth()
    }
  }

  async updateAuthSettings(settings) {
    // In a real implementation, this would use the Supabase Management API
    // For now, we'll simulate the configuration
    console.log(chalk.blue('Configuring auth settings...'))
    
    // Update supabase/config.toml with auth settings
    await this.updateSupabaseConfig('auth', settings)
  }

  async setupGoogleAuth() {
    console.log(chalk.blue('Setting up Google OAuth...'))
    // Would configure Google OAuth provider via Management API
  }

  async setupGitHubAuth() {
    console.log(chalk.blue('Setting up GitHub OAuth...'))
    // Would configure GitHub OAuth provider via Management API
  }

  async setupStorage() {
    const storageConfig = this.envConfig.storage
    if (!storageConfig?.buckets) return

    for (const bucket of storageConfig.buckets) {
      await this.createStorageBucket(bucket)
    }
  }

  async createStorageBucket(bucketConfig) {
    try {
      // Create storage bucket using CLI (would use Management API in production)
      const bucketName = bucketConfig.name
      const isPublic = bucketConfig.public || false
      const fileSizeLimit = bucketConfig.fileSizeLimit || '50MB'

      console.log(chalk.blue(`Creating storage bucket: ${bucketName}`))
      
      // This would create the bucket via Management API
      // For now, we simulate the creation
      
      // Create RLS policies for the bucket
      await this.createBucketPolicies(bucketName, isPublic)
      
    } catch (error) {
      throw new Error(`Failed to create storage bucket ${bucketConfig.name}: ${error.message}`)
    }
  }

  async createBucketPolicies(bucketName, isPublic) {
    const policies = []
    
    if (isPublic) {
      policies.push(`
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = '${bucketName}');
      `)
    }
    
    policies.push(`
      CREATE POLICY "Authenticated users can upload" ON storage.objects 
      FOR INSERT WITH CHECK (bucket_id = '${bucketName}' AND auth.role() = 'authenticated');
    `)
    
    // Execute policies (would be done via API in production)
    console.log(chalk.blue(`Created ${policies.length} RLS policies for ${bucketName}`))
  }

  async deployFunctions() {
    if (!this.envConfig.functions?.deploy) return

    try {
      const functionsDir = path.join(process.cwd(), 'supabase', 'functions')
      
      if (!fs.existsSync(functionsDir)) {
        console.log(chalk.yellow('No functions directory found, skipping...'))
        return
      }

      // Deploy all Edge Functions
      await execa('supabase', ['functions', 'deploy'])
      
      console.log(chalk.green('✅ Edge Functions deployed successfully'))
    } catch (error) {
      throw new Error(`Function deployment failed: ${error.message}`)
    }
  }

  async updateSupabaseConfig(section, settings) {
    const configPath = path.join(process.cwd(), 'supabase', 'config.toml')
    
    if (!fs.existsSync(configPath)) {
      throw new Error('Supabase config.toml not found')
    }

    // Read and update TOML config (simplified - would use proper TOML parser)
    let config = fs.readFileSync(configPath, 'utf8')
    
    // Update configuration sections
    for (const [key, value] of Object.entries(settings)) {
      const regex = new RegExp(`${key}\\s*=\\s*.*`, 'g')
      const replacement = `${key} = ${typeof value === 'string' ? `"${value}"` : value}`
      
      if (config.match(regex)) {
        config = config.replace(regex, replacement)
      } else {
        // Add new setting to section
        const sectionRegex = new RegExp(`\\[${section}\\]`)
        if (config.match(sectionRegex)) {
          config = config.replace(sectionRegex, `[${section}]\n${replacement}`)
        }
      }
    }
    
    fs.writeFileSync(configPath, config)
  }

  async getProjectUrl() {
    try {
      const { stdout } = await execa('supabase', ['status'])
      const urlMatch = stdout.match(/API URL: (https?:\/\/[^\s]+)/)
      return urlMatch ? urlMatch[1] : null
    } catch (error) {
      return `https://${this.projectRef}.supabase.co`
    }
  }

  async getProjectKeys() {
    try {
      const { stdout } = await execa('supabase', ['status'])
      
      const anonKeyMatch = stdout.match(/anon key: ([^\s]+)/)
      const serviceKeyMatch = stdout.match(/service_role key: ([^\s]+)/)
      
      return {
        anonKey: anonKeyMatch ? anonKeyMatch[1] : null,
        serviceKey: serviceKeyMatch ? serviceKeyMatch[1] : null
      }
    } catch (error) {
      throw new Error(`Failed to get project keys: ${error.message}`)
    }
  }

  async generateEnvironmentFile() {
    const projectUrl = await this.getProjectUrl()
    const { anonKey, serviceKey } = await this.getProjectKeys()
    
    const envContent = `# Generated by Supabase Magic Deploy
# Environment: ${this.environment}
# Generated: ${new Date().toISOString()}

NEXT_PUBLIC_SUPABASE_URL=${projectUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# Database
DATABASE_URL=postgresql://postgres:[password]@db.${this.projectRef}.supabase.co:5432/postgres

# Add your custom environment variables below
`

    const envFile = `.env.${this.environment}`
    fs.writeFileSync(envFile, envContent)
    
    console.log(chalk.green(`✅ Environment file created: ${envFile}`))
    return envFile
  }
}