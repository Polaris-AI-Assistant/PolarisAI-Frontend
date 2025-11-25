// Email service utilities for handling search and send operations

import { authenticatedFetch } from './auth';
import { 
  UserIntent, 
  EmailSendResponse, 
  SearchResponse, 
  ChatMessage 
} from './types';

/**
 * Handles email sending via AI composition
 */
export const handleEmailSending = async (
  intent: UserIntent, 
  userId: string, 
  API_URL: string
): Promise<EmailSendResponse> => {
  const { recipientEmail, emailPrompt } = intent.extractedInfo || {};

  if (!recipientEmail) {
    throw new Error('I could not find a valid email address in your request. Please include the recipient\'s email address (e.g., "send an email to john@example.com").');
  }

  if (!emailPrompt) {
    throw new Error('I need to know what you want to say in the email. Please provide more details about the message content.');
  }

  const response = await authenticatedFetch(`${API_URL}/api/gmail/compose/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userPrompt: emailPrompt,
      recipientEmail: recipientEmail,
      model: 'gpt-4o-mini',
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Email sending failed with status ${response.status}`);
  }

  return await response.json();
};

/**
 * Handles email searching via semantic search
 */
export const handleEmailSearch = async (
  intent: UserIntent, 
  userId: string, 
  API_URL: string
): Promise<SearchResponse> => {
  const searchQuery = intent.extractedInfo?.searchQuery || '';

  const response = await authenticatedFetch(`${API_URL}/api/search-gmail-messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      query: searchQuery,
      user_id: userId 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Search failed with status ${response.status}`);
  }

  return await response.json();
};

/**
 * Creates assistant message for email sending result
 */
export const createEmailSendMessage = (
  data: EmailSendResponse, 
  recipientEmail: string
): ChatMessage => {
  return {
    id: (Date.now() + 2).toString(),
    type: 'assistant',
    content: data.success 
      ? `✅ Email sent successfully to ${recipientEmail}!\n\n📧 **Subject**: ${data.generatedContent?.subject}\n📝 **Message ID**: ${data.messageId}`
      : `❌ Failed to send email: ${data.error}`,
    timestamp: new Date(),
    emailSent: data,
  };
};

/**
 * Creates assistant message for email search result
 */
export const createEmailSearchMessage = (data: SearchResponse): ChatMessage => {
  return {
    id: (Date.now() + 2).toString(),
    type: 'assistant',
    content: data.results.length > 0 
      ? `Found ${data.results.length} relevant email(s) out of ${data.total_searched} searched. Here are the results:`
      : `No relevant emails found in ${data.total_searched} searched messages. Try a different search term.`,
    timestamp: new Date(),
    results: data.results,
  };
};

/**
 * Creates error message for failed operations
 */
export const createErrorMessage = (error: Error | string): ChatMessage => {
  return {
    id: (Date.now() + 2).toString(),
    type: 'assistant',
    content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : error}. Please try again.`,
    timestamp: new Date(),
  };
};
