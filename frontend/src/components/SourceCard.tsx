import React, { useState } from 'react';
import type { Source } from '../types';

interface SourceCardProps {
  source: Source;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const similarityPercent = (source.similarity * 100).toFixed(1);
  
  // Determine color based on similarity score
  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 0.6) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getSimilarityIcon = (score: number) => {
    if (score >= 0.8) return '🔥';
    if (score >= 0.6) return '👍';
    if (score >= 0.4) return '📌';
    return '📄';
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(source.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`
      group relative
      bg-white rounded-xl border-2 transition-all duration-300
      ${expanded 
        ? 'border-blue-300 shadow-lg scale-[1.02]' 
        : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
      }
    `}>
      {/* Header */}
      <div className="px-4 py-3 bg-linear-to-r from-gray-50 to-white border-b border-gray-100 rounded-t-xl">
        <div className="flex items-center justify-between">
          {/* Left side - Source info */}
          <div className="flex items-center space-x-3">
            {/* Source number badge */}
            <div className={`
              w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
              ${expanded ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
              transition-colors duration-300
            `}>
              {index + 1}
            </div>
            
            {/* Source label */}
            <span className="text-xs font-medium text-gray-500">
              Source {index + 1}
            </span>
            
            {/* Similarity badge */}
            <div className={`
              flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium border
              ${getSimilarityColor(parseFloat(similarityPercent) / 100)}
              transition-all duration-300 hover:scale-105
            `}>
              <span>{getSimilarityIcon(parseFloat(similarityPercent) / 100)}</span>
              <span>{similarityPercent}% match</span>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Copy button */}
            <button
              onClick={handleCopyText}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Copy text"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
            
            {/* Expand/collapse button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title={expanded ? 'Show less' : 'Show more'}
            >
              <svg 
                className={`w-4 h-4 transform transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className={`
          relative overflow-hidden transition-all duration-500 ease-in-out
          ${!expanded ? 'max-h-24' : 'max-h-96'}
        `}>
          {/* Gradient fade for collapsed state */}
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-white to-transparent pointer-events-none"></div>
          )}
          
          {/* Text content */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {source.text}
          </p>
        </div>
        
        {/* Metadata footer */}
        {(source.document || source.page) && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Document name */}
              {source.document && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium truncate max-w-37.5">{source.document}</span>
                </div>
              )}
              
              {/* Page number */}
              {source.page && source.page !== 'Unknown' && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Page {source.page}</span>
                </div>
              )}
              
              {/* Chunk index (if available) */}
              {source.chunk_index !== undefined && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>Chunk #{source.chunk_index + 1}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Copy success toast */}
      {copied && (
        <div className="absolute -top-2 right-4 bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-bounce">
          Copied!
        </div>
      )}
    </div>
  );
};