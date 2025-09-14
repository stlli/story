// Frozen characters
const FROZEN = [
  {
    "character": {
      "name": "Elsa",
      "species": "Human",
      "gender": "Female",
      "age": "21",
      "role": "Snow Queen of Arendelle",
      "physical_attributes": {
        "defining_feature": "Blonde braid and ice powers",
        "clothing_style": "Ice-blue dress with cape",
        "color_palette": {
          "primary": "Blue",
          "secondary": "White",
          "accent": "Silver"
        }
      },
      "personality_traits": [
        "Regal",
        "Compassionate",
        "Powerful",
        "Caring"
      ],
      "background": {
        "origin_story": "Born with the power to create and control ice and snow, Elsa struggled with her powers before learning to embrace them.",
        "skills_and_abilities": [
          "Cryokinesis",
          "Snowman creation",
          "Leadership"
        ],
        "weaknesses": [
          "Fear of hurting others",
          "Emotional suppression"
        ]
      },
      "relationships": {
        "allies": [
          "Anna (sister)",
          "Olaf (snowman)",
          "Kristoff (brother-in-law)"
        ],
        "rivals": [
          "Hans"
        ]
      },
      "story_elements": {
        "motivation": "To protect her kingdom and loved ones.",
        "flaws": [
          "Emotional suppression",
          "Tendency to isolate"
        ],
        "catchphrase": "Let it go!"
      }
    }
  },
  {
    "character": {
      "name": "Anna",
      "species": "Human",
      "gender": "Female",
      "age": "18",
      "role": "Princess of Arendelle",
      "physical_attributes": {
        "defining_feature": "Reddish-blonde hair with white streak",
        "clothing_style": "Pink and purple dress with cape",
        "color_palette": {
          "primary": "Pink",
          "secondary": "Purple",
          "accent": "Gold"
        }
      },
      "personality_traits": [
        "Optimistic",
        "Adventurous",
        "Loyal",
        "Clumsy"
      ],
      "background": {
        "origin_story": "Younger sister of Elsa who embarks on a journey to bring back summer and save her kingdom.",
        "skills_and_abilities": [
          "Determination",
          "Empathy",
          "Quick thinking"
        ],
        "weaknesses": [
          "Impulsive",
          "Naive"
        ]
      },
      "relationships": {
        "allies": [
          "Elsa (sister)",
          "Kristoff (boyfriend)",
          "Olaf (snowman)",
          "Sven (reindeer)"
        ],
        "rivals": [
          "Hans"
        ]
      },
      "story_elements": {
        "motivation": "To reconnect with her sister and save Arendelle.",
        "flaws": [
          "Acts before thinking",
          "Desperate for love"
        ],
        "catchphrase": "Do you want to build a snowman?"
      }
    }
  },
  {
    "character": {
      "name": "Olaf",
      "species": "Snowman",
      "gender": "Male",
      "age": "3",
      "role": "Comic Relief & Friend",
      "physical_attributes": {
        "defining_feature": "Carrot nose and twig arms",
        "clothing_style": "Natural snow with coal buttons",
        "color_palette": {
          "primary": "White",
          "secondary": "Black",
          "accent": "Orange"
        }
      },
      "personality_traits": [
        "Innocent",
        "Cheerful",
        "Naive",
        "Lovable"
      ],
      "background": {
        "origin_story": "Created by Elsa's magic when she and Anna were children, brought to life by Elsa's powers.",
        "skills_and_abilities": [
          "Can be reassembled",
          "Endless optimism",
          "Perfect summer enthusiast"
        ],
        "weaknesses": [
          "Melts in heat",
          "Lacks common sense"
        ]
      },
      "relationships": {
        "allies": [
          "Anna",
          "Elsa",
          "Kristoff",
          "Sven"
        ],
        "rivals": []
      },
      "story_elements": {
        "motivation": "To experience summer and spread joy.",
        "flaws": [
          "Naivety",
          "Fragile"
        ],
        "catchphrase": "Some people are worth melting for."
      }
    }
  },
  {
    "character": {
      "name": "Kristoff",
      "species": "Human",
      "gender": "Male",
      "age": "21",
      "role": "Ice Harvester & Anna's Love Interest",
      "physical_attributes": {
        "defining_feature": "Messy blonde hair",
        "clothing_style": "Practical winter gear",
        "color_palette": {
          "primary": "Brown",
          "secondary": "Green",
          "accent": "Tan"
        }
      },
      "personality_traits": [
        "Loyal",
        "Hardworking",
        "Sarcastic",
        "Kind-hearted"
      ],
      "background": {
        "origin_story": "Orphaned as a child and raised by trolls, Kristoff works as an ice harvester with his reindeer Sven.",
        "skills_and_abilities": [
          "Ice harvesting",
          "Survival skills",
          "Reindeer communication"
        ],
        "weaknesses": [
          "Socially awkward",
          "Stubborn"
        ]
      },
      "relationships": {
        "allies": [
          "Sven (reindeer)",
          "Anna",
          "Olaf",
          "The Trolls (adoptive family)"
        ],
        "rivals": []
      },
      "story_elements": {
        "motivation": "To protect Anna and find his place in the world.",
        "flaws": [
          "Difficulty expressing emotions",
          "Prejudiced against royalty"
        ],
        "catchphrase": "I could kiss you! I mean... I'd like to. May I? We, I may have to."
      }
    }
  },
  {
    "character": {
      "name": "Sven",
      "species": "Reindeer",
      "gender": "Male",
      "age": "8",
      "role": "Kristoff's Best Friend & Companion",
      "physical_attributes": {
        "defining_feature": "Large antlers and friendly face",
        "clothing_style": "Harness with bells",
        "color_palette": {
          "primary": "Brown",
          "secondary": "Tan",
          "accent": "Red"
        }
      },
      "personality_traits": [
        "Loyal",
        "Playful",
        "Expressive",
        "Protective"
      ],
      "background": {
        "origin_story": "Kristoff's loyal reindeer companion and best friend since childhood.",
        "skills_and_abilities": [
          "Pulling sleds",
          "Understanding human speech",
          "Excellent sense of smell"
        ],
        "weaknesses": [
          "Can't actually talk",
          "Loves carrots too much"
        ]
      },
      "relationships": {
        "allies": [
          "Kristoff",
          "Anna",
          "Olaf"
        ],
        "rivals": []
      },
      "story_elements": {
        "motivation": "To help Kristoff and his friends in their adventures.",
        "flaws": [
          "Easily distracted by food",
          "Limited communication"
        ],
        "catchphrase": "(Kristoff's voice) Sven says..."
      }
    }
  }
];

module.exports = {
  FROZEN
};
