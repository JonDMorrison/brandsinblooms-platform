import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Edit3,
  MousePointer2,
  Eye,
  Save
} from 'lucide-react';

interface PageData {
  selectedLayout: string;
  title: string;
  subtitle: string;
  isNew?: boolean;
}

const PageEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageData = location.state as PageData;

  // If no page data, redirect to content page
  if (!pageData) {
    navigate('/dashboard/content');
    return null;
  }

  const { selectedLayout, title, subtitle, isNew } = pageData;

  const getLayoutName = (layoutId: string) => {
    const layouts = {
      'landing-page': 'Landing Page',
      'blog-post': 'Blog Article',
      'portfolio-grid': 'Portfolio Grid',
      'about-company': 'About/Company',
      'product-page': 'Product Page',
      'contact-services': 'Contact/Services'
    };
    return layouts[layoutId as keyof typeof layouts] || 'Unknown Layout';
  };

  const renderLayoutEditor = () => {
    switch (selectedLayout) {
      case 'landing-page':
        return (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-6 border-2 border-dashed border-gray-300 p-12 rounded-lg hover:border-primary cursor-pointer group transition-colors">
              <div className="space-y-2">
                <MousePointer2 className="h-8 w-8 mx-auto text-gray-400 group-hover:text-primary transition-colors" />
                <h1 className="text-5xl font-bold text-gray-800">{title}</h1>
                {subtitle && <p className="text-2xl text-gray-600">{subtitle}</p>}
                <p className="text-sm text-gray-400">Click to edit hero section</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-2 border-dashed border-gray-300 p-8 rounded-lg hover:border-primary cursor-pointer group transition-colors">
                  <MousePointer2 className="h-6 w-6 mb-4 text-gray-400 group-hover:text-primary transition-colors" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Feature {i}</h3>
                  <p className="text-gray-500 text-sm">Click to add feature content</p>
                </div>
              ))}
            </div>

            <div className="text-center border-2 border-dashed border-gray-300 p-8 rounded-lg hover:border-primary cursor-pointer group transition-colors">
              <MousePointer2 className="h-6 w-6 mx-auto mb-2 text-gray-400 group-hover:text-primary transition-colors" />
              <p className="text-gray-500">Add call-to-action section</p>
            </div>
          </div>
        );

      case 'blog-post':
        return (
          <div className="flex gap-8">
            <div className="flex-1 space-y-6">
              <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg hover:border-primary cursor-pointer group transition-colors">
                <MousePointer2 className="h-8 w-8 mb-4 text-gray-400 group-hover:text-primary transition-colors" />
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
                {subtitle && <p className="text-xl text-gray-600 mb-4">{subtitle}</p>}
                <p className="text-sm text-gray-400">Click to edit article header</p>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-2 border-dashed border-gray-300 p-6 rounded-lg hover:border-primary cursor-pointer group transition-colors">
                    <MousePointer2 className="h-6 w-6 mb-2 text-gray-400 group-hover:text-primary transition-colors" />
                    <p className="text-gray-500">Article paragraph {i}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="w-80 space-y-4">
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg hover:border-primary cursor-pointer group transition-colors">
                <MousePointer2 className="h-6 w-6 mb-2 text-gray-400 group-hover:text-primary transition-colors" />
                <p className="text-gray-500 text-sm">Author info</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg hover:border-primary cursor-pointer group transition-colors">
                <MousePointer2 className="h-6 w-6 mb-2 text-gray-400 group-hover:text-primary transition-colors" />
                <p className="text-gray-500 text-sm">Related articles</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg hover:border-primary cursor-pointer group transition-colors">
                <MousePointer2 className="h-6 w-6 mb-2 text-gray-400 group-hover:text-primary transition-colors" />
                <p className="text-gray-500 text-sm">Newsletter signup</p>
              </div>
            </div>
          </div>
        );

      case 'portfolio-grid':
        return (
          <div className="space-y-8">
            <div className="text-center border-2 border-dashed border-gray-300 p-8 rounded-lg hover:border-primary cursor-pointer group transition-colors">
              <MousePointer2 className="h-8 w-8 mx-auto mb-4 text-gray-400 group-hover:text-primary transition-colors" />
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
              {subtitle && <p className="text-xl text-gray-600 mb-4">{subtitle}</p>}
              <p className="text-sm text-gray-400">Click to edit portfolio header</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-primary cursor-pointer group transition-colors flex items-center justify-center">
                  <div className="text-center">
                    <MousePointer2 className="h-8 w-8 mx-auto mb-2 text-gray-400 group-hover:text-primary transition-colors" />
                    <p className="text-gray-500 text-sm">Project {i}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-20 space-y-6">
            <MousePointer2 className="h-16 w-16 mx-auto text-gray-400" />
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
              {subtitle && <p className="text-xl text-gray-600 mb-4">{subtitle}</p>}
              <p className="text-gray-500">Point-and-click editor for {getLayoutName(selectedLayout)} layout</p>
              <p className="text-sm text-gray-400 mt-2">Click anywhere to start editing</p>
            </div>
            
            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-2 border-dashed border-gray-300 p-6 rounded-lg hover:border-primary cursor-pointer group transition-colors">
                  <MousePointer2 className="h-6 w-6 mb-2 text-gray-400 group-hover:text-primary transition-colors" />
                  <p className="text-gray-500 text-sm">Content block {i}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-full mx-auto p-6 space-y-6">
        {/* Page Info Header */}
        <Card className="gradient-card border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="hover-scale">
                  <Link to="/dashboard/content">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Page Editor
                  </CardTitle>
                  <CardDescription>
                    {isNew ? 'Creating' : 'Editing'}: {title} {subtitle && `• ${subtitle}`}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button 
                  size="sm"
                  onClick={() => navigate('/dashboard/content')}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save & Publish
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Interactive Page Editor */}
        <Card className="gradient-card border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="bg-white rounded-lg shadow-inner min-h-[700px] p-8 relative border">
              {renderLayoutEditor()}
            </div>
          </CardContent>
        </Card>

        {/* Editor Toolbar */}
        <Card className="gradient-card border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Layout: <span className="font-medium">{getLayoutName(selectedLayout)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Status: <span className="font-medium text-amber-600">Draft</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Add Block
                </Button>
                <Button variant="outline" size="sm">
                  Change Layout
                </Button>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PageEditor;