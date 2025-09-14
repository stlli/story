const { PREDEFINED_ENTITIES } = require('./entities');
const { POKEMON_ENTITIES } = require('./entities_pm');
const { NINJAGO_ENTITIES } = require('./entities_ninjago');
const { 
  MICKEY_AND_FRIENDS, 
  LION_KING, 
  FROZEN, 
} = require('./disney/characters');
const {
  MICKEY_AND_FRIENDS_TOPICS,
  LION_KING_TOPICS,
  FROZEN_TOPICS,
} = require('./disney/topics');

const { NORMAL_TOPICS } = require('./topics');
const { TOPICS_PM } = require('./topics_pm');
const { TOPICS_NINJAGO } = require('./topics_ninjago');

const ALL_CATEGORIES = {
    normal: createCategoryStructure(NORMAL_TOPICS, 'normal'),
    pokemon: createCategoryStructure(TOPICS_PM, 'pokemon'),
    ninjago: createCategoryStructure(TOPICS_NINJAGO, 'ninjago'),
    mickey_and_friends: createCategoryStructure(MICKEY_AND_FRIENDS_TOPICS, 'mickey-and-friends'),
    lion_king: createCategoryStructure(LION_KING_TOPICS, 'lion-king'),
    frozen: createCategoryStructure(FROZEN_TOPICS, 'frozen'),
};

const ALL_ENTITIES = {
    normal: addIdsToEntities(PREDEFINED_ENTITIES, 'normal'),
    pokemon: addIdsToEntities(POKEMON_ENTITIES, 'pokemon'),
    ninjago: addIdsToEntities(NINJAGO_ENTITIES, 'ninjago'),
    mickey_and_friends: addIdsToEntities(MICKEY_AND_FRIENDS, 'mickey-and-friends'),
    lion_king: addIdsToEntities(LION_KING, 'lion-king'),
    frozen: addIdsToEntities(FROZEN, 'frozen'),
};

function addIdsToEntities(entities, category) {
    return entities.map((entity, index) => ({
        id: `${category}-entity-${index}`,
        type: category,
        ...entity
    }));
}

function createCategoryStructure(topics, categoryName) {
    return topics.map(category => ({
        id: `${categoryName}-${category.category.toLowerCase().replace(/\s+/g, '-')}`,
        name: category.category,
        type: categoryName,
        subtopics: category.subtopics.map(subtopic => ({
            id: `${categoryName}-${category.category.toLowerCase().replace(/\s+/g, '-')}-${subtopic.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: subtopic.name,
            aspects: subtopic.aspects,
            category: category.category,
            type: categoryName
        }))
    }));
}

module.exports = {
    ALL_CATEGORIES,
    ALL_ENTITIES
};
