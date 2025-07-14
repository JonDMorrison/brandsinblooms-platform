import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Users, Zap, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-primary rounded-xl flex items-center justify-center mb-8 shadow-glow">
              <img 
                src="/lovable-uploads/9fb0ed2b-1788-4ead-84c3-7d7d0d9768a3.png" 
                alt="Brands In Blooms Logo" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Brands In Blooms
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create beautiful websites with AI-powered tools. Manage content, products, and orders with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="xl" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="interactive gradient-card border-0 shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle>AI-Powered Content</CardTitle>
              <CardDescription>
                Generate compelling content with our advanced AI tools
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="interactive gradient-card border-0 shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Easy Management</CardTitle>
              <CardDescription>
                Intuitive dashboard to manage your site, products, and orders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="interactive gradient-card border-0 shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 bg-success rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Secure & Reliable</CardTitle>
              <CardDescription>
                Built with security and performance in mind
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
