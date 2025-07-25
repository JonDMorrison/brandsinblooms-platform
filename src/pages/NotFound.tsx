import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search, Flower } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8 fade-in">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg">
            <Flower className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-brand-heading text-gradient-primary">
              Brands & Blooms
            </h1>
          </div>
        </div>

        <Card className="gradient-card shadow-lg hover-scale-sm fade-in-up">
          <CardContent className="p-12">
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-bold text-gradient-primary opacity-20 leading-none">
                404
              </h1>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-brand-heading mb-4">
                Oops! Page not found
              </h2>
              <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved to a different location.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button asChild className="btn-gradient-primary interactive">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="interactive">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            {/* Search Suggestion */}
            <div className="border-t pt-8">
              <div className="flex items-center justify-center space-x-2 text-muted-foreground mb-4">
                <Search className="h-4 w-4" />
                <span className="text-sm">Looking for something specific?</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <Link
                  to="/dashboard"
                  className="p-3 rounded-lg border hover:bg-muted transition-colors text-center"
                >
                  <div className="font-medium">Dashboard</div>
                  <div className="text-muted-foreground text-xs">Manage your content</div>
                </Link>
                <Link
                  to="/signin"
                  className="p-3 rounded-lg border hover:bg-muted transition-colors text-center"
                >
                  <div className="font-medium">Sign In</div>
                  <div className="text-muted-foreground text-xs">Access your account</div>
                </Link>
                <Link
                  to="/signup"
                  className="p-3 rounded-lg border hover:bg-muted transition-colors text-center"
                >
                  <div className="font-medium">Get Started</div>
                  <div className="text-muted-foreground text-xs">Create new account</div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-sm text-muted-foreground fade-in" style={{ animationDelay: '0.2s' }}>
          <p>
            Need help? {' '}
            <Link to="/contact" className="text-primary hover:text-primary/80 transition-colors">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}