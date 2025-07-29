/**
 * Supabase Deployment Configuration
 * 
 * This file defines how your Supabase project should be deployed.
 * Zero configuration required - everything has smart defaults!
 */

export default {
  // Project settings (auto-detected from package.json if not specified)
  project: {
    name: "brands-and-blooms-platform", // Auto-detected from package.json
    // organization: "my-org", // Optional: Supabase organization
  },

  // Environments configuration
  environments: {
    // Staging environment - perfect for testing
    staging: {
      // Auto-generated if not specified: {project-name}-staging
      projectRef: null,
      
      // Database configuration
      database: {
        migrations: true,        // Auto-deploy migrations
        seed: "staging",         // Use staging seed data
        resetOnDeploy: false,    // Don't reset DB on deploy
      },

      // Authentication settings
      auth: {
        providers: ["email", "google"], // Enable auth providers
        signupEnabled: true,
        confirmationRequired: false,
      },

      // Storage configuration
      storage: {
        buckets: [
          { name: "avatars", public: true },
          { name: "documents", public: false }
        ]
      },

      // Edge Functions
      functions: {
        deploy: true,            // Auto-deploy all functions
        // specific: ["send-email", "process-data"] // Or specify functions
      },

      // Frontend deployment
      frontend: {
        platform: false,         // Railway will host the container
        buildCommand: "pnpm build",
        envVars: {
          // Auto-injected: NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
          NODE_ENV: "staging"
        }
      }
    },

    // Production environment
    production: {
      projectRef: null, // Auto-generated: {project-name}-prod
      
      database: {
        migrations: true,
        seed: false,             // No seed data in production
        resetOnDeploy: false,
        backupBeforeDeploy: true, // Always backup prod
      },

      auth: {
        providers: ["email", "google"],
        signupEnabled: true,
        confirmationRequired: true, // Require email confirmation in prod
        mfa: {
          enabled: true,
          providers: ["totp"]
        }
      },

      storage: {
        buckets: [
          { name: "avatars", public: true, fileSizeLimit: "5MB" },
          { name: "documents", public: false, fileSizeLimit: "50MB" }
        ]
      },

      functions: {
        deploy: true,
      },

      frontend: {
        platform: false,         // Railway will host the container
        domain: "myapp.com", // Custom domain
        buildCommand: "pnpm build",
        envVars: {
          NODE_ENV: "production"
        }
      },

      // Production-specific settings
      monitoring: {
        alerts: true,
        healthChecks: true,
        errorTracking: true,
      }
    }
  },

  // Deployment hooks (optional)
  hooks: {
    beforeDeploy: null,        // Run before deployment starts
    afterDatabase: null,       // Run after database is deployed
    afterFunctions: null,      // Run after functions are deployed
    afterFrontend: null,       // Run after frontend is deployed
    onSuccess: null,           // Run when deployment succeeds
    onFailure: null,           // Run when deployment fails
    // beforeDeploy: "pnpm test", // Example: run tests first
  },

  // Advanced options
  advanced: {
    parallelDeployment: true,  // Deploy services in parallel
    rollbackOnFailure: true,   // Auto-rollback on failure
    deploymentTimeout: 600,    // 10 minutes timeout
    retryAttempts: 3,          // Retry failed deployments
    confirmBeforeDeploy: true, // Ask for confirmation
  }
}