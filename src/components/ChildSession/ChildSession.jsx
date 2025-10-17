import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, LogOut, Home, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import MiloAvatar from './MiloAvatar'
import ChatBubble from './ChatBubble'

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
  
  // Milo Avatar state
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [loadingResponse, setLoadingResponse] = useState(false)
  const [error, setError] = useState('')
  const [conversationHistory, setConversationHistory] = useState([])
  const [testMessage, setTestMessage] = useState('')
  
  const parentPin = '1234'
  const tapTimeout = useRef(null)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const conversationEndRef = useRef(null)

  // Auto-scroll to the bottom when conversation changes
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Function to send prompt to backend
  const sendToBackend = async (prompt) => {
    setLoadingResponse(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/ask-milo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add to conversation history
      setConversationHistory(prev => [
        ...prev,
        { type: 'user', text: prompt, timestamp: new Date() },
        { type: 'assistant', text: data.reply, timestamp: new Date() }
      ]);
      
      // Add Milo's response to conversation display
      setConversation(prev => [...prev, { 
        speaker: 'milo', 
        message: data.reply 
      }])
      
      console.log("Milo response:", data.reply);
      
      return data.reply;
    } catch (err) {
      console.error("Backend API error:", err);
      setError(`Backend error: ${err.message}`);
      
      // Add error message to conversation
      setConversation(prev => [...prev, { 
        speaker: 'milo', 
        message: "I'm sorry, I'm having trouble connecting right now. Could you try again?" 
      }])
      
      throw err;
    } finally {
      setLoadingResponse(false);
    }
  };

  const handleMicClick = async () => {
    // Toggle listening state
    setIsListening(!isListening)
    
    if (!isListening) {
      // Simulate voice input for demo (in real app this would come from speech recognition)
      setIsRecording(true)
      
      // Simulate processing time
      setTimeout(async () => {
        setIsRecording(false)
        setIsThinking(true)
        
        // Simulate different user messages for demo
        const demoMessages = [
          "I'm feeling happy today!",
          "Can you tell me a story?",
          "I want to play a game!",
          "I had a good day at school",
          "I'm excited about my birthday",
          "Can we talk about animals?"
        ]
        const userMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)]
        
        // Add user message to conversation
        setConversation(prev => [...prev, { 
          speaker: 'child', 
          message: userMessage 
        }])

        try {
          // Get response from backend
          await sendToBackend(userMessage)

          // Set Milo to speaking state
          setIsThinking(false)
          setIsSpeaking(true)
          
          // Simulate speaking time
          setTimeout(() => {
            setIsSpeaking(false)
            setIsListening(false)
          }, 3000)

        } catch (error) {
          console.error('Error getting response:', error)
          setIsThinking(false)
          setIsListening(false)
        }
      }, 2000)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  const handleCornerTap = () => {
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current)
    }
    
    setTapCount(prevCount => prevCount + 1)
    
    tapTimeout.current = setTimeout(() => {
      setTapCount(0)
    }, 2000)
    
    if (tapCount === 4) {
      setShowPinModal(true)
      setTapCount(0)
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current)
      }
    }
  }
  
  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pinInput === parentPin) {
      setParentModeActive(true)
      setShowPinModal(false)
      setPinInput('')
    } else {
      setPinInput('')
    }
  }
  
  const handleExitParentMode = () => {
    setParentModeActive(false)
  }

  const handleTestMessage = async (e) => {
    e.preventDefault()
    if (!testMessage.trim()) return

    setIsThinking(true)
    
    // Add user message to conversation
    setConversation(prev => [...prev, { 
      speaker: 'child', 
      message: testMessage 
    }])

    try {
      await sendToBackend(testMessage)
      setIsSpeaking(true)
      
      setTimeout(() => {
        setIsSpeaking(false)
      }, 3000)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsThinking(false)
      setTestMessage('')
    }
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
      
      {/* Parent Mode Overlay */}
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

      {/* Mobile Chat Container - Full Width */}
      <div className="md:hidden w-full px-4 pt-4 pb-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 min-h-80 max-h-96 overflow-y-auto mx-auto max-w-4xl">
          <div className="space-y-4">
            {conversation.map((item, index) => (
              <div key={index} className={`flex w-full ${item.speaker === 'milo' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[92%] min-w-[200px] p-4 rounded-2xl shadow-sm ${
                  item.speaker === 'milo' 
                    ? 'bg-yellow-100 border-2 border-yellow-300 text-gray-800' 
                    : 'bg-teal-100 border-2 border-teal-300 text-gray-800'
                }`}>
                  <p className="text-base leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))}
            {loadingResponse && (
              <div className="flex justify-start">
                <div className="bg-yellow-100 rounded-2xl px-4 py-3 text-gray-600 border-2 border-yellow-300">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">🤔</div>
                    <span>Milo is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-100 rounded-2xl px-4 py-3 text-red-600 text-sm border-2 border-red-300">
                  {error}
                </div>
              </div>
            )}
            <div ref={conversationEndRef} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-4 pt-4 md:pt-10 pb-24 md:pb-8 flex flex-col md:flex-row md:items-start md:justify-start relative z-10">
        {/* Parent Mode Indicator */}
        {parentModeActive && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-earlymind-teal text-white text-xs px-3 py-1 rounded-b-md z-50 shadow-md">
            Parent Mode Active
          </div>
        )}
        
  {/* Cloud-Shaped Container - Desktop Only */}
  <div className="hidden md:block cloud-container md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mb-4 p-6 md:h-[28rem] lg:h-[32rem] overflow-hidden relative mx-0 ml-8">
          {/* Cloud puffs */}
          <div className="cloud-puff cloud-puff-left-top"></div>
          <div className="cloud-puff cloud-puff-left-middle"></div>
          <div className="cloud-puff cloud-puff-left-bottom"></div>
          <div className="cloud-puff cloud-puff-right-top"></div>
          <div className="cloud-puff cloud-puff-right-middle"></div>
          <div className="cloud-puff cloud-puff-right-bottom"></div>
          <div className="cloud-puff cloud-puff-bottom-left"></div>
          <div className="cloud-puff cloud-puff-bottom-right"></div>
          
          {/* Conversation content area */}
          <div className="cloud-content overflow-y-auto h-full pb-2 px-1">
            <div className="space-y-6 relative z-10">
              {conversation.map((item, index) => (
                <ChatBubble
                  key={index}
                  message={item.message}
                  isMilo={item.speaker === 'milo'}
                />
              ))}
              {loadingResponse && (
                <div className="flex justify-start">
                  <div className="bg-yellow-100 rounded-2xl px-4 py-2 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">🤔</div>
                      <span>Milo is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-100 rounded-2xl px-4 py-2 text-red-600 text-sm">
                    {error}
                  </div>
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>
          </div>
        </div>

        {/* Milo Avatar */}
        <div className="  w-96 relative mb-6 self-center md:self-start md:ml-28 md:flex md:flex-col md:items-center">
          <MiloAvatar
            isListening={isListening}
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            isRecording={isRecording}
            className="scale-75 md:scale-100"
          />
          
          {/* Desktop: Microphone Button */}
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
          
          <p className="mt-2 font-medium text-base text-earlymind-teal-dark">
            {isListening ? 'Listening...' : 'Talk to Milo'}
          </p>
        </div>
      </div>

      {/* Test Message Input - Development Only */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-xl p-4 border-2 border-gray-200 z-50">
        <form onSubmit={handleTestMessage} className="space-y-3">
          <label className="text-sm text-gray-700 font-medium block">Test Backend API:</label>
          <div className="flex space-x-3">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type a message to test..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-earlymind-teal focus:ring-2 focus:ring-earlymind-teal/20"
              disabled={loadingResponse}
            />
            <button
              type="submit"
              disabled={!testMessage.trim() || loadingResponse}
              className="px-6 py-3 bg-earlymind-teal text-white rounded-lg text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-earlymind-teal-dark transition-colors shadow-md"
            >
              {loadingResponse ? '⏳' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChildSession