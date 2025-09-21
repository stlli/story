const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_PATH = path.join(__dirname, '../.env');

// Check if .env exists, if not create it
if (!fs.existsSync(ENV_PATH)) {
  fs.writeFileSync(ENV_PATH, '');
}

// Read existing .env content
let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';

// Ask for Hugging Face token
rl.question('Please enter your Hugging Face access token (get it from https://huggingface.co/settings/tokens): ', (token) => {
  // Update or add HUGGING_FACE_HUB_TOKEN
  if (envContent.includes('HUGGING_FACE_HUB_TOKEN=')) {
    envContent = envContent.replace(
      /HUGGING_FACE_HUB_TOKEN=.*/,
      `HUGGING_FACE_HUB_TOKEN=${token}`
    );
  } else {
    envContent += `\nHUGGING_FACE_HUB_TOKEN=${token}\n`;
  }

  // Write back to .env
  fs.writeFileSync(ENV_PATH, envContent.trim() + '\n');
  
  console.log('✅ Successfully updated .env with your Hugging Face token');
  console.log('The token has been added to your .env file. Make sure to add .env to your .gitignore if you havent already!');
  
  rl.close();
});
