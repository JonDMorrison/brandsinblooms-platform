'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import DashboardSidebar from '@/src/components/layout/DashboardSidebar';
import DashboardHeader from '@/src/components/layout/DashboardHeader';
import { useUserSites } from '@/src/hooks/useSite';
import { CreateFirstSite } from '@/src/components/dashboard/CreateFirstSite';
import { Skeleton } from '@/src/components/ui/skeleton';

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { sites, loading: sitesLoading } = useUserSites();

  // Check if we're on the content editor page
  const isContentEditor = pathname?.includes('/dashboard/content/editor');

  // Check if user has no sites
  const hasNoSites = !sitesLoading && sites.length === 0;

  // Show loading state while checking sites
  if (sitesLoading) {
    return (
      <div className='flex h-screen items-center justify-center bg-gradient-subtle'>
        <div className='space-y-4 w-full max-w-md px-4'>
          <Skeleton className='h-8 w-48 mx-auto' />
          <Skeleton className='h-4 w-64 mx-auto' />
          <Skeleton className='h-32 w-full' />
        </div>
      </div>
    );
  }

  // Show create first site screen if user has no sites
  // BUT allow them to access the sites page where they can create one
  if (hasNoSites && pathname !== '/dashboard/sites') {
    return (
      <div className='flex h-screen items-center justify-center bg-gradient-subtle'>
        <CreateFirstSite />
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gradient-subtle'>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        >
          <div className='absolute inset-0 bg-gray-600 opacity-75' />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <DashboardSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className='flex-1 overflow-x-hidden overflow-y-auto bg-gradient-subtle'>
          {isContentEditor ? (
            <div className='w-full h-[calc(100vh-4.75rem)]' >{children}</div>
          ) : (
            <div className='brand-container py-6 '>{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
