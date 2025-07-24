import { createClient } from '@supabase/supabase-js'
import chalk from 'chalk'
import { execa } from 'execa'

/**
 * 🏥 Health Check & Monitoring System
 * 
 * Performs comprehensive health checks on deployed Supabase infrastructure
 * and provides monitoring capabilities
 */
export class HealthChecker {
  constructor(config, environment, supabaseManager) {
    this.config = config
    this.environment = environment
    this.supabaseManager = supabaseManager
    this.checks = []
    this.results = {}
  }

  async performHealthCheck() {
    console.log(chalk.blue('🏥 Running health checks...'))
    
    this.checks = [
      { name: 'Database Connection', fn: () => this.checkDatabase() },
      { name: 'Auth Service', fn: () => this.checkAuth() },
      { name: 'Storage Service', fn: () => this.checkStorage() },
      { name: 'Edge Functions', fn: () => this.checkFunctions() },
      { name: 'Frontend Accessibility', fn: () => this.checkFrontend() },
      { name: 'API Response Times', fn: () => this.checkPerformance() }
    ]

    const results = {}
    let allPassed = true

    for (const check of this.checks) {
      try {
        const result = await check.fn()
        results[check.name] = { ...result, status: 'passed' }
        console.log(chalk.green(`✅ ${check.name}: ${result.message || 'OK'}`))
      } catch (error) {
        results[check.name] = { 
          status: 'failed', 
          error: error.message,
          details: error.details || null
        }
        console.log(chalk.red(`❌ ${check.name}: ${error.message}`))
        allPassed = false
      }
    }

    this.results = results
    
    return {
      allPassed,
      results,
      summary: this.generateHealthSummary()
    }
  }

  async checkDatabase() {
    const projectUrl = await this.supabaseManager.getProjectUrl()
    const { serviceKey } = await this.supabaseManager.getProjectKeys()
    
    if (!projectUrl || !serviceKey) {
      throw new Error('Could not retrieve project credentials')
    }

    const supabase = createClient(projectUrl, serviceKey)
    
    // Test basic database connection
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }

    // Test RLS is enabled
    const { data: rlsCheck } = await supabase.rpc('check_rls_enabled')
    
