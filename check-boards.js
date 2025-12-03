// Quick script to check Pinterest boards and their pin counts
const PROXY_URL = 'https://viiibe-backend-hce5.vercel.app/api/pinterest-proxy';

async function checkBoards() {
    // Get token from Figma plugin storage (you'll need to paste it here)
    const token = process.argv[2];

    if (!token) {
        console.log('Usage: node check-boards.js YOUR_PINTEREST_TOKEN');
        console.log('\nTo get your token:');
        console.log('1. Open Figma plugin console');
        console.log('2. Run: await figma.clientStorage.getAsync("pinterest_token")');
        console.log('3. Copy the token and pass it as argument');
        process.exit(1);
    }

    try {
        console.log('Fetching your Pinterest boards...\n');

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get-boards',
                token: token
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch boards: ${response.status}`);
        }

        const data = await response.json();
        const boards = data.items || [];

        console.log(`Found ${boards.length} boards:\n`);
        console.log('Board Name'.padEnd(40) + 'Pin Count');
        console.log('-'.repeat(60));

        for (const board of boards) {
            const name = board.name || 'Unnamed';
            const pinCount = board.pin_count || 0;
            console.log(name.padEnd(40) + pinCount);
        }

        console.log('\n✅ Done!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkBoards();
