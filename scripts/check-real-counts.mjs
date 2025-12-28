import 'dotenv/config';

const API_URL = 'https://moood-refactor.vercel.app/api/get-curation-mission';

async function checkRealCounts() {
    console.log('🔍 Checking REAL counts from API...\n');

    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.isComplete) {
        console.log('⚠️  API says all Core complete, but let\'s check allCounts...\n');
    }

    if (data.allCounts) {
        const core = ['Finance', 'Fitness', 'Healthcare', 'Tech', 'Education', 'Saas', 'Ecommerce'];

        console.log('📈 CORE INDUSTRIES (from API):');
        console.log('================================\n');

        let total = 0;
        core.forEach(industry => {
            const count = data.allCounts[industry] || 0;
            total += count;
            const status = count >= 100 ? '✅' : '❌';
            console.log(`${status} ${industry}: ${count}/100`);
        });

        console.log(`\n📊 Total Core pins: ${total}`);
        console.log(`🎯 Target: 700`);
        console.log(`📈 Progress: ${Math.round(total / 700 * 100)}%\n`);

        // Show all industries sorted by count
        console.log('\n📋 ALL INDUSTRIES (sorted by count):');
        console.log('====================================\n');

        const sorted = Object.entries(data.allCounts)
            .sort((a, b) => b[1] - a[1]);

        sorted.forEach(([industry, count]) => {
            console.log(`${industry}: ${count}`);
        });
    }
}

checkRealCounts().catch(console.error);
