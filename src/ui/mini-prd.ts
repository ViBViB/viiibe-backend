/**
 * Mini-PRD Conversation Controller
 * Manages the 5-question conversational flow for moodboard generation
 */

export interface ConversationIntent {
    industry: string | null;
    projectType: string | null;
    styles: string[];
    colors: string[];
    exclusions: string[];
    rawResponses: string[];
}

export class MiniPRDController {
    private state: {
        currentQuestion: number;
        responses: string[];
        intent: ConversationIntent;
    };

    constructor() {
        this.state = {
            currentQuestion: 1,
            responses: [],
            intent: {
                industry: null,
                projectType: null,
                styles: [],
                colors: [],
                exclusions: [],
                rawResponses: []
            }
        };
    }

    getQuestion(questionNumber: number): string {
        const questions = [
            "¡Hey! Cuéntame, ¿qué estás diseñando? 🎨",
            "Interesante! ¿Qué tipo de proyecto es? Por ejemplo: landing page, app móvil, dashboard...",
            "Perfecto. ¿Cómo quieres que se sienta? Minimalista y clean, bold y expresivo, dark y sofisticado...",
            "Nice! ¿Hay algún color en mente? Azul, verde, neutros...",
            "Última pregunta: ¿hay algo que definitivamente NO quieras ver?"
        ];
        return questions[questionNumber - 1] || "";
    }

    processResponse(response: string): void {
        this.state.responses.push(response);
        this.state.intent.rawResponses.push(response);

        const currentQ = this.state.currentQuestion;

        if (currentQ === 1) {
            this.state.intent.industry = this.extractIndustry(response);
        } else if (currentQ === 2) {
            this.state.intent.projectType = this.extractProjectType(response);
        } else if (currentQ === 3) {
            this.state.intent.styles = this.extractStyles(response);
        } else if (currentQ === 4) {
            this.state.intent.colors = this.extractColors(response);
        } else if (currentQ === 5) {
            this.state.intent.exclusions = this.extractExclusions(response);
        }

        this.state.currentQuestion++;
    }

    isComplete(): boolean {
        return this.state.currentQuestion > 5;
    }

    getCurrentQuestion(): number {
        return this.state.currentQuestion;
    }

    getIntent(): ConversationIntent {
        return this.state.intent;
    }

    getSummary(): string {
        const { industry, projectType, styles, colors } = this.state.intent;

        let summary = "";
        if (projectType) summary += `${projectType} `;
        if (industry) summary += `para ${industry} `;
        if (styles.length > 0) summary += `con estilo ${styles.join(", ")} `;
        if (colors.length > 0) summary += `usando colores ${colors.join(", ")}`;

        return summary.trim() || "un proyecto de diseño";
    }

    private extractIndustry(text: string): string | null {
        const lowerText = text.toLowerCase();
        const industryKeywords: { [key: string]: string } = {
            'finance': 'Finance', 'fintech': 'Finance', 'banco': 'Finance',
            'fitness': 'Fitness', 'gym': 'Fitness', 'gimnasio': 'Fitness',
            'ecommerce': 'Ecommerce', 'tienda': 'Ecommerce',
            'tech': 'Tech', 'software': 'Tech',
            'education': 'Education', 'educación': 'Education',
            'saas': 'Saas', 'plataforma': 'Saas',
            'healthcare': 'Healthcare', 'salud': 'Healthcare',
            'real estate': 'Real estate', 'inmobiliaria': 'Real estate',
            'food': 'Food', 'restaurante': 'Food',
            'fashion': 'Fashion', 'moda': 'Fashion',
            'travel': 'Travel', 'viajes': 'Travel'
        };

        for (const [keyword, category] of Object.entries(industryKeywords)) {
            if (lowerText.includes(keyword)) {
                return category;
            }
        }
        return null;
    }

    private extractProjectType(text: string): string | null {
        const lowerText = text.toLowerCase();
        const projectTypes: { [key: string]: string } = {
            'landing': 'Landing page',
            'dashboard': 'Dashboard',
            'mobile': 'Mobile app',
            'app': 'Mobile app',
            'móvil': 'Mobile app'
        };

        for (const [keyword, type] of Object.entries(projectTypes)) {
            if (lowerText.includes(keyword)) {
                return type;
            }
        }
        return null;
    }

    private extractStyles(text: string): string[] {
        const lowerText = text.toLowerCase();
        const styles: string[] = [];
        const styleKeywords: { [key: string]: string } = {
            'minimalist': 'minimalist', 'minimal': 'minimalist', 'minimalista': 'minimalist',
            'bold': 'bold', 'llamativo': 'bold',
            'dark': 'dark', 'oscuro': 'dark',
            'elegant': 'elegant', 'elegante': 'elegant',
            'modern': 'modern', 'moderno': 'modern'
        };

        for (const [keyword, style] of Object.entries(styleKeywords)) {
            if (lowerText.includes(keyword) && !styles.includes(style)) {
                styles.push(style);
            }
        }
        return styles;
    }

    private extractColors(text: string): string[] {
        const lowerText = text.toLowerCase();
        const colors: string[] = [];
        const colorKeywords: { [key: string]: string } = {
            'red': 'red', 'rojo': 'red',
            'blue': 'blue', 'azul': 'blue',
            'green': 'green', 'verde': 'green',
            'neutral': 'neutral', 'neutro': 'neutral'
        };

        for (const [keyword, color] of Object.entries(colorKeywords)) {
            if (lowerText.includes(keyword) && !colors.includes(color)) {
                colors.push(color);
            }
        }
        return colors;
    }

    private extractExclusions(text: string): string[] {
        const lowerText = text.toLowerCase();
        const exclusions: string[] = [];
        const keywords: { [key: string]: string } = {
            'minimalist': 'minimalist', 'bold': 'bold', 'dark': 'dark',
            'corporate': 'professional', 'corporativo': 'professional'
        };

        for (const [keyword, value] of Object.entries(keywords)) {
            if (lowerText.includes(keyword) && !exclusions.includes(value)) {
                exclusions.push(value);
            }
        }
        return exclusions;
    }

    reset(): void {
        this.state = {
            currentQuestion: 1,
            responses: [],
            intent: {
                industry: null,
                projectType: null,
                styles: [],
                colors: [],
                exclusions: [],
                rawResponses: []
            }
        };
    }
}
