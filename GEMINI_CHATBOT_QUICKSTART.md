# Gemini Chatbot - Quick Start Checklist

Complete these steps in order to get your AI chatbot running ⚡

## Phase 1: Setup (5 minutes)

- [ ] Get your Gemini API key from https://ai.google.dev/
- [ ] Add `GEMINI_API_KEY=your_key_here` to `.env.local`
- [ ] Run `npm install @google/generative-ai` ✓ (Already done!)

## Phase 2: Integration (3 minutes)

- [ ] Add `<GeminiChatbot />` component to your dashboard layout:
  ```tsx
  // src/app/dashboard/layout.tsx
  import { GeminiChatbot } from '@/components/GeminiChatbot';
  
  export default function DashboardLayout({ children }) {
    return (
      <div>
        {children}
        <GeminiChatbot />
      </div>
    );
  }
  ```

- [ ] Verify these files exist in your project:
  - ✓ `src/lib/gemini-system-instructions.ts`
  - ✓ `src/lib/useGeminiChat.ts`
  - ✓ `src/components/GeminiChatbot.tsx`
  - ✓ `src/app/api/chatbot/chat/route.ts`

## Phase 3: Testing (5 minutes)

- [ ] Start your dev server: `npm run dev`
- [ ] Navigate to your dashboard (http://localhost:3000/dashboard)
- [ ] Look for the blue "Chat" button in bottom-right corner
- [ ] Click it and test these queries:
  - [ ] "Hello, who are you?"
  - [ ] "How many users are on the platform?"
  - [ ] "Show me information about appointments"

## Phase 4: Customization (Optional)

- [ ] Customize chatbot appearance (colors, size) in `GeminiChatbot.tsx`
- [ ] Update system instructions if needed in `gemini-system-instructions.ts`
- [ ] Add custom welcome messages specific to your team
- [ ] Integrate real API calls (see GEMINI_CHATBOT_EXAMPLES.md)

## Phase 5: Deployment

- [ ] Make sure `GEMINI_API_KEY` is set in your production `.env`
- [ ] Test chatbot in production environment
- [ ] Monitor for errors in production logs
- [ ] Collect feedback from admins

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Chat button not visible | Check that `<GeminiChatbot />` is in your layout |
| "API key not configured" error | Restart dev server after adding `GEMINI_API_KEY` to `.env.local` |
| Slow responses | First request is slower; subsequent ones are faster |
| Component not found errors | Run `npm install` again |
| Styling looks off | Check Tailwind CSS is properly configured |

---

## What to Expect

✅ **First Request:** 2-3 seconds (Gemini cold start)
✅ **Subsequent Requests:** < 1 second
✅ **Conversation Memory:** Maintained during session
✅ **Data Privacy:** On-device, not stored

---

## Next Steps

After setup is complete:

1. **Read Integration Examples** - See practical use cases in [GEMINI_CHATBOT_EXAMPLES.md](GEMINI_CHATBOT_EXAMPLES.md)
2. **Read Full Setup Guide** - Deep dive in [GEMINI_CHATBOT_SETUP.md](GEMINI_CHATBOT_SETUP.md)
3. **Customize for Your Needs** - Modify colors, behavior, or capabilities
4. **Add Real API Integration** - Make chatbot actually query your backend
5. **Gather Team Feedback** - See what admin workflows the chatbot improves

---

## Support

Need help? Here's where to look:

- **General API docs:** https://ai.google.dev/docs
- **Gemini pricing:** https://ai.google.dev/pricing
- **Google AI Studio:** https://ai.google.dev/ (test queries here first)

---

**Status:** ✅ Ready to Use
**Last Updated:** 2026-05-28
