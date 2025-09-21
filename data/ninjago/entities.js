// Ninjago character entities for the story application
const NINJAGO_ENTITIES = [
  {
    "character": {
      "name": "Kai",
      "species": "Human",
      "gender": "Male",
      "age": "20",
      "role": "Ninja of Fire",
      "image": "/public/images/entities/Kai.png",
      "physical_attributes": {
        "defining_feature": "Red ninja gi with flame patterns",
        "clothing_style": "Traditional ninja attire with red and black color scheme",
        "color_palette": {
          "primary": "Red",
          "secondary": "Black",
          "accent": "Gold"
        }
      },
      "personality_traits": [
        "Brave",
        "Hot-headed",
        "Loyal",
        "Determined",
        "Protective"
      ],
      "background": {
        "origin_story": "Former blacksmith's apprentice who became the Master of Fire and one of the leaders of the Ninja team.",
        "skills_and_abilities": [
          "Fire manipulation",
          "Expert swordsman",
          "Hand-to-hand combat",
          "Leadership"
        ],
        "weaknesses": [
          "Impulsive nature",
          "Can be hot-tempered",
          "Struggles with patience"
        ]
      },
      "relationships": {
        "allies": [
          "Nya (sister)",
          "The other Elemental Masters"
        ],
        "rivals": [
          "Lord Garmadon",
          "The Serpentine"
        ]
      },
      "story_elements": {
        "motivation": "To protect Ninjago and his friends, and to become the greatest ninja.",
        "flaws": [
          "Acts before thinking",
          "Can be overconfident"
        ],
        "catchphrase": "\"The fire inside me burns brighter than the fire around me!\""
      }
    }
  },
  {
    "character": {
      "name": "Jay",
      "species": "Human",
      "gender": "Male",
      "age": "19",
      "role": "Ninja of Lightning",
      "image": "/public/images/entities/Jay.png",
      "physical_attributes": {
        "defining_feature": "Blue ninja gi with lightning bolt patterns",
        "clothing_style": "Sleek ninja attire with blue and white color scheme",
        "color_palette": {
          "primary": "Blue",
          "secondary": "White",
          "accent": "Silver"
        }
      },
      "personality_traits": [
        "Funny",
        "Inventive",
        "Charming",
        "Clever",
        "Talkative"
      ],
      "background": {
        "origin_story": "Former mechanic who discovered his elemental powers and joined the ninja team as the Master of Lightning.",
        "skills_and_abilities": [
          "Lightning manipulation",
          "Mechanical engineering",
          "Gadget creation",
          "Quick thinking"
        ],
        "weaknesses": [
          "Can be a bit of a show-off",
          "Sometimes lacks confidence",
          "Easily distracted"
        ]
      },
      "relationships": {
        "allies": [
          "Nya (girlfriend)",
          "The other Elemental Masters"
        ],
        "rivals": [
          "Nadakhan",
          "The Time Twins"
        ]
      },
      "story_elements": {
        "motivation": "To prove himself as a hero and protect those he cares about.",
        "flaws": [
          "Can be impulsive",
          "Tends to crack jokes in serious situations"
        ],
        "catchphrase": "\"Let's light it up!\""
      }
    }
  },
  {
    "character": {
      "name": "Zane",
      "species": "Nindroid",
      "gender": "Male",
      "age": "Unknown (appears 20s)",
      "role": "Ninja of Ice",
      "image": "/public/images/entities/Zane.png",
      "physical_attributes": {
        "defining_feature": "White and silver robotic body with glowing blue circuits",
        "clothing_style": "White ninja gi with silver and light blue accents",
        "color_palette": {
          "primary": "White",
          "secondary": "Silver",
          "accent": "Light Blue"
        }
      },
      "personality_traits": [
        "Analytical",
        "Compassionate",
        "Loyal",
        "Wise",
        "Calm"
      ],
      "background": {
        "origin_story": "A nindroid created by Dr. Julien to be the son he never had, later discovering his true nature and becoming the Master of Ice.",
        "skills_and_abilities": [
          "Ice manipulation",
          "Superhuman strength and durability",
          "Advanced scanning and analysis",
          "Tactical thinking"
        ],
        "weaknesses": [
          "Can be overly logical",
          "Vulnerable to water damage",
          "Struggles with emotions"
        ]
      },
      "relationships": {
        "allies": [
          "Dr. Julien (creator/father)",
          "P.I.X.A.L. (fellow nindroid)"
        ],
        "rivals": [
          "The Overlord",
          "The Digital Overlord"
        ]
      },
      "story_elements": {
        "motivation": "To understand what it means to be human while protecting those he cares about.",
        "flaws": [
          "Can be too literal",
          "Sometimes overanalyzes situations"
        ],
        "catchphrase": "\"I am more than what I was programmed to be.\""
      }
    }
  },
  {
    "character": {
      "name": "Cole",
      "species": "Human (formerly Ghost)",
      "gender": "Male",
      "age": "21",
      "role": "Ninja of Earth",
      "image": "/public/images/entities/Cole.png",
      "physical_attributes": {
        "defining_feature": "Black ninja gi with earth and mountain motifs",
        "clothing_style": "Heavy-set ninja attire with black and dark gray colors",
        "color_palette": {
          "primary": "Black",
          "secondary": "Dark Gray",
          "accent": "Brown"
        }
      },
      "personality_traits": [
        "Strong",
        "Loyal",
        "Dependable",
        "Serious",
        "Caring"
      ],
      "background": {
        "origin_story": "Formerly the son of a famous rock musician, he rejected that life to become the Master of Earth and one of the most powerful ninja.",
        "skills_and_abilities": [
          "Earth manipulation",
          "Super strength",
          "Durability",
          "Dancing"
        ],
        "weaknesses": [
          "Fear of ghosts (ironically)",
          "Can be stubborn",
          "Dislikes technology"
        ]
      },
      "relationships": {
        "allies": [
          "His father, Lou",
          "The other Elemental Masters"
        ],
        "rivals": [
          "The Skulkin",
          "The Stone Warriors"
        ]
      },
      "story_elements": {
        "motivation": "To protect Ninjago and prove that strength comes in many forms.",
        "flaws": [
          "Can be too serious",
          "Struggles with change"
        ],
        "catchphrase": "\"I'm not just strong, I'm unbreakable!\""
      }
    }
  },
  {
    "character": {
      "name": "Nya",
      "species": "Human",
      "gender": "Female",
      "age": "19",
      "role": "Ninja of Water/Samurai X",
      "image": "/public/images/entities/Nya.png",
      "physical_attributes": {
        "defining_feature": "Blue ninja gi with wave patterns (as Samurai X: silver and pink armor)",
        "clothing_style": "Sleek ninja attire with blue and white colors (as Samurai X: high-tech armor)",
        "color_palette": {
          "primary": "Blue",
          "secondary": "White",
          "accent": "Silver"
        }
      },
      "personality_traits": [
        "Intelligent",
        "Independent",
        "Strong-willed",
        "Compassionate",
        "Determined"
      ],
      "background": {
        "origin_story": "Kai's younger sister who started as the team's mechanic before becoming the Water Ninja and later the Samurai X.",
        "skills_and_abilities": [
          "Water manipulation",
          "Mechanical engineering",
          "Hand-to-hand combat",
          "Strategy"
        ],
        "weaknesses": [
          "Can be stubborn",
          "Takes on too much responsibility",
          "Struggles with asking for help"
        ]
      },
      "relationships": {
        "allies": [
          "Kai (brother)",
          "Jay (boyfriend)",
          "The other Elemental Masters"
        ],
        "rivals": [
          "The Preeminent",
          "The Mechanic"
        ]
      },
      "story_elements": {
        "motivation": "To protect Ninjago and prove herself as a ninja in her own right.",
        "flaws": [
          "Can be too independent",
          "Tries to do everything herself"
        ],
        "catchphrase": "\"I don't need to be saved, I can take care of myself!\""
      }
    }
  },
  {
    "character": {
      "name": "Lloyd Garmadon",
      "species": "Human/Oni Hybrid",
      "gender": "Male",
      "age": "14-18 (varies by season)",
      "role": "Green Ninja/Master of Energy",
      "physical_attributes": {
        "defining_feature": "Green ninja gi with gold accents",
        "clothing_style": "Traditional ninja attire with green and gold colors",
        "color_palette": {
          "primary": "Green",
          "secondary": "Gold",
          "accent": "White"
        }
      },
      "personality_traits": [
        "Courageous",
        "Compassionate",
        "Determined",
        "Wise beyond his years",
        "Natural leader"
      ],
      "background": {
        "origin_story": "The son of Lord Garmadon and Koko, destined to become the Green Ninja and bring balance to Ninjago.",
        "skills_and_abilities": [
          "Energy manipulation",
          "Elemental dragon summoning",
          "Leadership",
          "Combat skills"
        ],
        "weaknesses": [
          "Struggles with his dark heritage",
          "Takes failures personally",
          "Pressure of being the chosen one"
        ]
      },
      "relationships": {
        "allies": [
          "Sensei Wu (uncle)",
          "The other Elemental Masters"
        ],
        "rivals": [
          "Lord Garmadon (father)",
          "The Overlord"
        ]
      },
      "story_elements": {
        "motivation": "To protect Ninjago and prove that he's not destined to follow in his father's footsteps.",
        "flaws": [
          "Self-doubt",
          "Fear of becoming like his father"
        ],
        "catchphrase": "\"I am the Green Ninja, and I will protect Ninjago!\""
      }
    }
  }
];

// Export the characters array for use in other modules
export { NINJAGO_ENTITIES };
