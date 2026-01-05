# New Chat UI Implementation Summary

## Changes Made

### HTML (`index.html`)

**Initial View** (lines 15-33):
- Illustration placeholder: `/moodboard-illustration.png`
- Title: "What will spark your creativity today?"
- Large textarea with placeholder
- Send button with upward arrow SVG

**Chat View** (lines 175-195):
- New `#view-chat` section
- Messages container: `#chatMessages`
- Input area with textarea and send button
- Same SVG button as initial view

### CSS (`src/styles/main.css`)

**Initial Screen Styles**:
- `.initial-illustration`: 200px width, centered
- `.initial-title`: 24px, font-weight 600
- `.initial-textarea`: Rounded input with gray background
- `.initial-send-btn`: Positioned absolute in bottom-right

**Chat View Styles**:
- `.message-user`: Gray bubble, rounded corners, 14px
- `.message-assistant-main`: **18px, font-weight 600** (main response)
- `.message-assistant-question`: **14px, font-weight 400** (questions)
- `.chat-input-area`: Fixed bottom with gradient background
- No avatars for either user or assistant

## Typography Specs (Per Screenshots)

| Element | Font Size | Font Weight | Color |
|---------|-----------|-------------|-------|
| GPT-4 Main Response | 18px | 600 (semi-bold) | #000 |
| GPT-4 Question/Suggestion | 14px | 400 (regular) | #666 |
| User Bubble | 14px | 400 | #000 |
| Input Placeholder | 14px | 400 | #999 |

## Next Steps

1. **Add illustration PNG** to project root
2. **Update TypeScript logic** in `src/main.ts`:
   - Handle `#initialSendButton` click
   - Transition from initial view to chat view
   - Append messages dynamically
   - Format GPT-4 responses with main + question structure
3. **Test in Figma plugin**

## Key Design Decisions

- **No avatars**: Clean, text-focused interface
- **Asymmetric bubbles**: User gets bubble, GPT-4 is plain text
- **Typography hierarchy**: Bold 18px for responses, regular 14px for questions
- **Consistent button**: Same SVG used in both views
