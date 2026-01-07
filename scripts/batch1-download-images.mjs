/**
 * BATCH 1: DOWNLOAD IMAGES
 * 
 * Downloads the 50 batch 1 pin images locally
 */

import fs from 'fs';
import https from 'https';

// Load pins
const pins = JSON.parse(fs.readFileSync('batch1-pins-to-analyze.json', 'utf8'));

// Create images directory
if (!fs.existsSync('batch1-images')) {
    fs.mkdirSync('batch1-images');
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
    console.log(`📥 Downloading ${pins.length} batch 1 images...\n`);

    let downloaded = 0;
    let errors = 0;

    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        const filename = `batch1-images/pin-${pin.pinId}.jpg`;

        // Skip if already exists
        if (fs.existsSync(filename)) {
            downloaded++;
            continue;
        }

        process.stdout.write(`\r[${i + 1}/${pins.length}] Downloading...`);

        try {
            await downloadImage(pin.imageUrl, filename);
            downloaded++;
        } catch (error) {
            errors++;
        }
    }

    console.log(`\n\n✅ Download complete!`);
    console.log(`   Downloaded: ${downloaded}`);
    console.log(`   Errors: ${errors}`);
    console.log(`\nImages saved in: batch1-images/\n`);
}

downloadAll()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
