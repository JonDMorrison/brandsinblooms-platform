'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flower, Sparkles, Globe, Shield, Zap, Users, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { useAuth } from '@/src/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import Link from 'next/link';

export default function HomePlatform() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsModalOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set(mode, 'true');
    window.history.replaceState({}, '', url.toString());
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-hero flex items-center justify-center'>
        <div className='flex items-center space-x-2 sm:space-x-3'>
          <div className='flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex-shrink-0'>
            <Flower className='h-5 w-5 sm:h-6 sm:w-6 text-white animate-spin' />
          </div>
          <div>
            <h1 className='text-base sm:text-xl font-brand-heading text-gradient-primary'>
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
            <div className='flex items-center space-x-2 sm:space-x-3'>
              <div className='flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex-shrink-0'>
                <Flower className='h-5 w-5 sm:h-6 sm:w-6 text-white' />
              </div>
              <div>
                <h1 className='text-base sm:text-xl font-brand-heading text-gradient-primary'>
                  Brands in Blooms
                </h1>
              </div>
            </div>
            
            <div className='flex items-center space-x-4'>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal('signin')}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="btn-gradient-primary"
                onClick={() => openAuthModal('signup')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className='relative py-12 sm:py-16 md:py-20'>
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
              
              <h1 className='text-3xl sm:text-4xl md:text-6xl font-brand-heading text-gradient-primary'>
                Build Beautiful Sites for Your Brands
              </h1>
              
              <p className='text-base sm:text-lg md:text-xl text-muted-foreground'>
                Create and manage multiple branded websites with our powerful platform. 
                Perfect for agencies, franchises, and multi-brand businesses.
              </p>
              
              <div className='flex flex-col sm:flex-row gap-4'>
                <Button 
                  size="lg" 
                  className="btn-gradient-primary"
                  onClick={() => openAuthModal('signup')}
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
            
            {/* Right Content - Hero Image/Graphic */}
            <div className='lg:pl-12'>
              <Card className='border-muted/50 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5'>
                <CardContent className='p-12 text-center'>
                  <div className='flex items-center justify-center mb-6'>
                    <div className='flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-2xl'>
                      <Flower className='h-12 w-12 text-white' />
                    </div>
                  </div>
                  <h3 className='text-2xl font-brand-heading mb-4'>Ready to grow your brands?</h3>
                  <p className='text-muted-foreground mb-6'>Join thousands of businesses already using our platform.</p>
                  <div className='flex flex-col gap-3'>
                    <Button 
                      size="lg" 
                      className="w-full btn-gradient-primary"
                      onClick={() => openAuthModal('signup')}
                    >
                      Get Started Free
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="w-full"
                      onClick={() => openAuthModal('signin')}
                    >
                      Sign In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className='py-12 sm:py-16 md:py-20 bg-muted/30'>
        <div className='brand-container'>
          <div className='text-center mb-8 sm:mb-10 md:mb-12'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl font-brand-heading text-gradient-primary mb-4'>
              Everything You Need to Succeed
            </h2>
            <p className='text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto'>
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
      <section className='py-12 sm:py-16 md:py-20'>
        <div className='brand-container'>
          <div className='bg-gradient-primary rounded-2xl p-8 sm:p-10 md:p-12 text-center text-white'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl font-brand-heading mb-4'>
              Ready to Get Started?
            </h2>
            <p className='text-base sm:text-lg mb-8 opacity-90 max-w-2xl mx-auto'>
              Join thousands of businesses already using our platform to manage their online presence.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => openAuthModal('signup')}
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
              <Link href="/platform/privacy" className='text-sm text-muted-foreground hover:text-primary'>
                Privacy Policy
              </Link>
              <Link href="/platform/terms" className='text-sm text-muted-foreground hover:text-primary'>
                Terms of Service
              </Link>
              <Link href="/platform/contact" className='text-sm text-muted-foreground hover:text-primary'>
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Auth Modal */}
      <AuthModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}