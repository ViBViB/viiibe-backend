/**
 * STEP 2: DOWNLOAD TEST IMAGES
 * 
 * Downloads the 10 test pin images locally so they can be analyzed
 */

import fs from 'fs';
import https from 'https';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);

// Load pins
const pins = JSON.parse(fs.readFileSync('test-pins-to-analyze.json', 'utf8'));

// Create images directory
if (!fs.existsSync('test-images')) {
    fs.mkdirSync('test-images');
}

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

async function downloadAll() {
    console.log('📥 Downloading 10 test images...\n');

    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        const filename = `test-images/pin-${pin.pinId}.jpg`;

        console.log(`[${i + 1}/10] Downloading pin ${pin.pinId}...`);

        try {
            await downloadImage(pin.imageUrl, filename);
            console.log(`   ✅ Saved to ${filename}`);
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n✅ Download complete!\n');
    console.log('Images saved in: test-images/\n');
}

downloadAll()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
