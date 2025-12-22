// Quick script to analyze current pins in Vercel KV
import { kv } from '@vercel/kv';

async function analyzeCurrentPins() {
    console.log('📊 Analyzing 171 pins...\n');

    // Get all saved pins
    const pinKeys = await kv.keys('saved-pin:*');
    console.log(`Total pins found: ${pinKeys.length}\n`);

    const industries = new Map();
    const colors = new Map();
    const styles = new Map();

    let pinsWithAnalysis = 0;
    let pinsWithoutAnalysis = 0;

    for (const key of pinKeys) {
        const pin = await kv.get(key);

        // Check if pin has AI analysis
        const analysis = await kv.get(`pin-tags:${pin.id}`);

        if (analysis) {
            pinsWithAnalysis++;

            // Count industries
            if (analysis.industry && Array.isArray(analysis.industry)) {
                analysis.industry.forEach(ind => {
                    industries.set(ind, (industries.get(ind) || 0) + 1);
                });
            }

            // Count colors
            if (analysis.color && Array.isArray(analysis.color)) {
                analysis.color.forEach(col => {
                    colors.set(col, (colors.get(col) || 0) + 1);
                });
            }

            // Count styles
            if (analysis.style && Array.isArray(analysis.style)) {
                analysis.style.forEach(sty => {
                    styles.set(sty, (styles.get(sty) || 0) + 1);
                });
            }
        } else {
            pinsWithoutAnalysis++;
        }
    }

    console.log('📈 ANALYSIS STATUS:');
    console.log(`✅ Pins with AI analysis: ${pinsWithAnalysis}`);
    console.log(`❌ Pins without AI analysis: ${pinsWithoutAnalysis}\n`);

    console.log('🏢 INDUSTRIES:');
    const sortedIndustries = Array.from(industries.entries())
        .sort((a, b) => b[1] - a[1]);
    sortedIndustries.forEach(([industry, count]) => {
        console.log(`  ${industry}: ${count} pins`);
    });

    console.log('\n🎨 COLORS:');
    const sortedColors = Array.from(colors.entries())
        .sort((a, b) => b[1] - a[1]);
    sortedColors.forEach(([color, count]) => {
        console.log(`  ${color}: ${count} pins`);
    });

    console.log('\n✨ STYLES:');
    const sortedStyles = Array.from(styles.entries())
        .sort((a, b) => b[1] - a[1]);
    sortedStyles.forEach(([style, count]) => {
        console.log(`  ${style}: ${count} pins`);
    });

    console.log('\n📊 SUMMARY:');
    console.log(`Total unique industries: ${industries.size}`);
    console.log(`Total unique colors: ${colors.size}`);
    console.log(`Total unique styles: ${styles.size}`);
}

analyzeCurrentPins().catch(console.error);
