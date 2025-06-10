import React from 'react';
import { Message } from '../../types/chat';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(timestamp);
  };

  const renderMessageContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < content.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
  };

  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-header">
        <div className="message-sender">
          {message.role === 'user' ? (
            <span className="user-icon">👤</span>
          ) : (
            <span className="agent-icon">🤖</span>
          )}
          <span className="sender-name">
            {message.role === 'user' ? 'You' : message.agentType || 'OneAgent'}
          </span>
        </div>
        <div className="message-timestamp">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
      
      <div className="message-content">
        {renderMessageContent(message.content)}
      </div>

      {message.memoryContext && (
        <div className="message-memory-context">
          <div className="memory-indicator">
            🧠 Memory Context: {message.memoryContext.relevantMemories} memories
          </div>
        </div>
      )}

      {message.error && (
        <div className="message-error">
          ⚠️ Error: {message.error}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
