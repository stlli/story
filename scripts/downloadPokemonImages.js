const fs = require('fs');
const https = require('https');
const path = require('path');

// List of Pokemon names from entities_pm.js
const pokemonList = [
    'pikachu',
    'charizard',
    'mewtwo',
    'bulbasaur',
    'squirtle',
    'dragonite',
    'sylveon',
    'gardevoir'
];

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
