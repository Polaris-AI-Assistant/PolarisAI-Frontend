// Intent recognition utility for determining user intent from natural language input

import { UserIntent } from './types';

/**
 * Analyzes user input to determine whether they want to search emails or send emails
 * @param input - The user's natural language input
 * @returns UserIntent object with type, confidence, and extracted information
 */
export const analyzeUserIntent = (input: string): UserIntent => {
  const lowerInput = input.toLowerCase().trim();
  
  // Check for email addresses first - this is the strongest indicator
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emailMatches = input.match(emailRegex);
  
  // Strong search indicators - these should override other patterns
  const strongSearchPatterns = [
    /^(show|find|search|get|list|display)\s+(me\s+)?(all\s+)?(emails?|messages?)/i,
    /^(what|which)\s+(emails?|messages?)/i,
    /emails?\s+(about|containing|regarding|with)/i,
    /^look\s+for\s+(emails?|messages?)/i,
  ];
  
  // Strong send indicators - only when there's clear sending intent
  const strongSendPatterns = [
    /^(send|write|compose)\s+(an?\s+)?(email|message|mail)\s+to\s+/i,
    /^email\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /^(tell|notify|inform)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ];
  
  // Check strong search patterns first
  for (const pattern of strongSearchPatterns) {
    if (pattern.test(input)) {
      return {
        type: 'search',
        confidence: 0.95,
        extractedInfo: { searchQuery: input }
      };
    }
  }
  
  // Check strong send patterns
  for (const pattern of strongSendPatterns) {
    const match = input.match(pattern);
    if (match) {
      let extractedEmail = '';
      let emailPrompt = input;
      
      if (emailMatches && emailMatches.length > 0) {
        extractedEmail = emailMatches[0];
        emailPrompt = input.replace(emailRegex, '').replace(/email\s+/gi, '').trim();
        emailPrompt = emailPrompt.replace(/^(send|write|compose|tell|notify|inform)\s+(an?\s+)?(email|message|mail)?\s*(to)?\s*/i, '');
      }
      
      return {
        type: 'send',
        confidence: 0.95,
        extractedInfo: {
          recipientEmail: extractedEmail,
          emailPrompt: emailPrompt || input
        }
      };
    }
  }
  
  // If email address is present, analyze context more carefully
  if (emailMatches && emailMatches.length > 0) {
    // Check if it's clearly a search query mentioning emails
    if (lowerInput.includes('show') || lowerInput.includes('find') || 
        lowerInput.includes('search') || lowerInput.includes('get') ||
        lowerInput.includes('from')) {
      return {
        type: 'search',
        confidence: 0.8,
        extractedInfo: { searchQuery: input }
      };
    }
    
    // If email is present and there's sending context
    const sendContext = ['send', 'write', 'compose', 'tell', 'notify', 'inform', 'email'];
    const hasSendContext = sendContext.some(word => lowerInput.includes(word));
    
    if (hasSendContext) {
      let emailPrompt = input.replace(emailRegex, '').replace(/email\s+/gi, '').trim();
      emailPrompt = emailPrompt.replace(/^(send|write|compose|tell|notify|inform)\s+/i, '');
      
      return {
        type: 'send',
        confidence: 0.9,
        extractedInfo: {
          recipientEmail: emailMatches[0],
          emailPrompt: emailPrompt || input
        }
      };
    }
  }
  
  // Fallback analysis for ambiguous cases
  const searchKeywords = ['show', 'find', 'search', 'get', 'list', 'display', 'look', 'what', 'which', 'all', 'recent'];
  const sendKeywords = ['send', 'write', 'compose', 'tell', 'notify', 'inform'];
  
  let searchScore = 0;
  let sendScore = 0;
  
  searchKeywords.forEach(keyword => {
    if (lowerInput.includes(keyword)) searchScore += 1;
  });
  
  sendKeywords.forEach(keyword => {
    if (lowerInput.includes(keyword)) sendScore += 1;
  });
  
  // Boost search score for email-related queries without recipients
  if ((lowerInput.includes('email') || lowerInput.includes('message')) && !emailMatches) {
    searchScore += 2;
  }
  
  // If no clear indicators, default based on structure
  if (searchScore === 0 && sendScore === 0) {
    // If it looks like a question or request for information
    if (lowerInput.includes('?') || lowerInput.startsWith('what') || 
        lowerInput.startsWith('which') || lowerInput.startsWith('how many')) {
      return {
        type: 'search',
        confidence: 0.7,
        extractedInfo: { searchQuery: input }
      };
    }
    
    // Default to search for safety
    return {
      type: 'search',
      confidence: 0.6,
      extractedInfo: { searchQuery: input }
    };
  }
  
  const totalScore = searchScore + sendScore;
  const searchConfidence = searchScore / totalScore;
  const sendConfidence = sendScore / totalScore;
  
  if (searchConfidence > sendConfidence) {
    return {
      type: 'search',
      confidence: Math.min(0.95, searchConfidence + 0.2),
      extractedInfo: { searchQuery: input }
    };
  } else {
    return {
      type: 'send',
      confidence: Math.min(0.95, sendConfidence + 0.2),
      extractedInfo: {
        recipientEmail: emailMatches ? emailMatches[0] : '',
        emailPrompt: input
      }
    };
  }
};
