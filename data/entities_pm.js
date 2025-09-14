// Pokémon character entities for the story application
const POKEMON_ENTITIES = [
  {
    "character": {
      "name": "Pikachu",
      "species": "Mouse Pokémon",
      "gender": "Male",
      "age": "5",
      "role": "Loyal Companion",
      "physical_attributes": {
        "defining_feature": "Red cheeks that store electricity",
        "clothing_style": "No clothing, but sometimes wears Ash's hat",
        "color_palette": {
          "fur": "Yellow",
          "cheeks": "Red",
          "stripes": "Brown"
        }
      },
      "personality_traits": [
        "Loyal",
        "Courageous",
        "Playful",
        "Determined",
        "Friendly"
      ],
      "background": {
        "origin": "Pallet Town",
        "profession": "Ash's partner Pokémon",
        "hobbies": ["Battling", "Eating ketchup", "Helping friends"]
      },
      "relationships": {
        "allies": ["Ash Ketchum", "Misty", "Brock"],
        "rivals": ["Team Rocket", "Raichu"]
      },
      "story_elements": {
        "motivation": "To become the strongest Pokémon and help Ash become a Pokémon Master",
        "flaws": [
          "Sometimes too trusting",
          "Can be stubborn"
        ],
        "catchphrase": "Pika Pika!"
      }
    }
  },
  // Additional Pokémon characters...
  {
    "character": {
      "name": "Charizard",
      "species": "Flame Pokémon",
      "gender": "Male",
      "age": "8",
      "role": "Powerhouse Fighter",
      "physical_attributes": {
        "defining_feature": "Large orange draconic body with flame-tipped tail",
        "clothing_style": "No clothing, but wears a Mega Stone X or Y when Mega Evolved",
        "color_palette": {
          "body": "Orange",
          "wings": "Blue",
          "belly": "Cream"
        }
      },
      "personality_traits": [
        "Proud",
        "Strong-willed",
        "Loyal to trusted trainers",
        "Confident",
        "Protective"
      ],
      "background": {
        "origin": "Kanto Region",
        "profession": "Battle Pokémon",
        "hobbies": ["Flying", "Battling", "Training"]
      },
      "relationships": {
        "allies": ["Ash Ketchum", "Pikachu"],
        "rivals": ["Blastoise", "Venusaur"]
      },
      "story_elements": {
        "motivation": "To become the strongest Fire-type Pokémon",
        "flaws": [
          "Can be arrogant",
          "Disobedient to weak trainers"
        ],
        "catchphrase": "Char-char!"
      }
    }
  },
  {
    "character": {
      "name": "Mewtwo",
      "species": "Genetic Pokémon",
      "gender": "Genderless",
      "age": "3",
      "role": "Mysterious Antihero",
      "physical_attributes": {
        "defining_feature": "Humanoid shape with purple skin and a long tail",
        "clothing_style": "No clothing, but sometimes wears armor",
        "color_palette": {
          "body": "Pale Purple",
          "eyes": "Purple",
          "underside": "Purple"
        }
      },
      "personality_traits": [
        "Intelligent",
        "Philosophical",
        "Isolated",
        "Powerful",
        "Mysterious"
      ],
      "background": {
        "origin": "Created in a lab on Cinnabar Island",
        "profession": "Legendary Pokémon",
        "hobbies": ["Meditating", "Questioning existence", "Protecting other Pokémon"]
      },
      "relationships": {
        "allies": ["Mew", "Other cloned Pokémon"],
        "rivals": ["Humans who exploit Pokémon"]
      },
      "story_elements": {
        "motivation": "To understand the meaning of life and protect Pokémon from human exploitation",
        "flaws": [
          "Struggles with trust",
          "Can be vengeful"
        ],
        "catchphrase": "..."
      }
    }
  },
  {
    "character": {
      "name": "Bulbasaur",
      "species": "Seed Pokémon",
      "gender": "Male",
      "age": "4",
      "role": "Starter Pokémon",
      "physical_attributes": {
        "defining_feature": "Large plant bulb on its back",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "Turquoise",
          "bulb": "Green",
          "spots": "Dark Green"
        }
      },
      "personality_traits": [
        "Gentle",
        "Dependable",
        "Patient",
        "Nurturing",
        "Strong-willed"
      ],
      "background": {
        "origin": "Kanto Region",
        "profession": "Starter Pokémon",
        "hobbies": ["Sunbathing", "Gardening", "Helping others"]
      },
      "relationships": {
        "allies": ["Squirtle", "Charmander", "Trainers"],
        "rivals": ["Poison-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To grow strong and evolve into Venusaur",
        "flaws": [
          "Can be too passive",
          "Grows weak in cold weather"
        ],
        "catchphrase": "Bulba-saur!"
      }
    }
  },
  {
    "character": {
      "name": "Squirtle",
      "species": "Tiny Turtle Pokémon",
      "gender": "Male",
      "age": "3",
      "role": "Playful Fighter",
      "physical_attributes": {
        "defining_feature": "Blue shell and curly tail",
        "clothing_style": "Often wears sunglasses",
        "color_palette": {
          "shell": "Blue",
          "skin": "Light Blue",
          "eyes": "Brown"
        }
      },
      "personality_traits": [
        "Playful",
        "Mischievous",
        "Loyal",
        "Confident",
        "Energetic"
      ],
      "background": {
        "origin": "Kanto Region",
        "profession": "Starter Pokémon",
        "hobbies": ["Swimming", "Playing pranks", "Battling"]
      },
      "relationships": {
        "allies": ["Bulbasaur", "Charmander", "Squirtle Squad"],
        "rivals": ["Grass-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To have fun while becoming stronger",
        "flaws": [
          "Can be too playful",
          "Sometimes doesn't take things seriously"
        ],
        "catchphrase": "Squirtle!"
      }
    }
  },
  {
    "character": {
      "name": "Jigglypuff",
      "species": "Balloon Pokémon",
      "gender": "Female",
      "age": "3",
      "role": "Musical Performer",
      "physical_attributes": {
        "defining_feature": "Round, pink body with big blue eyes",
        "clothing_style": "Often holds a microphone",
        "color_palette": {
          "body": "Pink",
          "eyes": "Blue",
          "ears": "Lighter Pink"
        }
      },
      "personality_traits": [
        "Sweet",
        "Dramatic",
        "Artistic",
        "Sensitive",
        "Determined"
      ],
      "background": {
        "origin": "Kanto Region",
        "profession": "Singer",
        "hobbies": ["Singing", "Performing", "Making friends"]
      },
      "relationships": {
        "allies": ["Wigglytuff", "Other musical Pokémon"],
        "rivals": ["Those who fall asleep during performances"]
      },
      "story_elements": {
        "motivation": "To become a famous singer and make people happy with music",
        "flaws": [
          "Gets angry when people fall asleep during performances",
          "Can be overly dramatic"
        ],
        "catchphrase": "Jiggly!"
      }
    }
  },
  {
    "character": {
      "name": "Snorlax",
      "species": "Sleeping Pokémon",
      "gender": "Male",
      "age": "7",
      "role": "Gentle Giant",
      "physical_attributes": {
        "defining_feature": "Massive, round body with cream-colored belly",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "Blue",
          "belly": "Cream",
          "feet": "Brown"
        }
      },
      "personality_traits": [
        "Gentle",
        "Laid-back",
        "Friendly",
        "Protective",
        "Food-loving"
      ],
      "background": {
        "origin": "Kanto Region",
        "profession": "Guardian of Routes",
        "hobbies": ["Sleeping", "Eating", "Sunbathing"]
      },
      "relationships": {
        "allies": ["Munchlax", "Trainers with food"],
        "rivals": ["Those who wake it from sleep"]
      },
      "story_elements": {
        "motivation": "To find the perfect napping spot and delicious food",
        "flaws": [
          "Very lazy and sleepy",
          "Can be stubborn when hungry"
        ],
        "catchphrase": "Snooor...lax..."
      }
    }
  },
  {
    "character": {
      "name": "Gengar",
      "species": "Shadow Pokémon",
      "gender": "Male",
      "age": "10",
      "role": "Mischievous Ghost",
      "physical_attributes": {
        "defining_feature": "Round, dark purple body with red eyes",
        "clothing_style": "No clothing, but often appears with a sinister grin",
        "color_palette": {
          "body": "Purple",
          "eyes": "Red",
          "underside": "Darker Purple"
        }
      },
      "personality_traits": [
        "Mischievous",
        "Playful",
        "Loyal",
        "Protective",
        "Humorous"
      ],
      "background": {
        "origin": "Lavender Town",
        "profession": "Ghost Pokémon",
        "hobbies": ["Playing pranks", "Scaring people", "Shadow games"]
      },
      "relationships": {
        "allies": ["Other Ghost-type Pokémon", "Trainers who appreciate its humor"],
        "rivals": ["Psychic-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To have fun and make friends, even if it means scaring them first",
        "flaws": [
          "Can be too mischievous",
          "Sometimes doesn't know its own strength"
        ],
        "catchphrase": "Gen-gar!"
      }
    }
  },
  {
    "character": {
      "name": "Dragonite",
      "species": "Dragon Pokémon",
      "gender": "Male",
      "age": "12",
      "role": "Gentle Guardian",
      "physical_attributes": {
        "defining_feature": "Large, orange dragon-like body with small wings",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "Orange",
          "belly": "Cream",
          "wings": "Green"
        }
      },
      "personality_traits": [
        "Kind",
        "Protective",
        "Wise",
        "Gentle",
        "Powerful"
      ],
      "background": {
        "origin": "Johto Region",
        "profession": "Guardian of the Seas",
        "hobbies": ["Flying", "Helping lost travelers", "Training"]
      },
      "relationships": {
        "allies": ["Dratini", "Dragonair", "Kind-hearted trainers"],
        "rivals": ["Ice-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To protect the weak and maintain balance in nature",
        "flaws": [
          "Can be too trusting",
          "Sometimes too gentle for its own good"
        ],
        "catchphrase": "Drago-nite!"
      }
    }
  },
  {
    "character": {
      "name": "Lugia",
      "species": "Diving Pokémon",
      "gender": "Genderless",
      "age": "1000",
      "role": "Guardian of the Seas",
      "physical_attributes": {
        "defining_feature": "Large, white dragon-bird with blue accents",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "White",
          "underside": "Blue",
          "wings": "Blue"
        }
      },
      "personality_traits": [
        "Wise",
        "Powerful",
        "Protective",
        "Mysterious",
        "Calm"
      ],
      "background": {
        "origin": "Whirl Islands",
        "profession": "Legendary Guardian",
        "hobbies": ["Soaring through the skies", "Meditating", "Watching over the seas"]
      },
      "relationships": {
        "allies": ["Ho-Oh", "The Legendary Birds"],
        "rivals": ["Dark-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To maintain balance between the land, sea, and sky",
        "flaws": [
        "Can be too distant",
        "Struggles to connect with others"
        ],
        "catchphrase": "Lugiaaa..."
      }
    }
  },
  {
    "character": {
      "name": "Lucario",
      "species": "Aura Pokémon",
      "gender": "Male",
      "age": "8",
      "role": "Noble Warrior",
      "physical_attributes": {
        "defining_feature": "Blue and black canine-like body with aura sensors",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "Blue",
          "chest": "Black",
          "eyes": "Red"
        }
      },
      "personality_traits": [
        "Noble",
        "Disciplined",
        "Loyal",
        "Wise",
        "Courageous"
      ],
      "background": {
        "origin": "Sinnoh Region",
        "profession": "Aura Guardian",
        "hobbies": ["Meditating", "Training", "Protecting others"]
      },
      "relationships": {
        "allies": ["Riolu", "Aura-sensitive trainers"],
        "rivals": ["Dark-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To master aura and protect the innocent",
        "flaws": [
          "Can be too serious",
          "Takes on too much responsibility"
        ],
        "catchphrase": "Lu-cario!"
      }
    }
  },
  {
    "character": {
      "name": "Greninja",
      "species": "Ninja Pokémon",
      "gender": "Male",
      "age": "6",
      "role": "Stealthy Ninja",
      "physical_attributes": {
        "defining_feature": "Dark blue ninja-like body with a tongue scarf",
        "clothing_style": "No clothing, but has a ninja aesthetic",
        "color_palette": {
          "body": "Dark Blue",
          "scarf": "Pink",
          "eyes": "Yellow"
        }
      },
      "personality_traits": [
        "Quick-witted",
        "Agile",
        "Loyal",
        "Strategic",
        "Cool-headed"
      ],
      "background": {
        "origin": "Kalos Region",
        "profession": "Ninja Warrior",
        "hobbies": ["Training", "Stealth missions", "Water techniques"]
      },
      "relationships": {
        "allies": ["Ash Ketchum", "Other Water-type Pokémon"],
        "rivals": ["Grass-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To become the ultimate ninja and master of water techniques",
        "flaws": [
          "Can be too independent",
          "Takes on too much alone"
        ],
        "catchphrase": "Grenin-ja!"
      }
    }
  },
  {
    "character": {
      "name": "Sylveon",
      "species": "Intertwining Pokémon",
      "gender": "Female",
      "age": "3",
      "role": "Gentle Healer",
      "physical_attributes": {
        "defining_feature": "White and pink fox-like body with ribbon-like feelers",
        "clothing_style": "No clothing, but has a bow-like feature",
        "color_palette": {
          "body": "White",
          "markings": "Pink",
          "eyes": "Blue"
        }
      },
      "personality_traits": [
        "Gentle",
        "Compassionate",
        "Healing",
        "Loving",
        "Empathetic"
      ],
      "background": {
        "origin": "Kalos Region",
        "profession": "Healer Pokémon",
        "hobbies": ["Helping others", "Playing with ribbons", "Spreading joy"]
      },
      "relationships": {
        "allies": ["Other Eeveelutions", "Fairy-type Pokémon"],
        "rivals": ["Dragon-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To bring happiness and healing to those in need",
        "flaws": [
          "Can be too trusting",
          "Takes others' pain as her own"
        ],
        "catchphrase": "Sylveon!"
      }
    }
  },
  {
    "character": {
      "name": "Garchomp",
      "species": "Mach Pokémon",
      "gender": "Male",
      "age": "9",
      "role": "Aerial Ace",
      "physical_attributes": {
        "defining_feature": "Shark-like body with wing-like arms",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "Blue-Gray",
          "underside": "Red",
          "wings": "Blue"
        }
      },
      "personality_traits": [
        "Powerful",
        "Loyal",
        "Protective",
        "Determined",
        "Fierce"
      ],
      "background": {
        "origin": "Sinnoh Region",
        "profession": "Dragon Warrior",
        "hobbies": ["Flying at high speeds", "Battling", "Training"]
      },
      "relationships": {
        "allies": ["Cynthia (Champion)", "Other Dragon-type Pokémon"],
        "rivals": ["Ice-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To become the strongest Dragon-type and protect its trainer",
        "flaws": [
          "Can be too aggressive in battle",
          "Struggles with patience"
        ],
        "catchphrase": "Garrr!"
      }
    }
  },
  {
    "character": {
      "name": "Mimikyu",
      "species": "Disguise Pokémon",
      "gender": "Genderless",
      "age": "5",
      "role": "Lonely Ghost",
      "physical_attributes": {
        "defining_feature": "Ragged cloth covering its true form",
        "clothing_style": "Wears a Pikachu-like disguise",
        "color_palette": {
          "cloth": "Yellow",
          "eyes": "Black",
          "mouth": "Black"
        }
      },
      "personality_traits": [
        "Lonely",
        "Gentle",
        "Longing for friendship",
        "Shy",
        "Affectionate"
      ],
      "background": {
        "origin": "Alola Region",
        "profession": "Ghost Pokémon",
        "hobbies": ["Making friends", "Hiding under its disguise", "Playing"]
      },
      "relationships": {
        "allies": ["Other Ghost-type Pokémon", "Kind trainers"],
        "rivals": ["Those who fear its true form"]
      },
      "story_elements": {
        "motivation": "To find true friendship without being feared for its appearance",
        "flaws": [
          "Very sensitive about its appearance",
          "Easily hurt by rejection"
        ],
        "catchphrase": "Mimi...kyu..."
      }
    }
  },
  {
    "character": {
      "name": "Umbreon",
      "species": "Moonlight Pokémon",
      "gender": "Male",
      "age": "4",
      "role": "Night Watcher",
      "physical_attributes": {
        "defining_feature": "Black body with yellow rings that glow in the dark",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "Black",
          "rings": "Yellow",
          "eyes": "Red"
        }
      },
      "personality_traits": [
        "Loyal",
        "Protective",
        "Mysterious",
        "Intelligent",
        "Independent"
      ],
      "background": {
        "origin": "Johto Region",
        "profession": "Night Guardian",
        "hobbies": ["Nighttime walks", "Protecting its trainer", "Stargazing"]
      },
      "relationships": {
        "allies": ["Eevee", "Other Eeveelutions"],
        "rivals": ["Psychic-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To protect its trainer and friends from nighttime dangers",
        "flaws": [
          "Can be too aloof",
          "Dislikes bright lights"
        ],
        "catchphrase": "Umbre..."
      }
    }
  },
  {
    "character": {
      "name": "Gardevoir",
      "species": "Embrace Pokémon",
      "gender": "Female",
      "age": "6",
      "role": "Graceful Protector",
      "physical_attributes": {
        "defining_feature": "Elegant, humanoid form with a flowing dress-like body",
        "clothing_style": "No clothing, but has a dress-like lower body",
        "color_palette": {
          "body": "White",
          "dress": "Green",
          "eyes": "Red"
        }
      },
      "personality_traits": [
        "Graceful",
        "Loyal",
        "Protective",
        "Empathetic",
        "Wise"
      ],
      "background": {
        "origin": "Hoenn Region",
        "profession": "Guardian Pokémon",
        "hobbies": ["Dancing", "Meditating", "Protecting its trainer"]
      },
      "relationships": {
        "allies": ["Ralts", "Kirlia", "Psychic-type Pokémon"],
        "rivals": ["Dark-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To protect its trainer with its life and create a safe space",
        "flaws": [
          "Can be overprotective",
          "Takes on others' emotions"
        ],
        "catchphrase": "Gardevoir..."
      }
    }
  },
  {
    "character": {
      "name": "Tyranitar",
      "species": "Armor Pokémon",
      "gender": "Male",
      "age": "11",
      "role": "Armored Tank",
      "physical_attributes": {
        "defining_feature": "Massive, dinosaur-like body with armor plating",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "Green",
          "armor": "Dark Green",
          "belly": "Cream"
        }
      },
      "personality_traits": [
        "Powerful",
        "Protective",
        "Territorial",
        "Loyal",
        "Strong-willed"
      ],
      "background": {
        "origin": "Johto Region",
        "profession": "Pseudo-Legendary Pokémon",
        "hobbies": ["Climbing mountains", "Training", "Protecting its territory"]
      },
      "relationships": {
        "allies": ["Larvitar", "Pupitar", "Strong trainers"],
        "rivals": ["Fighting-type Pokémon"]
      },
      "story_elements": {
        "motivation": "To become the strongest and protect what's important",
        "flaws": [
          "Can be too aggressive",
          "Destructive when angered"
        ],
        "catchphrase": "Tyraaaa!"
      }
    }
  },
  {
    "character": {
      "name": "Rayquaza",
      "species": "Sky High Pokémon",
      "gender": "Genderless",
      "age": "1000",
      "role": "Sky Guardian",
      "physical_attributes": {
        "defining_feature": "Serpentine dragon body with yellow rings",
        "clothing_style": "No clothing",
        "color_palette": {
          "body": "Green",
          "markings": "Yellow",
          "mouth": "Red"
        }
      },
      "personality_traits": [
        "Majestic",
        "Powerful",
        "Wise",
        "Protective",
        "Distant"
      ],
      "background": {
        "origin": "Hoenn Region",
        "profession": "Legendary Guardian of the Skies",
        "hobbies": ["Soaring through the ozone layer", "Meditating", "Maintaining balance"]
      },
      "relationships": {
        "allies": ["Groudon", "Kyogre"],
        "rivals": ["Those who disrupt the balance"]
      },
      "story_elements": {
        "motivation": "To maintain the balance between land and sea",
        "flaws": [
          "Can be too distant",
          "Slow to trust"
        ],
        "catchphrase": "Rayyyy!"
      }
    }
  },
  {
    "character": {
      "name": "Eevee",
      "species": "Evolution Pokémon",
      "gender": "Female",
      "age": "2",
      "role": "Adaptable Companion",
      "physical_attributes": {
        "defining_feature": "Fluffy brown fur with a cream-colored ruff",
        "clothing_style": "Sometimes wears accessories like bows or scarves",
        "color_palette": {
          "fur": "Brown",
          "ruff": "Cream",
          "eyes": "Brown"
        }
      },
      "personality_traits": [
        "Adaptable",
        "Friendly",
        "Curious",
        "Energetic",
        "Loving"
      ],
      "background": {
        "origin": "Various regions",
        "profession": "Companion Pokémon",
        "hobbies": ["Playing", "Exploring", "Evolving"]
      },
      "relationships": {
        "allies": ["Its trainer", "Other Eeveelutions"],
        "rivals": ["Pokémon that threaten its friends"]
      },
      "story_elements": {
        "motivation": "To find its true evolutionary path and make friends",
        "flaws": [
          "Can be indecisive",
          "Sometimes too trusting"
        ],
        "catchphrase": "Eevee!"
      }
    }
  }
];

// Export the Pokémon entities array for use in other modules
module.exports = { POKEMON_ENTITIES };
