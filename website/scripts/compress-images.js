/**
 * compress-images.js — Losslessly re-compress raster images using sharp
 * 
 * Usage: node compress-images.js <publicDir>
 * 
 * Outputs: count|savedKB to stdout
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const publicDir = process.argv[2];
if (!publicDir) { console.error('Usage: node compress-images.js <publicDir>'); process.exit(1); }

// Find all raster images
let images;
try {
    images = execSync(
        'find "' + publicDir + '" -type f \\( -name "*.webp" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \\)',
        { encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);
} catch (e) {
    process.exit(0);
}

if (images.length === 0) {  process.exit(0); }

let totalSaved = 0;
let count = 0;

for (const img of images) {
    const ext = path.extname(img).toLowerCase();
    const sizeBefore = fs.statSync(img).size;
    const tmpOut = img + '.opt';

    try {
        let cmd;
        if (ext === '.webp') {
            cmd = 'npx --yes sharp-cli -i "' + img + '" -o "' + tmpOut + '" --format webp --quality 85';
        } else if (ext === '.png') {
            cmd = 'npx --yes sharp-cli -i "' + img + '" -o "' + tmpOut + '" --format png --compressionLevel 9';
        } else if (ext === '.jpg' || ext === '.jpeg') {
            cmd = 'npx --yes sharp-cli -i "' + img + '" -o "' + tmpOut + '" --format jpeg --quality 85';
        }

        if (cmd) {
            execSync(cmd, { stdio: 'pipe' });
        }

        if (fs.existsSync(tmpOut)) {
            const sizeAfter = fs.statSync(tmpOut).size;
            if (sizeAfter < sizeBefore) {
                fs.renameSync(tmpOut, img);
                totalSaved += (sizeBefore - sizeAfter);
                count++;
            } else {
                fs.unlinkSync(tmpOut);
            }
        }
    } catch (e) {
        if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
    }
}

