"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface Step {
  emoji: string;
  text: string;
  delay: number;
}

interface AILoadingStateProps {
  query?: string;
}

const AILoadingState = ({ query }: AILoadingStateProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Generate dynamic steps based on the query
  const generateSteps = (userQuery: string): Step[] => {
    const lowerQuery = userQuery.toLowerCase();
    const steps: Step[] = [];
    
    // Step 1: Always start with understanding
    steps.push({ 
      emoji: '�', 
      text: 'Understanding your request...', 
      delay: 600 
    });

    // Detect which agents might be needed
    const needsCalendar = /calendar|event|meeting|schedule|appointment/i.test(lowerQuery);
    const needsDocs = /document|doc|write|create.*doc|google doc/i.test(lowerQuery);
    const needsForms = /form|survey|questionnaire|poll/i.test(lowerQuery);
    const needsGitHub = /github|repository|repo|commit|pull request|issue/i.test(lowerQuery);
    const needsMeet = /meet|video call|conference/i.test(lowerQuery);
    const needsSheets = /sheet|spreadsheet|excel|data|log|track/i.test(lowerQuery);
    const needsGmail = /email|gmail|mail|inbox|send/i.test(lowerQuery);
    
    const agentsNeeded = [];
    if (needsCalendar) agentsNeeded.push('calendar');
    if (needsDocs) agentsNeeded.push('docs');
    if (needsForms) agentsNeeded.push('forms');
    if (needsGitHub) agentsNeeded.push('github');
    if (needsMeet) agentsNeeded.push('meet');
    if (needsSheets) agentsNeeded.push('sheets');
    if (needsGmail) agentsNeeded.push('gmail');

    // Step 2: Memory check (if multiple agents or certain keywords)
    const needsMemory = agentsNeeded.length > 1 || /remember|past|previous|last time|history/i.test(lowerQuery);
    if (needsMemory) {
      steps.push({ 
        emoji: '�', 
        text: 'Checking your past memory...', 
        delay: 700 
      });
    }

    // Step 3: Agent-specific processing
    if (agentsNeeded.length > 0) {
      agentsNeeded.forEach((agent, index) => {
        const agentInfo = getAgentInfo(agent);
        steps.push({
          emoji: agentInfo.emoji,
          text: agentInfo.text,
          delay: 800 + (index * 50)
        });
      });
    } else {
      // Generic processing if no specific agent detected
      steps.push({ 
        emoji: '⚡', 
        text: 'Processing your request...', 
        delay: 800 
      });
    }

    // Step 4: Memory storage (if multiple agents or sheets involved)
    if (needsSheets && agentsNeeded.length > 1) {
      steps.push({ 
        emoji: '💾', 
        text: 'Storing summarized data into **Google Sheets Memory Log**', 
        delay: 750 
      });
    }

    // Final step: Preparing response
    steps.push({ 
      emoji: '✨', 
      text: 'Preparing your response...', 
      delay: 600 
    });

    // Ensure we have 4-6 steps
    if (steps.length > 6) {
      return steps.slice(0, 6);
    }

    return steps;
  };

  const getAgentInfo = (agent: string): { emoji: string; text: string } => {
    const agentMap: Record<string, { emoji: string; text: string }> = {
      calendar: { emoji: '�', text: 'Sending query to **Calendar Agent**' },
      docs: { emoji: '📄', text: 'Sending query to **Docs Agent**' },
      forms: { emoji: '📋', text: 'Sending query to **Forms Agent**' },
      github: { emoji: '🐙', text: 'Sending query to **GitHub Agent**' },
      meet: { emoji: '📹', text: 'Sending query to **Meet Agent**' },
      sheets: { emoji: '📊', text: 'Sending query to **Sheets Agent**' },
      gmail: { emoji: '📧', text: 'Sending query to **Gmail Agent**' }
    };
    return agentMap[agent] || { emoji: '🔧', text: `Connecting to ${agent}...` };
  };

  const steps = generateSteps(query || 'Processing...');

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, steps[currentStep].delay);
      return () => clearTimeout(timer);
    }
  }, [currentStep, steps]);

  return (
    <div className="w-full">
      <div className="relative">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isVisible = index <= currentStep;

            return (
              <div
                key={index}
                className={`flex items-start gap-4 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-gray-500 animate-in zoom-in duration-300" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-700"></div>
                  )}
                </div>

                <div className="flex-1 pt-0.5">
                  <div className={`text-base transition-all duration-300 ${
                    isCompleted ? 'text-gray-500' : isActive ? 'text-white font-medium' : 'text-gray-700'
                  }`}>
                    <span className="text-xl mr-2">{step.emoji}</span>
                    <span dangerouslySetInnerHTML={{ 
                      __html: step.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>') 
                    }} />
                  </div>
                  
                  {isActive && (
                    <div className="mt-2.5 h-0.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full animate-pulse"
                           style={{
                             animation: 'progress 1.5s ease-in-out infinite',
                           }}></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progressive fade overlay */}
        <div
          className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none rounded-lg"
          style={{
            background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 30%, transparent 100%)"
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; opacity: 0.6; }
          50% { width: 70%; opacity: 1; }
          100% { width: 100%; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default AILoadingState;
