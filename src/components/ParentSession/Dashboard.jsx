import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, User, BarChart, BookOpen, Calendar, MessageCircle } from 'lucide-react'

function Dashboard() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      // Navigation is handled by the protected route
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">EarlyMind</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm hidden md:flex">
              <User className="h-4 w-4" />
              <span>Welcome, {user?.name || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white text-emerald-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Parent Dashboard</h2>
        
        {/* Dashboard content will go here */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Getting Started</h3>
          <p className="text-gray-600 mb-4">
            Welcome to your EarlyMind dashboard! This is where you'll be able to:
          </p>
          <ul className="list-disc pl-5 mb-4 text-gray-600">
            <li>Monitor your child's progress</li>
            <li>Access educational resources</li>
            <li>Schedule activities and sessions</li>
            <li>Communicate with educators</li>
          </ul>
          <p className="text-gray-600">
            We're still building this dashboard. More features will be available soon!
          </p>
        </div>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-medium text-gray-800">Progress Tracking</h3>
            </div>
            <p className="text-gray-600">
              Monitor your child's developmental milestones and learning progress.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-medium text-gray-800">Learning Resources</h3>
            </div>
            <p className="text-gray-600">
              Access educational materials and activities customized for your child.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-medium text-gray-800">Educator Chat</h3>
            </div>
            <p className="text-gray-600">
              Connect with early childhood specialists for guidance and support.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard