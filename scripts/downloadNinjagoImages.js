/**
 * This script downloads images of Ninjago characters and saves them in the public/images/entities directory.
 * It uses the NINJAGO_ENTITIES array from data/entities_ninjago.js to determine which characters to download.
 * The images are downloaded from a Ninjago image source and saved with the character's name as the filename.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// Import Ninjago characters
const { NINJAGO_ENTITIES } = require('../data/entities_ninjago');

// Create images directory if it doesn't exist
const imageDir = path.join(__dirname, '../public/images/entities');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

// Function to download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = https.get(url, (response) => {
            // Check if response is successful
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                file.close();
                fs.unlink(filepath, () => {}); // Delete the file if download failed
                reject(new Error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`));
            }
        }).on('error', (error) => {
            fs.unlink(filepath, () => {});
            reject(error);
        });
        
        // Set timeout to prevent hanging
        request.setTimeout(10000, () => {
            request.destroy();
            fs.unlink(filepath, () => {});
            reject(new Error('Request timeout'));
        });
    });
}

// Function to search for a character on the Ninjago Wiki and get the image URL
async function getNinjagoImageUrl(characterName) {
    // Format the name for the URL (capitalize first letter of each word)
    const formattedName = characterName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('_');
    
    try {
        // First, get the character's page to find the image
        const searchUrl = `https://ninjago.fandom.com/api.php?action=query&titles=${encodeURIComponent(formattedName)}&prop=pageimages&format=json&pithumbsize=500`;
        
        const response = await new Promise((resolve, reject) => {
            https.get(searchUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
        
        const result = JSON.parse(response);
        const pages = result.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        
        if (pageId && pages[pageId].thumbnail) {
            return pages[pageId].thumbnail.source;
        }
        
        // If no thumbnail found, try to get the first image from the page
        const imageSearchUrl = `https://ninjago.fandom.com/api.php?action=query&titles=${encodeURIComponent(formattedName)}&prop=images&format=json`;
        const imageResponse = await new Promise((resolve, reject) => {
            https.get(imageSearchUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
        
        const imageResult = JSON.parse(imageResponse);
        const imagePages = imageResult.query?.pages || {};
        const imagePageId = Object.keys(imagePages)[0];
        
        if (imagePageId && imagePages[imagePageId].images) {
            // Find the first image that looks like a character image
            const image = imagePages[imagePageId].images.find(img => 
                !img.title.includes('Logo') && 
                !img.title.includes('symbol') &&
                img.title.endsWith('.png')
            );
            
            if (image) {
                // Get the image URL
                const imageInfoUrl = `https://ninjago.fandom.com/api.php?action=query&titles=${encodeURIComponent(image.title)}&prop=imageinfo&iiprop=url&format=json`;
                const imageInfoResponse = await new Promise((resolve, reject) => {
                    https.get(imageInfoUrl, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => resolve(data));
                    }).on('error', reject);
                });
                
                const imageInfo = JSON.parse(imageInfoResponse);
                const imageInfoPages = imageInfo.query?.pages || {};
                const imageInfoPageId = Object.keys(imageInfoPages)[0];
                
                if (imageInfoPageId && imageInfoPages[imageInfoPageId].imageinfo) {
                    return imageInfoPages[imageInfoPageId].imageinfo[0].url;
                }
            }
        }
        
        throw new Error('No suitable image found');
    } catch (error) {
        console.error(`Error getting image URL for ${characterName}:`, error.message);
        // Fallback to a placeholder if we can't find an image
        return null;
    }
}

// Download images for all Ninjago characters
async function downloadAllImages() {
    for (const entity of NINJAGO_ENTITIES) {
        const characterName = entity.character.name;
        try {
            console.log(`Processing ${characterName}...`);
            const imageUrl = await getNinjagoImageUrl(characterName);
            
            if (!imageUrl) {
                console.log(`❌ No image found for ${characterName}, skipping...`);
                continue;
            }
            
            const filePath = path.join(imageDir, `${characterName.replace(/\s+/g, '_')}.png`);
            
            // Skip if file already exists
            if (fs.existsSync(filePath)) {
                console.log(`ℹ️  ${characterName} already exists, skipping...`);
                continue;
            }
            
            console.log(`Downloading ${characterName}...`);
            await downloadImage(imageUrl, filePath);
            console.log(`✅ ${characterName} downloaded successfully!`);
            
            // Add a small delay to be polite to the server
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Error processing ${characterName}:`, error.message);
        }
    }
    
    console.log('\nAll downloads completed!');
}

// Run the script
downloadAllImages().catch(console.error);
