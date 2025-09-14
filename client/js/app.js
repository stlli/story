document.addEventListener('DOMContentLoaded', function() {
    const promptInput = document.getElementById('prompt');
    const generateBtn = document.getElementById('generate-btn');
    const resultDiv = document.getElementById('result');
    const topicSelection = document.getElementById('topic-selection');
    const entitySelection = document.getElementById('entity-selection');
    const storyCategorySelect = document.getElementById('story-category');
    
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
    
    // Toggle entity selection
    function toggleEntity(entityId) {
        const index = selectedEntities.indexOf(entityId);
        if (index > -1) {
            selectedEntities.splice(index, 1);
        } else {
            if (selectedEntities.length < MAX_ENTITIES) {
                selectedEntities.push(entityId);
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

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        resultDiv.innerHTML = '<div class="loading">Crafting your story... <div class="spinner"></div></div>';

        try {
            const ageInput = document.getElementById('age-input');
            const age = parseInt(ageInput.value) || 8; // Default to 8 if not set
            
            // Use the full selectedTopic as the topicId
            const response = await fetch('/api/generate-story', {
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
                    <button class="copy-btn" title="Copy to clipboard">
                        <svg class="copy-icon" viewBox="0 0 24 24">
                            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                        </svg>
                        Copy
                    </button>
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
                    copyBtn.innerHTML = `
                        <svg class="copy-icon" viewBox="0 0 24 24">
                            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                        </svg>
                        Copied!
                    `;
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = `
                            <svg class="copy-icon" viewBox="0 0 24 24">
                                <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                            </svg>
                            Copy
                        `;
                        copyBtn.classList.remove('copied');
                    }, 2000);
                });
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
