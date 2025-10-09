import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'

// Lazy load components for better performance
const Login = lazy(() => import('./components/Login'))
const Register = lazy(() => import('./components/Register'))
const Welcome = lazy(() => import('./components/Welcome'))
const Dashboard = lazy(() => import('./components/ParentSession/Dashboard'))

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  
  // Auto-redirect based on auth state
  useEffect(() => {
    // This can be expanded based on your app's needs
  }, [user])
  
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>
  }
  
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Add more routes as needed */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
