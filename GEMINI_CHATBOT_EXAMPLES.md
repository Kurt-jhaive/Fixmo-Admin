# Gemini Chatbot - Integration Examples

This document shows practical examples of how to use the Gemini chatbot with your FixMo Admin Dashboard.

## Example 1: Basic Integration in Dashboard

```tsx
// src/app/dashboard/layout.tsx
import { GeminiChatbot } from '@/components/GeminiChatbot';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Add the chatbot */}
      <GeminiChatbot />
    </div>
  );
}
```

## Example 2: Using the Chat Hook Standalone

If you want to use the chat functionality in a custom component:

```tsx
// src/app/dashboard/pages/test-chatbot.tsx
'use client';

import { useGeminiChat } from '@/lib/useGeminiChat';
import { useEffect } from 'react';

export default function ChatbotTestPage() {
  const { messages, loading, sendMessage } = useGeminiChat();

  useEffect(() => {
    // Auto-send a greeting
    sendMessage('Hello! Can you give me a summary of the platform?');
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Chatbot Test</h1>
      
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded ${
              msg.role === 'user'
                ? 'bg-blue-100 text-blue-900'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <button
        onClick={() => sendMessage('Show me pending appointments')}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Send Test Query
      </button>
    </div>
  );
}
```

## Example 3: Handling Real Data Fetching

Here's how Gemini can actually fetch data from your backend API:

```ts
// src/lib/chatbot-api-helpers.ts
/**
 * Helper functions for Gemini to make actual API calls
 * These can be called from your backend handler
 */

export const fetchAdminStats = async () => {
  try {
    const response = await fetch(
      'https://fixmo-backend-production.up.railway.app/api/admin/dashboard'
    );
    return await response.json();
  } catch (error) {
    return { error: 'Failed to fetch admin stats' };
  }
};

export const fetchUnverifiedUsers = async () => {
  try {
    const response = await fetch(
      'https://fixmo-backend-production.up.railway.app/api/admin/users?verified_only=false'
    );
    return await response.json();
  } catch (error) {
    return { error: 'Failed to fetch unverified users' };
  }
};

export const fetchAppointmentStats = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `https://fixmo-backend-production.up.railway.app/api/appointments/stats?${params}`
    );
    return await response.json();
  } catch (error) {
    return { error: 'Failed to fetch appointment stats' };
  }
};

export const fetchProviderRatings = async (providerId: number) => {
  try {
    const response = await fetch(
      `https://fixmo-backend-production.up.railway.app/api/ratings/provider/${providerId}`
    );
    return await response.json();
  } catch (error) {
    return { error: `Failed to fetch ratings for provider ${providerId}` };
  }
};
```

## Example 4: Advanced Backend Handler with Real API Calls

```ts
// src/app/api/chatbot/chat-advanced/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_SYSTEM_INSTRUCTIONS } from '@/lib/gemini-system-instructions';
import {
  fetchAdminStats,
  fetchUnverifiedUsers,
  fetchAppointmentStats,
  fetchProviderRatings,
} from '@/lib/chatbot-api-helpers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

/**
 * Advanced chat handler that performs actual API calls
 */
export async function POST(request: Request) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Detect what data the admin needs and pre-fetch it
    let contextData = '';

    // Check if they're asking about stats
    if (
      message.toLowerCase().includes('total') ||
      message.toLowerCase().includes('stats') ||
      message.toLowerCase().includes('summary')
    ) {
      const stats = await fetchAdminStats();
      contextData += `\n\nCurrent Platform Stats:\n${JSON.stringify(stats, null, 2)}`;
    }

    // Check if they're asking about unverified users
    if (
      message.toLowerCase().includes('unverified') ||
      message.toLowerCase().includes('pending') ||
      message.toLowerCase().includes('approval')
    ) {
      const unverified = await fetchUnverifiedUsers();
      contextData += `\n\nUnverified Users:\n${JSON.stringify(unverified, null, 2)}`;
    }

    // Build conversation with enhanced context
    const chatHistory = [
      {
        role: 'user',
        parts: [{ text: GEMINI_SYSTEM_INSTRUCTIONS }],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'I understand. I am the FixMo Admin Assistant.',
          },
        ],
      },
      ...conversationHistory,
    ];

    // Add context if we fetched data
    if (contextData) {
      chatHistory.push({
        role: 'user',
        parts: [{ text: `Here is some relevant platform data:\n${contextData}` }],
      });
      chatHistory.push({
        role: 'model',
        parts: [{ text: 'I have reviewed the data. Ready to answer your question.' }],
      });
    }

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);

    return Response.json({
      response: result.response.text(),
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return Response.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

## Example 5: Custom Chatbot with Theme Integration

```tsx
// components/CustomGeminiChatbot.tsx
'use client';

import { useGeminiChat } from '@/lib/useGeminiChat';
import { useTheme } from 'next-themes'; // If you use next-themes

export const CustomGeminiChatbot = () => {
  const { messages, loading, sendMessage } = useGeminiChat();
  const { theme } = useTheme();

  return (
    <div
      className={`fixed bottom-6 right-6 w-96 rounded-lg shadow-xl border ${
        theme === 'dark'
          ? 'bg-gray-900 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Your custom UI here */}
      <div
        className={`p-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}
      >
        <h3 className="font-bold">AI Assistant</h3>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id}>
            <p
              className={`text-sm ${
                msg.role === 'user'
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              {msg.content}
            </p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.querySelector('input');
            if (input?.value) {
              sendMessage(input.value);
              input.value = '';
            }
          }}
        >
          <input
            type="text"
            placeholder="Ask something..."
            className="w-full px-2 py-1 border rounded text-sm"
            disabled={loading}
          />
        </form>
      </div>
    </div>
  );
};
```

## Example 6: Common Admin Queries and Expected Responses

Here are queries your admins might ask:

### Query 1: Pending Approvals Count
```
Admin: "Ilan yung hindi pa approve sa site?"
Expected Response: "There are 12 unverified users and 8 unverified service providers waiting for approval."
```

### Query 2: Total Sales
```
Admin: "Magkano ang total sales ngayon?"
Expected Response: "The platform has generated $45,230 in total revenue with 523 completed appointments."
```

### Query 3: Top Providers
```
Admin: "Show me top performing providers"
Expected Response: [Lists top 5 providers with ratings and statistics]
```

### Query 4: Recent Activities
```
Admin: "What happened yesterday?"
Expected Response: [Summary of appointments, registrations, and activities]
```

### Query 5: Multilingual Support
```
Admin (Filipino): "Ilan ang new users ngayong linggo?"
Expected Response: "This week, 34 new customers registered and 7 new service providers joined."
```

## Example 7: Error Handling

The system gracefully handles various error scenarios:

```tsx
// Automatic error handling in GeminiChatbot component

// Network error
"Sorry, I encountered an error: Failed to fetch. Please check your connection and try again."

// API error
"I couldn't retrieve the data at this moment. Please try your question again later."

// Invalid query
"I'm not sure how to help with that. Try asking about users, appointments, providers, or sales."
```

---

These examples show you how flexible the Gemini chatbot implementation is. You can customize it to fit your exact needs!
