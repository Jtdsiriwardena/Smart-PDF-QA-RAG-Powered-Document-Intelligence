import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';
import { SourceCard } from './SourceCard';

interface MessageListProps {
    messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Auto-scroll to new messages with smooth behavior
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const lastMessageElement = messageRefs.current.get(lastMessage.id);
            if (lastMessageElement) {
                lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [messages]);

    // Helper to format timestamp
    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        
        // Check if it's today
        if (messageDate.toDateString() === now.toDateString()) {
            return messageDate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        // Check if it's yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (messageDate.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${messageDate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            })}`;
        }
        
        // Otherwise show full date
        return messageDate.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="space-y-6 p-4">
            {messages.map((message, index) => {
                const isUser = message.type === 'user';
                const showAvatar = index === 0 || messages[index - 1]?.type !== message.type;
                
                return (
                    <div
                        key={message.id}
                        ref={(el) => {
                            if (el) messageRefs.current.set(message.id, el);
                            else messageRefs.current.delete(message.id);
                        }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
                    >
                        <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                            {/* Message bubble */}
                            <div className="flex items-start gap-2">
                                {/* Assistant avatar */}
                                {!isUser && showAvatar && (
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Message content */}
                                <div className="flex-1">
                                    {/* Sender name */}
                                    {!isUser && showAvatar && (
                                        <p className="text-xs font-medium text-gray-600 ml-1 mb-1">AI Assistant</p>
                                    )}
                                    
                                    {/* Message bubble with animations */}
                                    <div
                                        className={`
                                            relative rounded-2xl p-4 shadow-sm transition-all duration-200
                                            ${isUser 
                                                ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-br-none hover:shadow-md' 
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none hover:shadow-md'
                                            }
                                        `}
                                    >
                                        {/* Tail effect */}
                                        <div
                                            className={`
                                                absolute bottom-0 w-4 h-4 
                                                ${isUser 
                                                    ? 'right-0 translate-x-1/4 translate-y-1/4 rotate-45 bg-blue-700' 
                                                    : 'left-0 -translate-x-1/4 translate-y-1/4 rotate-45 bg-white border-l border-b border-gray-200'
                                                }
                                            `}
                                            style={{
                                                display: showAvatar ? 'block' : 'none'
                                            }}
                                        ></div>

                                        {/* Message text */}
                                        {isUser ? (
                                            <p className="text-sm whitespace-pre-wrap wrap-break-word">
                                                {message.content}
                                            </p>
                                        ) : (
                                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-gray-800">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ children }) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
                                                        a: ({ href, children }) => (
                                                            <a href={href} target="_blank" rel="noopener noreferrer" 
                                                               className="text-blue-600 hover:text-blue-800 underline">
                                                                {children}
                                                            </a>
                                                        ),
                                                        code: ({ inline, children }) => (
                                                            inline 
                                                                ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                                                                : <code className="block bg-gray-100 p-2 rounded-lg text-sm font-mono overflow-x-auto">{children}</code>
                                                        ),
                                                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                                        li: ({ children }) => <li className="text-sm mb-1">{children}</li>,
                                                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-md font-bold mb-2">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}

                                        {/* Timestamp inside bubble (hover effect) */}
                                        <div className={`
                                            absolute bottom-1 right-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity
                                            ${isUser ? 'text-blue-100' : 'text-gray-400'}
                                        `}>
                                            {formatTimestamp(message.timestamp)}
                                        </div>
                                    </div>

                                    {/* Sources for assistant messages */}
                                    {message.type === 'assistant' && message.sources && message.sources.length > 0 && (
                                        <div className="mt-3 space-y-2 animate-fadeIn">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-px flex-1 bg-linear-to-r from-transparent to-gray-300"></div>
                                                <p className="text-xs font-medium text-gray-500 flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                    {message.sources.length} Source{message.sources.length > 1 ? 's' : ''}
                                                </p>
                                                <div className="h-px flex-1 bg-linear-to-l from-transparent to-gray-300"></div>
                                            </div>
                                            <div className="grid gap-2">
                                                {message.sources.map((source, idx) => (
                                                    <SourceCard key={idx} source={source} index={idx} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Message status indicators */}
                                    {index === messages.length - 1 && message.type === 'assistant' && (
                                        <div className="flex items-center space-x-1 mt-1 ml-1">
                                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] text-gray-400">Delivered</span>
                                        </div>
                                    )}
                                </div>

                                {/* User avatar */}
                                {isUser && showAvatar && (
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 bg-linear-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-md">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};