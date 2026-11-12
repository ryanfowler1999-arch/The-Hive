type Prompt = [string, string, string, string];

// Append whole boards and keep their order stable. Use an explicit dated
// schedule before expanding a deck that has already gone live.
export const boards: Prompt[][] = [
  [
    ["What household object would give the best resignation speech?", "Alarm clock|clock", "Vacuum|vacuum cleaner", "Toaster"],
    ["Which fruit would look most convincing in a tiny detective hat?", "Pineapple", "Banana", "Orange"],
    ["What noise would you least want your shoes to make?", "Squeak|squeaking", "Fart|farting", "Quack|quacking"],
    ["What would a ghost be most likely to leave in a rideshare?", "Sheet|white sheet", "Phone|cell phone", "Keys|key"],
    ["Which smell would make the best candle for a rainy day?", "Fresh rain|rain|petrichor", "Coffee", "Vanilla"],
    ["What belongs in a museum of mildly annoying inventions?", "Clamshell packaging|plastic packaging", "Pop-up ads|popup ads|ads", "Alarm clock|alarms"],
    ["Which animal would be the strictest librarian?", "Owl", "Cat", "Goose"],
  ],
  [
    ["Which vegetable would you cast as a medieval knight?", "Potato", "Carrot", "Broccoli"],
    ["What sound makes a room feel awkward when everyone is silent?", "Stomach growl|stomach rumble", "Cough|coughing", "Sneeze|sneezing"],
    ["What would you bring to a picnic on the moon?", "Sandwich|sandwiches", "Water", "Oxygen|oxygen tank"],
    ["What object would make the worst doorbell?", "Air horn|horn", "Whoopee cushion", "Drum"],
    ["Which animal would be hardest to beat at hide-and-seek?", "Chameleon", "Octopus", "Mouse"],
    ["What food sounds like a good name for a sleepy dog?", "Biscuit", "Mochi", "Waffles|waffle"],
    ["What would you put in a time capsule about waiting in line?", "Ticket|number ticket", "Phone", "Receipt"],
  ],
  [
    ["If clouds had flavors, what would a storm cloud taste like?", "Black licorice|licorice", "Blueberry", "Grape"],
    ["What would a hotel for cats put on its breakfast menu?", "Tuna", "Salmon|fish", "Milk"],
    ["Which household chore deserves its own theme song?", "Laundry|washing clothes", "Dishes|washing dishes", "Vacuuming|vacuum"],
    ["What would a robot keep as a good-luck charm?", "Battery", "Bolt|screw", "Lucky coin|coin"],
    ["What would you hate to find at the center of a chocolate truffle?", "Toothpaste", "Onion", "Pickle"],
    ["What would a dragon most likely order from a coffee shop?", "Espresso", "Hot chocolate|cocoa", "Black coffee|coffee"],
    ["Which room in a house would make the best name for a band?", "The Basement|basement", "The Attic|attic", "The Garage|garage"],
  ],
  [
    ["Which animal would take the longest to tell a joke?", "Sloth", "Turtle|tortoise", "Snail"],
    ["What would you put in a vending machine for insomniacs?", "Melatonin", "Tea|chamomile tea", "Coffee"],
    ["Which item in a junk drawer would win a talent show?", "Rubber band|rubber bands", "Scissors", "Tape"],
    ["What snack would make the worst substitute for a poker chip?", "Potato chip|chip|chips", "Popcorn", "Pretzel|pretzels"],
    ["What would you least want to hear from a talking elevator?", "Help|help me", "Goodbye", "Going down"],
    ["What would a snowman collect on vacation?", "Snow globe", "Postcard", "Shell|seashell"],
    ["Which kitchen utensil would make the best musical instrument?", "Wooden spoon|spoon", "Whisk", "Ladle"],
  ],
  [
    ["What would be the hardest thing to wrap as a birthday present?", "Bicycle|bike", "Car", "Cat"],
    ["What would a very polite pirate say instead of a swear word?", "Barnacles", "Shiver me timbers", "Darn"],
    ["Which creature would be best at delivering tiny parcels?", "Ant", "Bee", "Pigeon"],
    ["What would a store that only opens in dreams sell?", "Pillows|pillow", "Memories", "Dreams"],
    ["What breakfast food would make the best building material?", "Toast", "Waffle|waffles", "Pancake|pancakes"],
    ["Which object at a dentist's office would make the strangest souvenir?", "Tooth", "Drill", "Bib"],
    ["What would a bored wizard do with a spoon?", "Bend it|bend", "Make it float|levitate", "Turn it into a wand|wand"],
  ],
  [
    ["Which snack should come with a tiny instruction manual?", "Pistachios|pistachio", "Sunflower seeds", "String cheese"],
    ["What everyday object would be eeriest to find on a deserted island?", "Mirror", "Phone", "Doll"],
    ["Which animal would you trust to pick the music on a road trip?", "Dog", "Parrot", "Cat"],
    ["What would a haunted bakery run out of first?", "Ghost cookies|cookies", "Bread", "Donuts|doughnuts"],
    ["What smell should have its own national holiday?", "Fresh bread|bread", "Coffee", "Rain|petrichor"],
    ["What would you name a plant that refuses to grow?", "Stubborn|stubborn sprout", "Bob", "Lazy|lazy leaf"],
    ["Which toy would make the worst office mascot?", "Furby", "Clown doll|clown", "Jack-in-the-box|jack in the box"],
  ],
  [
    ["What would be the most useful prize in a cereal box?", "Money|cash", "Coupon", "Spoon"],
    ["Which animal would write the longest restaurant review?", "Cat", "Goose", "Owl"],
    ["What would a houseplant ask for on its birthday?", "Water", "Sunlight|sun", "New pot|pot"],
    ["What object would make the worst trophy for a race?", "Snail", "Brick", "Banana"],
    ["Which food would be funniest to hear someone order in a whisper?", "Pickles|pickle", "Soup", "Cheeseburger|burger"],
    ["What sound would you choose for a door that opens into space?", "Whoosh", "Ding", "Creak"],
    ["What would a bee put on an out-of-office sign?", "Out collecting pollen|pollen", "Gone buzzing|buzzing", "Back at the hive|hive"],
  ],
];

