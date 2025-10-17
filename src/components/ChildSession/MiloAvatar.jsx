import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Lottie from 'lottie-react';
import miloIdleAnimation from '../../assets/MIlo-idle.json';
import miloThinkingAnimation from '../../assets/MIlo-thinking.json';
import miloTalkingAnimation from '../../assets/Milo-talking.json';

const MiloAvatar = ({ 
  isListening = false, 
  isThinking = false, 
  isSpeaking = false, 
  isRecording = false,
  className = "" 
}) => {
  
  // Determine the animation URL and styling
  const getAnimationProps = () => {
    if (isRecording) {
      return {
        animationUrl: "https://lottie.host/4e729bc5-52ba-490a-bff9-9f6c75dcf43f/btOKUgHtIJ.lottie",
        className: "animate-pulse scale-150",
        statusText: "🎤 Listening to you...",
        statusColor: "text-red-600",
        useLocalJson: false
      };
    }
    
    if (isThinking) {
      return {
        animationData: miloThinkingAnimation,
        className: "scale-125",
        statusText: "💭 Thinking...",
        statusColor: "text-blue-600",
        useLocalJson: true
      };
    }
    
    if (isSpeaking) {
      return {
        animationData: miloTalkingAnimation,
        className: "animate-pulse scale-140",
        statusText: "🗣️ Speaking...",
        statusColor: "text-purple-600",
        useLocalJson: true
      };
    }
    
    if (isListening) {
      return {
        animationUrl: "https://lottie.host/4e729bc5-52ba-490a-bff9-9f6c75dcf43f/btOKUgHtIJ.lottie",
        className: "scale-125",
        statusText: "👂 Ready to listen...",
        statusColor: "text-green-600",
        useLocalJson: false
      };
    }
    
    // Default idle state - use local JSON file
    return {
      animationData: miloIdleAnimation,
      className: "scale-125", // Make it even bigger by default
      statusText: "😊 Hi! I'm Milo",
      statusColor: "text-gray-600",
      useLocalJson: true
    };
  };

  const animationProps = getAnimationProps();

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Container - Clean, no background effects */}
      <div className="relative h-[28rem] flex justify-center align-middle overflow-hidden">
        {/* Main Lottie Animation */}
        <div className={`w-[48rem] h-[48rem] -mt-80 md:w-[56rem] md:h-[56rem] lg:w-[64rem] lg:h-[64rem] transition-all duration-300 ${animationProps.className}`}>
          {animationProps.useLocalJson ? (
            <Lottie
              animationData={animationProps.animationData}
              loop={true}
              autoplay={true}
              className="w-full h-full"
              style={{
                filter: 'contrast(1.1) saturate(1.2)', // Enhance clarity
                imageRendering: 'crisp-edges' // Better rendering for animations
              }}
            />
          ) : (
            <DotLottieReact
              src={animationProps.animationUrl}
              loop
              autoplay
              className="w-full h-full"
              style={{
                filter: 'contrast(1.1) saturate(1.2)', // Enhance clarity
                imageRendering: 'crisp-edges' // Better rendering for animations
              }}
            />
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className={`text-center transition-all duration-300 ${animationProps.statusColor}`}>
        <p className="font-medium">{animationProps.statusText}</p>
      </div>
    </div>
  );
};

export default MiloAvatar;