const fetch = require('node-fetch');
require('dotenv').config();

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

async function testSearch() {
    const query = "design";
    console.log(`🔍 Testing search for: "${query}"`);

    try {
        const response = await fetch(
            `${PINTEREST_API_BASE}/search/pins?query=${encodeURIComponent(query)}&limit=5`,
            {
                headers: {
                    'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`
                }
            }
        );

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response body:`);
        console.log(text);

    } catch (error) {
        console.error("Error:", error);
    }
}

testSearch();
