// Character entities for the story application
const NORMAL_ENTITIES = [
  {
    "character": {
      "name": "Finn the Fox",
      "species": "Fox",
      "gender": "Male",
      "age": "25",
      "role": "Mischievous Hero",
      "physical_attributes": {
        "defining_feature": "A tattered, green bandana around his neck",
        "clothing_style": "Wears a patched-up vest and shorts with a satchel",
        "color_palette": {
          "fur": "Burnt Orange",
          "eyes": "Emerald Green",
          "clothing": "Earthy tones"
        }
      },
      "personality_traits": [
        "Clever",
        "Impulsive",
        "Loyal",
        "Sarcastic",
        "Adventurous",
        "Resourceful"
      ],
      "background": {
        "origin_story": "A lone scavenger who stumbled upon an ancient map, now on a quest to find the lost City of Whispers.",
        "skills_and_abilities": [
          "Expert tracker",
          "Agile climber",
          "Knows how to set simple traps"
        ],
        "weaknesses": [
          "Overly confident",
          "Dislikes working in large groups",
          "Has a crippling fear of water"
        ]
      },
      "relationships": {
        "allies": [
          "Pip the Squirrel (a nervous scout)",
          "Elderberry (a wise old bear)"
        ],
        "rivals": [
          "Barnaby the Badger (a greedy rival scavenger)"
        ]
      },
      "story_elements": {
        "motivation": "To prove himself worthy of a great adventure and to find a place to belong.",
        "flaws": [
          "Often takes unnecessary risks",
          "Can be emotionally distant"
        ],
        "catchphrase": "\"Just one more little peek...\""
      }
    }
  },
  {
    "character": {
      "name": "Luna the Owl",
      "species": "Owl",
      "gender": "Female",
      "age": "60",
      "role": "Mystical Mentor",
      "physical_attributes": {
        "defining_feature": "Feathers that shimmer with an ethereal glow",
        "clothing_style": "Wears a deep purple, flowing cloak adorned with silver star patterns",
        "color_palette": {
          "feathers": "Shades of violet and navy",
          "eyes": "Luminous gold",
          "clothing": "Deep purple"
        }
      },
      "personality_traits": [
        "Wise",
        "Patient",
        "Reserved",
        "Observant",
        "Calm"
      ],
      "background": {
        "origin_story": "Guardian of the Starlit Grove, she was tasked with protecting ancient knowledge from falling into the wrong hands.",
        "skills_and_abilities": [
          "Foresees the immediate future",
          "Can manipulate dreams",
          "Has vast knowledge of magical lore"
        ],
        "weaknesses": [
          "Can be overly cryptic and vague",
          "Reluctant to directly interfere"
        ]
      },
      "relationships": {
        "allies": [
          "The Forest Spirits",
          "Elderberry the Bear"
        ],
        "rivals": [
          "Sol the Crow (a chaotic trickster)"
        ]
      },
      "story_elements": {
        "motivation": "To maintain the balance between the mortal and spiritual worlds.",
        "flaws": [
          "Hesitates to act",
          "Rarely reveals her true intentions"
        ],
        "catchphrase": "\"Look to the stars, not the shadows.\""
      }
    }
  },
  {
    "character": {
      "name": "Sparky",
      "species": "Robot",
      "gender": "None",
      "age": "10",
      "role": "Loyal Sidekick",
      "physical_attributes": {
        "defining_feature": "A single, large light bulb for a head that changes color with emotion",
        "clothing_style": "Wears a small red bow tie",
        "color_palette": {
          "body": "Shiny silver metal",
          "light_bulb": "Varies (blue for sad, yellow for happy, red for angry)",
          "clothing": "Bright red"
        }
      },
      "personality_traits": [
        "Optimistic",
        "Clumsy",
        "Energetic",
        "Curious",
        "Brave"
      ],
      "background": {
        "origin_story": "A prototype cleaning robot abandoned in an old junkyard, later reactivated by an inventor.",
        "skills_and_abilities": [
          "Can analyze and process data quickly",
          "Extends his arms to a long length",
          "Acts as a mobile flashlight"
        ],
        "weaknesses": [
          "Prone to short-circuiting when scared",
          "Cannot swim"
        ]
      },
      "relationships": {
        "allies": [
          "Wally the Inventor",
          "Any small animals he meets"
        ],
        "rivals": [
          "Dust Bunnies (his mortal enemies)"
        ]
      },
      "story_elements": {
        "motivation": "To be useful and to make his inventor friend proud.",
        "flaws": [
          "Too trusting",
          "Gets easily distracted by shiny things"
        ],
        "catchphrase": "\"Zorp zorp!\""
      }
    }
  },
  {
    "character": {
      "name": "Barnaby the Badger",
      "species": "Badger",
      "gender": "Male",
      "age": "50",
      "role": "Greedy Antagonist",
      "physical_attributes": {
        "defining_feature": "A monocle on his left eye",
        "clothing_style": "Wears a fine, black waistcoat with a gold chain",
        "color_palette": {
          "fur": "Gray and white stripes",
          "eyes": "Small and beady",
          "clothing": "Black and gold"
        }
      },
      "personality_traits": [
        "Greedy",
        "Cunning",
        "Egotistical",
        "Meticulous"
      ],
      "background": {
        "origin_story": "A formerly respected miner who became obsessed with finding wealth after a cave-in destroyed his family heirloom.",
        "skills_and_abilities": [
          "Excellent digger and tunneler",
          "Skilled negotiator",
          "Knows the location of many hidden caves and passages"
        ],
        "weaknesses": [
          "Easily angered when his plans fail",
          "Fails to see the bigger picture due to greed"
        ]
      },
      "relationships": {
        "allies": [
          "A small gang of weasels"
        ],
        "rivals": [
          "Finn the Fox",
          "All who stand in his way"
        ]
      },
      "story_elements": {
        "motivation": "To hoard all the riches in the world and become untouchable.",
        "flaws": [
          "His ego blinds him to threats",
          "Never shares his spoils"
        ],
        "catchphrase": "\"Mine! All mine!\""
      }
    }
  },
  {
    "character": {
      "name": "Pip the Squirrel",
      "species": "Squirrel",
      "gender": "Male",
      "age": "18",
      "role": "Nervous Scout",
      "physical_attributes": {
        "defining_feature": "Carries a large, worn-out backpack filled with gadgets",
        "clothing_style": "None, but often wears a hat with a feather",
        "color_palette": {
          "fur": "Light brown with a white belly",
          "eyes": "Wide and nervous",
          "clothing": "Worn and faded"
        }
      },
      "personality_traits": [
        "Timid",
        "Loyal",
        "Meticulous",
        "Skilled with gadgets",
        "Pessimistic"
      ],
      "background": {
        "origin_story": "A loner who was always worried about the next disaster, he spent his time building small gadgets and learning survival skills.",
        "skills_and_abilities": [
          "Can build useful gadgets out of junk",
          "Is a fantastic scout and lookout",
          "Can climb and navigate trees quickly"
        ],
        "weaknesses": [
          "Overly paranoid",
          "Easily overwhelmed by pressure"
        ]
      },
      "relationships": {
        "allies": [
          "Finn the Fox"
        ],
        "rivals": [
          "Any loud or scary creatures"
        ]
      },
      "story_elements": {
        "motivation": "To survive any crisis that comes his way and to keep his friends safe.",
        "flaws": [
          "Runs from danger first",
          "Worries about everything"
        ],
        "catchphrase": "\"Oh no, oh no, oh no...\""
      }
    }
  },
  {
    "character": {
      "name": "Elderberry",
      "species": "Bear",
      "gender": "Female",
      "age": "80",
      "role": "Wise Advisor",
      "physical_attributes": {
        "defining_feature": "A walking stick made from an old oak branch",
        "clothing_style": "Wears a simple, homespun tunic",
        "color_palette": {
          "fur": "Graying brown",
          "eyes": "Kind and warm",
          "clothing": "Faded white"
        }
      },
      "personality_traits": [
        "Patient",
        "Gentle",
        "Insightful",
        "Tough",
        "Serene"
      ],
      "background": {
        "origin_story": "A long-time resident of the Whispering Woods, she is known for her deep knowledge of the forest and its history.",
        "skills_and_abilities": [
          "Knows about all the plants and herbs in the forest",
          "Can calm enraged animals with her voice",
          "Is an excellent storyteller"
        ],
        "weaknesses": [
          "Can be stubborn in her beliefs",
          "Her age makes her slow and tired"
        ]
      },
      "relationships": {
        "allies": [
          "Finn the Fox",
          "Luna the Owl"
        ],
        "rivals": [
          "Hunters and loggers"
        ]
      },
      "story_elements": {
        "motivation": "To preserve the old ways and protect her home from any harm.",
        "flaws": [
          "Tends to lecture",
          "Underestimates the power of new technology"
        ],
        "catchphrase": "\"All things are connected.\""
      }
    }
  },
  {
    "character": {
      "name": "Dr. Gizmo",
      "species": "Rabbit",
      "gender": "Male",
      "age": "45",
      "role": "Eccentric Inventor",
      "physical_attributes": {
        "defining_feature": "Wears thick glasses with one lens cracked",
        "clothing_style": "A messy white lab coat with a variety of tools in the pockets",
        "color_palette": {
          "fur": "White",
          "eyes": "Sparkle with an excited light",
          "clothing": "Grubby white"
        }
      },
      "personality_traits": [
        "Genius",
        "Absent-minded",
        "Excitable",
        "Obsessive",
        "Caring"
      ],
      "background": {
        "origin_story": "A reclusive inventor who lives in a vast underground burrow, obsessed with creating a device that can translate animal sounds into human speech.",
        "skills_and_abilities": [
          "Can build almost anything from spare parts",
          "Highly intelligent in physics and engineering",
          "Can solve complex puzzles quickly"
        ],
        "weaknesses": [
          "Forgets to eat and sleep",
          "His inventions sometimes fail spectacularly"
        ]
      },
      "relationships": {
        "allies": [
          "His countless inventions"
        ],
        "rivals": [
          "The laws of physics"
        ]
      },
      "story_elements": {
        "motivation": "To create an invention that will make the world a better place.",
        "flaws": [
          "Has a hard time finishing projects",
          "Doesn't understand social cues"
        ],
        "catchphrase": "\"A-ha! It's an a-ha moment!\""
      }
    }
  },
  {
    "character": {
      "name": "Milo the Mole",
      "species": "Mole",
      "gender": "Male",
      "age": "20",
      "role": "Underground Explorer",
      "physical_attributes": {
        "defining_feature": "Wears a miner's helmet with a light on the front",
        "clothing_style": "A worn-out denim jumpsuit with many pockets",
        "color_palette": {
          "fur": "Dark brown",
          "eyes": "Tiny and black",
          "clothing": "Faded blue"
        }
      },
      "personality_traits": [
        "Shy",
        "Quiet",
        "Courageous",
        "Perfectionist",
        "Honest"
      ],
      "background": {
        "origin_story": "Raised in the deep tunnels of the earth, he knows the network of underground passages better than anyone.",
        "skills_and_abilities": [
          "Exceptional sense of direction underground",
          "Can dig through almost any material",
          "Can navigate in total darkness"
        ],
        "weaknesses": [
          "Blind in bright light",
          "Very shy and introverted"
        ]
      },
      "relationships": {
        "allies": [
          "Worms and other burrowing creatures"
        ],
        "rivals": [
          "Earthquakes and cave-ins"
        ]
      },
      "story_elements": {
        "motivation": "To map every single tunnel and cave in the world.",
        "flaws": [
          "Often gets lost in his own thoughts",
          "Finds it difficult to speak up"
        ],
        "catchphrase": "\"Just follow the rumbling.\""
      }
    }
  },
  {
    "character": {
      "name": "Cassandra the Cat",
      "species": "Cat",
      "gender": "Female",
      "age": "28",
      "role": "Cunning Mercenary",
      "physical_attributes": {
        "defining_feature": "A single scar across her left eye",
        "clothing_style": "Wears sleek, black leather armor with throwing daggers in her belt",
        "color_palette": {
          "fur": "Sleek black",
          "eyes": "Icy blue",
          "clothing": "Dark gray and black"
        }
      },
      "personality_traits": [
        "Cynical",
        "Skeptical",
        "Agile",
        "Independent",
        "Secretly soft-hearted"
      ],
      "background": {
        "origin_story": "A former city thief who now takes on dangerous quests for a high price, but occasionally helps those in need for free.",
        "skills_and_abilities": [
          "Expert in stealth and infiltration",
          "Skilled with throwing knives",
          "Quick reflexes"
        ],
        "weaknesses": [
          "Doesn't trust anyone",
          "Her cynical attitude can alienate others"
        ]
      },
      "relationships": {
        "allies": [
          "A network of informers and spies"
        ],
        "rivals": [
          "Her own reputation for being untrustworthy"
        ]
      },
      "story_elements": {
        "motivation": "To earn enough money to live a peaceful, quiet life.",
        "flaws": [
          "Pushing people away",
          "Can't refuse a good challenge"
        ],
        "catchphrase": "\"Don't get attached.\""
      }
    }
  },
  {
    "character": {
      "name": "Captain Sterling",
      "species": "Human",
      "gender": "Male",
      "age": "55",
      "role": "Disgraced Leader",
      "physical_attributes": {
        "defining_feature": "A large, silver mechanical arm",
        "clothing_style": "A worn military uniform with tarnished medals",
        "color_palette": {
          "hair": "Graying",
          "eyes": "World-weary",
          "clothing": "Faded navy blue"
        }
      },
      "personality_traits": [
        "Grizzled",
        "Stoic",
        "Honorable",
        "Brave",
        "Haunted"
      ],
      "background": {
        "origin_story": "A legendary captain who lost his ship and his crew in a great battle, now seeking redemption by protecting the innocent.",
        "skills_and_abilities": [
          "Master strategist",
          "Skilled in hand-to-hand combat",
          "Highly resilient"
        ],
        "weaknesses": [
          "Struggles with his past failures",
          "Can be too rigid in his thinking"
        ]
      },
      "relationships": {
        "allies": [
          "Old comrades"
        ],
        "rivals": [
          "His own inner demons"
        ]
      },
      "story_elements": {
        "motivation": "To atone for his past mistakes and find peace.",
        "flaws": [
          "Puts himself in harm's way unnecessarily",
          "Slow to trust new people"
        ],
        "catchphrase": "\"A captain goes down with the ship... or he learns to swim.\""
      }
    }
  }
];

// Export the characters arrays for use in other modules
module.exports = { 
  NORMAL_ENTITIES,
};