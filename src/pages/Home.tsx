import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to Supabase Starter
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          A complete Supabase development starter with automated deployment tooling.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Local Development</h2>
            <p className="text-muted-foreground mb-4">
              Start building with your local Supabase stack
            </p>
            <code className="text-sm bg-muted p-2 rounded block">
              pnpm docker:up && pnpm dev
            </code>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Deploy</h2>
            <p className="text-muted-foreground mb-4">
              One command deployment to production
            </p>
            <code className="text-sm bg-muted p-2 rounded block">
              pnpm deploy
            </code>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                View Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}