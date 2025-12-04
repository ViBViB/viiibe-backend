/**
 * Tag Combiner
 * Combines Vision AI and GPT-4 Vision outputs into unified tag system
 */

import type { VisionAnalysis } from './vision-ai';
import type { GPT4Analysis } from './gpt4-vision';

export interface PinTags {
    style: string[];
    color: string[];
    type: string[];
    typography: string;
    imagery: string[];
    industry: string[];
    layout: string;
    elements: string[];
    confidence: number;
}

interface PinMetadata {
    title: string;
    description: string;
    pinterestUrl: string;
}

/**
 * Combine AI analyses into unified tag system
 */
export function combineTags(
    visionData: VisionAnalysis,
    gptData: GPT4Analysis,
    pinMetadata: PinMetadata
): PinTags {
    return {
        style: extractStyleTags(visionData, gptData),
        color: extractColorTags(visionData),
        type: extractTypeTags(visionData, gptData, pinMetadata),
        typography: gptData.typography,
        imagery: extractImageryTags(visionData),
        industry: gptData.industry,
        layout: gptData.layout,
        elements: gptData.elements,
        confidence: calculateConfidence(visionData, gptData)
    };
}

/**
 * Extract style tags from analyses
 */
function extractStyleTags(vision: VisionAnalysis, gpt: GPT4Analysis): string[] {
    const tags = new Set<string>();

    // Add GPT-4 style tags
    gpt.style.forEach(tag => tags.add(tag));

    // Infer from Vision AI labels
    const styleKeywords = {
        'minimal': ['minimal', 'simple', 'clean'],
        'bold': ['bold', 'vibrant', 'striking'],
        'dark': ['dark', 'night', 'black'],
        'light': ['light', 'bright', 'white'],
        'gradient': ['gradient', 'colorful'],
        'modern': ['modern', 'contemporary']
    };

    vision.labels.forEach(label => {
        Object.entries(styleKeywords).forEach(([style, keywords]) => {
            if (keywords.some(kw => label.includes(kw))) {
                tags.add(style);
            }
        });
    });

    return Array.from(tags).slice(0, 5);
}

/**
 * Extract color tags
 */
function extractColorTags(vision: VisionAnalysis): string[] {
    return vision.colors
        .filter(c => c.score > 0.1)
        .map(c => c.color)
        .filter((color, index, self) => self.indexOf(color) === index) // unique
        .slice(0, 3);
}

/**
 * Extract type tags
 */
function extractTypeTags(
    vision: VisionAnalysis,
    gpt: GPT4Analysis,
    metadata: PinMetadata
): string[] {
    const tags = new Set<string>();

    // From Vision AI labels
    const typeKeywords = {
        'landing-page': ['landing', 'homepage', 'website'],
        'dashboard': ['dashboard', 'analytics', 'chart'],
        'mobile-app': ['mobile', 'app', 'phone', 'ios', 'android'],
        'ecommerce': ['shop', 'store', 'product', 'cart'],
        'saas': ['software', 'platform', 'tool'],
        'portfolio': ['portfolio', 'gallery']
    };

    vision.labels.forEach(label => {
        Object.entries(typeKeywords).forEach(([type, keywords]) => {
            if (keywords.some(kw => label.includes(kw))) {
                tags.add(type);
            }
        });
    });

    // From metadata
    const titleLower = metadata.title.toLowerCase();
    Object.entries(typeKeywords).forEach(([type, keywords]) => {
        if (keywords.some(kw => titleLower.includes(kw))) {
            tags.add(type);
        }
    });

    // Default if none found
    if (tags.size === 0) {
        tags.add('website');
    }

    return Array.from(tags).slice(0, 3);
}

/**
 * Extract imagery tags
 */
function extractImageryTags(vision: VisionAnalysis): string[] {
    const tags = new Set<string>();

    const imageryKeywords = {
        'photography': ['photo', 'photograph', 'camera'],
        'illustration': ['illustration', 'drawing', 'art'],
        '3d-render': ['3d', 'render', 'cgi'],
        'icons': ['icon', 'symbol'],
        'abstract': ['abstract', 'pattern'],
        'product-shots': ['product', 'item'],
        'people': ['person', 'people', 'human', 'face'],
        'nature': ['nature', 'landscape', 'outdoor']
    };

    vision.labels.forEach(label => {
        Object.entries(imageryKeywords).forEach(([imagery, keywords]) => {
            if (keywords.some(kw => label.includes(kw))) {
                tags.add(imagery);
            }
        });
    });

    return Array.from(tags).slice(0, 3);
}

/**
 * Calculate confidence score
 */
function calculateConfidence(vision: VisionAnalysis, gpt: GPT4Analysis): number {
    let confidence = 0.5; // Base confidence

    // More labels = higher confidence
    if (vision.labels.length > 10) confidence += 0.2;
    else if (vision.labels.length > 5) confidence += 0.1;

    // More colors detected = higher confidence
    if (vision.colors.length >= 3) confidence += 0.1;

    // GPT-4 provided detailed analysis = higher confidence
    if (gpt.elements.length > 3) confidence += 0.1;
    if (gpt.style.length > 2) confidence += 0.1;

    return Math.min(confidence, 1.0);
}
