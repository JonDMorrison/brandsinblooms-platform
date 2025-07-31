import { SiteCreationWizard } from '@/src/components/admin/SiteCreationWizard'

export const metadata = {
  title: 'Create New Site - Platform Admin',
  description: 'Create a new site using a template',
}

export default function NewSitePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <SiteCreationWizard />
      </div>
    </div>
  )
}