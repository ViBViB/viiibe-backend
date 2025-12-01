/**
 * Pinterest Auto-Setup Script
 * 
 * This script automatically:
 * 1. Creates organized boards in your Pinterest account
 * 2. Searches Pinterest for relevant pins
 * 3. Saves the best pins to your boards
 * 
 * Usage:
 *   node scripts/pinterest-auto-setup.js
 * 
 * Requirements:
 *   - Pinterest Access Token (set in .env)
 *   - Trial mode or approved Pinterest Developer Account
 */

const fetch = require('node-fetch');
require('dotenv').config();

// ============================================================
// CONFIGURATION
// ============================================================

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

// Board configurations with search terms
const BOARDS_CONFIG = [
    // Project Types
    {
        name: "Landing Pages",
        description: "Modern landing page designs and inspiration",
        searches: [
            "landing page",
            "website design",
            "web design"
        ],
        pinsPerSearch: 10
    },
    {
        name: "Dashboard UI",
        description: "Dashboard and analytics interface designs",
        searches: [
            "dashboard",
            "analytics",
            "admin panel"
        ],
        pinsPerSearch: 10
    },
    {
        name: "Mobile App UI",
        description: "Mobile application interface designs",
        searches: [
            "mobile app",
            "app design",
            "ios design"
        ],
        pinsPerSearch: 10
    },
    {
        name: "E-commerce Design",
        description: "Online store and e-commerce designs",
        searches: [
            "ecommerce",
            "online store",
            "shop design"
        ],
        pinsPerSearch: 10
    },

    // Color-based Boards
    {
        name: "Red Design",
        description: "Designs with red as dominant color",
        searches: [
            "red design",
            "red website",
            "red ui"
        ],
        pinsPerSearch: 10
    },
    {
        name: "Blue Design",
        description: "Designs with blue as dominant color",
        searches: [
            "blue design",
            "blue website",
            "blue ui"
        ],
        pinsPerSearch: 10
    },
    {
        name: "Monochrome Design",
        description: "Black and white minimalist designs",
        searches: [
            "monochrome",
            "black white",
            "minimal design"
        ],
        pinsPerSearch: 10
    },

    // Style-based Boards
    {
        name: "Minimalist Design",
        description: "Clean, minimal interface designs",
        searches: [
            "minimalist",
            "minimal design",
            "clean design"
        ],
        pinsPerSearch: 10
    },
    {
        name: "Bold Design",
        description: "Vibrant, colorful, maximalist designs",
        searches: [
            "colorful design",
            "vibrant",
            "bold design"
        ],
        pinsPerSearch: 10
    },
    {
        name: "Dark Mode Design",
        description: "Dark theme interface designs",
        searches: [
            "dark mode",
            "dark design",
            "dark ui"
        ],
        pinsPerSearch: 10
    }
];

// ============================================================
// PINTEREST API FUNCTIONS
// ============================================================

/**
 * Get all boards (helper for finding existing ones)
 */
async function getBoards() {
    let boards = [];
    let bookmark = null;

    try {
        do {
            const url = `${PINTEREST_API_BASE}/boards${bookmark ? `?bookmark=${bookmark}` : ''}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}` }
            });

            if (!response.ok) break;

            const data = await response.json();
            boards = boards.concat(data.items);
            bookmark = data.bookmark;
        } while (bookmark);

        return boards;
    } catch (e) {
        return [];
    }
}

/**
 * Create a new board or get existing one
 */
async function createBoard(name, description) {
    console.log(`\n📌 Processing board: "${name}"`);

    try {
        const response = await fetch(`${PINTEREST_API_BASE}/boards`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                description: description,
                privacy: 'PUBLIC'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorJson;
            try { errorJson = JSON.parse(errorText); } catch (e) { }

            // Handle "Board already exists" error (Code 58 or message match)
            if (errorJson && (errorJson.code === 58 || errorJson.message?.includes('already have a board'))) {
                console.log(`   ℹ️  Board already exists. Fetching ID...`);

                const boards = await getBoards();
                const existingBoard = boards.find(b => b.name === name);

                if (existingBoard) {
                    console.log(`   ✓ Found existing board ID: ${existingBoard.id}`);
                    return existingBoard;
                } else {
                    throw new Error(`Board exists but couldn't be found in list. API Error: ${errorText}`);
                }
            }

            throw new Error(`Failed to create board: ${errorText}`);
        }

        const board = await response.json();
        console.log(`   ✓ Board created with ID: ${board.id}`);
        return board;
    } catch (error) {
        console.error(`   ✗ Error processing board "${name}":`, error.message);
        return null;
    }
}

