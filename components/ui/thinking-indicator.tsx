"use client";

import React from 'react';

interface ThinkingIndicatorProps {
  message?: string;
}

export const ThinkingIndicator = ({ message = "Thinking" }: ThinkingIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <div className="flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}>
          •
        </span>
        <span className="animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }}>
          •
        </span>
        <span className="animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }}>
          •
        </span>
      </div>
      <span className="text-sm">{message}</span>
    </div>
  );
};
