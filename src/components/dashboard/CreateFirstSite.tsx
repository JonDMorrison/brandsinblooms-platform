'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Plus, Flower, Sparkles } from 'lucide-react'

export function CreateFirstSite() {
  const router = useRouter()

  return (
    <div className='w-full max-w-2xl px-4'>
      <Card className='shadow-xl border-2'>
        <CardHeader className='text-center space-y-4 pb-6'>
          <div className='flex justify-center'>
            <div className='flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl shadow-lg'>
              <Flower className='h-10 w-10 text-white' />
            </div>
          </div>
          <div>
            <CardTitle className='text-3xl font-brand-heading text-gradient-primary mb-2'>
              Welcome to Brands in Blooms
            </CardTitle>
            <p className='text-gray-600 text-lg'>
              Let&apos;s create your first website
            </p>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='bg-gradient-primary-50 rounded-lg p-6 space-y-4'>
            <h3 className='font-semibold text-lg flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-primary' />
              What you&apos;ll get:
            </h3>
            <ul className='space-y-3'>
              <li className='flex items-start gap-3'>
                <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0'>
                  <svg className='w-3 h-3 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>Custom Subdomain</p>
                  <p className='text-sm text-gray-600'>Your own branded URL (e.g., yourname.blooms.cc)</p>
                </div>
              </li>
              <li className='flex items-start gap-3'>
                <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0'>
                  <svg className='w-3 h-3 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>Beautiful Templates</p>
                  <p className='text-sm text-gray-600'>Choose from professionally designed templates</p>
                </div>
              </li>
              <li className='flex items-start gap-3'>
                <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0'>
                  <svg className='w-3 h-3 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>Easy Content Management</p>
                  <p className='text-sm text-gray-600'>Update your site anytime with our intuitive editor</p>
                </div>
              </li>
              <li className='flex items-start gap-3'>
                <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0'>
                  <svg className='w-3 h-3 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>Product Catalog</p>
                  <p className='text-sm text-gray-600'>Showcase your products with built-in catalog management</p>
                </div>
              </li>
            </ul>
          </div>

          <div className='pt-2'>
            <Button
              size='lg'
              className='w-full text-lg h-14 shadow-lg hover:shadow-xl transition-all'
              onClick={() => router.push('/dashboard/sites')}
            >
              <Plus className='h-5 w-5 mr-2' />
              Create Your First Site
            </Button>
          </div>

          <p className='text-center text-sm text-gray-500'>
            It only takes a few minutes to get started
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
