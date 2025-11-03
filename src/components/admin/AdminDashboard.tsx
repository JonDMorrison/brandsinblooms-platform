'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  LogOut,
  Shield,
  UserPlus,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Badge } from '@/components/ui/badge'

interface UserStats {
  total: number
  active: number
  inactive: number
  admins: number
  siteOwners: number
  users: number
}

export function AdminDashboard() {
  const { user, signOut, isLoading } = useAdminAuth()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    siteOwners: 0,
    users: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/api/admin/users?limit=1000')
      const result = await response.json()

      if (response.ok && result.data) {
        const users = result.data.users
        setStats({
          total: result.data.pagination.total,
          active: users.filter((u: any) => u.is_active).length,
          inactive: users.filter((u: any) => !u.is_active).length,
          admins: users.filter((u: any) => u.role === 'admin').length,
          siteOwners: users.filter((u: any) => u.role === 'site_owner').length,
          users: users.filter((u: any) => u.role === 'user').length
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

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
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
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
                Admin Dashboard
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
        <div className="mb-8">
          <Button
            size="lg"
            onClick={() => router.push('/admin/users')}
            className="gap-2"
          >
            <Users className="h-5 w-5" />
            Manage Users
          </Button>
        </div>

        {/* User Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            User Statistics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Users */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {loadingStats ? '--' : stats.total}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Active Users
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {loadingStats ? '--' : stats.active}
                    </p>
                  </div>
                  <UserCheck className="h-10 w-10 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Inactive Users */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Inactive Users
                    </p>
                    <p className="text-3xl font-bold text-gray-600 mt-1">
                      {loadingStats ? '--' : stats.inactive}
                    </p>
                  </div>
                  <UserX className="h-10 w-10 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            {/* Admins */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Administrators
                    </p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                      {loadingStats ? '--' : stats.admins}
                    </p>
                  </div>
                  <Shield className="h-10 w-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Breakdown by Role */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Users by Role
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="destructive">Admin</Badge>
                  <span className="text-2xl font-bold">
                    {loadingStats ? '--' : stats.admins}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Full platform access and user management
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="default">Site Owner</Badge>
                  <span className="text-2xl font-bold">
                    {loadingStats ? '--' : stats.siteOwners}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Can create and manage their own sites
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">User</Badge>
                  <span className="text-2xl font-bold">
                    {loadingStats ? '--' : stats.users}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Basic users with site access permissions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Management Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">User Management</CardTitle>
                  <CardDescription>
                    Manage all platform users, roles, and permissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  View all registered users, create new accounts, update user information,
                  manage roles and permissions, reset passwords, and activate or deactivate accounts.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={() => router.push('/admin/users')}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    View All Users
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create New User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/users?role=admin')}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Manage Admins
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Status
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">All Systems Operational</p>
                  <p className="text-sm text-gray-600">User management system is running smoothly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
