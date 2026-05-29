'use client';

import { useCallback, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  loading?: boolean;
  error?: string;
}

interface ApiCallLog {
  endpoint: string;
  method: string;
  params?: Record<string, unknown>;
  timestamp: Date;
}

interface ConversationHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface ChatApiResponse {
  response: string;
  apiCalls?: ApiCallLog[];
}

export const useGeminiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const conversationHistoryRef = useRef<ConversationHistoryItem[]>([]);
  const apiCallsRef = useRef<ApiCallLog[]>([]);

  /**
   * Sends a message to Gemini and gets a response
   */
  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      // Add user message to chat
      const userMessageId = `msg-${Date.now()}`;
      const newUserMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newUserMessage]);

      // Add user message to conversation history for Gemini
      conversationHistoryRef.current.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      setLoading(true);

      try {
        const token =
          localStorage.getItem('token') ||
          localStorage.getItem('adminToken') ||
          localStorage.getItem('admin_token');

        // Call your backend endpoint that handles Gemini
        const response = await fetch('/api/chatbot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: conversationHistoryRef.current,
            authToken: token,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.statusText}`);
        }

        const data: ChatApiResponse = await response.json();

        // Extract API calls that Gemini made (if tracking is enabled)
        if (data.apiCalls) {
          apiCallsRef.current.push(...data.apiCalls);
        }

        // Add assistant response to chat
        const assistantMessageId = `msg-${Date.now()}-assistant`;
        const newAssistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newAssistantMessage]);

        // Add assistant response to conversation history
        conversationHistoryRef.current.push({
          role: 'model',
          parts: [{ text: data.response }],
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred';

        // Add error message
        const errorMessageId = `msg-${Date.now()}-error`;
        const newErrorMessage: ChatMessage = {
          id: errorMessageId,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
          error: errorMessage,
        };

        setMessages((prev) => [...prev, newErrorMessage]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Clears the chat history
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    conversationHistoryRef.current = [];
    apiCallsRef.current = [];
  }, []);

  /**
   * Get API call logs
   */
  const getApiCallLogs = useCallback(() => {
    return apiCallsRef.current;
  }, []);

  /**
   * Get conversation history for manual manipulation
   */
  const getConversationHistory = useCallback(() => {
    return conversationHistoryRef.current;
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    clearChat,
    getApiCallLogs,
    getConversationHistory,
  };
};
