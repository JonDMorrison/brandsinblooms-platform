'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Globe, 
  Users, 
  Settings, 
  LogOut, 
  BarChart3, 
  Database,
  Shield,
  Plus,
  Palette,
  Edit,
  Activity,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card'
import { useAdminAuth } from '@/src/contexts/AdminAuthContext'
import { ActiveImpersonationSessions } from './ActiveImpersonationSessions'

export function AdminDashboard() {
  const { user, signOut, isLoading } = useAdminAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-2"></div>
            <div className="h-4 w-32 bg-muted rounded mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Platform Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.email}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button onClick={() => router.push('/admin/sites/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Site
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/sites/templates')}>
            <Palette className="h-4 w-4 mr-2" />
            Browse Templates
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/sites/health')}>
            <Shield className="h-4 w-4 mr-2" />
            Platform Health
          </Button>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Sites Management Card */}
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 ">
                  <Globe className="h-5 w-5 text-blue-600 " />
                </div>
                <div>
                  <CardTitle className="text-lg">Sites Management</CardTitle>
                  <CardDescription>
                    Create and manage customer sites
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Create new sites using templates, manage existing sites, and 
                  configure domain settings.
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push('/admin/sites/new')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Site
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push('/admin/sites/templates')}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Management Card */}
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 ">
                  <Users className="h-5 w-5 text-green-600 " />
                </div>
                <div>
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <CardDescription>
                    Manage platform users and permissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  View user accounts, manage permissions, and handle support 
                  requests. Monitor user activity and engagement.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    View Users
                  </Button>
                  <Button size="sm" variant="outline">
                    <Shield className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Monitoring Card */}
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 ">
                  <Activity className="h-5 w-5 text-indigo-600 " />
                </div>
                <div>
                  <CardTitle className="text-lg">Analytics & Monitoring</CardTitle>
                  <CardDescription>
                    Site analytics and health monitoring
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Monitor site performance, health status, and comprehensive 
                  analytics across the platform.
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push('/admin/sites/health')}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Health
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push('/admin/analytics')}
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Settings Card */}
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 ">
                  <Settings className="h-5 w-5 text-purple-600 " />
                </div>
                <div>
                  <CardTitle className="text-lg">Platform Settings</CardTitle>
                  <CardDescription>
                    Configure global platform settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Manage system-wide configurations, security settings, and 
                  platform maintenance options.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    View Settings
                  </Button>
                  <Button size="sm" variant="outline">
                    <Database className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Platform Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Sites
                    </p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  <Globe className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Active Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                  <Users className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      System Health
                    </p>
                    <p className="text-sm font-medium text-green-600">Healthy</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Uptime
                    </p>
                    <p className="text-sm font-medium text-green-600">99.9%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Impersonation Sessions */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Active Sessions
          </h2>
          <ActiveImpersonationSessions />
        </div>

        {/* Recent Activity Section (Placeholder) */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500">
                  Activity tracking will be implemented soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}