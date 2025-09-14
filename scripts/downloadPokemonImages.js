/**
 * This script downloads the images of specified Pokemon from the Pokemon
 * DB website and saves them in the specified directory.
 *
 * It uses the pokemonList array to determine which Pokemon to download.
 * Each Pokemon's name is used to construct the URL for its image.
 * The images are saved in the specified directory, with the same name as the Pokemon.
 *
 * The script first checks if the image directory exists, and creates it if it doesn't.
 * Then it uses the downloadImage function to download each Pokemon's image.
 * The downloadImage function creates a writable stream to save the image,
 * and uses the https.get function to download the image from the specified URL.
 * Once the image is downloaded, the stream is closed and the promise is resolved.
 *
 *
 * Usage:
 *   node scripts/downloadPokemonImages.js
 *
 * This script can be run from the command line using the following command:
 *
 *   node scripts/downloadPokemonImages.js
 *
 * When the script is run, it will download the images of the specified Pokemon and save them in the specified directory.
 *
 * If any error occurs during the download process, the promise is rejected with the error.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// List of Pokemon names from entities_pm.js
const entitiesPm = require('../data/entities_pm.json');
const pokemonList = Object.values(entitiesPm).map(entity => entity.character.name);

// Create images directory if it doesn't exist
const imageDir = path.join(__dirname, '../public/images/entities');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

// Function to download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (error) => {
            fs.unlink(filepath, () => {});
            reject(error);
        });
    });
}

// Download images for all Pokemon
async function downloadAllImages() {
    for (const pokemon of pokemonList) {
        try {
            const imageUrl = `https://img.pokemondb.net/artwork/large/${pokemon}.jpg`;
            const filePath = path.join(imageDir, `${pokemon}.jpg`);
            
            console.log(`Downloading ${pokemon}...`);
            await downloadImage(imageUrl, filePath);
            console.log(`✅ ${pokemon} downloaded successfully!`);
            
            // Add a small delay to be polite to the server
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`❌ Error downloading ${pokemon}:`, error.message);
        }
    }
    
    console.log('\nAll downloads completed!');
}

// Run the script
downloadAllImages().catch(console.error);
