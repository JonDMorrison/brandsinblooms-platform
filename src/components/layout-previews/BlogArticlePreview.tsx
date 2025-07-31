import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Calendar, Clock, User } from 'lucide-react'

interface BlogArticlePreviewProps {
  title: string
  subtitle?: string
}

export function BlogArticlePreview({ title, subtitle }: BlogArticlePreviewProps) {
  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 p-6 space-y-6">
      {/* Article Header */}
      <div className="text-center space-y-4 border-b pb-6">
        <div className="flex justify-center gap-2">
          <Badge>Gardening</Badge>
          <Badge variant="outline">Tips</Badge>
        </div>
        <h1 className="text-3xl font-bold leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        )}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            March 15, 2024
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            5 min read
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Featured Image</span>
          </div>
          
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
              nostrud exercitation ullamco laboris.
            </p>
            
            <h2 className="text-xl font-bold">Key Points</h2>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>Essential care techniques</li>
              <li>Seasonal maintenance tips</li>
              <li>Common problems and solutions</li>
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Author Bio */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">Author Name</p>
                <p className="text-sm text-muted-foreground">Expert Florist</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Passionate about flowers and helping others create beautiful arrangements.
            </p>
          </Card>

          {/* Related Posts */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Related Articles</h3>
            <div className="space-y-3">
              {['Flower Care Basics', 'Seasonal Blooms', 'Garden Design'].map((post, i) => (
                <div key={i} className="text-sm">
                  <p className="font-medium hover:text-blue-600 cursor-pointer">{post}</p>
                  <p className="text-xs text-muted-foreground">2 min read</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}