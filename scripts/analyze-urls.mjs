import { kv } from '@vercel/kv';

async function analyzePinUrls() {
    try {
        console.log('🔍 Analyzing pin URLs in database...\n');

        // Get all pins
        const pins = await kv.get('pins') || [];
        console.log(`📦 Total pins in database: ${pins.length}\n`);

        if (pins.length === 0) {
            console.log('No pins found in database');
            return;
        }

        // Analyze URL patterns
        const urlPatterns = {
            '/originals/': 0,
            '/736x/': 0,
            '/564x/': 0,
            '/474x/': 0,
            '/236x/': 0,
            'other': 0
        };

        const brokenUrls = [];
        const sampleUrls = {
            '/originals/': null,
            '/736x/': null,
            '/564x/': null,
            '/474x/': null,
            '/236x/': null
        };

        pins.forEach((pin, index) => {
            const url = pin.imageUrl || '';

            // Count patterns
            let matched = false;
            for (const pattern in urlPatterns) {
                if (pattern !== 'other' && url.includes(pattern)) {
                    urlPatterns[pattern]++;
                    matched = true;

                    // Store sample URL
                    if (!sampleUrls[pattern]) {
                        sampleUrls[pattern] = url;
                    }
                    break;
                }
            }

            if (!matched) {
                urlPatterns['other']++;
            }

            // Check if URL looks valid
            if (!url.startsWith('https://i.pinimg.com/')) {
                brokenUrls.push({ index, pinId: pin.id || pin.pinId, url });
            }
        });

        // Print results
        console.log('📊 URL Pattern Distribution:');
        console.log('─'.repeat(50));
        for (const [pattern, count] of Object.entries(urlPatterns)) {
            const percentage = ((count / pins.length) * 100).toFixed(1);
            console.log(`${pattern.padEnd(15)} ${count.toString().padStart(5)} (${percentage}%)`);
        }

        console.log('\n📸 Sample URLs:');
        console.log('─'.repeat(50));
        for (const [pattern, url] of Object.entries(sampleUrls)) {
            if (url) {
                console.log(`\n${pattern}:`);
                console.log(url);
            }
        }

        if (brokenUrls.length > 0) {
            console.log('\n⚠️  Potentially Broken URLs:');
            console.log('─'.repeat(50));
            brokenUrls.slice(0, 5).forEach(({ index, pinId, url }) => {
                console.log(`Pin ${pinId} (index ${index}): ${url}`);
            });
            if (brokenUrls.length > 5) {
                console.log(`... and ${brokenUrls.length - 5} more`);
            }
        }

        // Test a few URLs
        console.log('\n🧪 Testing URL Accessibility:');
        console.log('─'.repeat(50));

        for (const [pattern, url] of Object.entries(sampleUrls)) {
            if (url) {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    const status = response.ok ? '✅' : '❌';
                    console.log(`${status} ${pattern}: ${response.status}`);
                } catch (error) {
                    console.log(`❌ ${pattern}: ${error.message}`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

analyzePinUrls();
