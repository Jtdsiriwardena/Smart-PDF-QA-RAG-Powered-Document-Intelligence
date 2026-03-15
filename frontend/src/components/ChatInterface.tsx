import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { MessageList } from './MessageList';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>;
  messages: Message[];
  disabled?: boolean;
  placeholder?: string;
  currentDocument?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  messages,
  disabled = false,
  placeholder = "Ask a question about your PDF...",
  currentDocument
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input when enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    
    const message = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      await onSendMessage(message);
    } finally {
      setIsLoading(false);
      // Refocus input after sending
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Handle paste events if needed
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Chat Header */}
      <div className="bg-linear-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Chat Assistant</h3>
            {currentDocument ? (
              <p className="text-xs text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Currently viewing: <span className="font-medium text-gray-700 ml-1 truncate max-w-50">{currentDocument}</span>
              </p>
            ) : (
              <p className="text-xs text-amber-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                No document selected
              </p>
            )}
          </div>
        </div>
        
        {/* Message count badge */}
        {messages.length > 0 && (
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-linear-to-b from-gray-50 to-white scroll-smooth"
           style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              {/* Animated icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-linear-to-r from-transparent via-blue-400 to-transparent rounded-full animate-pulse"></div>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready to help!</h4>
              <p className="text-sm text-gray-500 mb-4">
                {disabled 
                  ? "Upload a PDF or select a document to start asking questions."
                  : "Ask me anything about your document. I'll find the relevant information and provide answers with sources."}
              </p>
              
              {/* Example questions */}
              {!disabled && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Try asking:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "What is this document about?",
                      "Summarize the main points",
                      "Find key takeaways"
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(example)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-gray-400 mt-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="text-xs ml-1">Assistant is typing</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <form onSubmit={handleSubmit} className="relative">
          {/* Input field with gradient border on focus */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur"></div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={disabled ? "📁 Upload a document to start chatting" : placeholder}
              disabled={disabled || isLoading}
              className={`
                relative w-full px-5 py-4 bg-white border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200
                placeholder:text-gray-400
                disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
                pr-24
                ${disabled 
                  ? 'border-gray-200' 
                  : 'border-gray-300 hover:border-blue-400'
                }
              `}
            />
            
            {/* Character count (optional) */}
            {input.length > 0 && (
              <div className="absolute right-24 top-1/2 transform -translate-y-1/2">
                <span className={`text-xs ${input.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                  {input.length}/500
                </span>
              </div>
            )}
            
            {/* Send button */}
            <button
              type="submit"
              disabled={disabled || isLoading || !input.trim()}
              className={`
                absolute right-2 top-1/2 transform -translate-y-1/2
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                flex items-center space-x-2
                ${disabled || isLoading || !input.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Sending</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
          
          {/* Input footer with hints */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>↵ Enter to send</span>
              {currentDocument && (
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                  Context: {currentDocument.split('.')[0]}
                </span>
              )}
            </div>
            <div>
              {!disabled && input.length === 0 && (
                <span className="animate-pulse">✨ Ask anything...</span>
              )}
            </div>
          </div>
        </form>
      </div>
      
      {/* Quick action buttons (when no messages) */}
      {messages.length === 0 && !disabled && (
        <div className="px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { icon: '📝', text: 'Summarize' },
            { icon: '🔑', text: 'Key points' },
            { icon: '📊', text: 'Data' },
            { icon: '❓', text: 'Explain' },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(action.text)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap transition-colors"
            >
              <span>{action.icon}</span>
              <span>{action.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};