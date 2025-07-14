import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  FileText,
  PenTool,
  Sparkles,
  Save,
  Eye,
  Wand2,
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
  const [step, setStep] = useState(1);
  const [selectedLayout, setSelectedLayout] = useState<string>('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const layouts: Layout[] = [
    {
      id: 'hero-cta',
      name: 'Hero + CTA',
      description: 'Large hero section with call-to-action',
      preview: (
        <div className="w-full h-16 bg-accent rounded border space-y-1 p-2">
          <div className="h-3 bg-primary/30 rounded w-3/4"></div>
          <div className="h-2 bg-muted-foreground/20 rounded w-1/2"></div>
          <div className="h-2 bg-primary rounded w-1/4 mt-1"></div>
        </div>
      )
    },
    {
      id: 'two-column',
      name: 'Two Column',
      description: 'Split layout with content and sidebar',
      preview: (
        <div className="w-full h-16 bg-accent rounded border flex gap-1 p-2">
          <div className="flex-1 space-y-1">
            <div className="h-2 bg-primary/30 rounded"></div>
            <div className="h-2 bg-muted-foreground/20 rounded w-3/4"></div>
            <div className="h-2 bg-muted-foreground/20 rounded w-1/2"></div>
          </div>
          <div className="w-1/3 space-y-1">
            <div className="h-2 bg-secondary rounded"></div>
            <div className="h-2 bg-secondary rounded w-3/4"></div>
          </div>
        </div>
      )
    },
    {
      id: 'feature-grid',
      name: 'Feature Grid',
      description: 'Grid layout showcasing features or services',
      preview: (
        <div className="w-full h-16 bg-accent rounded border p-2 space-y-1">
          <div className="h-2 bg-primary/30 rounded w-1/2 mx-auto"></div>
          <div className="grid grid-cols-3 gap-1 mt-2">
            <div className="h-3 bg-secondary rounded"></div>
            <div className="h-3 bg-secondary rounded"></div>
            <div className="h-3 bg-secondary rounded"></div>
          </div>
        </div>
      )
    },
    {
      id: 'about-story',
      name: 'About Story',
      description: 'Narrative layout perfect for about pages',
      preview: (
        <div className="w-full h-16 bg-accent rounded border p-2 space-y-1">
          <div className="h-2 bg-primary/30 rounded w-2/3 mx-auto"></div>
          <div className="flex gap-1 mt-1">
            <div className="w-1/3 h-4 bg-secondary rounded"></div>
            <div className="flex-1 space-y-1">
              <div className="h-1 bg-muted-foreground/20 rounded"></div>
              <div className="h-1 bg-muted-foreground/20 rounded w-4/5"></div>
              <div className="h-1 bg-muted-foreground/20 rounded w-3/5"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contact-form',
      name: 'Contact Form',
      description: 'Contact page with form and info',
      preview: (
        <div className="w-full h-16 bg-accent rounded border p-2 space-y-1">
          <div className="h-2 bg-primary/30 rounded w-1/2 mx-auto"></div>
          <div className="flex gap-1 mt-1">
            <div className="flex-1 space-y-1">
              <div className="h-1 bg-muted-foreground/20 rounded"></div>
              <div className="h-1 bg-muted-foreground/20 rounded"></div>
              <div className="h-1 bg-primary rounded w-1/3"></div>
            </div>
            <div className="w-1/3 space-y-1">
              <div className="h-1 bg-secondary rounded"></div>
              <div className="h-1 bg-secondary rounded w-3/4"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'blog-article',
      name: 'Blog Article',
      description: 'Clean reading layout for articles',
      preview: (
        <div className="w-full h-16 bg-accent rounded border p-2 space-y-1">
          <div className="h-2 bg-primary/30 rounded w-3/4 mx-auto"></div>
          <div className="h-1 bg-muted-foreground/30 rounded w-1/3 mx-auto"></div>
          <div className="space-y-1 mt-2">
            <div className="h-1 bg-muted-foreground/20 rounded"></div>
            <div className="h-1 bg-muted-foreground/20 rounded w-5/6"></div>
            <div className="h-1 bg-muted-foreground/20 rounded w-4/5"></div>
          </div>
        </div>
      )
    }
  ];

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const layout = layouts.find(l => l.id === selectedLayout);
      const generatedContent = `# ${title || aiPrompt}
${subtitle ? `\n*${subtitle}*\n` : ''}

Welcome to this new page about ${aiPrompt}. We're excited to share our approach with you.

## Our Approach

At the heart of what we do is a commitment to excellence. We believe that ${aiPrompt} should be accessible, effective, and tailored to your unique needs.

## Why Choose Us

- **Experience**: Years of expertise in the field
- **Quality**: Commitment to delivering the best results  
- **Support**: We're here to help every step of the way

## Get In Touch

Ready to learn more? We'd love to hear from you and discuss how we can help with your ${aiPrompt} needs.`;

      setContent(generatedContent);
      if (!title) {
        setTitle(aiPrompt.charAt(0).toUpperCase() + aiPrompt.slice(1));
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    console.log('Saving page:', { selectedLayout, title, subtitle, content });
    navigate('/dashboard/content');
  };

  const canProceed = () => {
    if (step === 1) return selectedLayout;
    if (step === 2) return title;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
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
              Step {step} of 3 • Build something amazing
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <Card className="gradient-card border-0 shadow-xl animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Choose Your Layout</CardTitle>
              <CardDescription>
                Select a layout that fits your page design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className={`group p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover-scale ${
                      selectedLayout === layout.id
                        ? 'border-primary bg-primary/5 shadow-md'
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
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="gradient-card border-0 shadow-xl animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Page Details</CardTitle>
              <CardDescription>
                Enter your page title and subtitle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
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

              <div className="bg-accent/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">AI Assistant</span>
                </div>
                <Textarea
                  placeholder="Describe your topic or ask AI to help generate ideas..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={!aiPrompt.trim() || isGenerating}
                  size="sm"
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Ideas...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="gradient-card border-0 shadow-xl animate-scale-in">
            <CardHeader>
              <CardTitle className="text-xl">Write Your Content</CardTitle>
              <CardDescription>
                {title && `Creating: ${title}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Start writing your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="font-mono text-sm resize-none"
              />
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {content.length} characters
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button onClick={handleSave} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save & Publish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Previous
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div /> // Spacer
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateContent;