'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flower, Sparkles, Globe, Shield, Zap, Users, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { useAuth } from '@/src/contexts/AuthContext';
import SignIn from '@/components/auth/SignIn';
import SignUp from '@/components/auth/SignUp';
import Link from 'next/link';

export default function HomePlatform() {
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(
    searchParams.get('signup') === 'true'
  );
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setIsSignUp(searchParams.get('signup') === 'true');
  }, [searchParams]);

  const handleToggle = (signUp: boolean) => {
    setIsSignUp(signUp);
    const url = new URL(window.location.href);
    if (signUp) {
      url.searchParams.set('signup', 'true');
    } else {
      url.searchParams.delete('signup');
    }
    window.history.replaceState({}, '', url.toString());
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-hero flex items-center justify-center'>
        <div className='flex items-center space-x-3'>
          <div className='flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg'>
            <Flower className='h-6 w-6 text-white animate-spin' />
          </div>
          <div>
            <h1 className='text-xl font-brand-heading text-gradient-primary'>
              Loading...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className='min-h-screen bg-gradient-hero'>
      {/* Header */}
      <header className='relative z-10'>
        <nav className='brand-container py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg'>
                <Flower className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-xl font-brand-heading text-gradient-primary'>
                  Brands in Blooms
                </h1>
              </div>
            </div>
            
            <div className='flex items-center space-x-4'>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(false)}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="btn-gradient-primary"
                onClick={() => handleToggle(true)}
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className='relative py-20'>
        <div className='brand-container'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Left Content */}
            <div className='space-y-6'>
              <div className='inline-flex items-center space-x-2 bg-primary/10 px-3 py-1 rounded-full'>
                <Sparkles className='h-4 w-4 text-primary' />
                <span className='text-sm font-medium text-primary'>
                  Multi-tenant Platform
                </span>
              </div>
              
              <h1 className='text-4xl md:text-6xl font-brand-heading text-gradient-primary'>
                Build Beautiful Sites for Your Brands
              </h1>
              
              <p className='text-lg md:text-xl text-muted-foreground'>
                Create and manage multiple branded websites with our powerful platform. 
                Perfect for agencies, franchises, and multi-brand businesses.
              </p>
              
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button 
                  size="lg" 
                  className="btn-gradient-primary"
                  onClick={() => handleToggle(true)}
                >
                  Start Building <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => {
                    const element = document.getElementById('features');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore Features
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className='flex items-center space-x-6 pt-4'>
                <div className='flex items-center space-x-2'>
                  <Check className='h-5 w-5 text-green-500' />
                  <span className='text-sm text-muted-foreground'>Free tier available</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Check className='h-5 w-5 text-green-500' />
                  <span className='text-sm text-muted-foreground'>No credit card required</span>
                </div>
              </div>
            </div>
            
            {/* Right Content - Auth Form */}
            <div className='lg:pl-12'>
              <Card className='border-muted/50 shadow-xl'>
                <CardContent className='p-6'>
                  {/* Auth Toggle */}
                  <div className='flex items-center space-x-1 bg-muted p-1 rounded-lg mb-6'>
                    <Button
                      variant={!isSignUp ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => handleToggle(false)}
                      className={`flex-1 ${!isSignUp ? 'btn-gradient-primary' : ''}`}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant={isSignUp ? 'default' : 'ghost'}
                      size='sm'
                      onClick={() => handleToggle(true)}
                      className={`flex-1 ${isSignUp ? 'btn-gradient-primary' : ''}`}
                    >
                      Sign Up
                    </Button>
                  </div>
                  
                  {/* Auth Form */}
                  <div className='transition-all duration-200 ease-in-out'>
                    {isSignUp ? <SignUp /> : <SignIn />}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className='py-20 bg-muted/30'>
        <div className='brand-container'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-brand-heading text-gradient-primary mb-4'>
              Everything You Need to Succeed
            </h2>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              Our platform provides all the tools you need to create, manage, and grow your branded websites.
            </p>
          </div>
          
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Feature Cards */}
            <Card className='border-muted/50 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4'>
                  <Globe className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>Custom Domains</h3>
                <p className='text-muted-foreground'>
                  Connect your own domains and create unique branded experiences for each site.
                </p>
              </CardContent>
            </Card>
            
            <Card className='border-muted/50 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4'>
                  <Users className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>Team Management</h3>
                <p className='text-muted-foreground'>
                  Invite team members and control access with granular permissions.
                </p>
              </CardContent>
            </Card>
            
            <Card className='border-muted/50 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4'>
                  <Zap className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>S3/CDN Storage</h3>
                <p className='text-muted-foreground'>
                  Lightning-fast image delivery with integrated CDN and S3 storage.
                </p>
              </CardContent>
            </Card>
            
            <Card className='border-muted/50 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4'>
                  <Shield className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>Secure & Reliable</h3>
                <p className='text-muted-foreground'>
                  Enterprise-grade security with SSL certificates and regular backups.
                </p>
              </CardContent>
            </Card>
            
            <Card className='border-muted/50 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4'>
                  <Sparkles className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>Product Catalog</h3>
                <p className='text-muted-foreground'>
                  Manage products with categories, inventory tracking, and beautiful galleries.
                </p>
              </CardContent>
            </Card>
            
            <Card className='border-muted/50 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4'>
                  <Flower className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>Beautiful Themes</h3>
                <p className='text-muted-foreground'>
                  Choose from professionally designed themes or create your own.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20'>
        <div className='brand-container'>
          <div className='bg-gradient-primary rounded-2xl p-12 text-center text-white'>
            <h2 className='text-3xl md:text-4xl font-brand-heading mb-4'>
              Ready to Get Started?
            </h2>
            <p className='text-lg mb-8 opacity-90 max-w-2xl mx-auto'>
              Join thousands of businesses already using our platform to manage their online presence.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => handleToggle(true)}
            >
              Create Your First Site <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 border-t'>
        <div className='brand-container'>
          <div className='flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0'>
            <div className='flex items-center space-x-3'>
              <div className='flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg'>
                <Flower className='h-4 w-4 text-white' />
              </div>
              <span className='text-sm text-muted-foreground'>
                © 2025 Brands in Blooms. All rights reserved.
              </span>
            </div>
            
            <div className='flex items-center space-x-6'>
              <Link href="/privacy" className='text-sm text-muted-foreground hover:text-primary'>
                Privacy Policy
              </Link>
              <Link href="/terms" className='text-sm text-muted-foreground hover:text-primary'>
                Terms of Service
              </Link>
              <Link href="/contact" className='text-sm text-muted-foreground hover:text-primary'>
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}