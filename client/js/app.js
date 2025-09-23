// Import TTS Service
import { ttsService } from './services/ttsService.js';

document.addEventListener('DOMContentLoaded', function() {
    // Global pointer down listener for pen input
    document.addEventListener('pointerdown', function(event) {
        // Check if the pointer is a pen and only one button is pressed
        if (event.pointerType === 'pen' && event.buttons === 1) {
            // Prevent default to avoid any unwanted behavior
            event.preventDefault();
            
            // Get the speech button if it exists
            const speechBtn = document.getElementById('speech-btn');
            if (speechBtn && typeof toggleSpeechRecognition === 'function') {
                // Add visual feedback
                speechBtn.classList.add('pen-active');
                
                // Trigger the speech recognition
                toggleSpeechRecognition();
                
                // Remove visual feedback after a short delay
                setTimeout(() => {
                    speechBtn.classList.remove('pen-active');
                }, 200);
            }
        }
    });
    const promptInput = document.getElementById('prompt');
    const generateBtn = document.getElementById('generate-btn');
    const resultDiv = document.getElementById('result');
    const topicSelection = document.getElementById('topic-selection');
    const entitySelection = document.getElementById('entity-selection');
    const storyCategorySelect = document.getElementById('story-category');
    const speechBtn = document.getElementById('speech-btn');
    const speechStatus = document.getElementById('speech-status');
    
    // Check if the browser supports the Web Speech API
    const isSpeechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    let recognition = null;
    
    if (isSpeechRecognitionSupported) {
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        // Handle speech recognition results
        recognition.onresult = (event) => {
            try {
                const transcript = event.results[0][0].transcript;
                promptInput.value = transcript;
                speechStatus.textContent = 'Voice input received';
                
                // Auto-submit the form after a short delay
                setTimeout(() => {
                    if (speechStatus.textContent === 'Voice input received') {
                        speechStatus.textContent = 'Generating story...';
                        // Trigger the generate story function
                        if (generateBtn && !generateBtn.disabled) {
                            generateStory();
                        }
                    }
                }, 1000); // 1 second delay to show the received message
            } catch (error) {
                console.error('Error processing speech result:', error);
                speechStatus.textContent = 'Error processing voice input. Please try again.';
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event);
            handleRecognitionError(event.error || event.message);
        };
        
        recognition.onaudiostart = () => {
            speechStatus.textContent = 'Listening... Speak now!';
        };
        
        recognition.onsoundstart = () => {
            // Sound detected, user is speaking
        };
        
        recognition.onsoundend = () => {
            // Sound stopped, but recognition might still be processing
            if (speechStatus.textContent === 'Listening... Speak now!') {
                speechStatus.textContent = 'Processing your voice...';
            }
        };
        
        recognition.onend = () => {
            if (!speechBtn.classList.contains('listening')) return;
            
            speechBtn.classList.remove('listening');
            if (speechStatus.textContent === 'Listening... Speak now!') {
                speechStatus.textContent = 'No speech detected. Please try again.';
            }
        };
        
        // Add click event listener to the speech button
        speechBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSpeechRecognition();
        });
        
        // Add event listener for when speech is detected
        if (recognition) {
            recognition.onspeechstart = () => {
                // Stop the prompt sound when speech is detected
                if (promptSound) {
                    promptSound.pause();
                    promptSound.currentTime = 0;
                }
                // Remove any pending sound end handlers
                if (soundEndHandler) {
                    promptSound.removeEventListener('ended', soundEndHandler);
                    soundEndHandler = null;
                }
            };
        }
    } else {
        // Hide the speech button if not supported
        speechBtn.style.display = 'none';
    }
    
    // Get the audio element
    const promptSound = document.getElementById('promptSound');
    let soundEndHandler = null;
    
    // Toggle speech recognition on/off
    function toggleSpeechRecognition() {
        if (!recognition) return;
        
        if (speechBtn.classList.contains('listening')) {
            recognition.stop();
            speechBtn.classList.remove('listening');
            speechStatus.textContent = 'Voice input stopped';
            // Stop the prompt sound if it's playing
            if (promptSound) {
                promptSound.pause();
                promptSound.currentTime = 0;
            }
            return;
        }
        
        // Pause any ongoing TTS when starting voice recognition
        if (ttsService && ttsService.isSpeaking) {
            ttsService.pause();
        }
        
        // Function to start recognition after audio has finished playing
        const startRecognitionAfterAudio = () => {
            if (promptSound) {
                // Wait for the audio to finish playing
                const onEnded = () => {
                    promptSound.removeEventListener('ended', onEnded);
                    startRecognition();
                };
                promptSound.addEventListener('ended', onEnded);
            } else {
                // If no sound element, start recognition immediately
                startRecognition();
            }
        };

        // Play the prompt sound if available
        if (promptSound) {
            // Reset the audio to the start in case it was paused
            promptSound.currentTime = 0;
            
            // Play the sound
            const playPromise = promptSound.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Audio is playing, wait for it to finish before starting recognition
                        startRecognitionAfterAudio();
                    })
                    .catch(error => {
                        console.error('Error playing prompt sound:', error);
                        // If sound fails to play, start recognition immediately
                        startRecognition();
                    });
            } else {
                // If play() doesn't return a promise (older browsers)
                promptSound.onplaying = () => {
                    startRecognitionAfterAudio();
                };
                promptSound.onerror = (error) => {
                    console.error('Error playing prompt sound:', error);
                    startRecognition();
                };
            }
        } else {
            // If no sound element, start recognition immediately
            startRecognition();
        }
        
        // Function to start the actual recognition
        function startRecognition() {
            // Request microphone permission
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    // Stop any existing tracks to release the microphone
                    stream.getTracks().forEach(track => track.stop());
                    
                    try {
                        recognition.start();
                        speechBtn.classList.add('listening');
                        speechStatus.textContent = 'Listening... Speak now!';
                    } catch (error) {
                        console.error('Error starting speech recognition:', error);
                        handleRecognitionError(error);
                    }
                })
                .catch(error => {
                    console.error('Microphone access denied:', error);
                    speechStatus.innerHTML = `
                        Microphone access is required for voice input. 
                        <br>Please enable microphone permissions in your browser settings.
                        <br><a href="https://support.google.com/chrome/answer/2693767" target="_blank" style="color: #3498db; text-decoration: underline;">
                            How to enable microphone access
                        </a>
                    `;
                });
        }
    }
    
    function handleRecognitionError(error) {
        let errorMessage = 'Error: Could not start voice input';
        
        if (error === 'not-allowed' || error.name === 'NotAllowedError') {
            errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings.';
        } else if (error === 'service-not-allowed' || error.name === 'ServiceNotAllowedError') {
            errorMessage = 'Microphone access is not allowed. Please check your browser settings.';
        } else if (error === 'no-speech' || error.name === 'NoSpeechError') {
            errorMessage = 'No speech was detected. Please try again.';
        }
        
        speechStatus.textContent = errorMessage;
        speechBtn.classList.remove('listening');
    }
    
    let categories = [];
    let entities = [];
    let selectedTopic = null;
    let selectedEntities = [];
    let currentCategory = 'normal';
    const MAX_ENTITIES = 3;
    let expandedCategory = null; // Track which category is expanded
    
    // Initialize the app
    async function init() {
        setupEventListeners();
        await loadCategoryData();
    }
    
    // Load data for the current category
    async function loadCategoryData() {
        // Clear previous selections
        selectedTopic = null;
        selectedEntities = [];
        
        await Promise.all([
            fetchCategories(),
            fetchEntities()
        ]);
        
        renderCategories();
        renderEntities();
    }
    
    // Fetch categories with topics from the server
    async function fetchCategories() {
        try {
            const response = await fetch(`/api/categories?category=${currentCategory}`);
            categories = await response.json();
            // Expand the first category by default
            if (categories.length > 0) {
                expandedCategory = categories[0].id;
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            categories = [];
        }
    }
    
    // Fetch entities from the server
    async function fetchEntities() {
        try {
            const response = await fetch(`/api/entities?category=${currentCategory}`);
            entities = await response.json();
        } catch (error) {
            console.error('Error fetching entities:', error);
            entities = [];
        }
    }
    
    // Render categories and topics in the UI
    function renderCategories() {
        topicSelection.innerHTML = '';
        
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            const isExpanded = expandedCategory === category.id;
            
            categoryElement.innerHTML = `
                <div class="category-header" style="margin: 1rem 0; padding: 0.5rem 0; border-bottom: 1px solid #eee; cursor: pointer;" onclick="event.stopPropagation(); toggleCategory('${category.id}')">
                    <h3 style="margin: 0; display: flex; justify-content: space-between; align-items: center;">
                        ${category.name}
                        <span style="font-size: 1.2rem;">${isExpanded ? '−' : '+'}</span>
                    </h3>
                </div>
                <div class="selection-grid" style="display: ${isExpanded ? 'grid' : 'none'}; margin-top: 1rem;">
                    ${(category.subtopics || []).map(topic => {
                        const fullTopicId = `${category.id}-${topic.id}`;
                        const isSelected = selectedTopic === fullTopicId;
                        return `
                        <div class="topic-card entity-card ${isSelected ? 'selected' : ''}" data-topic-id="${topic.id}" style="cursor: pointer;">
                            <div class="entity-avatar" style="background-color: #e3f2fd; color: #1976d2; font-size: 2rem;">
                                ${topic.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="entity-info">
                                <div class="entity-name">${topic.name}</div>
                                <div class="entity-role">${topic.aspects ? topic.aspects[0] : ''}</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
            
            // Add click handler for category header
            const header = categoryElement.querySelector('.category-header');
            header.addEventListener('click', (e) => {
                if (e.target.closest('.category-header')) {
                    toggleCategory(category.id);
                }
            });
            
            // Add click handlers for topic cards
            categoryElement.querySelectorAll('.topic-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const topicId = card.getAttribute('data-topic-id');
                    const fullTopicId = `${category.id}-${topicId}`;
                    
                    // Toggle selection
                    if (selectedTopic === fullTopicId) {
                        selectedTopic = null;
                        card.classList.remove('selected');
                    } else {
                        // Remove selected class from all other topic cards
                        document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
                        selectedTopic = fullTopicId;
                        card.classList.add('selected');
                    }
                });
            });
            
            topicSelection.appendChild(categoryElement);
        });
    }
    
    // Toggle category expansion
    function toggleCategory(categoryId) {
        expandedCategory = expandedCategory === categoryId ? null : categoryId;
        renderCategories();
    }
    
    // Render entities in the UI
    function renderEntities() {
        entitySelection.innerHTML = '';
        
        entities.forEach(entity => {
            const isSelected = selectedEntities.includes(entity.id);
            const entityElement = document.createElement('div');
            entityElement.className = `entity-card ${isSelected ? 'selected' : ''}`;
            
            // Check if the entity has an image path
            let imagePath = entity.character.image || '';
            const hasImage = imagePath && !imagePath.endsWith('.svg'); // Skip SVG placeholders
            
            // Get the first letter for the avatar fallback
            const firstLetter = entity.character.name.charAt(0).toUpperCase();
            
            // Get the species if available, otherwise use role
            const subtitle = entity.character.species || entity.character.role || '';
            
            // Set background image if available
            if (hasImage) {
                entityElement.style.backgroundImage = `url('${imagePath}')`;
                entityElement.style.backgroundSize = 'cover';
                entityElement.style.backgroundPosition = 'center';
                entityElement.style.color = 'white';
                entityElement.style.textShadow = '0 1px 3px rgba(0,0,0,0.8)';
                
                entityElement.innerHTML = `
                    <div class="entity-info" style="background: rgba(0,0,0,0.6); width: 100%; border-radius: 8px;">
                        <div class="entity-name" style="font-weight: 700;">${entity.character.name}</div>
                        <div class="entity-role" style="font-size: 0.85rem; opacity: 0.9;">${subtitle}</div>
                    </div>
                `;
            } else {
                entityElement.innerHTML = `
                    <div class="entity-avatar">
                        ${firstLetter}
                    </div>
                    <div class="entity-info">
                        <div class="entity-name">${entity.character.name}</div>
                        <div class="entity-role">${subtitle}</div>
                    </div>
                `;
            }
            entityElement.addEventListener('click', () => toggleEntity(entity.id));
            entitySelection.appendChild(entityElement);
        });
    }
    
    // Handle topic selection
    function selectTopic(topicId) {
        // Toggle selection if clicking the same topic
        const cardFullId = topicId.includes('-') ? topicId : `${expandedCategory}-${topicId}`;
        const isAlreadySelected = selectedTopic === cardFullId;
        
        // Update selected topic (toggle if clicking the same one)
        selectedTopic = isAlreadySelected ? null : cardFullId;
        
        // Update UI to show selected topic
        document.querySelectorAll('.topic-card').forEach(card => {
            const cardTopicId = card.getAttribute('data-topic-id');
            const cardCategoryId = card.closest('.category-card')?.dataset?.categoryId || expandedCategory;
            const currentCardFullId = `${cardCategoryId}-${cardTopicId}`;
            
            if (currentCardFullId === cardFullId) {
                if (isAlreadySelected) {
                    card.classList.remove('selected');
                } else {
                    card.classList.add('selected');
                    // Ensure the category is expanded
                    if (cardCategoryId && cardCategoryId !== expandedCategory) {
                        expandedCategory = cardCategoryId;
                        renderCategories();
                        return; // Exit early to prevent multiple renders
                    }
                }
            } else {
                card.classList.remove('selected');
            }
        });
    }
    
    // Keep track of the currently playing audio
    let currentAudio = null;
    
    // Toggle entity selection
    function toggleEntity(entityId) {
        const index = selectedEntities.indexOf(entityId);
        const entity = entities.find(e => e.id === entityId);
        
        if (index > -1) {
            // Unselecting the character
            selectedEntities.splice(index, 1);
            
            // Pause and reset the audio if it's playing
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }
        } else {
            if (selectedEntities.length < MAX_ENTITIES) {
                selectedEntities.push(entityId);
                
                // Play the character's audio if available
                if (entity?.character?.audio) {
                    // Stop any currently playing audio
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                    }
                    
                    // Create and play the new audio
                    currentAudio = new Audio(entity.character.audio);
                    currentAudio.play().catch(error => {
                        console.error('Error playing character audio:', error);
                    });
                }
            } else {
                alert(`You can select up to ${MAX_ENTITIES} characters.`);
            }
        }
        renderEntities();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        generateBtn.addEventListener('click', generateStory);
        storyCategorySelect.addEventListener('change', async (e) => {
            currentCategory = e.target.value;
            await loadCategoryData();
        });
    }
    
    // Generate story
    async function generateStory() {
        const userPrompt = promptInput?.value?.trim() || '';
        
        // Require either a topic or a user prompt, but not necessarily both
        if (!selectedTopic && !userPrompt) {
            alert('Please either select a topic or enter a story idea!');
            return;
        }

        if (selectedEntities.length === 0) {
            alert('Please select at least one character!');
            return;
        }

        // Stop any ongoing speech when generating a new story
        ttsService.stop();
        
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        resultDiv.innerHTML = '<div class="loading">Crafting your story... <div class="spinner"></div></div>';

        try {
            const ageInput = document.getElementById('age-input');
            const age = parseInt(ageInput.value) || 8; // Default to 8 if not set
            
            // Get force flags from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const forceOpenAIStory = urlParams.get('forceOpenAIStory') === 'true';
            const forceOpenAITTS = urlParams.get('forceOpenAITTS') === 'true';
            
            // Build the API URL with query parameters
            const apiUrl = new URL('/api/generate-story', window.location.origin);
            if (forceOpenAIStory) apiUrl.searchParams.append('forceOpenAIStory', 'true');
            if (forceOpenAITTS) apiUrl.searchParams.append('forceOpenAITTS', 'true');
            
            // Use the full selectedTopic as the topicId
            const response = await fetch(apiUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    userPrompt: userPrompt,
                    age: age,
                    topicId: selectedTopic || undefined, // Send undefined if no topic is selected
                    entityIds: selectedEntities,
                    category: currentCategory
                })
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // Debug log the response data
            console.log('Response data:', data);
            
            // Handle the response data more robustly
            const storyContent = data.story || data.prompt || data.structured_prompt || 'No story content received';
            const storyTopic = data.topic || 'Unknown Topic';
            const storyAspect = data.aspect || '';
            const storyCharacters = Array.isArray(data.characters) ? data.characters : [];
            
            // Format the story content for display
            const formattedPrompt = String(storyContent)
                .replace(/\n/g, '<br>')
                .replace(/\s{4,}/g, '    ');
            
            resultDiv.innerHTML = `
                <h3>
                    Your Story Prompt:
                    <div class="action-buttons">
                        <button class="tts-btn" title="Read story aloud">
                            <svg class="tts-icon" viewBox="0 0 24 24">
                                <path d="M3,9H7L12,4V20L7,15H3V9M16.59,12L14,9.41L15.41,8L18,10.59L20.59,8L22,9.41L19.41,12L22,14.59L20.59,16L18,13.41L15.41,16L14,14.59L16.59,12Z" />
                            </svg>
                            <span class="tts-text">Read Aloud</span>
                        </button>
                        <button class="copy-btn" title="Copy to clipboard">
                            <svg class="copy-icon" viewBox="0 0 24 24">
                                <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                            </svg>
                            <span class="copy-text">Copy</span>
                        </button>
                    </div>
                </h3>
                ${storyTopic ? `<p><strong>Topic:</strong> ${storyTopic}${storyAspect ? ` - ${storyAspect}` : ''}</p>` : ''}
                ${storyCharacters.length > 0 ? `<p><strong>Characters:</strong> ${storyCharacters.join(', ')}</p>` : ''}
                <div class="prompt-content">${formattedPrompt}</div>
            `;
            
            // Add copy functionality
            const copyBtn = resultDiv.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                const promptContent = resultDiv.querySelector('.prompt-content').textContent;
                navigator.clipboard.writeText(promptContent).then(() => {
                    const copyText = copyBtn.querySelector('.copy-text');
                    copyText.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyText.textContent = 'Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                });
            });

            // Initialize TTS
            const ttsBtn = resultDiv.querySelector('.tts-btn');
            const ttsText = ttsBtn.querySelector('.tts-text');
            const promptContent = resultDiv.querySelector('.prompt-content').textContent;
            
            // Handle TTS state changes
            const handleTTSState = (state) => {
                console.log('TTS State:', state.state, state);
                
                // Skip state updates if we're in the middle of pausing
                if (state.state === 'error' && state.data?.error === 'interrupted') {
                    console.log('Ignoring interrupted state during pause');
                    return;
                }

                switch (state.state) {
                    case 'speaking':
                        ttsText.textContent = 'Pause';
                        ttsBtn.classList.add('speaking');
                        break;
                    case 'paused':
                        ttsText.textContent = 'Resume';
                        ttsBtn.classList.remove('speaking');
                        break;
                    case 'stopped':
                    case 'ended':
                        ttsText.textContent = 'Read Aloud';
                        ttsBtn.classList.remove('speaking');
                        break;
                    case 'error':
                        // Only show error if it's not related to pausing
                        if (state.data?.error !== 'interrupted') {
                            console.error('TTS Error:', state.data);
                            ttsText.textContent = 'Read Aloud';
                            ttsBtn.classList.remove('speaking');
                            alert('Error reading story. Please try again.');
                        }
                        break;
                }
            };
            
            // Toggle TTS on button click
            ttsBtn.addEventListener('click', () => {
                ttsService.speak(promptContent, handleTTSState);
            });
            
            // Auto-start TTS if enabled in settings
            const autoReadEnabled = localStorage.getItem('autoRead') !== 'false'; // Default to true
            if (autoReadEnabled) {
                // Small delay to ensure the UI is updated
                setTimeout(() => {
                    ttsService.speak(promptContent, handleTTSState);
                }, 500);
            }
            
            // Stop TTS when navigating away
            window.addEventListener('beforeunload', () => {
                ttsService.stop();
            });
            
            resultDiv.style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            resultDiv.textContent = 'Error generating story. Please try again.';
            resultDiv.style.display = 'block';
        } finally {
            // Reset button state
            if (generateBtn) {
                generateBtn.textContent = 'Generate Story';
                generateBtn.disabled = false;
            }
        }
    }
    
    // Initialize the app
    init();
});