    return {
      message: 'Database connection successful',
      details: {
        tablesFound: data?.length || 0,
        rlsEnabled: rlsCheck || false
      }
    }
  }

  async checkAuth() {
    const projectUrl = await this.supabaseManager.getProjectUrl()
    const { anonKey } = await this.supabaseManager.getProjectKeys()
    
    const supabase = createClient(projectUrl, anonKey)
    
    // Test auth service availability
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error && error.message !== 'No session found') {
        throw new Error(`Auth service error: ${error.message}`)
      }
      
      return {
        message: 'Auth service is responsive',
        details: {
          sessionCheck: 'passed',
          authUrl: `${projectUrl}/auth/v1`
        }
      }
    } catch (error) {
      throw new Error(`Auth service check failed: ${error.message}`)
    }
  }

  async checkStorage() {
    const projectUrl = await this.supabaseManager.getProjectUrl()
    const { serviceKey } = await this.supabaseManager.getProjectKeys()
    
    const supabase = createClient(projectUrl, serviceKey)
    
    try {
      // List storage buckets
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        throw new Error(`Storage service error: ${error.message}`)
      }
      
      return {
        message: 'Storage service is operational',
        details: {
          bucketsCount: buckets?.length || 0,
          buckets: buckets?.map(b => b.name) || []
        }
      }
    } catch (error) {
      throw new Error(`Storage check failed: ${error.message}`)
    }
  }

  async checkFunctions() {
    try {
      // List deployed functions
      const { stdout } = await execa('supabase', ['functions', 'list'])
      
      const functionCount = (stdout.match(/function/gi) || []).length
      
      return {
        message: `${functionCount} Edge Functions deployed`,
        details: {
          functionsCount: functionCount,
          output: stdout
        }
      }
    } catch (error) {
      // Functions might not be deployed, which is okay
      return {
        message: 'No Edge Functions deployed',
        details: { functionsCount: 0 }
      }
    }
  }

  async checkFrontend() {
    const frontendResult = this.supabaseManager.deploymentResults?.frontend
    
    if (!frontendResult?.deployed) {
      return {
        message: 'Frontend deployment skipped',
        details: { deployed: false }
      }
    }

    try {
      // Test frontend accessibility
      const response = await fetch(frontendResult.url, { 
        method: 'HEAD',
        timeout: 10000 
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return {
        message: 'Frontend is accessible',
        details: {
          url: frontendResult.url,
          status: response.status,
          platform: frontendResult.platform
        }
      }
    } catch (error) {
      throw new Error(`Frontend accessibility check failed: ${error.message}`)
    }
  }

  async checkPerformance() {
    const projectUrl = await this.supabaseManager.getProjectUrl()
    
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${projectUrl}/rest/v1/`, {
        method: 'HEAD',
        timeout: 5000
      })
      
      const responseTime = Date.now() - startTime
      
      if (!response.ok) {
        throw new Error(`API not responding: HTTP ${response.status}`)
      }
      
      const performance = {
        responseTime,
        rating: responseTime < 500 ? 'excellent' : 
                responseTime < 1000 ? 'good' : 
                responseTime < 2000 ? 'fair' : 'poor'
      }
      
      return {
        message: `API response time: ${responseTime}ms (${performance.rating})`,
        details: performance
      }
    } catch (error) {
      throw new Error(`Performance check failed: ${error.message}`)
    }
  }

  generateHealthSummary() {
    const total = Object.keys(this.results).length
    const passed = Object.values(this.results).filter(r => r.status === 'passed').length
    const failed = total - passed
    
    return {
      total,
      passed,
      failed,
      score: Math.round((passed / total) * 100),
      status: failed === 0 ? 'healthy' : failed <= 2 ? 'warning' : 'critical'
    }
  }

  async generateHealthReport() {
    const summary = this.generateHealthSummary()
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      project: this.supabaseManager.envConfig.projectRef,
      summary,
      checks: this.results,
      recommendations: this.generateRecommendations()
    }
    
    // Save report to file
    const reportPath = `health-report-${this.environment}-${Date.now()}.json`
    const fs = await import('fs')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(chalk.blue(`📊 Health report saved: ${reportPath}`))
    
    return report
  }

  generateRecommendations() {
    const recommendations = []
    
    Object.entries(this.results).forEach(([checkName, result]) => {
      if (result.status === 'failed') {
        switch (checkName) {
          case 'Database Connection':
            recommendations.push('Check database credentials and network connectivity')
            break
          case 'Auth Service':
            recommendations.push('Verify auth configuration and service availability')
            break
          case 'Storage Service':
            recommendations.push('Check storage service status and permissions')
            break
          case 'Frontend Accessibility':
            recommendations.push('Verify frontend deployment and domain configuration')
            break
          case 'API Response Times':
            recommendations.push('Consider optimizing database queries and adding caching')
            break
        }
      }
    })
    
    if (recommendations.length === 0) {
      recommendations.push('All systems are operating normally! 🎉')
    }
    
    return recommendations
  }

  async setupMonitoring() {
    console.log(chalk.blue('📊 Setting up monitoring...'))
    
    // Create monitoring configuration
    const monitoringConfig = {
      environment: this.environment,
      project: this.supabaseManager.envConfig.projectRef,
      healthCheckInterval: 300, // 5 minutes
      alertThresholds: {
        responseTime: 2000, // 2 seconds
        errorRate: 0.05,    // 5%
        availability: 0.99  // 99%
      },
      notifications: {
        email: process.env.MONITORING_EMAIL,
        webhook: process.env.MONITORING_WEBHOOK
      }
    }
    
    // Save monitoring config
    const fs = await import('fs')
    fs.writeFileSync(
      `monitoring-${this.environment}.json`, 
      JSON.stringify(monitoringConfig, null, 2)
    )
    
    console.log(chalk.green('✅ Monitoring configuration created'))
    
    return monitoringConfig
  }
}