# Gemini Chatbot - Testing & Debugging Guide

Complete guide to testing your AI chatbot implementation.

## Phase 1: Pre-Launch Testing

### Check 1.1: Environment Setup
```bash
# Verify env file has the key
cat .env.local | grep GEMINI_API_KEY

# Expected output:
# GEMINI_API_KEY=your_api_key_here_...
```

### Check 1.2: Dependencies Installed
```bash
npm list @google/generative-ai

# Expected output:
# ├── @google/generative-ai@0.x.x
```

### Check 1.3: File Structure
Verify these files exist:
```
src/
├── lib/
│   ├── gemini-system-instructions.ts
│   └── useGeminiChat.ts
├── components/
│   └── GeminiChatbot.tsx
└── app/
    └── api/
        └── chatbot/
            └── chat/
                └── route.ts
```

### Check 1.4: Code Syntax
```bash
npm run build

# Should complete without TypeScript errors
```

## Phase 2: Development Testing

### Test 2.1: Component Rendering
```tsx
// Quick test - add to any page
import { GeminiChatbot } from '@/components/GeminiChatbot';

export default function TestPage() {
  return (
    <div>
      <h1>Testing Chatbot</h1>
      <GeminiChatbot />
    </div>
  );
}
```

Open in browser:
- [ ] See blue "Chat" button in bottom-right
- [ ] Click button opens chat dialog
- [ ] Dialog has header, message area, input field

### Test 2.2: Basic Chat Flow
```
1. Click Chat button
2. Type: "Hello"
3. Expected: Assistant greeting appears

If nothing happens:
- Check browser console for errors (F12 → Console)
- Verify GEMINI_API_KEY is set
- Check Network tab for `/api/chatbot/chat` request
```

### Test 2.3: API Error Handling
```
1. Temporarily remove GEMINI_API_KEY from .env.local
2. Restart dev server
3. Try to send message
4. Expected: Error message: "Gemini API key not configured"

Then restore the key and test again to confirm it works
```

### Test 2.4: Loading States
```
1. Send a message: "List all users"
2. While loading:
   - [ ] Send button shows "..."
   - [ ] Input field is disabled
   - [ ] Loading indicator shows

2. After response:
   - [ ] Button shows "Send" again
   - [ ] Input field is enabled
   - [ ] Message appears in chat
```

## Phase 3: Functionality Testing

### Test 3.1: Conversation Memory
```
1. Send: "I am testing the chatbot"
2. System should remember this

3. Send: "Did I mention testing?"
4. Expected: "Yes, you mentioned testing the chatbot. Is there something specific you'd like help with?"

If failed: Conversation history not maintained
```

### Test 3.2: Multi-Language Support
```
Test 3.2a - English
Ask: "How many users?"
Expected: Response in English

Test 3.2b - Filipino
Ask: "Ilan ang users?" or "Gaano karaming users?"
Expected: Response in Filipino

Test 3.2c - Mixed
Ask: "Show me yung new providers ngayong linggo"
Expected: Hybrid response acknowledging mixed language
```

### Test 3.3: Clear Chat Function
```
1. Send: "First message"
2. Send: "Second message"
3. Click "Clear history" button
4. Expected: All messages disappear
5. Chart messages should be cleared
6. Send: "New message"
7. Expected: Only this message shows (history cleared)
```

### Test 3.4: Error Recovery
```
1. Disconnect internet
2. Try to send message
3. Expected: Friendly error message
4. Restore internet
5. Send message again
6. Expected: Works normally

(Tests error resilience)
```

## Phase 4: Performance Testing

### Test 4.1: Response Time
```
Message: "Hello"
Expected Time: 1-3 seconds (first request), <1s (subsequent)

Message: "Show me appointments"
Expected Time: 2-4 seconds

If much slower: 
- Check internet connection
- Check Gemini API status
- Monitor browser for resource issues
```

### Test 4.2: Conversation Length
```
Send 10+ messages in a row
Expected:
- All messages visible in chat
- No crashes
- Scrolling works smooth
- Performance remains acceptable

If fails:
- May need to implement pagination
- Check browser memory usage
- Consider archiving old messages
```

### Test 4.3: File Size Impact
```
File sizes created:
- gemini-system-instructions.ts: ~7KB
- useGeminiChat.ts: ~2KB
- GeminiChatbot.tsx: ~5KB
- chat/route.ts: ~2KB

Total impact: ~16KB additional code
Expected: Minimal impact on bundle size
```

