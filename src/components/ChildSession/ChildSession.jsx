import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, LogOut, Home, Lock, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// Cloud CSS styles
import './cloud-bubble.css'
import './cloud-animations.css'
import './cloud-container.css'
import './cloud-background.css'

function ChildSession() {
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState([
    { speaker: 'milo', message: 'Hi there! I\'m Milo. How are you feeling today?' }
  ])
  const [parentModeActive, setParentModeActive] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [pinInput, setPinInput] = useState('')
  const [showPinModal, setShowPinModal] = useState(false)
  const parentPin = '1234' // This would ideally come from a secure context or parent setup
  const tapTimeout = useRef(null)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const conversationEndRef = useRef(null)

  // Auto-scroll to the bottom when conversation changes
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleMicClick = () => {
    // Toggle the mic state
    setIsListening(!isListening)
    
    // Simulate a response for demo purposes
    if (!isListening) {
      // Add user message after a short delay (simulating speech recognition)
      setTimeout(() => {
        setConversation(prevConversation => [...prevConversation, { 
          speaker: 'child', 
          message: 'I\'m feeling happy today!' 
        }])
        
        // Add Milo's response after another delay
        setTimeout(() => {
          setConversation(prevConversation => [...prevConversation, 
            { speaker: 'milo', message: 'That\'s wonderful! Would you like to play a game or hear a story?' }
          ])
          setIsListening(false)
        }, 2000)
      }, 1500)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Navigation is handled by the protected route
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  // Handle the special tap pattern in the corner to activate parent mode
  const handleCornerTap = () => {
    // Clear any existing timeout
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current)
    }
    
    // Increment tap count
    setTapCount(prevCount => prevCount + 1)
    
    // Set timeout to reset tap count if not tapped quickly enough
    tapTimeout.current = setTimeout(() => {
      setTapCount(0)
    }, 2000) // Reset after 2 seconds of inactivity
    
    // Check if we've reached 5 taps to activate pin modal
    if (tapCount === 4) { // 4 + 1 = 5 taps
      setShowPinModal(true)
      setTapCount(0)
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current)
      }
    }
  }
  
  // Handle PIN verification
  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pinInput === parentPin) {
      setParentModeActive(true)
      setShowPinModal(false)
      setPinInput('')
    } else {
      // Show error animation or message
      setPinInput('')
    }
  }
  
  // Handle exiting parent mode
  const handleExitParentMode = () => {
    setParentModeActive(false)
  }

  return (
    <div className="min-h-screen cloud-scene">
      {/* Cloud Background Image */}
      <div className="cloud-bg"></div>
      
      {/* Hidden corner tap area for parent mode */}
      <div 
        className="absolute top-0 right-0 w-16 h-16 z-50 opacity-0" 
        onClick={handleCornerTap}
        aria-hidden="true"
      ></div>
      
      {/* Parent Mode Overlay - Only visible when activated */}
      <AnimatePresence>
        {parentModeActive && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-xl p-5 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-earlymind-teal">Parent Controls</h2>
                <button 
                  onClick={handleExitParentMode}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-earlymind-teal text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <Home className="h-5 w-5" />
                  <span>Return to Dashboard</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>End Session & Logout</span>
                </button>
                
                <div className="border-t pt-3 text-center text-sm text-gray-500 mt-2">
                  <p>Milo session in progress</p>
                  <p>Child will not see this control panel</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* PIN Entry Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-xl p-5 max-w-xs w-full mx-4 shadow-xl"
            >
              <h3 className="text-center font-bold mb-4 text-earlymind-teal">Parent Access</h3>
              <p className="text-sm text-center mb-4 text-gray-600">Please enter your PIN to access parent controls</p>
              
              <form onSubmit={handlePinSubmit}>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 text-center tracking-widest"
                  placeholder="• • • •"
                  maxLength={4}
                  autoFocus
                />
                
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="bg-earlymind-teal text-white px-8 py-2 rounded-full flex items-center"
                    disabled={pinInput.length !== 4}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Verify
                  </button>
                </div>
              </form>
              
              <button 
                onClick={() => setShowPinModal(false)}
                className="mt-3 text-sm text-gray-500 w-full text-center"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pt-10 pb-24 md:pt-12 md:pb-8 flex flex-col md:flex-row md:items-start md:justify-start relative z-10">
        {/* Parent Mode Indicator - Only visible when active */}
        {parentModeActive && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-earlymind-teal text-white text-xs px-3 py-1 rounded-b-md z-50 shadow-md">
            Parent Mode Active
          </div>
        )}
        
        {/* Cloud-Shaped Container - Desktop Only */}
        <div className="hidden md:block cloud-container w-full max-w-md mb-4 p-6 h-80 overflow-hidden relative mx-0 ml-8">
          {/* Cloud puffs to create the cloud shape */}
          <div className="cloud-puff cloud-puff-left-top"></div>
          <div className="cloud-puff cloud-puff-left-middle"></div>
          <div className="cloud-puff cloud-puff-left-bottom"></div>
          
          <div className="cloud-puff cloud-puff-right-top"></div>
          <div className="cloud-puff cloud-puff-right-middle"></div>
          <div className="cloud-puff cloud-puff-right-bottom"></div>
          
          <div className="cloud-puff cloud-puff-bottom-left"></div>
          <div className="cloud-puff cloud-puff-bottom-right"></div>
          
          {/* Conversation content area - Desktop only */}
          <div className="cloud-content overflow-y-auto h-full pb-2 px-1">
            <div className="space-y-6 relative z-10">
              {conversation.map((item, index) => (
                <div key={index} className={`flex ${item.speaker === 'milo' ? 'justify-start' : 'justify-end'}`}>
                  {item.speaker === 'milo' ? (
                    /* Milo's enhanced cloud speech bubble */
                    <div className="relative max-w-[80%]">
                      <div className="cloud-bubble bg-earlymind-yellow p-4 text-black border-2 border-yellow-300">
                        <p className="font-medium text-base">{item.message}</p>
                      </div>
                      {/* Enhanced cloud puffs at bottom to create cloud shape */}
                      <div className="absolute -bottom-1 left-3 w-5 h-5 bg-earlymind-yellow rounded-full border-2 border-yellow-300"></div>
                      <div className="absolute -bottom-2 left-8 w-4 h-4 bg-earlymind-yellow rounded-full border-2 border-yellow-300"></div>
                      <div className="absolute -bottom-1 left-12 w-6 h-6 bg-earlymind-yellow rounded-full border-2 border-yellow-300"></div>
                      
                      {/* Small tail */}
                      <div className="absolute -left-1 bottom-2 w-3 h-3 bg-earlymind-yellow rounded-full border-2 border-yellow-300"></div>
                    </div>
                  ) : (
                    /* Child's enhanced cloud speech bubble */
                    <div className="relative max-w-[80%]">
                      <div className="cloud-bubble bg-earlymind-teal p-4 text-white border-2 border-teal-300">
                        <p className="font-medium text-base">{item.message}</p>
                      </div>
                      {/* Enhanced cloud puffs at bottom to create cloud shape */}
                      <div className="absolute -bottom-1 right-3 w-5 h-5 bg-earlymind-teal rounded-full border-2 border-teal-300"></div>
                      <div className="absolute -bottom-2 right-8 w-4 h-4 bg-earlymind-teal rounded-full border-2 border-teal-300"></div>
                      <div className="absolute -bottom-1 right-12 w-6 h-6 bg-earlymind-teal rounded-full border-2 border-teal-300"></div>
                      
                      {/* Small tail */}
                      <div className="absolute -right-1 bottom-2 w-3 h-3 bg-earlymind-teal rounded-full border-2 border-teal-300"></div>
                    </div>
                  )}
                </div>
              ))}
              {/* Empty div for auto-scrolling to the bottom of the conversation */}
              <div ref={conversationEndRef} />
            </div>
          </div>
        </div>

        {/* Character Placeholder - Mobile: Centered, Desktop: Right side of cloud */}
        <div className="relative mb-6 self-center md:self-start md:ml-28 md:flex md:flex-col md:items-center">
          {/* Circle background for character with animation */}
          <div className="w-44 h-44 md:w-64 md:h-64 rounded-full bg-earlymind-teal-lighter flex items-center justify-center">
            <div className="w-36 h-36 md:w-52 md:h-52 bg-earlymind-yellow rounded-full flex items-center justify-center relative overflow-hidden milo-character">
              {/* Placeholder for character - to be replaced with actual character */}
              <div className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">Milo</div>
              
              {/* Bouncing animation when speaking */}
              {isListening && (
                <motion.div 
                  className="absolute bottom-0 w-full h-1/3 bg-earlymind-teal-light opacity-30"
                  animate={{ 
                    height: ["33%", "50%", "33%"],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>
          </div>
          
          {/* Desktop: Microphone Button and text directly below character */}
          <div className="hidden md:block mt-6 flex-col items-center">
            <motion.button
              onClick={handleMicClick}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                isListening ? 'bg-red-500' : 'bg-earlymind-teal'
              }`}
            >
              <div className="absolute inset-0 rounded-full bg-white opacity-20"></div>
              {isListening ? (
                <MicOff className="h-10 w-10 text-white" />
              ) : (
                <Mic className="h-10 w-10 text-white" />
              )}
              
              {/* Ripple effect when active */}
              {isListening && (
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-red-500"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [1, 0, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.button>
            
            {/* Desktop: Text Label below mic */}
            <p className="mt-3 font-medium text-lg text-earlymind-teal-dark">
              {isListening ? 'Listening...' : 'Talk to Milo'}
            </p>
          </div>
        </div>

        {/* Mobile only: Microphone Button */}
        <div className="md:hidden flex flex-col items-center">
          <motion.button
            onClick={handleMicClick}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg mx-auto ${
              isListening ? 'bg-red-500' : 'bg-earlymind-teal'
            }`}
          >
            <div className="absolute inset-0 rounded-full bg-white opacity-20"></div>
            {isListening ? (
              <MicOff className="h-8 w-8 text-white" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
            
            {/* Ripple effect when active */}
            {isListening && (
              <motion.div 
                className="absolute inset-0 rounded-full border-4 border-red-500"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [1, 0, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.button>
          
          {/* Mobile: Text Label */}
          <p className="mt-2 font-medium text-base text-earlymind-teal-dark">
            {isListening ? 'Listening...' : 'Talk to Milo'}
          </p>
        </div>
      </div>

      {/* No mobile footer navigation in child mode */}
    </div>
  )
}

export default ChildSession