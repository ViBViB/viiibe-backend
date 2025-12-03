// Script to get Pinterest Board ID from URL
// Usage: node get-board-id.js <board-url> <pinterest-token>

const fetch = require('node-fetch');

async function getBoardId(boardUrl, token) {
    try {
        // Extract username and board slug from URL
        const match = boardUrl.match(/pinterest\.com\/([^\/]+)\/([^\/]+)/);

        if (!match) {
            console.error('❌ Invalid Pinterest URL format');
            console.log('Expected format: https://pinterest.com/{username}/{board-slug}/');
            return;
        }

        const [, username, boardSlug] = match;
        console.log(`\n📌 Board URL: ${boardUrl}`);
        console.log(`👤 Username: ${username}`);
        console.log(`📋 Board Slug: ${boardSlug}`);
        console.log('\n🔍 Searching for board...\n');

        // Fetch all boards from Pinterest API
        const response = await fetch('https://api.pinterest.com/v5/boards', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('❌ Failed to fetch boards:', response.status);
            const error = await response.text();
            console.error('Error:', error);
            return;
        }

        const data = await response.json();
        const boards = data.items || [];

        console.log(`Found ${boards.length} total boards\n`);

        // Try to find matching board
        const normalizedSlug = boardSlug.toLowerCase().replace(/-/g, ' ');

        // First try exact name match
        let matchingBoard = boards.find(b =>
            b.name.toLowerCase() === normalizedSlug
        );

        // If not found, try partial match
        if (!matchingBoard) {
            matchingBoard = boards.find(b =>
                b.name.toLowerCase().includes(normalizedSlug) ||
                normalizedSlug.includes(b.name.toLowerCase())
            );
        }

        if (matchingBoard) {
            console.log('✅ BOARD FOUND!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📋 Board ID: ${matchingBoard.id}`);
            console.log(`📝 Board Name: ${matchingBoard.name}`);
            console.log(`📌 Pin Count: ${matchingBoard.pin_count || 0}`);
            console.log(`🔒 Privacy: ${matchingBoard.privacy || 'public'}`);
            if (matchingBoard.description) {
                console.log(`📄 Description: ${matchingBoard.description}`);
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            console.log('📋 Copy this Board ID to use in The Curator:');
            console.log(`\x1b[32m${matchingBoard.id}\x1b[0m\n`);

            return matchingBoard;
        } else {
            console.log('❌ Board not found in your accessible boards\n');
            console.log('This could mean:');
            console.log('  1. The board is private and you don\'t have access');
            console.log('  2. The board belongs to another user');
            console.log('  3. The board slug has changed\n');

            console.log('💡 Try these boards instead:\n');
            boards.slice(0, 5).forEach(b => {
                console.log(`  • ${b.name} (${b.pin_count} pins) - ID: ${b.id}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Get arguments
const boardUrl = process.argv[2];
const token = process.argv[3];

if (!boardUrl || !token) {
    console.log('\n📖 Usage:');
    console.log('  node get-board-id.js <board-url> <pinterest-token>\n');
    console.log('📝 Example:');
    console.log('  node get-board-id.js https://pinterest.com/irubiobaeza/web-design/ pina_ABC123...\n');
    console.log('💡 Get your token from Figma plugin console after connecting to Pinterest\n');
    process.exit(1);
}

getBoardId(boardUrl, token);
