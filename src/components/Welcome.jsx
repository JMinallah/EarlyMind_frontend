import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogIn, UserPlus, ArrowRight } from 'lucide-react'

function Welcome() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-r from-emerald-500 to-teal-600 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Welcome to EarlyMind</h1>
        <p className="text-xl text-white opacity-90">
          Supporting early childhood development through innovative digital solutions.
        </p>
      </div>

      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-emerald-800 mb-6 text-center">
          Get Started
        </h2>

        {user ? (
          <div className="space-y-4">
            <p className="text-gray-700 text-center">
              Welcome back, {user.name || 'User'}!
            </p>
            <Link
              to="/dashboard"
              className="w-full block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-md transition-colors text-center flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <Link
              to="/login"
              className="w-full block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-md transition-colors text-center flex items-center justify-center gap-2"
            >
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/register"
              className="w-full block bg-white border-2 border-emerald-600 hover:bg-emerald-50 text-emerald-600 font-medium py-3 px-4 rounded-md transition-colors text-center flex items-center justify-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              <span>Create Account</span>
            </Link>
          </div>
        )}

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>EarlyMind provides tools for parents and educators to support early childhood development.</p>
        </div>
      </div>
    </div>
  )
}

export default Welcome