# GPT-4 Mini-PRD Integration - Testing Guide

## ✅ Implementation Complete

### What Was Done

**Backend (Phase 1)**
- Created `/api/chat-gpt.ts` endpoint with GPT-4 Turbo integration
- Implemented design consultant system prompt
- Added function calling for structured data extraction
- Deployed to Vercel successfully
- **Cost per conversation**: ~$0.01

**Frontend (Phase 2)**
- Replaced keyword-based NLP with GPT-4 conversational system
- Updated `handleChatSend()` to async with typing indicator
- Modified `showConfirmation()` to use new MiniPRD structure
- Added typing indicator animation (3 dots)
- Removed fixed progress indicator
- **Build size**: 70.84 kB (gzip: 18.95 kB)

---

## 🧪 How to Test

### 1. Reload the Plugin in Figma
- Open Figma
- Go to Plugins → Development → Viiibe!
- Or press `Cmd+Option+P` and search for "Viiibe!"

### 2. Start Mini-PRD
- Click "Crear con Moood! 💬" button
- You should see the new GPT-4 prompt:
  > "Hey! Tell me about your project in as much detail as you'd like. What are you looking to create?
  > 
  > For example: 'I need a homepage for a transportation company with red colors and Apple-style design targeting multinational clients.'"

### 3. Test Conversation Flow

**Test Case 1: Complete Information Upfront**
```
You: "I need a homepage for a transportation company with red colors and Apple-style design targeting multinational clients"

Expected:
- Typing indicator appears (3 animated dots)
- GPT-4 responds naturally
- Extracts: industry=Transportation, projectType=Homepage, colors=[red], styles=[Apple style], audience=multinational clients
- May ask follow-up questions or confirm completion
```

**Test Case 2: Gradual Information**
```
You: "I need a mobile app"
GPT-4: "Great! What industry is this for?"
You: "Healthcare"
GPT-4: "Perfect! Who is your target audience?"
... continues until complete
```

**Test Case 3: Vague Input**
```
You: "Something modern"
GPT-4: "I'd love to help! Could you tell me more about what type of project this is?"
```

### 4. Verify PRD Completion
- When GPT-4 has all required info (industry, project type, audience, styles)
- Confirmation screen should appear automatically
- Should show:
  - Summary: "Homepage for Transportation targeting multinational clients with Apple style style using red colors"
  - Tags for each extracted field

### 5. Generate Moodboard
- Click "Generate my moodboard"
- Should search with extracted intent
- Results should be highly relevant

---

## 🐛 Known Issues to Watch For

1. **API Errors**: If you see "Sorry, I'm having trouble connecting"
   - Check Vercel deployment is live
   - Check OPENAI_API_KEY is set
   - Check browser console for errors

2. **Typing Indicator Stuck**: If dots keep animating
   - Refresh the plugin
   - Check network tab for failed requests

3. **No Response**: If GPT-4 doesn't respond
   - Check OpenAI API status
   - Check rate limits (unlikely with current usage)

---

## 📊 Cost Tracking

**During Testing**:
- Each conversation: ~$0.01
- 10 test conversations: ~$0.10
- 100 test conversations: ~$1.00

**Monitor in OpenAI Dashboard**:
https://platform.openai.com/usage

---

## 🔄 Rollback if Needed

If something breaks:
```bash
cd /Users/elnegro/Figma-plugins/viiibe-plugin
cp src/main.ts.backup src/main.ts
npm run build
```

---

## ✨ What's Different from Before

**Old System**:
- 6 fixed questions in sequence
- Keyword matching (English only)
- Tag-based summary
- Felt mechanical

**New System**:
- Open-ended conversation
- GPT-4 understands context
- Natural follow-up questions
- Professional Mini-PRD document
- Feels like talking to a consultant

---

## 🎯 Next Steps (If Testing Goes Well)

1. **Phase 3**: Mini-PRD Document Generation
   - Markdown rendering
   - Inline editing
   - Export as PDF

2. **Phase 4**: Polish & Optimization
   - Response streaming (real-time text)
   - Conversation caching
   - Performance tuning

3. **Launch**: Gradual rollout
   - 10% of users → GPT-4
   - Monitor metrics
   - Full rollout if successful

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12)
2. Check Vercel logs: `vercel logs`
3. Test API directly: `node scripts/test-gpt-chat.mjs`

**Ready to test!** 🚀
