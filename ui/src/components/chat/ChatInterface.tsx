import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { useChat } from '../../hooks/useChat';
import { useWebSocketChat } from '../../hooks/useWebSocketChat';
import './ChatInterface.css';

interface ChatInterfaceProps {
  userId?: string;
  agentType?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  userId = 'default-user', 
  agentType = 'general' 
}) => {
  const {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    isConnected
  } = useChat(userId, agentType);

  const { connectionStatus } = useWebSocketChat();

  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async (message: string) => {
    if (message.trim()) {
      await sendMessage(message);
      setInputValue('');
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearMessages();
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>OneAgent Chat</h3>
        <div className="chat-controls">
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢' : '🔴'} {connectionStatus}
          </div>
          <button 
            onClick={handleClearChat}
            className="clear-button"
            title="Clear chat history"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="chat-container">
        <MessageList messages={messages} />
        {isTyping && <TypingIndicator />}
      </div>

      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        disabled={!isConnected || isTyping}
        placeholder="Ask OneAgent anything..."
      />
    </div>
  );
};

export default ChatInterface;