## Phase 5: Integration Testing

### Test 5.1: Dashboard Integration
```
1. Add to dashboard layout
2. Navigate to dashboard
3. See blue chat button
4. Use chatbot without page breaking
5. Can navigate away and back
6. Chat history persists during session
```

### Test 5.2: Multiple Page Navigation
```
1. Open chatbot
2. Send a message: "Test message"
3. Navigate to different dashboard page
4. Chatbot still visible
5. Send another message
6. Expected: Works from any page
```

### Test 5.3: Concurrent Chat Sessions
```
1. Open two browser tabs with dashboard
2. Send message in Tab 1
3. Send message in Tab 2
4. Expected: Both sessions independent
5. Each maintains own history
```

## Phase 6: Production Readiness

### Check 6.1: Environment Variables
```
Production .env should have:
- GEMINI_API_KEY=xxx (SECRET - use secure vault)
- NEXT_PUBLIC_API_BASE_URL=https://...

Verify:
- Key is valid
- Base URL points to production backend
- No development URLs in production
```

### Check 6.2: Error Logging
```
Monitor your application logs for:
- API errors
- Missing environment variables
- Gemini API failures
- Rate limiting

Set up alerts for:
- High error rates
- Failed authentication
- API quota issues
```

### Check 6.3: Security Checks
```
- [ ] API key is in .env (not exposed in code)
- [ ] NEXT_PUBLIC_* variables don't contain secrets
- [ ] Backend API endpoints validate admin authentication
- [ ] No sensitive data logged to console in production
- [ ] CORS properly configured if needed
```

### Check 6.4: Performance Optimization
```
- [ ] Chatbot doesn't impact page load (lazy loaded)
- [ ] Messages properly cleaned from memory
- [ ] No memory leaks in conversation history
- [ ] Bundle size acceptable

Measure with:
- Lighthouse audit
- Chrome DevTools Performance tab
- Network waterfall analysis
```

## Debugging Common Issues

### Issue: "Cannot find module @google/generative-ai"
```
Solution:
npm install @google/generative-ai
npm run build
Restart dev server
```

### Issue: Chat button appears but doesn't work
```
Debugging steps:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Check Network tab for failed `/api/chatbot/chat` requests
5. Verify .env.local has GEMINI_API_KEY
6. Check that route.ts is in correct directory
```

### Issue: Very slow responses
```
Possible causes:
1. Slow internet connection
2. Gemini API overloaded (check status page)
3. Large conversation history (clear and test)
4. Browser throttling (check DevTools throttling settings)

Solution:
- Clear chat history
- Wait a moment and retry
- Check gemini status: https://status.cloud.google.com/
- Try different internet connection
```

### Issue: Responses seem irrelevant
```
Debugging:
1. Check system instructions are loaded
2. Test different query types
3. Verify backend API documentation is accurate
4. Review response in terms of instructions

Solution:
- Update system instructions with clearer examples
- Add more context to queries
- Test in Gemini Studio first: https://ai.google.dev/
```

### Issue: OpenAI/Other API Used Instead of Gemini
```
Verify correct imports:
```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
// NOT from 'openai' or other libraries
```

## Browser Testing Checklist

Test on these browsers:
- [ ] Chrome 120+
- [ ] Firefox 120+
- [ ] Safari 17+
- [ ] Edge 120+

Mobile testing:
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design breakpoints

## Regression Testing

After each deploy, verify:
- [ ] Chat button appears
- [ ] Can send message
- [ ] Receives response
- [ ] History clears
- [ ] No console errors
- [ ] Performance acceptable

## Load Testing

For testing with multiple concurrent users:
```bash
# Using Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:3000/api/chatbot/chat

# Note: Adjust based on your deployment
```

## Success Criteria

✅ **Passed Testing If:**
- Chat button renders without errors
- Messages send and receive responses
- Conversation history maintained
- Multilingual queries work
- Error handling graceful
- Performance acceptable
- Production deployment smooth

❌ **Not Ready For Production If:**
- Browser console has errors
- API requests fail
- System instructions not loaded
- Memory leaks detected
- Performance degraded
- Environment variables missing

---

**Testing Checklist Status:** Ready to Use
**Last Updated:** 2026-05-28