/**
 * Search for pins on Pinterest
 */
async function searchPins(query, limit = 10) {
    console.log(`   🔍 Searching: "${query}"`);

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
            const error = await response.text();
            throw new Error(`Search failed: ${error}`);
        }

        const data = await response.json();

        if (data.items?.length === 0) {
            console.log(`      ⚠️  0 pins found. Full response:`, JSON.stringify(data).substring(0, 200) + '...');
        } else {
            console.log(`      Found ${data.items?.length || 0} pins`);
        }

        return data.items || [];
    } catch (error) {
        console.error(`      ✗ Search error:`, error.message);
        return [];
    }
}

/**
 * Save a pin to a board
 */
async function savePinToBoard(pinId, boardId) {
    try {
        const response = await fetch(`${PINTEREST_API_BASE}/pins`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board_id: boardId,
                pin_id: pinId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`         ⚠️  Failed to save pin ${pinId}: ${errorText.substring(0, 100)}`);
            return false;
        }

        return true;
    } catch (error) {
        console.log(`         ⚠️  Error saving pin ${pinId}:`, error.message);
        return false;
    }
}

/**
 * Add delay between requests to respect rate limits
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// MAIN SETUP FUNCTION
// ============================================================

async function setupPinterestBoards() {
    console.log('🚀 Starting Pinterest Auto-Setup\n');
    console.log(`📊 Configuration:`);
    console.log(`   - Boards to create: ${BOARDS_CONFIG.length}`);
    console.log(`   - Total pins: ~${BOARDS_CONFIG.reduce((sum, b) => sum + (b.searches.length * b.pinsPerSearch), 0)}`);
    console.log('');

    // Validate access token
    if (!PINTEREST_ACCESS_TOKEN) {
        console.error('❌ Error: PINTEREST_ACCESS_TOKEN not found in .env file');
        console.log('\nPlease add your Pinterest access token to .env:');
        console.log('PINTEREST_ACCESS_TOKEN=your_token_here');
        process.exit(1);
    }

    let totalPinsSaved = 0;
    let totalBoardsCreated = 0;

    // Process each board configuration
    for (const config of BOARDS_CONFIG) {
        // Create the board
        const board = await createBoard(config.name, config.description);

        if (!board) {
            console.log(`   ⚠️  Skipping searches for "${config.name}" (board creation failed)`);
            continue;
        }

        totalBoardsCreated++;
        let pinsForThisBoard = 0;

        // Search and save pins for each search term
        for (const searchTerm of config.searches) {
            await delay(1000); // Rate limiting: 1 second between searches

            const pins = await searchPins(searchTerm, config.pinsPerSearch);

            // Save each pin to the board
            for (const pin of pins) {
                const saved = await savePinToBoard(pin.id, board.id);

                if (saved) {
                    pinsForThisBoard++;
                    totalPinsSaved++;
                    console.log(`      ✓ Saved: ${pin.title || 'Untitled'}`);
                }

                await delay(500); // Rate limiting: 0.5 seconds between saves
            }
        }

        console.log(`   ✅ Board "${config.name}" complete: ${pinsForThisBoard} pins saved\n`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Setup Complete!');
    console.log('='.repeat(60));
    console.log(`✓ Boards created: ${totalBoardsCreated}/${BOARDS_CONFIG.length}`);
    console.log(`✓ Total pins saved: ${totalPinsSaved}`);
    console.log('\nYour Pinterest account is now ready for testing!');
    console.log('You can now run the plugin and search within your boards.');
    console.log('='.repeat(60) + '\n');
}

// ============================================================
// RUN SCRIPT
// ============================================================

setupPinterestBoards().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
