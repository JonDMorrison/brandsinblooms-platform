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

interface Template {
  id: string;
  name: string;
  type: 'page' | 'blog';
  description: string;
  icon: string;
}

const CreateContent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const templates: Template[] = [
    {
      id: 'homepage',
      name: 'Homepage',
      type: 'page',
      description: 'Perfect landing page for your business',
      icon: '🏠'
    },
    {
      id: 'about',
      name: 'About Page',
      type: 'page', 
      description: 'Tell your story and build trust',
      icon: '👋'
    },
    {
      id: 'services',
      name: 'Services',
      type: 'page',
      description: 'Showcase what you offer',
      icon: '⚡'
    },
    {
      id: 'blog-post',
      name: 'Blog Post',
      type: 'blog',
      description: 'Share insights and expertise',
      icon: '✍️'
    },
    {
      id: 'case-study',
      name: 'Case Study',
      type: 'blog',
      description: 'Highlight success stories',
      icon: '📈'
    },
    {
      id: 'tutorial',
      name: 'Tutorial',
      type: 'blog',
      description: 'Teach your audience something new',
      icon: '🎓'
    }
  ];

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const template = templates.find(t => t.id === selectedTemplate);
      const generatedContent = `# ${title || aiPrompt}

${template?.type === 'blog' ? 
`Welcome to this comprehensive guide about ${aiPrompt}. Let's dive into the key insights and practical tips you need to know.

## What You'll Learn

In this ${template.name.toLowerCase()}, we'll cover:
- Essential concepts and fundamentals
- Practical strategies you can implement today  
- Real-world examples and case studies
- Next steps for continued growth

## Getting Started

${aiPrompt} is an important topic that deserves your attention. Here's why it matters and how you can get started...` :

`## Welcome to ${title || aiPrompt}

We're excited to share our approach to ${aiPrompt} with you. Our mission is to provide exceptional value through innovative solutions.

## Our Approach

At the heart of what we do is a commitment to excellence. We believe that ${aiPrompt} should be accessible, effective, and tailored to your unique needs.

## Why Choose Us

- **Experience**: Years of expertise in the field
- **Quality**: Commitment to delivering the best results  
- **Support**: We're here to help every step of the way`}

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
    console.log('Saving content:', { selectedTemplate, title, content });
    navigate('/dashboard/content');
  };

  const canProceed = () => {
    if (step === 1) return selectedTemplate;
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
            <h1 className="text-2xl font-bold">Create New Content</h1>
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
              <CardTitle className="text-xl">Choose Your Template</CardTitle>
              <CardDescription>
                Pick a starting point that matches your goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`group p-6 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover-scale ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="text-center space-y-3">
                      <span className="text-3xl block">{template.icon}</span>
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      <Badge variant={template.type === 'blog' ? 'default' : 'secondary'}>
                        {template.type}
                      </Badge>
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
              <CardTitle className="text-xl">What's Your Topic?</CardTitle>
              <CardDescription>
                Tell us what you want to create content about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a compelling title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
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