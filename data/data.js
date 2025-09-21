import { NORMAL_ENTITIES } from './normal/entities.js';
import { POKEMON_ENTITIES } from './pokemon/entities.js';
import { NINJAGO_ENTITIES } from './ninjago/entities.js';
import { 
  MICKEY_AND_FRIENDS, 
  LION_KING, 
  FROZEN, 
} from './disney/characters/index.js';
import {
  MICKEY_AND_FRIENDS_TOPICS,
  LION_KING_TOPICS,
  FROZEN_TOPICS,
} from './disney/topics/index.js';

import { NORMAL_TOPICS } from './normal/topics.js';
import { TOPICS_PM } from './pokemon/topics.js';
import { TOPICS_NINJAGO } from './ninjago/topics.js';

const ALL_CATEGORIES = {
    normal: createCategoryStructure(NORMAL_TOPICS, 'normal'),
    pokemon: createCategoryStructure(TOPICS_PM, 'pokemon'),
    ninjago: createCategoryStructure(TOPICS_NINJAGO, 'ninjago'),
    mickey_and_friends: createCategoryStructure(MICKEY_AND_FRIENDS_TOPICS, 'mickey-and-friends'),
    lion_king: createCategoryStructure(LION_KING_TOPICS, 'lion-king'),
    frozen: createCategoryStructure(FROZEN_TOPICS, 'frozen'),
};

const ALL_ENTITIES = {
    normal: addIdsToEntities(NORMAL_ENTITIES, 'normal'),
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

export { ALL_CATEGORIES, ALL_ENTITIES };
