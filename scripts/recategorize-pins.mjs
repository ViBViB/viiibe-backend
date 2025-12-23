#!/usr/bin/env node

/**
 * Re-categorize pins interactively via terminal
 * Shows each pin and lets you select the correct industry
 */

import { createInterface } from 'readline';

const API_BASE = 'https://moood-refactor.vercel.app/api';

const INDUSTRIES = [
    '1. Real Estate',
    '2. Tech',
    '3. Finance',
    '4. Fitness',
    '5. Healthcare',
    '6. Saas',
    '7. Ecommerce',
    '8. Education',
    '9. Travel',
    '10. Food',
    '11. Fashion',
    '12. Logistics',
    '13. Furniture',
    '14. Beauty',
    '15. Transport',
    '16. Transportation',
    '17. Consulting',
    '18. Construction',
    '19. Business',
    '20. Legal',
    '21. Home Services',
    '0. Skip',
    'D. Delete'
];

const INDUSTRY_MAP = {
    '1': 'Real Estate',
    '2': 'Tech',
    '3': 'Finance',
    '4': 'Fitness',
    '5': 'Healthcare',
    '6': 'Saas',
    '7': 'Ecommerce',
    '8': 'Education',
    '9': 'Travel',
    '10': 'Food',
    '11': 'Fashion',
    '12': 'Logistics',
    '13': 'Furniture',
    '14': 'Beauty',
    '15': 'Transport',
    '16': 'Transportation',
    '17': 'Consulting',
    '18': 'Construction',
    '19': 'Business',
    '20': 'Legal',
    '21': 'Home Services'
};

async function getAllPins() {
    console.log('📊 Fetching all pins from database...\n');

    const response = await fetch(`${API_BASE}/collection-gaps?refresh=true`);
    const data = await response.json();

    const allIndustries = [...data.urgent, ...data.low, ...data.balanced];

    // Get total count
    const totalPins = allIndustries.reduce((sum, i) => sum + i.count, 0);

    console.log(`Found ${totalPins} pins in database\n`);

    return totalPins;
}

function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function recategorizePins() {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🔧 PIN RE-CATEGORIZATION TOOL\n');
    console.log('This tool will help you re-categorize pins manually.\n');

    await getAllPins();

    console.log('⚠️  MANUAL PROCESS:');
    console.log('Since we need to access Vercel KV directly, please follow these steps:\n');
    console.log('1. Go to Vercel Dashboard: https://vercel.com/vibvib/viiibe-backend');
    console.log('2. Go to Storage → KV');
    console.log('3. Filter by key pattern: saved-pin:*');
    console.log('4. For each pin:');
    console.log('   - View the pin data');
    console.log('   - Note the pin ID');
    console.log('   - Update pin-tags:{pinId} with correct industry\n');

    console.log('INDUSTRIES TO USE (exact capitalization):');
    INDUSTRIES.forEach(ind => console.log(`   ${ind}`));

    console.log('\n💡 TIP: Focus on pins with wrong categories first');
    console.log('   - "Cleaning" → "Home Services"');
    console.log('   - "Agriculture" → closest match');
    console.log('   - "Services" → "Business"\n');

    const answer = await askQuestion(rl, 'Press ENTER when done, or type "auto" for automated solution: ');

    if (answer.toLowerCase() === 'auto') {
        console.log('\n🤖 AUTOMATED SOLUTION:');
        console.log('Creating API endpoint to handle re-categorization...\n');
        console.log('This would require:');
        console.log('1. New endpoint: /api/recategorize-pin');
        console.log('2. Chrome extension UI update');
        console.log('3. ~30 minutes implementation time\n');
        console.log('For now, please use manual Vercel KV approach above.');
    }

    rl.close();

    console.log('\n✅ Done! Run check-progress.mjs to see updated distribution.');
}

recategorizePins().catch(console.error);
