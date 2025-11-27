'use client'
import React, { useEffect, useState } from 'react';
import { User, Sparkles } from 'lucide-react';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

const SignUpIllustration = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messages = [
    {
      type: 'user',
      text: 'Create a meeting tomorrow at 3 PM with Riya.',
    },
    {
      type: 'ai',
      text: 'Scheduled. The event is added to your Calendar with a call link.',
    },
    {
      type: 'user',
      text: 'Also, check if I have any deadlines this week.',
    },
    {
      type: 'ai',
      text: 'You have 2 upcoming deadlines:\n• Presentation draft — Wednesday\n• Budget review — Friday\nWant me to set reminders?',
    },
    {
      type: 'user',
      text: 'Yes, set one for both.',
    },
    {
      type: 'ai',
      text: 'All reminders set. I\'ll notify you on time.',
    },
  ];

  useEffect(() => {
    // Reset animation
    setCurrentMessageIndex(0);
    setTypedText('');
    setIsTyping(false);
  }, []);

  useEffect(() => {
    if (currentMessageIndex >= messages.length) {
      // Loop back after showing all messages
      const timer = setTimeout(() => {
        setCurrentMessageIndex(0);
        setTypedText('');
        setIsTyping(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    const currentMessage = messages[currentMessageIndex];
    
    // If it's a user message, show it immediately
    if (currentMessage.type === 'user') {
      const timer = setTimeout(() => {
        setCurrentMessageIndex(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // If it's an AI message, type it out
    if (currentMessage.type === 'ai') {
      setIsTyping(true);
      setTypedText('');
      
      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < currentMessage.text.length) {
          setTypedText(currentMessage.text.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
          // Move to next message after typing completes
          setTimeout(() => {
            setCurrentMessageIndex(prev => prev + 1);
          }, 1500);
        }
      }, 30); // Typing speed

      return () => clearInterval(typingInterval);
    }
  }, [currentMessageIndex]);

  // Calculate which messages to show (max 4 visible at once)
  const visibleStartIndex = Math.max(0, currentMessageIndex - 3);
  const visibleMessages = messages.slice(visibleStartIndex, currentMessageIndex + 1);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black px-8 py-12">
      
      {/* Animated gradient orbs - same as signin */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Header Section - Above Chat */}
      <div className="relative z-10 mb-12 text-center space-y-3 max-w-md">
        <h3 className={`${spaceGrotesk.className} text-4xl font-bold text-white tracking-tight leading-tight`}>
          Your AI memory assistant
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Instantly recall information from across all your apps.
          <br />
          Ask naturally, get intelligent answers.
        </p>
      </div>

      {/* Chat Container with Fixed Height */}
      <div className="relative w-full max-w-lg z-10">
        {/* Badge */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/50 border border-neutral-700/50">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-gray-400 tracking-wide">POLARIS AI</span>
          </div>
        </div>

        {/* Messages Container with Fixed Height and Overflow */}
        <div className="space-y-5 min-h-[320px] max-h-[320px] overflow-hidden relative">
          {visibleMessages.map((message, index) => {
            const isUser = message.type === 'user';
            const actualIndex = visibleStartIndex + index;
            const isCurrentAI = message.type === 'ai' && actualIndex === currentMessageIndex;
            const displayText = isCurrentAI ? typedText : message.text;
            
            // Fade out effect for older messages
            const opacity = index === 0 && visibleMessages.length > 3 ? 'opacity-40' : 'opacity-100';
            
            return (
              <div
                key={actualIndex}
                className={`flex gap-3 items-start transition-opacity duration-500 ${opacity} ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isUser 
                    ? 'bg-neutral-700/50 border border-neutral-600/50' 
                    : 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30'
                }`}>
                  {isUser ? (
                    <User className="w-4 h-4 text-gray-300" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-300" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 pt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {/* User Message - Grey Bubble */}
                  {isUser && (
                    <div className="inline-block px-4 py-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/50">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                  )}

                  {/* AI Message - No Bubble, Just Text with Typing Effect */}
                  {!isUser && (
                    <div className="space-y-1">
                      <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">
                        {displayText}
                        {isCurrentAI && isTyping && (
                          <span className="inline-block w-0.5 h-4 bg-white/90 ml-0.5 animate-pulse" />
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SignUpIllustration;
