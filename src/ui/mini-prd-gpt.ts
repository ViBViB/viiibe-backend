// GPT-4 Mini-PRD Controller
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

const API_URL = 'https://viiibe-backend-fo2xokim1-alberto-contreras-projects-101c33ba.vercel.app/api/chat-gpt';

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
        return "Hey! Tell me about the project you're looking for inspiration for. What kind of design references do you need?\n\nFor example: 'I need inspiration for a transportation company homepage with red colors and Apple-style design targeting multinational clients.'";
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
            this.prd.styles.length > 0 &&
            this.prd.colors.length > 0  // COLORS ARE MANDATORY
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

        let doc = "";

        // Start with project type and industry
        if (projectType && industry) {
            doc += `${projectType} for ${industry}`;
        } else if (projectType) {
            doc += `${projectType}`;
        } else if (industry) {
            doc += `A project for ${industry}`;
        }

        // Add audience
        if (audience) {
            doc += ` targeting ${audience}`;
        }

        // Add visual style
        if (styles.length > 0) {
            doc += ` with ${styles.join(", ")} style`;
        }

        // Add colors
        if (colors.length > 0) {
            doc += ` using ${colors.join(", ")} colors`;
        }

        // Add typography if specified
        if (typography) {
            doc += ` and ${typography} typography`;
        }

        // Add intent if specified
        if (intent) {
            doc += `. The goal is ${intent}`;
        }

        // Add additional notes
        if (additionalNotes) {
            doc += `. ${additionalNotes}`;
        }

        return doc || "A design project";
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

export { MiniPRDController, MiniPRD };
