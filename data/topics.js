const NORMAL_TOPICS = [
  {
    "category": "Imagination",
    "subtopics": [
      {
        "name": "Fantasy Realms",
        "aspects": [
          "Forests of magic",
          "Cities of enchantment",
          "Castles of adventure",
          "Islands of wonder"
        ]
      },
      {
        "name": "Superheroes",
        "aspects": [
          "Powers and abilities",
          "Allies and enemies",
          "Missions and challenges",
          "Personal struggles"
        ]
      },
      {
        "name": "Enchanted Animals",
        "aspects": [
          "Magical powers",
          "Enchanted homes",
          "Friendly interactions",
          "Mysterious origins"
        ]
      }
    ]
  },
  {
    "category": "Nature",
    "subtopics": [
      {
        "name": "Forests",
        "aspects": [
          "Tall trees",
          "Rushing streams",
          "Wildlife habitats",
          "Ancient traditions"
        ]
      },
      {
        "name": "Beaches",
        "aspects": [
          "Sandy shores",
          "Waves crashing",
          "Sea creatures",
          "Island dreams"
        ]
      },
      {
        "name": "Mountains",
        "aspects": [
          "Peaks and valleys",
          "Rocky trails",
          "Wildflowers and berries",
          "Ancient legends"
        ]
      }
    ]
  }
];

module.exports = { 
  NORMAL_TOPICS,
  // Import Pokémon topics from the separate file
  ...require('./topics_pm')
};
