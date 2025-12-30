#!/bin/bash

# Backup
cp src/main.ts src/main.ts.backup2

# Remove old class (lines 16-471)
sed -i '' '16,471d' src/main.ts

# Insert new GPT-4 class at line 16
cat > /tmp/gpt4-class.ts << 'EOF'
interface MiniPRD {
    industry: string | null;
    projectType: string | null;
    audience: string | null;
    styles: string[];
    colors: string[];
    typography: string | null;
    intent: string | null;
    additionalNotes: string | null;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const API_URL = 'https://viiibe-backend-rc2dhfcsm-alberto-contreras-projects-101c33ba.vercel.app/api/chat-gpt';

class MiniPRDController {
    private conversationHistory: Message[];
    private prd: MiniPRD;
    private isLoading: boolean;

    constructor() {
        this.conversationHistory = [];
        this.prd = {
            industry: null,
            projectType: null,
            audience: null,
            styles: [],
            colors: [],
            typography: null,
            intent: null,
            additionalNotes: null
        };
        this.isLoading = false;
    }

    getInitialPrompt(): string {
        return "Hey! Tell me about your project in as much detail as you'd like. What are you looking to create?\n\nFor example: 'I need a homepage for a transportation company with red colors and Apple-style design targeting multinational clients.'";
    }

    async sendMessage(userMessage: string): Promise<string> {
        if (this.isLoading) {
            return "Please wait for the current response...";
        }

        this.isLoading = true;

        try {
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: this.conversationHistory.slice(0, -1)
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            this.conversationHistory.push({
                role: 'assistant',
                content: data.reply
            });

            if (data.prdUpdate) {
                this.updatePRD(data.prdUpdate);
            }

            this.isLoading = false;
            return data.reply;

        } catch (error) {
            console.error('GPT-4 API error:', error);
            this.isLoading = false;
            return "Sorry, I'm having trouble connecting. Please try again.";
        }
    }

    private updatePRD(update: Partial<MiniPRD>): void {
        if (update.industry) this.prd.industry = update.industry;
        if (update.projectType) this.prd.projectType = update.projectType;
        if (update.audience) this.prd.audience = update.audience;
        if (update.typography) this.prd.typography = update.typography;
        if (update.intent) this.prd.intent = update.intent;
        if (update.additionalNotes) this.prd.additionalNotes = update.additionalNotes;
        
        if (update.styles) {
            update.styles.forEach(style => {
                if (!this.prd.styles.includes(style)) {
                    this.prd.styles.push(style);
                }
            });
        }
        if (update.colors) {
            update.colors.forEach(color => {
                if (!this.prd.colors.includes(color)) {
                    this.prd.colors.push(color);
                }
            });
        }
    }

    isPRDComplete(): boolean {
        return !!(
            this.prd.industry &&
            this.prd.projectType &&
            this.prd.audience &&
            this.prd.styles.length > 0
        );
    }

    getPRD(): MiniPRD {
        return { ...this.prd };
    }

    getSummary(): string {
        const { industry, projectType, audience, styles, colors } = this.prd;

        let summary = "";
        if (projectType) summary += `${projectType} `;
        if (industry) summary += `for ${industry} `;
        if (audience) summary += `targeting ${audience} `;
        if (styles.length > 0) summary += `with ${styles.join(", ")} style `;
        if (colors.length > 0) summary += `using ${colors.join(", ")} colors`;

        return summary.trim() || "a design project";
    }

    generatePRDDocument(): string {
        const { industry, projectType, audience, styles, colors, typography, intent, additionalNotes } = this.prd;

        let doc = "# Project Brief\n\n";
        
        if (projectType) doc += `**Project Type**: ${projectType}\n\n`;
        if (industry) doc += `**Industry**: ${industry}\n\n`;
        if (audience) doc += `**Target Audience**: ${audience}\n\n`;
        if (styles.length > 0) doc += `**Visual Style**: ${styles.join(", ")}\n\n`;
        if (colors.length > 0) doc += `**Colors**: ${colors.join(", ")}\n\n`;
        if (typography) doc += `**Typography**: ${typography}\n\n`;
        if (intent) doc += `**Project Intent**: ${intent}\n\n`;
        if (additionalNotes) doc += `**Additional Notes**: ${additionalNotes}\n\n`;

        return doc;
    }

    reset(): void {
        this.conversationHistory = [];
        this.prd = {
            industry: null,
            projectType: null,
            audience: null,
            styles: [],
            colors: [],
            typography: null,
            intent: null,
            additionalNotes: null
        };
        this.isLoading = false;
    }

    getConversationHistory(): Message[] {
        return [...this.conversationHistory];
    }
}

EOF

# Insert the new class
sed -i '' '15r /tmp/gpt4-class.ts' src/main.ts

echo "Class replaced successfully"
