import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates speech from text using Kokoro TTS via Python subprocess
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Options for the TTS
 * @param {number} [options.speed=1.0] - Speed of the generated audio (0.5 to 2.0)
 * @returns {Promise<Buffer>} The audio data as a Buffer
 */
const generateSpeech = (text, options = {}) => {
    const { speed = 1.0 } = options;
    
    return new Promise((resolve, reject) => {
        const pythonPath = path.join(__dirname, '..', 'venv', 'bin', 'python3');
        const pythonProcess = spawn(pythonPath, [
            path.join(__dirname, 'kokoro_tts.py')
        ]);

        let audioData = [];
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            audioData.push(data);
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python TTS process failed:', errorData);
                return reject(new Error(`TTS generation failed: ${errorData}`));
            }
            
            if (audioData.length === 0) {
                return reject(new Error('No audio data received from TTS service'));
            }
            
            resolve(Buffer.concat(audioData));
        });

        // Send input to Python process
        pythonProcess.stdin.write(JSON.stringify({
            text,
            speed: Math.min(Math.max(speed, 0.5), 2.0)  // Clamp speed
        }));
        pythonProcess.stdin.end();
    });
};

export { generateSpeech };
