const fetch = require('node-fetch');
require('dotenv').config();

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

// Same board configuration as auto-setup
const BOARDS_CONFIG = [
    {
        name: "Landing Pages",
        searches: [
            "landing page",
            "website design",
            "web design",
            "homepage design",
            "saas landing",
            "product page"
        ],
        pinsPerSearch: 8
    },
    {
        name: "Dashboard UI",
        searches: [
            "dashboard",
            "analytics",
            "admin panel",
            "data visualization",
            "dashboard design",
            "metrics ui"
        ],
        pinsPerSearch: 8
    },
    {
        name: "Mobile App UI",
        searches: [
            "mobile app",
            "app design",
            "ios design",
            "mobile ui",
            "app interface",
            "smartphone app"
        ],
        pinsPerSearch: 8
    },
    {
        name: "E-commerce Design",
        searches: [
            "ecommerce",
            "online store",
            "shop design",
            "product listing",
            "checkout design",
            "shopping cart"
        ],
        pinsPerSearch: 8
    },
    {
        name: "Red Design",
        searches: [
            "red design",
            "red website",
            "red ui",
            "red branding",
            "red color scheme"
        ],
        pinsPerSearch: 8
    },
    {
        name: "Blue Design",
        searches: [
            "blue design",
            "blue website",
            "blue ui",
            "blue branding",
            "navy design"
        ],
        pinsPerSearch: 8
    },
    {
        name: "Monochrome Design",
        searches: [
            "monochrome",
            "black white",
            "minimal design",
            "grayscale design",
            "black and white ui"
        ],
        pinsPerSearch: 8
    },
    {
        name: "Minimalist Design",
        searches: [
            "minimalist",
            "minimal design",
            "clean design",
            "simple ui",
            "whitespace design",
            "minimal website"
        ],
        pinsPerSearch: 8
    },
    {
        name: "Bold Design",
        searches: [
            "colorful design",
            "vibrant",
            "bold design",
            "bright colors",
            "maximalist design"
        ],
        pinsPerSearch: 8
    },
    {
        name: "Dark Mode Design",
        searches: [
            "dark mode",
            "dark design",
            "dark ui",
            "dark theme",
            "black ui"
        ],
        pinsPerSearch: 8
    }
];

/**
 * Search for pins
 */
async function searchPins(query, limit = 5) {
    try {
        const response = await fetch(
            `${PINTEREST_API_BASE}/search/pins?query=${encodeURIComponent(query)}&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`
                }
            }
        );

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        return [];
    }
}

/**
 * Delay helper
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function assistedPinSaving() {
    // Dynamic import of 'open' since it's an ES module
    const open = (await import('open')).default;

    console.log('🚀 Pinterest Assisted Pin Saving\n');
    console.log('This script will open pins in your browser.');
    console.log('You just need to click "Save" and select the board.\n');
    console.log('Press Ctrl+C at any time to stop.\n');

    for (const config of BOARDS_CONFIG) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📌 Board: "${config.name}"`);
        console.log(`${'='.repeat(60)}\n`);

        const allPins = [];

        // Collect pins from all searches
        for (const searchTerm of config.searches) {
            console.log(`   🔍 Searching: "${searchTerm}"`);
            const pins = await searchPins(searchTerm, config.pinsPerSearch);

            if (pins.length > 0) {
                console.log(`      Found ${pins.length} pins`);
                allPins.push(...pins);
            } else {
                console.log(`      No pins found`);
            }

            await delay(1000); // Rate limiting
        }

        // Remove duplicates
        const uniquePins = Array.from(new Map(allPins.map(p => [p.id, p])).values());

        if (uniquePins.length === 0) {
            console.log(`\n   ⚠️  No pins found for this board. Skipping.\n`);
            continue;
        }

        console.log(`\n   ✓ Total unique pins: ${uniquePins.length}`);
        console.log(`\n   🌐 Opening pins in browser...`);
        console.log(`   👉 For each tab:`);
        console.log(`      1. Click "Save" button`);
        console.log(`      2. Select board: "${config.name}"`);
        console.log(`      3. Close the tab\n`);

        // Wait for user to be ready
        console.log(`   ⏸️  Opening in 3 seconds...`);
        await delay(3000);

        // Open each pin in browser
        for (let i = 0; i < uniquePins.length; i++) {
            const pin = uniquePins[i];
            const pinUrl = `https://www.pinterest.com/pin/${pin.id}/`;

            console.log(`   [${i + 1}/${uniquePins.length}] Opening: ${pin.title || 'Untitled'}`);

            try {
                await open(pinUrl);
                await delay(2000); // Delay between opening tabs
            } catch (error) {
                console.log(`      ⚠️  Failed to open: ${error.message}`);
            }
        }

        console.log(`\n   ✅ All pins opened for "${config.name}"`);
        console.log(`   ⏸️  Take your time to save them all.`);
        console.log(`   Press Enter when ready to continue to next board...`);

        // Wait for user input before continuing to next board
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All boards processed!');
    console.log('='.repeat(60));
    console.log('\nYour boards should now be populated with pins.');
    console.log('You can verify at: https://www.pinterest.com/');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
}

// Enable stdin and run
(async () => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    try {
        await assistedPinSaving();
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
})();
