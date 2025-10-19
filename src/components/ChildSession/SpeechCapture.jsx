import React, { useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import MiloAvatar from "./MiloAvatar";

const SpeechCapture = () => {
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [synthesizer, setSynthesizer] = useState(null);
  // Debounce timers to better align animation with audible audio
  const speakingStartTimerRef = useRef(null);
  const speakingEndTimerRef = useRef(null);

  // Azure Speech Service configuration
  const subscriptionKey = import.meta.env.VITE_SPEECH_KEY;
  const serviceRegion = import.meta.env.VITE_SPEECH_REGION;

  // Text-to-Speech function using Ana voice
  const speakText = async (textToSpeak) => {
    if (!textToSpeak.trim()) return;
    
    try {
      console.log("Starting TTS for:", textToSpeak);
      
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        subscriptionKey,
        serviceRegion
      );
      
      // Set voice to Ana
      speechConfig.speechSynthesisVoiceName = "en-US-AnaNeural";
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
      const newSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
      
      setSynthesizer(newSynthesizer);

      return new Promise((resolve, reject) => {
        // Clear any previous timers
        if (speakingStartTimerRef.current) {
          clearTimeout(speakingStartTimerRef.current);
          speakingStartTimerRef.current = null;
        }
        if (speakingEndTimerRef.current) {
          clearTimeout(speakingEndTimerRef.current);
          speakingEndTimerRef.current = null;
        }

        // Event listener for when audio begins (device receives first buffer)
        newSynthesizer.synthesisStarted = () => {
          console.log("Audio started (synthesisStarted)");
          // Small delay to line up with audible start on some devices
          speakingStartTimerRef.current = setTimeout(() => {
            setIsSpeaking(true);
          }, 120);
        };

        // Event listener for when audio fully queued to device
        newSynthesizer.synthesisCompleted = () => {
          console.log("Audio completed (synthesisCompleted)");
          // Grace window to allow device buffer to fully drain
          speakingEndTimerRef.current = setTimeout(() => {
            setIsSpeaking(false);
          }, 320);
        };

        // Ensure we also stop on cancel
        newSynthesizer.synthesisCanceled = () => {
          console.log("Audio canceled (synthesisCanceled)");
          if (speakingStartTimerRef.current) {
            clearTimeout(speakingStartTimerRef.current);
            speakingStartTimerRef.current = null;
          }
          if (speakingEndTimerRef.current) {
            clearTimeout(speakingEndTimerRef.current);
            speakingEndTimerRef.current = null;
          }
          setIsSpeaking(false);
        };

        newSynthesizer.speakTextAsync(
          textToSpeak,
          (result) => {
            console.log("TTS synthesis finished");
            // Let synthesisCompleted timer handle isSpeaking=false
            try {
              newSynthesizer.close();
            } catch (err) {
              console.log("Synthesizer cleanup:", err);
            }
            setSynthesizer(null);
            resolve(result);
          },
          (error) => {
            console.error("TTS synthesis failed:", error);
            // On error ensure timers cleared and speaking state reset
            if (speakingStartTimerRef.current) {
              clearTimeout(speakingStartTimerRef.current);
              speakingStartTimerRef.current = null;
            }
            if (speakingEndTimerRef.current) {
              clearTimeout(speakingEndTimerRef.current);
              speakingEndTimerRef.current = null;
            }
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
      // Ensure timers cleared on init error
      if (speakingStartTimerRef.current) {
        clearTimeout(speakingStartTimerRef.current);
        speakingStartTimerRef.current = null;
      }
      if (speakingEndTimerRef.current) {
        clearTimeout(speakingEndTimerRef.current);
        speakingEndTimerRef.current = null;
      }
      setIsSpeaking(false);
      setError(`TTS error: ${err.message}`);
    }
  };

  // Stop speaking function
  const stopSpeaking = () => {
    if (synthesizer) {
      try {
        synthesizer.close();
      } catch (err) {
        console.log("Synthesizer already disposed:", err);
      }
      setSynthesizer(null);
    }
    // Clear any pending timers and reset state
    if (speakingStartTimerRef.current) {
      clearTimeout(speakingStartTimerRef.current);
      speakingStartTimerRef.current = null;
    }
    if (speakingEndTimerRef.current) {
      clearTimeout(speakingEndTimerRef.current);
      speakingEndTimerRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Function to send prompt to backend
  const sendToBackend = async (prompt) => {
    setLoadingResponse(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/ask-milo`, {
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
      
      console.log("Milo response:", data.reply);
      
      // Speak the response immediately using TTS
      speakText(data.reply);
    } catch (err) {
      console.error("Backend API error:", err);
      setError(`Backend error: ${err.message}`);
    } finally {
      setLoadingResponse(false);
    }
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
          
          // Send to backend
          sendToBackend(e.result.text);
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
        // Don't close here - let the cleanup handle it
      };

      newRecognizer.sessionStopped = () => {
        console.log("Session stopped event.");
        setIsListening(false);
        setIsRecording(false);
        // Don't close here - let the cleanup handle it
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
  };

  // Cleanup on unmount
  React.useEffect(() => {
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

  const clearText = () => {
    setError("");
    setConversationHistory([]);
    stopSpeaking(); // Also stop any ongoing speech
  };

  return (
    <div className="min-h-screen bg-gradient-to-br bg-yellow-500 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Milo Avatar */}
        <div className="mb-2">
          <MiloAvatar 
            isListening={isListening && !isRecording && !isSpeaking && !loadingResponse}
            isThinking={loadingResponse}
            isSpeaking={isSpeaking}
            isRecording={isRecording}
            className="animate-in fade-in-50 duration-500"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4 mb-2">
          {/* Main Conversation Button */}
          <div 
            className={`button w-16 h-16 rounded-lg cursor-pointer select-none transition-all duration-150 ${
              isListening
                ? "bg-red-500 active:translate-y-2 active:[box-shadow:0_0px_0_0_#dc2626,0_0px_0_0_#dc262641] active:border-b-[0px] [box-shadow:0_10px_0_0_#dc2626,0_15px_0_0_#dc262641] border-b-[1px] border-red-400"
                : loadingResponse
                ? "bg-gray-400 cursor-not-allowed [box-shadow:0_5px_0_0_#9ca3af,0_8px_0_0_#9ca3af41] border-b-[1px] border-gray-500"
                : "bg-blue-500 active:translate-y-2 active:[box-shadow:0_0px_0_0_#1b6ff8,0_0px_0_0_#1b70f841] active:border-b-[0px] [box-shadow:0_10px_0_0_#1b6ff8,0_15px_0_0_#1b70f841] border-b-[1px] border-blue-400"
            }`}
            onClick={loadingResponse ? undefined : startContinuousListening}
          >
            <span className="flex flex-col justify-center items-center h-full text-white font-bold text-2xl">
              {isListening ? (
                // Stop icon
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : loadingResponse ? (
                // Loading spinner
                <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                // Play icon
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              )}
            </span>
          </div>
          
          {/* Stop Speaking Button */}
          {isSpeaking && (
            <div
              className="button w-16 h-16 rounded-lg cursor-pointer select-none transition-all duration-150 bg-orange-500 active:translate-y-2 active:[box-shadow:0_0px_0_0_#ea580c,0_0px_0_0_#ea580c41] active:border-b-[0px] [box-shadow:0_10px_0_0_#ea580c,0_15px_0_0_#ea580c41] border-b-[1px] border-orange-400"
              onClick={stopSpeaking}
            >
              <span className="flex flex-col justify-center items-center h-full text-white font-bold text-2xl">
                {/* Mute/Stop speaking icon */}
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              </span>
            </div>
          )}
          
          {/* Clear/New Chat Button */}
          {conversationHistory.length > 0 && !isListening && (
            <div
              className="button w-16 h-16 rounded-lg cursor-pointer select-none transition-all duration-150 bg-gray-500 active:translate-y-2 active:[box-shadow:0_0px_0_0_#6b7280,0_0px_0_0_#6b728041] active:border-b-[0px] [box-shadow:0_10px_0_0_#6b7280,0_15px_0_0_#6b728041] border-b-[1px] border-gray-400"
              onClick={clearText}
            >
              <span className="flex flex-col justify-center items-center h-full text-white font-bold text-2xl">
                {/* Refresh/New chat icon */}
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
              </span>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-4 mb-4 text-center shadow-lg">
            <p className="text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechCapture;