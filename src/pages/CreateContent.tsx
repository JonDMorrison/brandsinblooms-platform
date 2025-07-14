import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface Layout {
  id: string;
  name: string;
  description: string;
  preview: React.ReactNode;
}

const CreateContent = () => {
  const navigate = useNavigate();
  const [selectedLayout, setSelectedLayout] = useState<string>('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  const layouts: Layout[] = [
    {
      id: 'landing-page',
      name: 'Landing Page',
      description: 'Hero banner with features and call-to-action',
      preview: (
        <div className="w-full h-20 bg-muted rounded border p-2 space-y-1">
          <div className="h-5 bg-primary/40 rounded mb-1"></div>
          <div className="grid grid-cols-3 gap-1">
            <div className="h-3 bg-secondary/60 rounded"></div>
            <div className="h-3 bg-secondary/60 rounded"></div>
            <div className="h-3 bg-secondary/60 rounded"></div>
          </div>
          <div className="h-2 bg-primary/20 rounded w-1/3 mx-auto"></div>
        </div>
      )
    },
    {
      id: 'blog-post',
      name: 'Blog Article',
      description: 'Article layout with sidebar for related content',
      preview: (
        <div className="w-full h-20 bg-muted rounded border flex gap-2 p-2">
          <div className="flex-1 space-y-1">
            <div className="h-2 bg-primary/30 rounded w-4/5"></div>
            <div className="h-1 bg-muted-foreground/20 rounded"></div>
            <div className="h-1 bg-muted-foreground/20 rounded w-5/6"></div>
            <div className="h-1 bg-muted-foreground/20 rounded w-4/5"></div>
            <div className="h-1 bg-muted-foreground/20 rounded w-3/4"></div>
          </div>
          <div className="w-1/4 space-y-1">
            <div className="h-1 bg-secondary/40 rounded"></div>
            <div className="h-3 bg-secondary rounded"></div>
            <div className="h-3 bg-secondary rounded"></div>
          </div>
        </div>
      )
    },
    {
      id: 'portfolio-grid',
      name: 'Portfolio Grid',
      description: 'Showcase work with grid-based image gallery',
      preview: (
        <div className="w-full h-20 bg-muted rounded border p-2 space-y-1">
          <div className="h-2 bg-primary/30 rounded w-1/2 mx-auto"></div>
          <div className="grid grid-cols-4 gap-1">
            <div className="h-4 bg-secondary rounded"></div>
            <div className="h-4 bg-secondary rounded"></div>
            <div className="h-4 bg-secondary rounded"></div>
            <div className="h-4 bg-secondary rounded"></div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <div className="h-3 bg-secondary/60 rounded"></div>
            <div className="h-3 bg-secondary/60 rounded"></div>
            <div className="h-3 bg-secondary/60 rounded"></div>
            <div className="h-3 bg-secondary/60 rounded"></div>
          </div>
        </div>
      )
    },
    {
      id: 'about-company',
      name: 'About/Company',
      description: 'Alternating text and image sections',
      preview: (
        <div className="w-full h-20 bg-muted rounded border p-2 space-y-1">
          <div className="h-2 bg-primary/30 rounded w-2/3 mx-auto"></div>
          <div className="flex gap-2">
            <div className="w-3/5 space-y-1">
              <div className="h-1 bg-muted-foreground/20 rounded"></div>
              <div className="h-1 bg-muted-foreground/20 rounded w-4/5"></div>
            </div>
            <div className="w-2/5 h-4 bg-secondary rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-2/5 h-4 bg-secondary rounded"></div>
            <div className="w-3/5 space-y-1">
              <div className="h-1 bg-muted-foreground/20 rounded"></div>
              <div className="h-1 bg-muted-foreground/20 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'product-page',
      name: 'Product Page',
      description: 'Product images with details and specifications',
      preview: (
        <div className="w-full h-20 bg-muted rounded border flex gap-2 p-2">
          <div className="w-1/2 space-y-1">
            <div className="h-8 bg-secondary rounded"></div>
            <div className="grid grid-cols-3 gap-1">
              <div className="h-2 bg-secondary/60 rounded"></div>
              <div className="h-2 bg-secondary/60 rounded"></div>
              <div className="h-2 bg-secondary/60 rounded"></div>
            </div>
          </div>
          <div className="w-1/2 space-y-1">
            <div className="h-2 bg-primary/30 rounded w-4/5"></div>
            <div className="h-1 bg-muted-foreground/20 rounded w-3/5"></div>
            <div className="h-1 bg-muted-foreground/20 rounded"></div>
            <div className="h-1 bg-muted-foreground/20 rounded w-4/5"></div>
            <div className="h-2 bg-primary/20 rounded w-2/3"></div>
          </div>
        </div>
      )
    },
    {
      id: 'contact-services',
      name: 'Contact/Services',
      description: 'Form alongside contact information or service details',
      preview: (
        <div className="w-full h-20 bg-muted rounded border flex gap-2 p-2">
          <div className="w-1/2 space-y-1">
            <div className="h-2 bg-primary/30 rounded w-3/4"></div>
            <div className="h-1 bg-muted-foreground/20 rounded"></div>
            <div className="h-1 bg-muted-foreground/20 rounded w-4/5"></div>
            <div className="flex gap-1">
              <div className="h-1 bg-secondary/40 rounded flex-1"></div>
              <div className="h-1 bg-secondary/40 rounded flex-1"></div>
            </div>
            <div className="h-2 bg-primary/20 rounded w-1/3"></div>
          </div>
          <div className="w-1/2 space-y-1">
            <div className="h-1 bg-secondary/60 rounded w-3/4"></div>
            <div className="space-y-1">
              <div className="h-3 bg-secondary rounded"></div>
              <div className="h-3 bg-secondary rounded"></div>
              <div className="h-3 bg-secondary rounded"></div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleCreatePage = () => {
    console.log('Creating page:', { selectedLayout, title, subtitle });
    // Navigate to page editor with page data
    navigate('/dashboard/page-editor', { 
      state: { selectedLayout, title, subtitle, isNew: true }
    });
  };

  const canProceed = () => {
    return selectedLayout && title.trim();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="hover-scale">
            <Link to="/dashboard/content">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Page</h1>
            <p className="text-muted-foreground">
              Set up your page details and choose a layout
            </p>
          </div>
        </div>

        <Card className="gradient-card border-0 shadow-xl animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Page Setup</CardTitle>
            <CardDescription>
              Enter your page details and choose a layout structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Page Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a compelling title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  placeholder="Add a descriptive subtitle..."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>
            </div>

            {/* Layout Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Choose Layout Structure</h3>
                <p className="text-sm text-muted-foreground">Select how you want your content to be arranged</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className={`group p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover-scale ${
                      selectedLayout === layout.id
                        ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedLayout(layout.id)}
                  >
                    <div className="space-y-3">
                      <div className="w-full">
                        {layout.preview}
                      </div>
                      <div className="text-center">
                        <h3 className="font-medium">{layout.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {layout.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-6">
              <Button 
                onClick={handleCreatePage}
                disabled={!canProceed()}
                size="lg"
                className="min-w-[160px]"
              >
                Create Page
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateContent;