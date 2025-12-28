// ============================================
// MOOOD! COLLECTOR - CATEGORIES CONFIGURATION
// ============================================
// Centralized list of all 22 categories
// DO NOT MODIFY without updating all dependent files

const CATEGORIES_CONFIG = {
    // Core industries - Target: 100 pins each
    core: [
        { name: 'Finance', target: 100 },
        { name: 'Fitness', target: 100 },
        { name: 'Ecommerce', target: 100 },
        { name: 'Tech', target: 100 },
        { name: 'Education', target: 100 },
        { name: 'Saas', target: 100 },
        { name: 'Healthcare', target: 100 }
    ],

    // Secondary industries - Target: 50 pins each
    secondary: [
        { name: 'Real estate', target: 50 },
        { name: 'Food', target: 50 },
        { name: 'Fashion', target: 50 },
        { name: 'Travel', target: 50 },
        { name: 'Construction', target: 50 },
        { name: 'Furniture', target: 50 },
        { name: 'Home services', target: 50 },
        { name: 'Logistics', target: 50 },
        { name: 'Business', target: 50 },
        { name: 'Sustainability', target: 50 },
        { name: 'Consulting', target: 50 },
        { name: 'Transportation', target: 50 },
        { name: 'Digital agency', target: 50 },
        { name: 'Beauty', target: 50 },
        { name: 'Agriculture', target: 50 }
    ]
};

// Get all categories as a flat array
function getAllCategories() {
    return [
        ...CATEGORIES_CONFIG.core,
        ...CATEGORIES_CONFIG.secondary
    ];
}

// Find the current mission (category with lowest completion that needs work)
// Returns: { name, target, current, progress, tier, isComplete }
function getCurrentMission(counts) {
    const allCategories = getAllCategories();

    // Find incomplete categories, sorted by count (lowest first = highest priority)
    const incomplete = allCategories
        .map(cat => {
            // Case-insensitive lookup
            const count = getCountCaseInsensitive(counts, cat.name);
            return {
                name: cat.name,
                target: cat.target,
                current: count,
                progress: Math.round((count / cat.target) * 100),
                tier: CATEGORIES_CONFIG.core.some(c => c.name === cat.name) ? 'core' : 'secondary',
                isComplete: count >= cat.target
            };
        })
        .filter(cat => !cat.isComplete)
        .sort((a, b) => a.current - b.current); // Lowest first (needs most work)

    if (incomplete.length === 0) {
        // All complete!
        return {
            name: null,
            isAllComplete: true,
            message: 'All 22 categories are complete!'
        };
    }

    return incomplete[0];
}

// Case-insensitive count lookup
function getCountCaseInsensitive(counts, name) {
    if (!counts) return 0;

    // Try exact match first
    if (counts[name] !== undefined) return counts[name];

    // Try lowercase match
    const lowerName = name.toLowerCase();
    for (const key of Object.keys(counts)) {
        if (key.toLowerCase() === lowerName) {
            return counts[key];
        }
    }

    return 0;
}

// Export for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CATEGORIES_CONFIG, getAllCategories, getCurrentMission, getCountCaseInsensitive };
}
