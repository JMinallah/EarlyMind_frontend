import React from 'react';
import './cloud-bubble.css';

const ChatBubble = ({ message, isMilo = false }) => {
  return (
    <div className={`cloud-bubble p-3 mb-2 ${
      isMilo 
        ? 'milo-cloud bg-yellow-200 border-yellow-300 border-2 self-start' 
        : 'child-cloud bg-teal-200 border-teal-300 border-2 self-end'
    }`}>
      <p className="text-gray-800">{message}</p>
    </div>
  );
};

export default ChatBubble;