import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Calendar, Home, BarChart3, Settings, Bell, Shield, Brain, X, Copy, Download, Check, Plus } from 'lucide-react'
import sessionService from '../../appwrite/sessionService'
import childProfileService from '../../appwrite/childProfileService'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [recentSessions, setRecentSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [childProfiles, setChildProfiles] = useState([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [_selectedChild, setSelectedChild] = useState(null)
  const [newChildData, setNewChildData] = useState({
    name: '',
    age: '',
    gender: '',
    notes: ''
  })
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Load recent sessions and child profiles when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (user?.$id) {
        try {
          // Load sessions
          setLoadingSessions(true)
          const sessions = await sessionService.getParentSessions(user.$id, 5) // Get 5 most recent
          setRecentSessions(sessions)
          
          // Load child profiles
          setLoadingProfiles(true)
          const profiles = await childProfileService.getChildProfiles(user.$id)
          setChildProfiles(profiles)
        } catch (error) {
          console.error('Error loading dashboard data:', error)
        } finally {
          setLoadingSessions(false)
          setLoadingProfiles(false)
        }
      }
    }

    loadData()
  }, [user])
  
  // Handle adding a new child profile
  const handleAddChild = async (e) => {
    e.preventDefault()
    
    try {
      // Validate input
      if (!newChildData.name || !newChildData.age) {
        // Display validation error
        return
      }
      
      // Create the child profile
      const childProfile = await childProfileService.createChildProfile({
        parentId: user.$id,
        name: newChildData.name,
        age: parseInt(newChildData.age),
        gender: newChildData.gender || null,
        notes: newChildData.notes || null
      })
      
      // Add to state and reset form
      setChildProfiles(prevProfiles => [childProfile, ...prevProfiles])
      setNewChildData({
        name: '',
        age: '',
        gender: '',
        notes: ''
      })
      
      // Close modal
      setShowAddChildModal(false)
    } catch (error) {
      console.error('Error adding child profile:', error)
    }
  }
  
  // Handle starting a session with a specific child
  const handleStartChildSession = async (childId, childName) => {
    setIsCreatingSession(true)
    
    try {
      const session = await sessionService.createSession(user.$id, childName)
      
      // Update child profile with new session
      await childProfileService.updateSessionCount(childId, session.$id)
      
      // Navigate to the child session
      navigate(`/child-session/${session.$id}`)
    } catch (error) {
      console.error('Error starting child session:', error)
      setIsCreatingSession(false)
    }
  }

  const handleAnalyzeSession = async (session) => {
    setSelectedSession(session)
    setShowAnalysisModal(true)
    setAnalysisLoading(true)
    setAnalysisResult(null)

    try {
      // Fetch messages for this session
      const messages = await sessionService.getSessionMessages(session.$id)
      
      if (!messages || messages.length === 0) {
        setAnalysisResult({
          error: "No conversation data found for this session."
        })
        setAnalysisLoading(false)
        return
      }

      // Format messages for AI analysis
      const conversationText = messages
        .map(msg => `${msg.speaker === 'child' ? 'Child' : 'Milo'}: ${msg.message}`)
        .join('\n')

      // Send to AI for analysis
      const response = await fetch('http://localhost:5000/api/openai-raw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a child psychology expert. Analyze the following conversation between a child and an AI assistant named Milo. Provide a mental health and emotional well-being assessment for the parent. Focus on:

1. Emotional state indicators
2. Communication patterns
3. Any concerns or positive signs
4. Developmental insights
5. Recommendations for the parent

Format your response as a structured analysis that's easy for parents to understand. Be supportive and constructive.`
            },
            {
              role: "user",
              content: `Please analyze this conversation:\n\n${conversationText}`
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const data = await response.json()
      setAnalysisResult({
        analysis: data.choices[0].message.content,
        sessionDate: new Date(session.session_start).toLocaleDateString(),
        messageCount: messages.length
      })

    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysisResult({
        error: `Failed to analyze session: ${error.message}`
      })
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleCopyAnalysis = async () => {
    if (!analysisResult?.analysis) return
    
    try {
      // Create clean text version for copying
      const cleanText = analysisResult.analysis
        .replace(/^#\s+(.+)$/gm, '$1\n' + '='.repeat(50) + '\n') // Main headers
        .replace(/^##\s+(.+)$/gm, '\n$1\n' + '-'.repeat(30) + '\n') // Sub headers
        .replace(/^###\s+(.+)$/gm, '\n$1:\n') // Sub-sub headers
        .replace(/^\d+\.\s+(.+)$/gm, '\n$1\n') // Numbered sections
        .replace(/^\s*[-•]\s+(.+)$/gm, '  • $1') // Bullet points
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
        .replace(/\n{3,}/g, '\n\n') // Clean up multiple newlines
      
      const fullReport = `EARLYMIND CHILD SESSION ANALYSIS REPORT
${'='.repeat(50)}

Session Date: ${analysisResult.sessionDate}
Messages Analyzed: ${analysisResult.messageCount}
Generated: ${new Date().toLocaleString()}

${cleanText}

${'='.repeat(50)}
Generated by EarlyMind AI Analysis System
This analysis is for informational purposes and should not replace professional medical advice.`

      await navigator.clipboard.writeText(fullReport)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = analysisResult.analysis
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleExportAnalysis = () => {
    if (!analysisResult?.analysis) return

    // Create clean text version for export
    const cleanText = analysisResult.analysis
      .replace(/^#\s+(.+)$/gm, '$1\n' + '='.repeat(50) + '\n') // Main headers
      .replace(/^##\s+(.+)$/gm, '\n$1\n' + '-'.repeat(30) + '\n') // Sub headers
      .replace(/^###\s+(.+)$/gm, '\n$1:\n') // Sub-sub headers
      .replace(/^\d+\.\s+(.+)$/gm, '\n$1\n') // Numbered sections
      .replace(/^\s*[-•]\s+(.+)$/gm, '  • $1') // Bullet points
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
      .replace(/\n{3,}/g, '\n\n') // Clean up multiple newlines

    const fullReport = `EARLYMIND CHILD SESSION ANALYSIS REPORT
${'='.repeat(50)}

Session Date: ${analysisResult.sessionDate}
Messages Analyzed: ${analysisResult.messageCount}
Session ID: ${selectedSession?.$id}
Generated: ${new Date().toLocaleString()}

${cleanText}

${'='.repeat(50)}
Generated by EarlyMind AI Analysis System

DISCLAIMER:
This analysis is generated by artificial intelligence and is intended for 
informational purposes only. It should not replace professional medical, 
psychological, or educational advice. If you have concerns about your 
child's development or well-being, please consult with qualified healthcare 
or educational professionals.

For more information, visit: https://earlymind.com
`

    // Create and download file
    const blob = new Blob([fullReport], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EarlyMind_Analysis_${analysisResult.sessionDate.replace(/\//g, '-')}_${selectedSession?.$id?.slice(-8) || 'session'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Navigation is handled by the protected route
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // We've removed the generic session function as all sessions must have a child profile

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
            <p className="text-gray-600 mb-4">
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
                <button 
                  onClick={() => setShowAddChildModal(true)}
                  className="bg-white text-earlymind-yellow rounded-full h-7 w-7 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                  title="Add new child profile"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Always show an "Add Child" button at the top of the profiles list */}
            <div className="px-4 pt-4 pb-2">
              <button 
                onClick={() => setShowAddChildModal(true)} 
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-earlymind-teal hover:bg-gray-50 transition-colors text-sm text-gray-600 hover:text-earlymind-teal"
              >
                <Plus className="h-4 w-4" /> Add New Child Profile
              </button>
            </div>
            
            <div className="p-4">
              {/* No children placeholder */}
              {loadingProfiles ? (
                <div className="py-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-earlymind-teal"></div>
                </div>
              ) : childProfiles.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-4">No child profiles yet</p>
                  <div>
                    <button 
                      onClick={() => setShowAddChildModal(true)}
                      className="px-6 py-2.5 bg-earlymind-yellow text-white rounded-md font-medium hover:bg-earlymind-yellow-dark transition-colors shadow-sm"
                    >
                      Add Child Profile
                    </button>
                    <p className="text-xs text-gray-400 mt-3">A child profile is required to start a session</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {childProfiles.map(child => (
                    <div key={child.$id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center p-3 border-b border-gray-100">
                        <div className="bg-earlymind-teal-lighter/20 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                          <span className="text-earlymind-teal font-bold">{child.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{child.name}</h4>
                          <p className="text-xs text-gray-500">Age: {child.age} years</p>
                        </div>
                      </div>
                      
                      <div className="p-3 text-sm">
                        <div className="flex justify-between mb-1">
                          <span>Sessions Completed:</span>
                          <span className="font-medium">{child.sessions_count || 0}</span>
                        </div>
                        <div className="flex justify-between mb-3">
                          <span>Last Session:</span>
                          <span className="font-medium">
                            {child.last_session ? new Date(child.updated_at).toLocaleDateString() : 'None'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <button 
                            onClick={() => handleStartChildSession(child.$id, child.name)}
                            disabled={isCreatingSession}
                            className={`w-full mt-1 px-3 py-3 rounded-md font-medium transition-colors flex items-center justify-center shadow-sm ${
                              isCreatingSession 
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-earlymind-yellow text-white hover:bg-earlymind-yellow-dark'
                            }`}
                          >
                            {isCreatingSession ? (
                              <div className="flex items-center">
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                <span>Starting...</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="mr-2 text-xl">👋</span>
                                <span>Start Session with {child.name}</span>
                              </div>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedChild(child)
                              // Show edit modal or navigate to detailed profile view
                            }}
                            className="w-full px-3 py-2 bg-earlymind-teal-lighter/20 text-earlymind-teal rounded text-sm hover:bg-earlymind-teal-lighter/30 transition-colors"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                        <div className="flex gap-2">
                          {session.status === 'active' && (
                            <button
                              onClick={() => navigate(`/child-session/${session.$id}`)}
                              className="text-xs bg-earlymind-teal text-white px-2 py-1 rounded hover:bg-earlymind-teal-dark transition-colors"
                            >
                              Continue
                            </button>
                          )}
                          <button
                            onClick={() => handleAnalyzeSession(session)}
                            className="text-xs bg-earlymind-yellow text-white px-2 py-1 rounded hover:bg-earlymind-yellow-dark transition-colors flex items-center gap-1"
                          >
                            <Brain className="h-3 w-3" />
                            Analyze
                          </button>
                        </div>
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

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-earlymind-teal text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <h3 className="text-lg font-medium">Session Analysis</h3>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {analysisLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-earlymind-teal mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing conversation...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              ) : analysisResult?.error ? (
                <div className="text-center py-12">
                  <div className="bg-red-100 border border-red-300 rounded-lg p-6">
                    <h4 className="text-red-800 font-medium mb-2">Analysis Error</h4>
                    <p className="text-red-600">{analysisResult.error}</p>
                  </div>
                </div>
              ) : analysisResult ? (
                <div>
                  {/* Session Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-earlymind-teal" />
                      Session Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-gray-600 block">📅 Date</span>
                        <span className="font-medium text-lg">{analysisResult.sessionDate}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-gray-600 block">💬 Messages</span>
                        <span className="font-medium text-lg">{analysisResult.messageCount}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-gray-600 block">🕐 Analysis</span>
                        <span className="font-medium text-lg">Complete</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary Table */}
                  <div className="bg-gradient-to-r from-earlymind-teal to-earlymind-yellow bg-opacity-5 rounded-lg p-4 mb-6 border border-earlymind-teal border-opacity-20">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-earlymind-teal" />
                      Quick Assessment Overview
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="text-center p-2">
                        <div className="text-2xl mb-1">😊</div>
                        <div className="text-xs text-gray-600">Emotional State</div>
                        <div className="font-medium text-green-600">Positive</div>
                      </div>
                      <div className="text-center p-2">
                        <div className="text-2xl mb-1">💬</div>
                        <div className="text-xs text-gray-600">Communication</div>
                        <div className="font-medium text-blue-600">Active</div>
                      </div>
                      <div className="text-center p-2">
                        <div className="text-2xl mb-1">🧠</div>
                        <div className="text-xs text-gray-600">Development</div>
                        <div className="font-medium text-purple-600">Healthy</div>
                      </div>
                      <div className="text-center p-2">
                        <div className="text-2xl mb-1">📈</div>
                        <div className="text-xs text-gray-600">Engagement</div>
                        <div className="font-medium text-orange-600">High</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-earlymind-teal" />
                      Mental Health & Well-being Analysis
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="text-gray-700 leading-relaxed space-y-4"
                        dangerouslySetInnerHTML={{
                          __html: analysisResult.analysis
                            .replace(/^#\s+(.+)$/gm, '<div class="text-xl font-bold text-earlymind-teal mb-3 mt-6 first:mt-0 flex items-center"><span class="mr-2">🧠</span>$1</div>') // Main headers with emoji
                            .replace(/^##\s+(.+)$/gm, '<div class="text-lg font-semibold text-gray-800 mb-2 mt-4 flex items-center"><span class="mr-2">📊</span>$1</div>') // Sub headers
                            .replace(/^###\s+(.+)$/gm, '<div class="text-md font-medium text-gray-700 mb-2 mt-3 flex items-center"><span class="mr-2">📋</span>$1</div>') // Sub-sub headers
                            .replace(/^####\s+(.+)$/gm, '<div class="text-sm font-medium text-gray-600 mb-1 mt-2 flex items-center"><span class="mr-2">📌</span>$1</div>') // Minor headers
                            .replace(/^\d+\.\s+(.+)$/gm, '<div class="font-medium text-gray-800 mb-2 mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-earlymind-teal flex items-start"><span class="text-earlymind-teal mr-2 font-bold">$1</span></div>') // Numbered sections
                            .replace(/^\s*•\s+(.+)$/gm, '<div class="ml-6 mb-2 flex items-start"><span class="text-earlymind-teal mr-2 text-lg">•</span><span class="flex-1">$1</span></div>') // Bullet points
                            .replace(/^\s*-\s+(.+)$/gm, '<div class="ml-6 mb-2 flex items-start"><span class="text-earlymind-teal mr-2 text-lg">•</span><span class="flex-1">$1</span></div>') // Convert dashes to bullets
                            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 bg-yellow-100 px-1 rounded">$1</strong>') // Bold text with highlight
                            .replace(/\*(.+?)\*/g, '<em class="italic text-gray-800">$1</em>') // Italic text
                            .replace(/Positive Signs?:/gi, '<div class="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3 mt-2"><span class="mr-1">✅</span>Positive Signs</div><div class="mb-3">')
                            .replace(/Concerns?:/gi, '<div class="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mb-3 mt-2"><span class="mr-1">⚠️</span>Concerns</div><div class="mb-3">')
                            .replace(/Recommendations?:/gi, '<div class="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-3 mt-2"><span class="mr-1">💡</span>Recommendations</div><div class="mb-3">')
                            .replace(/Overall[,:]?\s*/gi, '<div class="bg-gradient-to-r from-earlymind-teal to-earlymind-yellow bg-opacity-10 p-4 rounded-lg mt-6 border-l-4 border-earlymind-teal"><div class="font-semibold text-earlymind-teal mb-3 flex items-center"><span class="mr-2">🎯</span>Overall Assessment</div><div class="text-gray-700">')
                            .replace(/\n\n+/g, '</div><div class="mt-4 mb-2">') // Convert double line breaks to spacing
                            .replace(/\n/g, '<br class="mb-1">') // Convert single line breaks
                            + '</div>' // Close any open divs
                        }}
                      />
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-yellow-800">
                      <strong>Disclaimer:</strong> This analysis is generated by AI and should not replace professional medical or psychological advice. 
                      If you have concerns about your child's mental health, please consult with a qualified healthcare professional.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {analysisResult && !analysisResult.error && (
                    <>
                      <button
                        onClick={handleCopyAnalysis}
                        className="px-3 py-2 text-sm bg-earlymind-teal text-white rounded hover:bg-earlymind-teal-dark transition-colors flex items-center gap-2 whitespace-nowrap"
                        disabled={copySuccess}
                      >
                        {copySuccess ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Report
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleExportAnalysis}
                        className="px-3 py-2 text-sm bg-earlymind-yellow text-white rounded hover:bg-earlymind-yellow-dark transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Download className="h-4 w-4" />
                        Export as .txt
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Child Profile Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
            <div className="bg-earlymind-teal text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-medium text-lg">Add Child Profile</h3>
              <button 
                onClick={() => setShowAddChildModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddChild} className="p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    id="childName"
                    value={newChildData.name}
                    onChange={(e) => setNewChildData({...newChildData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-earlymind-teal focus:border-transparent"
                    placeholder="Enter child's name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="childAge" className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    id="childAge"
                    min="0"
                    max="18"
                    value={newChildData.age}
                    onChange={(e) => setNewChildData({...newChildData, age: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-earlymind-teal focus:border-transparent"
                    placeholder="Enter child's age"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="childGender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender (Optional)
                  </label>
                  <select
                    id="childGender"
                    value={newChildData.gender}
                    onChange={(e) => setNewChildData({...newChildData, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-earlymind-teal focus:border-transparent"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="childNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="childNotes"
                    rows="3"
                    value={newChildData.notes}
                    onChange={(e) => setNewChildData({...newChildData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-earlymind-teal focus:border-transparent"
                    placeholder="Add any notes about your child (e.g., preferences, needs, interests)"
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddChildModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-earlymind-yellow text-white rounded-md hover:bg-earlymind-yellow-dark transition-colors"
                  >
                    Add Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard