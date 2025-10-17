import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, LogOut, Home, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"
import MiloAvatar from './MiloAvatar'
import ChatBubble from './ChatBubble'
import sessionService from '../../appwrite/sessionService'

// Cloud CSS styles
import './cloud-bubble.css'
import './cloud-animations.css'
import './cloud-container.css'
import './cloud-background.css'
import './chat-scrollbar.css'

function ChildSession() {
  const { sessionId } = useParams()
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || null)
  
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
  const [testMessage, setTestMessage] = useState('')
  
  // Speech SDK state
  const [recognizer, setRecognizer] = useState(null)
  const [synthesizer, setSynthesizer] = useState(null)
  
  const parentPin = '1234'
  const tapTimeout = useRef(null)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const conversationEndRef = useRef(null)
  
  // Azure Speech Service configuration
  const subscriptionKey = import.meta.env.VITE_SPEECH_KEY
  const serviceRegion = import.meta.env.VITE_SPEECH_REGION

  // Helper function to add message to conversation and database
  const addMessage = async (speaker, message) => {
    // Add to local conversation state
    setConversation(prev => [...prev, { speaker, message }]);
    
    // Add to database if we have a session
    if (currentSessionId) {
      try {
        await sessionService.addMessage(currentSessionId, speaker, message);
      } catch (error) {
        console.error('Failed to save message to database:', error);
        // Continue anyway - we don't want to break the chat flow
      }
    }
  };

  // Auto-scroll to the bottom when conversation changes
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Load existing session messages when component mounts
  useEffect(() => {
    const loadSessionMessages = async () => {
      if (currentSessionId) {
        console.log('Loading session messages for:', currentSessionId);
        try {
          const messages = await sessionService.getSessionMessages(currentSessionId);
          console.log('Retrieved messages:', messages);
          
          if (messages && Array.isArray(messages) && messages.length > 0) {
            // Replace initial conversation with session messages
            const conversationMessages = messages.map(msg => ({
              speaker: msg.speaker,
              message: msg.content || msg.message
            }));
            console.log('Setting conversation to loaded messages:', conversationMessages);
            setConversation(conversationMessages);
          } else {
            console.log('No existing messages found, keeping default welcome message');
          }
        } catch (error) {
          console.error('Failed to load session messages:', error);
          // Keep the default welcome message if loading fails
        }
      } else {
        console.log('No currentSessionId, not loading messages');
      }
    };

    loadSessionMessages();
  }, [currentSessionId]);

  // Cleanup speech components on unmount
  useEffect(() => {
    return () => {
      if (recognizer) {
        try {
          recognizer.close();
        } catch (err) {
          console.log("Recognizer already disposed:", err);
        }
      }
      if (synthesizer) {
        try {
          synthesizer.close();
        } catch (err) {
          console.log("Synthesizer already disposed:", err);
        }
      }
    };
  }, [recognizer, synthesizer]);

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
      
      // Add Milo's response to conversation display
      await addMessage('milo', data.reply);
      
      console.log("Milo response:", data.reply);
      
      // Speak the response using TTS
      speakText(data.reply);
      
      return data.reply;
    } catch (err) {
      console.error("Backend API error:", err);
      setError(`Backend error: ${err.message}`);
      
      // Add error message to conversation
      await addMessage('milo', "I'm sorry, I'm having trouble connecting right now. Could you try again?");
      
      throw err;
    } finally {
      setLoadingResponse(false);
    }
  };

  // Simple Text-to-Speech function with character-based timing
  const speakText = async (textToSpeak) => {
    if (!textToSpeak.trim()) return;
    
    try {
      console.log("Starting TTS for:", textToSpeak);
      
      // Calculate speaking duration based on character count
      // Average speaking rate: ~300 characters per minute (faster than before)
      // Reduced timing to better match actual speech completion
      const characterCount = textToSpeak.length;
      const baseSpeed = 300; // characters per minute (increased from 200 for faster timing)
      const durationInSeconds = (characterCount / baseSpeed) * 60;
      const durationInMs = Math.max(durationInSeconds * 1000, 800); // Minimum 0.8 seconds (reduced)
      const bufferTime = Math.min(durationInMs * 0.1, 1000); // 10% buffer, max 1 second (reduced)
      const totalDuration = (durationInMs + bufferTime) * 0.6; // Scale to 60% of calculated time
      
      console.log(`Text: "${textToSpeak}"`);
      console.log(`Characters: ${characterCount}`);
      console.log(`Estimated duration: ${Math.round(totalDuration / 1000 * 10) / 10}s`);
      
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        subscriptionKey,
        serviceRegion
      );
      
      // Set voice to Ana
      speechConfig.speechSynthesisVoiceName = "en-US-AnaNeural";
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
      const newSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
      
      setSynthesizer(newSynthesizer);

      // Set speaking state immediately
      setIsSpeaking(true);

      // Set timer to stop speaking based on calculated duration
      const speakingTimer = setTimeout(() => {
        console.log("Timer ended - stopping speaking animation");
        setIsSpeaking(false);
      }, totalDuration);

      return new Promise((resolve, reject) => {
        newSynthesizer.speakTextAsync(
          textToSpeak,
          (result) => {
            console.log("TTS completed successfully");
            try {
              newSynthesizer.close();
            } catch (err) {
              console.log("Synthesizer cleanup:", err);
            }
            setSynthesizer(null);
            resolve(result);
          },
          (error) => {
            console.error("TTS failed:", error);
            clearTimeout(speakingTimer);
            setIsSpeaking(false);
            setError(`TTS error: ${error}`);
            try {
              newSynthesizer.close();
            } catch (err) {
              console.log("Synthesizer cleanup:", err);
            }
            setSynthesizer(null);
            reject(error);
          }
        );
      });
    } catch (err) {
      console.error("TTS initialization failed:", err);
      setIsSpeaking(false);
      setError(`TTS error: ${err.message}`);
    }
  };

  // Simple stop speaking function
  const stopSpeaking = () => {
    if (synthesizer) {
      try {
        synthesizer.close();
      } catch (err) {
        console.log("Synthesizer already disposed:", err);
      }
      setSynthesizer(null);
    }
    setIsSpeaking(false);
  };

  // Start continuous listening
  const startContinuousListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        subscriptionKey,
        serviceRegion
      );
      speechConfig.speechRecognitionLanguage = "en-US";

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const newRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      // Event handlers for continuous recognition
      newRecognizer.recognizing = (s, e) => {
        console.log(`RECOGNIZING: Text=${e.result.text}`);
        setIsRecording(true);
      };

      newRecognizer.recognized = (s, e) => {
        console.log(`RECOGNIZED: Text=${e.result.text}`);
        
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text.trim()) {
          setIsRecording(false);
          setIsThinking(true);
          
          // Add user message to conversation (non-blocking)
          addMessage('child', e.result.text).catch(console.error);
          
          // Send to backend
          sendToBackend(e.result.text).finally(() => {
            setIsThinking(false);
          });
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
          console.log("NOMATCH: Speech could not be recognized.");
          setIsRecording(false);
        }
      };

      newRecognizer.canceled = (s, e) => {
        console.log(`CANCELED: Reason=${e.reason}`);
        
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          setError(`Speech recognition error: ${e.errorDetails}`);
        }
        
        setIsRecording(false);
        setIsListening(false);
      };

      newRecognizer.sessionStopped = () => {
        console.log("Session stopped event.");
        setIsListening(false);
        setIsRecording(false);
      };

      // Start continuous recognition
      newRecognizer.startContinuousRecognitionAsync(
        () => {
          console.log("Continuous recognition started");
          setIsListening(true);
          setError("");
        },
        (err) => {
          console.error("Failed to start continuous recognition:", err);
          setError(`Failed to start listening: ${err}`);
          setIsListening(false);
        }
      );

      setRecognizer(newRecognizer);

    } catch (err) {
      console.error("Failed to initialize speech recognition:", err);
      setError(`Initialization error: ${err.message}`);
    }
  };

  // Stop continuous listening
  const stopListening = () => {
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log("Continuous recognition stopped");
          setIsListening(false);
          setIsRecording(false);
          try {
            recognizer.close();
          } catch (err) {
            console.log("Recognizer already disposed:", err);
          }
          setRecognizer(null);
        },
        (err) => {
          console.error("Failed to stop recognition:", err);
          setError(`Failed to stop listening: ${err}`);
          setIsListening(false);
          setIsRecording(false);
          setRecognizer(null);
        }
      );
    }
    // Also stop any ongoing speech
    stopSpeaking();
  };

  const handleMicClick = async () => {
    startContinuousListening();
  }

  const handleLogout = async () => {
    try {
      // End the session if one is active
      if (currentSessionId) {
        await sessionService.endSession(currentSessionId);
      }
      
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

    const messageToSend = testMessage.trim()
    setTestMessage('') // Clear input immediately for better UX
    setIsThinking(true)
    
    // Add user message to conversation
    await addMessage('child', messageToSend);

    try {
      await sendToBackend(messageToSend)
      // TTS will be handled by sendToBackend function
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsThinking(false)
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 min-h-80 max-h-96 overflow-y-auto mx-auto max-w-4xl chat-scrollbar">
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
          <div className="cloud-content overflow-y-auto h-full pb-2 px-1 cloud-scrollbar">
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
          
          {/* Desktop: Microphone and Control Buttons */}
          <div className="hidden md:block mt-6 flex-col items-center">
            <div className="flex gap-4 items-center justify-center">
              <motion.button
                onClick={handleMicClick}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                  isListening ? 'bg-red-500' : 'bg-earlymind-teal'
                }`}
                disabled={isSpeaking}
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
              
              {/* Stop Speaking Button - appears when Milo is speaking */}
              {isSpeaking && (
                <motion.button
                  onClick={stopSpeaking}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-orange-500"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <div className="absolute inset-0 rounded-full bg-white opacity-20"></div>
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                </motion.button>
              )}
            </div>
            
            <p className="mt-3 font-medium text-lg text-earlymind-teal-dark">
              {isSpeaking ? 'Milo is speaking...' : isListening ? 'Listening...' : 'Talk to Milo'}
            </p>
          </div>
        </div>

        {/* Mobile only: Microphone and Control Buttons */}
        <div className="md:hidden flex flex-col items-center">
          <div className="flex gap-3 items-center justify-center">
            <motion.button
              onClick={handleMicClick}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                isListening ? 'bg-red-500' : 'bg-earlymind-teal'
              }`}
              disabled={isSpeaking}
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
            
            {/* Stop Speaking Button - appears when Milo is speaking */}
            {isSpeaking && (
              <motion.button
                onClick={stopSpeaking}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-orange-500"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <div className="absolute inset-0 rounded-full bg-white opacity-20"></div>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              </motion.button>
            )}
          </div>
          
          <p className="mt-2 font-medium text-base text-earlymind-teal-dark">
            {isSpeaking ? 'Milo is speaking...' : isListening ? 'Listening...' : 'Talk to Milo'}
          </p>
        </div>
      </div>

      {/* Chat Input - Alternative to Voice */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 border border-blue-200 z-50">
        <form onSubmit={handleTestMessage} className="space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">Type your message to Milo</span>
          </div>
          <div className="flex space-x-3">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Hi Milo, how are you today?"
              className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/90 placeholder-gray-400"
              disabled={loadingResponse}
              autoComplete="off"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!testMessage.trim() || loadingResponse}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl text-sm font-medium disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {loadingResponse ? (
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center flex items-center justify-between">
            <span>💡 You can also use the microphone button to speak</span>
            <span className={`${testMessage.length > 180 ? 'text-orange-500' : 'text-gray-400'}`}>
              {testMessage.length}/200
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChildSession