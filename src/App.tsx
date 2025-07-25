import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import Index from '@/pages/Index'
import SignIn from '@/pages/SignIn'
import SignUp from '@/pages/SignUp'
import Dashboard from '@/pages/Dashboard'
import Content from '@/pages/Content'
import CreateContent from '@/pages/CreateContent'
import PageEditor from '@/pages/PageEditor'
import Products from '@/pages/Products'
import Orders from '@/pages/Orders'
import Design from '@/pages/Design'
import Settings from '@/pages/Settings'
import Profile from '@/pages/Profile'
import NotFound from '@/pages/NotFound'
import DashboardLayout from '@/components/layout/DashboardLayout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return user ? <>{children}</> : <Navigate to="/signin" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Dashboard routes with layout */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="content" element={<Content />} />
            <Route path="content/new" element={<CreateContent />} />
            <Route path="content/editor" element={<PageEditor />} />
            <Route path="content/edit/:id" element={<PageEditor />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="design" element={<Design />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Legacy profile route */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          
          {/* Redirect old routes */}
          <Route path="/login" element={<Navigate to="/signin" replace />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          
          {/* 404 Not Found - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  )
}

export default App