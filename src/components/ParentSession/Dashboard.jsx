import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Calendar, Home, BarChart3, Settings, Bell, Shield } from 'lucide-react'
import sessionService from '../../appwrite/sessionService'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [recentSessions, setRecentSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Load recent sessions when component mounts
  useEffect(() => {
    const loadRecentSessions = async () => {
      if (user?.$id) {
        try {
          setLoadingSessions(true)
          const sessions = await sessionService.getParentSessions(user.$id, 5) // Get 5 most recent
          setRecentSessions(sessions)
        } catch (error) {
          console.error('Error loading recent sessions:', error)
        } finally {
          setLoadingSessions(false)
        }
      }
    }

    loadRecentSessions()
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
      // Navigation is handled by the protected route
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleStartSession = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    setIsCreatingSession(true);
    
    try {
      // Create a new chat session
      const session = await sessionService.createSession(
        user.$id,
        null // Child name - can be added later or from user preferences
      );
      
      // Navigate to child session page with the session ID
      navigate(`/child-session/${session.$id}`);
      
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-earlymind-teal text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">EarlyMind</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm hidden md:flex">
              <User className="h-4 w-4" />
              <span>Welcome, {user?.name || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white text-earlymind-teal px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors items-center gap-1 hidden md:flex"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Desktop View Title - always visible on desktop */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 hidden md:block">Parent Dashboard</h2>
        
        {/* Mobile View Title - changes based on active tab */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 md:hidden">
          {activeTab === 'dashboard' && 'Dashboard'}
          {activeTab === 'reports' && 'Reports'}
          {activeTab === 'settings' && 'Settings'}
        </h2>
        
        {/* Welcome Card - only show on dashboard tab for mobile */}
        {(activeTab === 'dashboard' || !activeTab) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Welcome, {user?.name || 'Parent'}!</h3>
            <p className="text-gray-600">
              Manage your children's profiles, view recent activities, and customize your app preferences.
            </p>
          </div>
        )}

        {/* Mobile Reports View - only shown when activeTab is reports */}
        {activeTab === 'reports' && (
          <div className="md:hidden">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Progress Reports</h3>
                <Calendar className="h-5 w-5 text-earlymind-teal" />
              </div>
              <p className="text-gray-600 mb-4">
                View your child's development progress and milestones.
              </p>
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No reports available yet</p>
                <p className="text-xs text-gray-400 mt-1">Reports will appear here as your child completes activities</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Settings View - only shown when activeTab is settings */}
        {activeTab === 'settings' && (
          <div className="md:hidden">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="bg-earlymind-yellow text-white py-3 px-4">
                <h3 className="font-medium text-lg">App Preferences</h3>
              </div>
              <div className="p-4">
                <div className="mb-5">
                  <h4 className="font-medium mb-3">Notifications</h4>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700">Email Notifications</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700">Push Notifications</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">SMS Notifications</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                    </label>
                  </div>
                </div>
                <div className="mb-5">
                  <h4 className="font-medium mb-3">Privacy</h4>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700">Share Progress with Teachers</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Allow Anonymous Data Collection</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                    </label>
                  </div>
                </div>
                <button className="w-full mt-3 px-4 py-2 bg-earlymind-teal text-white rounded-md text-sm hover:bg-earlymind-teal-dark transition-colors flex items-center justify-center">
                  <span>Update Settings</span>
                </button>
              </div>
            </div>
          
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-earlymind-yellow text-white py-3 px-4">
                <h3 className="font-medium text-lg">Account Settings</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <button className="flex items-center w-full p-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    <User className="h-5 w-5 mr-3 text-earlymind-teal" />
                    <span>Edit Profile</span>
                  </button>
                  <button className="flex items-center w-full p-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    <Bell className="h-5 w-5 mr-3 text-earlymind-teal" />
                    <span>Notification Settings</span>
                  </button>
                  <button className="flex items-center w-full p-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    <Shield className="h-5 w-5 mr-3 text-earlymind-teal" />
                    <span>Privacy & Security</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Three Column Layout - Always visible on desktop, only visible on mobile when activeTab is dashboard */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 ${activeTab !== 'dashboard' && 'hidden md:grid'}`}>
          
          {/* Column 1: Child Profiles */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-earlymind-yellow text-white py-3 px-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">Child Profiles</h3>
                <button className="bg-white text-earlymind-yellow rounded-full h-6 w-6 flex items-center justify-center">
                  <span className="text-xl font-bold leading-none">+</span>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {/* Placeholder for no children - Hidden for now to show example profile */}
              <div className="hidden text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No child profiles yet</p>
                <button className="mt-3 px-4 py-2 bg-earlymind-yellow text-white rounded-md text-sm hover:bg-earlymind-yellow-dark transition-colors">
                  Add Child Profile
                </button>
              </div>
              
              {/* Example Child Profile Card - Visible for testing */}
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center p-3 border-b border-gray-100">
                  <div className="bg-earlymind-teal-lighter/20 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                    <span className="text-earlymind-teal font-bold">S</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Sarah</h4>
                    <p className="text-xs text-gray-500">Age: 4 years</p>
                  </div>
                </div>
                <div className="p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Development Score:</span>
                    <span className="font-medium">87/100</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Activities Completed:</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span>Next Assessment:</span>
                    <span className="font-medium">Oct 20</span>
                  </div>
                  <div className="space-y-2">
                    <button 
                      onClick={handleStartSession}
                      disabled={isCreatingSession}
                      className={`w-full mt-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                        isCreatingSession 
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-earlymind-yellow text-white hover:bg-earlymind-yellow-dark'
                      }`}
                    >
                      {isCreatingSession ? 'Starting Session...' : 'Start Session'}
                    </button>
                    <button className="w-full px-3 py-2 bg-earlymind-teal-lighter/20 text-earlymind-teal rounded text-sm hover:bg-earlymind-teal-lighter/30 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Column 2: Recent Activity */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-earlymind-yellow text-white py-3 px-4">
              <h3 className="font-medium text-lg">Recent Activity</h3>
            </div>
            
            <div className="p-4">
              {loadingSessions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-earlymind-teal mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading sessions...</p>
                </div>
              ) : recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.$id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          Chat Session {session.status === 'active' ? '(Active)' : '(Completed)'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.session_start).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {session.status === 'active' 
                          ? 'Session in progress' 
                          : `Duration: ${session.duration_minutes ? Math.round(session.duration_minutes) + ' minutes' : 'N/A'}`
                        }
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status === 'active' ? 'Active' : 'Completed'}
                        </span>
                        {session.status === 'active' && (
                          <button
                            onClick={() => navigate(`/child-session/${session.$id}`)}
                            className="text-xs bg-earlymind-teal text-white px-2 py-1 rounded hover:bg-earlymind-teal-dark transition-colors"
                          >
                            Continue
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No recent sessions</p>
                  <p className="text-xs text-gray-400 mt-1">Start your first session to see activity here</p>
                </div>
              )}
            </div>
                
            <div className="border-t border-gray-100 p-4">
              <button className="w-full text-sm text-earlymind-teal hover:underline">
                View All Sessions
              </button>
            </div>
          </div>
          
          {/* Column 3: App Preferences - Only visible on desktop */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hidden md:block">
            <div className="bg-earlymind-yellow text-white py-3 px-4">
              <h3 className="font-medium text-lg">App Preferences</h3>
            </div>
            
            <div className="p-4">
              {/* Notification Settings */}
              <div className="mb-5">
                <h4 className="font-medium mb-3">Notifications</h4>
                
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">Email Notifications</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">Push Notifications</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">SMS Notifications</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                  </label>
                </div>
              </div>
              
              {/* Privacy Settings */}
              <div className="mb-5">
                <h4 className="font-medium mb-3">Privacy</h4>
                
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">Share Progress with Teachers</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Allow Anonymous Data Collection</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earlymind-teal"></div>
                  </label>
                </div>
              </div>
              
              {/* Account Settings Link */}
              <button className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center justify-center">
                <span>View All Settings</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation - only shown on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 md:hidden z-30 shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'dashboard' ? 'text-earlymind-teal' : 'text-gray-500'}`}
        >
          <Home size={20} />
          <span className="text-xs mt-1">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'reports' ? 'text-earlymind-teal' : 'text-gray-500'}`}
        >
          <BarChart3 size={20} />
          <span className="text-xs mt-1">Reports</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${activeTab === 'settings' ? 'text-earlymind-teal' : 'text-gray-500'}`}
        >
          <Settings size={20} />
          <span className="text-xs mt-1">Settings</span>
        </button>
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 py-1 text-earlymind-yellow"
        >
          <LogOut size={20} />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>

      {/* Add padding at the bottom on mobile to account for the navigation bar */}
      <div className="h-16 md:h-0"></div>
    </div>
  )
}

export default Dashboard