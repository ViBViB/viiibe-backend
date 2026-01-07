/**
 * TEST AI COLOR ANALYSIS
 * 
 * Tests AI vision capabilities on sample pin images
 */

import fs from 'fs';

// Load first 3 pins from batch
const pins = JSON.parse(fs.readFileSync('pending-pins-batch1.json', 'utf8')).slice(0, 3);

console.log('🎨 Testing AI Color Analysis\n');
console.log(`Analyzing ${pins.length} sample images...\n`);
console.log('═══════════════════════════════════════════════════════════\n');

for (const pin of pins) {
    console.log(`Pin ID: ${pin.pinId}`);
    console.log(`Title: ${pin.title.substring(0, 60)}`);
    console.log(`Current colors: ${pin.currentColors.join(', ')}`);
    console.log(`Image URL: ${pin.imageUrl}`);
    console.log('\n---\n');
}

console.log('\n✅ Sample data loaded');
console.log('\nNext: I will analyze these images to detect dominant colors\n');
