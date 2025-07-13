import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Wand2,
  FileText,
  Image,
  MessageCircle,
  Zap,
  Copy,
  Download,
  Loader2,
  CheckCircle,
  Star
} from 'lucide-react';

const AITools = () => {
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you create content, generate ideas, and optimize your site. What would you like to work on today?',
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const contentTemplates = [
    {
      id: 'blog-post',
      title: 'Blog Post',
      description: 'Create engaging blog posts for your audience',
      icon: FileText,
      prompt: 'Write a blog post about',
    },
    {
      id: 'product-description',
      title: 'Product Description',
      description: 'Write compelling product descriptions',
      icon: Sparkles,
      prompt: 'Write a product description for',
    },
    {
      id: 'page-content',
      title: 'Page Content',
      description: 'Generate content for your website pages',
      icon: FileText,
      prompt: 'Create page content for',
    },
    {
      id: 'social-media',
      title: 'Social Media Post',
      description: 'Create social media content',
      icon: MessageCircle,
      prompt: 'Write a social media post about',
    },
  ];

  const aiFeatures = [
    {
      title: 'Content Generator',
      description: 'Generate high-quality content for your website using AI',
      icon: Wand2,
      status: 'available',
    },
    {
      title: 'Image Generator',
      description: 'Create custom images and graphics for your content',
      icon: Image,
      status: 'coming-soon',
    },
    {
      title: 'SEO Optimizer',
      description: 'Optimize your content for search engines',
      icon: Zap,
      status: 'coming-soon',
    },
    {
      title: 'Site Builder',
      description: 'Generate complete page layouts and structures',
      icon: FileText,
      status: 'available',
    },
  ];

  const handleGenerate = async (template: any, input: string) => {
    if (!input.trim()) return;
    
    setLoading(true);
    // Mock AI generation
    setTimeout(() => {
      const mockContent = `# ${template.title}\n\nHere's your AI-generated content for "${input}":\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n## Key Features\n\n- Feature 1: Comprehensive and detailed\n- Feature 2: User-friendly design\n- Feature 3: High-quality materials\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n## Conclusion\n\nThis AI-generated content provides a solid foundation that you can customize and expand upon to match your brand voice and specific requirements.`;
      
      setGeneratedContent(mockContent);
      setLoading(false);
    }, 2000);
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    
    const newMessages = [
      ...chatMessages,
      { role: 'user', content: chatInput },
      { 
        role: 'assistant', 
        content: 'That\'s a great question! Based on your request, here are some suggestions:\n\n1. Consider your target audience\n2. Focus on your unique value proposition\n3. Use compelling visuals\n4. Keep your message clear and concise\n\nWould you like me to help you develop any of these ideas further?' 
      }
    ];
    
    setChatMessages(newMessages);
    setChatInput('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span>AI Tools</span>
          </h1>
          <p className="text-muted-foreground">
            Harness the power of AI to create amazing content
          </p>
        </div>
        <Badge variant="default" className="bg-gradient-primary">
          ✨ Powered by AI
        </Badge>
      </div>

      {/* AI Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiFeatures.map((feature, index) => (
          <Card key={feature.title} className="interactive gradient-card border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <feature.icon className="h-8 w-8 text-primary" />
                <Badge variant={feature.status === 'available' ? 'default' : 'secondary'}>
                  {feature.status === 'available' ? 'Available' : 'Coming Soon'}
                </Badge>
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main AI Tools */}
      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">Content Generator</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Templates */}
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5" />
                  <span>Content Templates</span>
                </CardTitle>
                <CardDescription>
                  Choose a template and let AI create content for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contentTemplates.map((template) => (
                  <div key={template.id} className="p-4 rounded-lg border bg-background/50">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gradient-primary rounded-lg">
                        <template.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{template.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex space-x-2">
                          <Input
                            placeholder={`${template.prompt}...`}
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleGenerate(template, (e.target as HTMLInputElement).value);
                              }
                            }}
                          />
                          <Button 
                            size="sm"
                            variant="gradient"
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).closest('.flex')?.querySelector('input') as HTMLInputElement;
                              if (input) handleGenerate(template, input.value);
                            }}
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Generated Content */}
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Generated Content</span>
                    </CardTitle>
                    <CardDescription>
                      Your AI-generated content will appear here
                    </CardDescription>
                  </div>
                  {generatedContent && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Generating content...</p>
                    </div>
                  </div>
                ) : generatedContent ? (
                  <div className="bg-background/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-center">
                    <div>
                      <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Select a template and provide a prompt to generate content
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assistant" className="space-y-6">
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>AI Assistant Chat</span>
              </CardTitle>
              <CardDescription>
                Chat with your AI assistant for personalized help and advice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <div className="bg-background/50 rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-gradient-primary text-white'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask your AI assistant anything..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleChatSubmit();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleChatSubmit} variant="gradient">
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="interactive hover:shadow-glow transition-all duration-300">
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Site Analysis</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get AI insights about your site performance
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Analyze Site
                </Button>
              </CardContent>
            </Card>

            <Card className="interactive hover:shadow-glow transition-all duration-300">
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 text-accent mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Content Ideas</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Generate fresh content ideas for your niche
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Get Ideas
                </Button>
              </CardContent>
            </Card>

            <Card className="interactive hover:shadow-glow transition-all duration-300">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <h3 className="font-semibold mb-2">SEO Review</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Optimize your content for search engines
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Review SEO
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AITools;