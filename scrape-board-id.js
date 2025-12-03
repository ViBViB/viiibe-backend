// Script to extract Pinterest Board ID from public board page via scraping
// Usage: node scrape-board-id.js <board-url>

const https = require('https');

async function scrapeBoardId(boardUrl) {
    return new Promise((resolve, reject) => {
        // Clean URL
        const url = boardUrl.replace('cl.pinterest.com', 'www.pinterest.com');

        console.log(`\n🔍 Scraping: ${url}\n`);

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    // Method 1: Look for board ID in __PWS_DATA__ script tag
                    const pwsMatch = data.match(/"id":"(\d+)"/);

                    // Method 2: Look for resourceId in page data
                    const resourceMatch = data.match(/"resourceId":"(\d+)"/);

                    // Method 3: Look for board object
                    const boardMatch = data.match(/"board":\{"id":"(\d+)"/);

                    const boardId = pwsMatch?.[1] || resourceMatch?.[1] || boardMatch?.[1];

                    if (boardId) {
                        console.log('✅ BOARD ID FOUND!\n');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log(`📋 Board ID: ${boardId}`);
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                        console.log('📋 Copy this ID to use in The Curator:');
                        console.log(`\x1b[32m${boardId}\x1b[0m\n`);
                        resolve(boardId);
                    } else {
                        console.log('❌ Could not extract Board ID from page');
                        console.log('\n💡 Try:');
                        console.log('  1. Opening the board in your browser');
                        console.log('  2. Right-click → Inspect');
                        console.log('  3. Search for "resourceId" or "board":{"id"');
                        console.log('  4. Copy the numeric ID\n');
                        reject(new Error('Board ID not found'));
                    }
                } catch (error) {
                    reject(error);
                }
            });

        }).on('error', (err) => {
            console.error('❌ Error fetching page:', err.message);
            reject(err);
        });
    });
}

// Get board URL from arguments
const boardUrl = process.argv[2];

if (!boardUrl) {
    console.log('\n📖 Usage:');
    console.log('  node scrape-board-id.js <board-url>\n');
    console.log('📝 Example:');
    console.log('  node scrape-board-id.js https://cl.pinterest.com/irubiobaeza/web-design/\n');
    process.exit(1);
}

scrapeBoardId(boardUrl).catch(err => {
    console.error('\n❌ Failed:', err.message);
    process.exit(1);
});
