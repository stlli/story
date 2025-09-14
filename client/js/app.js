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
            const topicsList = category.subtopics.map(topic => {
                const fullTopicId = `${category.id}-${topic.id}`;
                const isSelected = selectedTopic === fullTopicId || selectedTopic === topic.id;
                return `
                    <div class="topic-card ${isSelected ? 'selected' : ''}" 
                         data-topic-id="${topic.id}">
                        <h4>${topic.name}</h4>
                        <p class="topic-aspect">${topic.aspects[0]}</p>
                    </div>
                `;
            }).join('');
            
            categoryElement.className = 'category-card';
            categoryElement.innerHTML = `
                <div class="category-header" data-category-id="${category.id}">
                    <h3>${category.name}</h3>
                    <span class="toggle-icon">${isExpanded ? '−' : '+'}</span>
                </div>
                <div class="topics-container" style="display: ${isExpanded ? 'grid' : 'none'}">
                    ${topicsList}
                </div>
            `;
            
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
                    selectTopic(topicId);
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
            const imagePath = entity.character.image || '';
            const hasImage = imagePath && !imagePath.endsWith('.svg'); // Skip SVG placeholders
            
            entityElement.innerHTML = `
                <div class="entity-avatar" ${hasImage ? `style="background-image: url('${imagePath}')"` : ''}>
                    ${hasImage ? '' : entity.character.name.charAt(0)}
                </div>
                <div class="entity-info">
                    <div class="entity-name">${entity.character.name}</div>
                    <div class="entity-role">${entity.character.role}</div>
                </div>
            `;
            entityElement.addEventListener('click', () => toggleEntity(entity.id));
            entitySelection.appendChild(entityElement);
        });
    }
    
    // Handle topic selection
    function selectTopic(topicId) {
        // If topicId doesn't contain a dash, it's just the topic ID without category
        // In that case, we need to find the full ID using the current category
        let fullTopicId = topicId;
        if (!topicId.includes('-') && categories.length > 0) {
            const currentCategory = categories.find(cat => cat.id === expandedCategory);
            if (currentCategory) {
                fullTopicId = `${currentCategory.id}-${topicId}`;
                console.log('Generated full topic ID:', fullTopicId);
            }
        }
        
        selectedTopic = fullTopicId;
        
        // Update UI to show selected topic
        document.querySelectorAll('.topic-card').forEach(card => {
            const cardTopicId = card.dataset.topicId;
            const cardCategoryId = card.closest('.category-card')?.dataset.categoryId;
            const cardFullId = cardCategoryId ? `${cardCategoryId}-${cardTopicId}` : cardTopicId;
            
            if (cardFullId === fullTopicId) {
                card.classList.add('selected');
                if (cardCategoryId) {
                    expandedCategory = cardCategoryId;
                }
            } else {
                card.classList.remove('selected');
            }
        });
        
        renderCategories();
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
        if (!selectedTopic) {
            alert('Please select a topic first!');
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
            
            const response = await fetch('/api/generate-story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: promptInput?.value || '',
                    age: age,
                    topicId: selectedTopic,
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
