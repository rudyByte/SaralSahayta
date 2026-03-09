const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const assetsDir = path.join('d:', 'e transfer', '1PROJECTS', 'SaralSahayta', 'public', 'ocr-assets');
const files = ['eng.traineddata.gz', 'hin.traineddata.gz', 'osd.traineddata.gz'];

files.forEach(file => {
    const input = path.join(assetsDir, file);
    const output = path.join(assetsDir, file.replace('.gz', ''));

    if (fs.existsSync(input)) {
        console.log(`Decompressing ${file}...`);
        const fileContents = fs.createReadStream(input);
        const writeStream = fs.createWriteStream(output);
        const unzip = zlib.createGunzip();

        fileContents.pipe(unzip).pipe(writeStream).on('finish', (err) => {
            if (err) console.error(`Error decompressing ${file}:`, err);
            else console.log(`Finished ${file}`);
        });
    } else {
        console.log(`File not found: ${file}`);
    }
});
