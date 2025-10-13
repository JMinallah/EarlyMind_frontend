import React, { useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';

const Conversation = ({ messages = [] }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {messages.map((msg, index) => (
        <ChatBubble 
          key={index} 
          message={msg.text} 
          isMilo={msg.sender === 'milo'}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Conversation;