// Script to detect keyword conflicts in NLP_KEYWORDS
const NLP_KEYWORDS = {
    industries: {
        'Finance': ['finance', 'bank', 'banking', 'financial', 'fintech', 'investment', 'trading', 'stock', 'crypto', 'wallet', 'payment'],
        'Healthcare': ['healthcare', 'health', 'medical', 'hospital', 'clinic', 'doctor', 'medicine', 'wellness', 'therapy'],
        'Ecommerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'shopping', 'marketplace', 'cart', 'checkout', 'product'],
        'Education': ['education', 'learning', 'course', 'school', 'university', 'training', 'academy', 'student', 'teacher'],
        'Real Estate': ['real estate', 'property', 'house', 'apartment', 'realty', 'housing', 'rent', 'buy property', 'sell property'],
        'Tech': ['tech', 'technology', 'software', 'digital', 'cloud', 'ai', 'ml', 'startup', 'innovation'],
        'Saas': ['saas', 'software as a service', 'platform', 'web app', 'webapp', 'cloud software'],
        'Food': ['food', 'restaurant', 'cafe', 'bakery', 'dining', 'culinary', 'recipe', 'cooking', 'chef'],
        'Fashion': ['fashion', 'clothing', 'apparel', 'style', 'boutique', 'wear', 'outfit', 'wardrobe'],
        'Travel': ['travel', 'tourism', 'hotel', 'vacation', 'trip', 'destination', 'booking', 'flight'],
        'NGO': ['ngo', 'nonprofit', 'charity', 'foundation', 'social', 'community', 'volunteer', 'cause'],
        'Portfolio': ['portfolio', 'personal', 'freelance', 'creative', 'designer', 'developer', 'artist'],
        'Fitness': ['fitness', 'gym', 'workout', 'exercise', 'training', 'health club', 'wellness', 'sports'],
        'Agriculture': ['agriculture', 'farming', 'farm', 'organic', 'crops', 'harvest', 'rural', 'agro'],
        'Logistics': ['logistics', 'shipping', 'delivery', 'transport', 'freight', 'courier', 'warehouse', 'supply chain'],
        'Furniture': ['furniture', 'furnishing', 'interior', 'decor', 'home decor', 'sofa', 'table', 'chair'],
        'Consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'business consulting', 'management'],
        'Business': ['business', 'corporate', 'enterprise', 'company', 'professional services'],
        'Sustainability': ['sustainability', 'sustainable', 'green', 'eco', 'environment', 'renewable', 'climate'],
        'Construction': ['construction', 'building', 'contractor', 'architecture', 'engineering', 'renovation'],
        'Beauty': ['beauty', 'cosmetics', 'salon', 'spa', 'makeup', 'skincare', 'haircare', 'aesthetics'],
        'Transportation': ['transportation', 'transport', 'mobility', 'transit', 'automotive', 'vehicle'],
        'Digital Agency': ['digital agency', 'agency', 'marketing agency', 'creative agency', 'advertising', 'branding'],
        'Home Services': ['home services', 'home service', 'cleaning', 'maintenance', 'repair', 'handyman', 'plumbing', 'hvac']
    },
    projectTypes: {
        'landing page': ['landing', 'página', 'homepage', 'home page', 'landing page', 'hero', 'hero section', 'website'],
        'dashboard': ['dashboard', 'panel', 'analytics', 'admin', 'admin panel', 'control panel', 'metrics'],
        'mobile app': ['mobile', 'app', 'ios', 'android', 'smartphone', 'phone', 'aplicación móvil', 'aplicacion movil'],
        'ecommerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'tienda', 'shopping', 'cart', 'checkout', 'product'],
        'saas': ['saas', 'software', 'platform', 'plataforma', 'web app', 'webapp'],
        'portfolio': ['portfolio', 'portafolio', 'showcase', 'work', 'projects'],
        'blog': ['blog', 'article', 'post', 'content', 'editorial']
    }
};

console.log('🔍 Analyzing NLP Keywords for conflicts...\n');

// Flatten all keywords with their categories
const allKeywords = new Map();

// Process industries
for (const [industry, keywords] of Object.entries(NLP_KEYWORDS.industries)) {
    for (const keyword of keywords) {
        if (!allKeywords.has(keyword)) {
            allKeywords.set(keyword, []);
        }
        allKeywords.get(keyword).push({ type: 'industry', name: industry });
    }
}

// Process project types
for (const [projectType, keywords] of Object.entries(NLP_KEYWORDS.projectTypes)) {
    for (const keyword of keywords) {
        if (!allKeywords.has(keyword)) {
            allKeywords.set(keyword, []);
        }
        allKeywords.get(keyword).push({ type: 'projectType', name: projectType });
    }
}

// Find conflicts (keywords appearing in multiple categories)
const conflicts = [];
for (const [keyword, categories] of allKeywords.entries()) {
    if (categories.length > 1) {
        conflicts.push({ keyword, categories });
    }
}

if (conflicts.length === 0) {
    console.log('✅ No keyword conflicts found!\n');
} else {
    console.log(`❌ Found ${conflicts.length} keyword conflicts:\n`);

    conflicts.forEach(({ keyword, categories }) => {
        console.log(`"${keyword}" appears in:`);
        categories.forEach(cat => {
            console.log(`  - ${cat.type}: ${cat.name}`);
        });
        console.log('');
    });
}

// Check for substring conflicts (keywords that contain other keywords)
console.log('\n🔍 Checking for substring conflicts...\n');

const substringConflicts = [];
const keywordList = Array.from(allKeywords.keys());

for (let i = 0; i < keywordList.length; i++) {
    for (let j = i + 1; j < keywordList.length; j++) {
        const kw1 = keywordList[i];
        const kw2 = keywordList[j];

        // Check if one contains the other (but they're not the same)
        if (kw1.includes(kw2) || kw2.includes(kw1)) {
            substringConflicts.push({
                keyword1: kw1,
                keyword2: kw2,
                categories1: allKeywords.get(kw1),
                categories2: allKeywords.get(kw2)
            });
        }
    }
}

if (substringConflicts.length === 0) {
    console.log('✅ No substring conflicts found!\n');
} else {
    console.log(`⚠️ Found ${substringConflicts.length} potential substring conflicts:\n`);

    substringConflicts.slice(0, 20).forEach(({ keyword1, keyword2, categories1, categories2 }) => {
        console.log(`"${keyword1}" contains/overlaps "${keyword2}"`);
        console.log(`  "${keyword1}" in: ${categories1.map(c => c.name).join(', ')}`);
        console.log(`  "${keyword2}" in: ${categories2.map(c => c.name).join(', ')}`);
        console.log('');
    });

    if (substringConflicts.length > 20) {
        console.log(`... and ${substringConflicts.length - 20} more\n`);
    }
}
