
const API_BASE = 'https://viiibe-backend-2muhra4su-alberto-contreras-projects-101c33ba.vercel.app/api';
const TARGET_IMAGE_ID = '8e2740d41c8b4aab3589f404aad32907';
const ADMIN_KEY = 'viiibe-curator-2025';

async function getAllPins() {
    console.log('📥 Fetching all saved pins (limit 5000)...');
    const response = await fetch(`${API_BASE}/pins?limit=5000`);
    if (!response.ok) throw new Error(`Failed to fetch pins: ${response.status}`);
    const data = await response.json();
    return data.pins || [];
}

async function deletePin(pinId) {
    console.log(`🗑️ Deleting pin ${pinId}...`);
    const response = await fetch(`${API_BASE}/delete-pin`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId, adminKey: ADMIN_KEY })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete pin');
    }
    return await response.json();
}

async function main() {
    try {
        const pins = await getAllPins();
        console.log(`📊 Total pins found: ${pins.length}`);

        // Debug: Print first 3 pins to check structure
        console.log('--- Sample Pins ---');
        pins.slice(0, 3).forEach(p => {
            console.log(`ID: ${p.id}`);
            console.log(`Image: ${p.imageUrl || p.image?.url || 'No URL'}`);
            console.log(`Full object keys: ${Object.keys(p).join(', ')}`);
        });
        console.log('-------------------');

        const targetPin = pins.find(pin => {
            // Check structured image object or direct URL properties
            const imageUrl = pin.imageUrl || (pin.image && pin.image.url) || '';
            // Try matching just the filename hash part
            return imageUrl.includes('8e2740d41c8b4aab3589f404aad32907');
        });

        if (targetPin) {
            console.log('✅ Found target pin:');
            console.log(`   ID: ${targetPin.id}`);
            console.log(`   Title: ${targetPin.title}`);
            console.log(`   Image: ${targetPin.imageUrl || targetPin.image?.url}`);

            await deletePin(targetPin.id);
            console.log('🎉 Pin deleted successfully!');
        } else {
            console.log('❌ Target image not found in any pin.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
