import fetch from 'node-fetch';

async function testRealEstateSearch() {
    console.log('🔍 Testing Real Estate Search for Duplicates\n');

    // Test the actual API endpoint the plugin uses
    const response = await fetch('https://viiibe-backend.vercel.app/api/pins');
    const data = await response.json();

    const allPins = data.pins || [];
    console.log(`📦 Total pins from API: ${allPins.length}\n`);

    // Filter for Real Estate
    const realEstatePins = allPins.filter(pin => {
        const industries = pin.aiAnalysis?.industry || [];
        return industries.some(ind => ind.toLowerCase().includes('real estate'));
    });

    console.log(`🏠 Real Estate pins: ${realEstatePins.length}\n`);

    // Check for duplicate imageUrls
    const urlCounts = {};
    realEstatePins.forEach(pin => {
        const url = pin.imageUrl;
        if (!urlCounts[url]) {
            urlCounts[url] = [];
        }
        urlCounts[url].push({
            id: pin.id,
            title: pin.title
        });
    });

    const duplicates = Object.entries(urlCounts).filter(([url, pins]) => pins.length > 1);

    if (duplicates.length > 0) {
        console.log(`❌ Found ${duplicates.length} duplicate image URLs in Real Estate results:\n`);
        duplicates.forEach(([url, pins]) => {
            console.log(`URL: ${url}`);
            console.log(`Pins (${pins.length}):`);
            pins.forEach(p => console.log(`  - ${p.id}: ${p.title}`));
            console.log('');
        });
    } else {
        console.log('✅ No duplicate image URLs found in Real Estate results\n');
    }

    // Check for duplicate pin IDs
    const idCounts = {};
    realEstatePins.forEach(pin => {
        const id = pin.id;
        if (!idCounts[id]) {
            idCounts[id] = 0;
        }
        idCounts[id]++;
    });

    const duplicateIds = Object.entries(idCounts).filter(([id, count]) => count > 1);

    if (duplicateIds.length > 0) {
        console.log(`❌ Found ${duplicateIds.length} duplicate pin IDs:\n`);
        duplicateIds.forEach(([id, count]) => {
            console.log(`  - ID ${id} appears ${count} times`);
        });
    } else {
        console.log('✅ No duplicate pin IDs found\n');
    }

    // Show sample of Real Estate pins
    console.log('Sample Real Estate pins (first 5):');
    realEstatePins.slice(0, 5).forEach((pin, i) => {
        console.log(`${i + 1}. ${pin.title}`);
        console.log(`   ID: ${pin.id}`);
        console.log(`   URL: ${pin.imageUrl}`);
        console.log('');
    });
}

testRealEstateSearch().catch(console.error);
