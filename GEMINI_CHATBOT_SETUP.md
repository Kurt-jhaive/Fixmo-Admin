# FixMo Admin AI Chatbot - Setup Guide

## Overview

This guide walks you through setting up the AI chatbot feature for your FixMo Admin Dashboard. The chatbot uses Google's Gemini API to understand natural language questions and fetch relevant data from your backend.

## What's Included

1. **System Instructions** (`gemini-system-instructions.ts`) - Comprehensive prompt that teaches Gemini about your API
2. **Chat Hook** (`useGeminiChat.ts`) - React hook managing chat state and API communication
3. **Chatbot Component** (`GeminiChatbot.tsx`) - Beautiful floating chatbot UI
4. **Backend API Route** (`api/chatbot/chat/route.ts`) - Server-side Gemini integration

## Prerequisites

- Google Gemini API key (free tier available at https://ai.google.dev/)
- Node.js 18+ (your project likely already has this)

## Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key

## Step 2: Add Environment Variables

Add this to your `.env.local` file:

```env
# Google Gemini API
GEMINI_API_KEY=your_api_key_here

# Optional: API Backend URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
# For production:
# NEXT_PUBLIC_API_BASE_URL=https://fixmo-backend-production.up.railway.app/
```

## Step 3: Install Dependencies

You need the Gemini Google AI package:

```bash
npm install @google/generative-ai
```

## Step 4: Add Chatbot to Your Layout

Open your main dashboard layout (`src/app/dashboard/layout.tsx`) and add the chatbot component:

```tsx
import { GeminiChatbot } from '@/components/GeminiChatbot';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Your existing layout */}
      {children}
      
      {/* Add the chatbot */}
      <GeminiChatbot />
    </div>
  );
}
```

## Step 5: Test the Chatbot

1. Start your dev server: `npm run dev`
2. Navigate to your dashboard
3. Look for the blue "Chat" button in the bottom-right corner
4. Click it and try some queries:
   - "How many unverified users are there?"
   - "Show me appointments from yesterday"
   - "What are the top performing providers?"

## How It Works

### Architecture Flow

```
Admin Message
    ↓
React Component (GeminiChatbot.tsx)
    ↓
Frontend Hook (useGeminiChat.ts)
    ↓
Next.js API Route (/api/chatbot/chat)
    ↓
Gemini API with System Instructions
    ↓
Response + Any Required API Calls
    ↓
Back to Admin
```

### System Instructions

The `gemini-system-instructions.ts` file contains detailed instructions that teach Gemini:

- What API endpoints are available
- How to query for specific data
- How to format responses
- Language support (English + Filipino)
- Error handling best practices

### Key Features

✅ **Multi-language Support** - Responds to English and Filipino (Tagalog)
✅ **Context Awareness** - Maintains conversation history for follow-up questions
✅ **Error Handling** - Graceful error messages without technical jargon
✅ **Floating UI** - Non-intrusive floating button
✅ **Real-time Streaming** - Responses appear as they're generated
✅ **Conversation History** - Admins can see full chat history in one session

## Advanced Usage

### Get API Call Logs

The hook provides a way to access logs of all API calls made:

```tsx
const { getApiCallLogs } = useGeminiChat();
const logs = getApiCallLogs(); // Returns array of API calls
```

### Clear Chat History

```tsx
const { clearChat } = useGeminiChat();
clearChat(); // Clears all messages and conversation history
```

### Get Conversation History

For debugging or saving conversations:

```tsx
const { getConversationHistory } = useGeminiChat();
const history = getConversationHistory(); // Raw Gemini conversation format
```

## Common Questions

### Q: Does the chatbot modify data?
**A:** No, by design it only fetches and displays data. Modifications require explicit admin action in the UI.

### Q: Is my data secure?
**A:** Your data is sent through Gemini's API. Avoid asking about sensitive information. Enterprise users should review Google's data policies.

### Q: What languages are supported?
**A:** English and Filipino (Tagalog). The system instructions have multilingual prompts built-in.

### Q: Can I customize the chatbot appearance?
**A:** Yes! Edit the `GeminiChatbot.tsx` component. Change colors, size, position, or add your own branding.

### Q: How much does this cost?
**A:** Gemini's free tier includes 60 requests per minute. Professional tiers available for higher volumes. Check [Google AI Pricing](https://ai.google.dev/pricing).

## Troubleshooting

### "Gemini API key not configured"
- Check your `.env.local` file
- Make sure `GEMINI_API_KEY` is set
- Restart your dev server after adding the key

### Chatbot doesn't appear
- Make sure you added `<GeminiChatbot />` to your layout
- Check browser console for errors
- Verify `@google/generative-ai` package is installed

### Slow responses
- First request can take 2-3 seconds
- Subsequent requests are usually faster
- Check your internet connection and Gemini's status

### Errors about API endpoints
- The system instructions reference specific endpoints
- Make sure your backend is running on the expected port
- Check [API_DOCUMENTATION_CONTROLLER_BASED.md](../API_DOCUMENTATION_CONTROLLER_BASED.md) for current endpoints

## Future Enhancements

Potential improvements you could add:

1. **Export Conversations** - Download chat history as PDF/CSV
2. **Real-time Data Fetching** - Gemini directly calls your backend APIs
3. **Analytics Dashboard** - Track what admins ask most
4. **Custom Prompts** - Let admins create saved query templates
5. **Voice Input** - Voice-to-text for hands-free queries
6. **Multi-user Support** - Team chat features
7. **Data Visualization** - Auto-generate charts from responses

## Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Review [Google Generative AI Docs](https://ai.google.dev/docs)
3. Verify your Gemini API key has proper permissions
4. Ensure your Next.js environment is properly configured

## Files Created

- `src/lib/gemini-system-instructions.ts` - Gemini system prompt
- `src/lib/useGeminiChat.ts` - React chat hook
- `src/components/GeminiChatbot.tsx` - Chatbot UI component
- `src/app/api/chatbot/chat/route.ts` - Backend API handler

---

**Last Updated:** 2026-05-28
**Version:** 1.0.0
