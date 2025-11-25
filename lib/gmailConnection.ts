// Gmail connection and status utilities

import { authenticatedFetch } from './auth';
import { ChatMessage } from './types';

/**
 * Checks Gmail connection status and returns appropriate messages
 */
export const checkGmailConnection = async (): Promise<ChatMessage[]> => {
  const messages: ChatMessage[] = [];
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await authenticatedFetch(`${API_URL}/api/gmail/stats`);
    
    if (response.ok) {
      const stats = await response.json();
      if (stats.total_messages === 0) {
        messages.push({
          id: 'gmail-warning',
          type: 'assistant',
          content: "⚠️ I notice you don't have any Gmail messages imported yet. Please connect your Gmail account from the dashboard first, or make sure your emails have been fetched and embedded.",
          timestamp: new Date(),
        });
      }
    }
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    messages.push({
      id: 'gmail-error',
      type: 'assistant',
      content: "⚠️ I'm having trouble accessing your Gmail data. Please make sure you're signed in and your Gmail account is connected.",
      timestamp: new Date(),
    });
  }
  
  return messages;
};
