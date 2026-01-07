import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// System prompt for design consultant
const SYSTEM_PROMPT = `You are an expert design consultant helping designers find visual inspiration and design references for their projects.

Your goal is to gather ALL of the following information through natural conversation so you can help them find the perfect design inspiration:
1. Industry (e.g., Finance, Healthcare, Tech, Transportation, Travel, Fitness, etc.)
2. Project Type (e.g., Landing page, Mobile app, Dashboard, Website)
3. Target Audience (e.g., young professionals, investors, millennials, beginners, general public)
4. Visual Style (e.g., minimalist, bold, dark, elegant, modern, clean)
5. **COLORS** - THIS IS CRITICAL! (specific colors like "blue", "red", "green", "neutral tones", etc.)
6. Typography (optional - sans-serif, serif, specific fonts)
7. Project Intent (optional - e.g., lead capture, product launch, brand awareness)

CRITICAL RULES:
- **NEVER EVER repeat the user's question back to them**
- **ALWAYS provide helpful, specific answers and recommendations when asked**
- When user says "suggest", "recommend", "what would you suggest", "what do you think", etc., you MUST give 2-3 specific recommendations
- DO NOT ask them to tell you - GIVE THEM SUGGESTIONS based on their industry and audience

EXAMPLES OF WHAT NOT TO DO:
❌ User: "Would love you to suggest a visual style"
❌ You: "Could you tell me about visual style?" ← NEVER DO THIS

EXAMPLES OF WHAT TO DO:
✅ User: "Would love you to suggest a visual style"
✅ You: "For transportation targeting agro exporters, I'd suggest either a bold, modern style with strong typography to convey reliability, or a clean, professional look with subtle animations. Which direction appeals more to you?"

✅ User: "What colors would work?"
✅ You: "For transportation, I'd recommend either deep blues and grays for trust and professionalism, or vibrant oranges and reds for energy and speed. What feeling do you want to convey?"

- Ask intelligent follow-up questions AFTER providing value
- Don't ask for information they've already given
- Be conversational and natural, not robotic
- Keep responses concise (2-3 sentences max)

COMPLETION REQUIREMENTS:
- You MUST collect: Industry, Project Type, Target Audience, Visual Style, AND Colors
- Colors are MANDATORY - if user hasn't mentioned colors, you MUST ask: "What colors would you like to see? For example, vibrant blues, warm earth tones, or bold reds?"
- DO NOT say "I have everything I need" until you have AT LEAST: industry, project type, audience, style, AND colors
- Only when you have ALL required fields, say: "Perfect! I have everything I need. Let me summarize..."
- Then provide a clean summary WITHOUT asterisks or markdown formatting
- Ask if they'd like to proceed or add anything else

Use the update_mini_prd function to save extracted information as you learn it, but ALWAYS include a helpful text response.`;

// Function definition for structured data extraction
const MINI_PRD_FUNCTION = {
    name: 'update_mini_prd',
    description: 'Update the Mini-PRD with extracted information from the conversation',
    parameters: {
        type: 'object',
        properties: {
            industry: {
                type: 'string',
                description: 'The industry or sector (e.g., Finance, Healthcare, Tech, Transportation)',
            },
            projectType: {
                type: 'string',
                description: 'The type of project (e.g., Landing page, Mobile app, Dashboard)',
            },
            audience: {
                type: 'string',
                description: 'The target audience (e.g., young professionals, investors, millennials)',
            },
            styles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Visual styles (e.g., minimalist, bold, dark, elegant)',
            },
            colors: {
                type: 'array',
                items: { type: 'string' },
                description: 'Colors or hex values (e.g., #FF0000, blue, neutral)',
            },
            typography: {
                type: 'string',
                description: 'Typography style or font family (e.g., sans-serif, SF Pro)',
            },
            intent: {
                type: 'string',
                description: 'Project intent or goal (e.g., lead capture, product launch)',
            },
            additionalNotes: {
                type: 'string',
                description: 'Any additional context or requirements',
            },
        },
    },
};

interface Message {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
}

interface ChatRequest {
    message: string;
    history?: Message[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history = [] }: ChatRequest = req.body;

        // Validate input
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build messages array
        const messages: Message[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history as Message[]),
            { role: 'user', content: message },
        ];

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-1106-preview',
            messages: messages as any,
            functions: [MINI_PRD_FUNCTION],
            function_call: 'auto',
            temperature: 0.7,
            max_tokens: 300, // Keep responses concise
        });

        const choice = completion.choices[0];
        const assistantMessage = choice.message;

        // Check if GPT-4 called the function
        let prdUpdate = null;
        if (assistantMessage.function_call) {
            try {
                prdUpdate = JSON.parse(assistantMessage.function_call.arguments);
            } catch (e) {
                console.error('Failed to parse function call arguments:', e);
            }
        }

        // Get the reply text
        let reply = assistantMessage.content || '';

        // If reply is too short or generic and we have PRD updates, generate a better response
        if (reply.length < 20 || reply.includes('Let me help you with that')) {
            if (prdUpdate) {
                const extracted = [];
                if (prdUpdate.industry) extracted.push(`industry: ${prdUpdate.industry}`);
                if (prdUpdate.projectType) extracted.push(`project type: ${prdUpdate.projectType}`);
                if (prdUpdate.audience) extracted.push(`audience: ${prdUpdate.audience}`);
                if (prdUpdate.styles && prdUpdate.styles.length > 0) extracted.push(`style: ${prdUpdate.styles.join(', ')}`);
                if (prdUpdate.colors && prdUpdate.colors.length > 0) extracted.push(`colors: ${prdUpdate.colors.join(', ')}`);

                if (extracted.length > 0) {
                    reply = `Great! I've got ${extracted.join(', ')}. `;

                    // Ask for what's missing
                    const missing = [];
                    if (!prdUpdate.audience) missing.push('target audience');
                    if (!prdUpdate.styles || prdUpdate.styles.length === 0) missing.push('visual style');
                    if (!prdUpdate.typography) missing.push('typography preference');
                    if (!prdUpdate.intent) missing.push('project intent');

                    if (missing.length > 0) {
                        reply += `Could you tell me about ${missing.slice(0, 2).join(' and ')}?`;
                    } else {
                        reply += `I have all the information I need. Let me confirm: ${extracted.join(', ')}. Does this look correct?`;
                    }
                }
            }
        }

        // Return response
        return res.status(200).json({
            reply: reply || 'Could you tell me more about your project?',
            prdUpdate,
            usage: {
                promptTokens: completion.usage?.prompt_tokens || 0,
                completionTokens: completion.usage?.completion_tokens || 0,
                totalTokens: completion.usage?.total_tokens || 0,
            },
        });
    } catch (error: any) {
        console.error('OpenAI API error:', error);

        // Handle specific OpenAI errors
        if (error.status === 429) {
            return res.status(429).json({
                error: 'Rate limit exceeded. Please try again in a moment.',
            });
        }

        if (error.status === 401) {
            return res.status(500).json({
                error: 'API configuration error. Please contact support.',
            });
        }

        // Generic error
        return res.status(500).json({
            error: 'Failed to process your request. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
}
