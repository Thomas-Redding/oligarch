let utils = {
  "NATIONS": {
    "Africa": {
      "base_income_per_territory" : 6,
      "territories": ["Madagascar", "North Africa", "Egypt", "East Africa", "Congo", "South Africa"]
    },
    "North America": {
      "base_income_per_territory" : 4,
      "territories": ["Alaska", "Ontario", "Northwest Territory", "Greenland", "Eastern United States", "Western United States", "Quebec", "Central America", "Alberta"]
    },
    "South America": {
      "base_income_per_territory" : 9,
      "territories": ["Venezuela", "Brazil", "Argentina", "Peru"]
    },
    "Europe": {
      "base_income_per_territory" : 5,
      "territories": ["Iceland", "Great Britain", "Scandinavia", "Southern Europe", "Western Europe", "Northern Europe", "Ukraine"]
    },
    "Asia": {
      "base_income_per_territory" : 5,
      "territories": ["Japan", "Yakursk", "Kamchatka", "Siberia", "Ural", "Afghanistan", "Middle East", "India", "Siam", "China", "Mongolia", "Irkutsk"]
    },
    "Australia": {
      "base_income_per_territory" : 9,
      "territories": ["Eastern Australia", "Indonesia", "New Guinea", "Western Australia"]
    }
  },
  "NEIGHBORS": {
    "Afghanistan": {
      "Ural": 1,
      "Siberia": 1,
      "China": 1,
      "India": 1,
      "Middle East": 1,
      "Ukraine": 1,
    },
    "Alaska": {
      "Northwest Territory": 1,
      "Alberta": 1,
      "Kamchatka": 1,
    },
    "Alberta": {
      "Alaska": 1,
      "Northwest Territory": 1,
      "Ontario": 1,
      "Western United States": 1,
    },
    "Argentina": {
      "Peru": 1,
      "Brazil": 1,
    },
    "Brazil": {
      "Venezuela": 1,
      "Peru": 1,
      "Argentina": 1,
    },
    "Central America": {
      "Western United States": 1,
      "Eastern United States": 1,
      "Venezuela": 1,
    },
    "China": {
      "Siam": 1,
      "India": 1,
      "Afghanistan": 1,
      "Ural": 1,
      "Siberia": 1,
      "Mongolia": 1,
    },
    "Congo": {
      "North Africa": 1,
      "East Africa": 1,
      "South Africa": 1,
    },
    "East Africa": {
      "South Africa": 1,
      "Congo": 1,
      "Madagascar": 1,
      "North Africa": 1,
      "Egypt": 1,
      "Middle East": 1,
    },
    "Eastern Australia": {
      "Western Australia": 1,
      "New Guinea": 1,
    },
    "Eastern United States": {
      "Central America": 1,
      "Western United States": 1,
      "Ontario": 1,
      "Quebec": 1,
    },
    "Egypt": {
      "North Africa": 1,
      "East Africa": 1,
      "Western Europe": 1,
      "Southern Europe": 1,
      "Middle East": 1,
    },
    "Great Britain": {
      "Iceland": 1,
      "Scandinavia": 1,
      "Northern Europe": 1,
      "Western Europe": 1,
    },
    "Greenland": {
      "Northwest Territory": 1,
      "Ontario": 1,
      "Quebec": 1,
      "Iceland": 1,
    },
    "Iceland": {
      "": 1,
    },
    "India": {
      "Middle East": 1,
      "Afghanistan": 1,
      "China": 1,
      "Siam": 1,
    },
    "Indonesia": {
      "Siam": 1,
      "New Guinea": 1,
      "Western Australia": 1,
    },
    "Irkutsk": {
      "Siberia": 1,
      "Yakutsk": 1,
      "Kamchatka": 1,
      "Mongolia": 1,
    },
    "Japan": {
      "Kamchatka": 1,
      "Mongolia": 1,
    },
    "Kamchatka": {
      "Yakutsk": 1,
      "Irkutsk": 1,
      "Mongolia": 1,
      "Japan": 1,
      "Alaska": 1,
    },
    "Madagascar": {
      "South Africa": 1,
      "East Africa": 1,
    },
    "Middle East": {
      "": 1,
    },
    "Mongolia": {
      "China": 1,
      "Siberia": 1,
      "Irkutsk": 1,
      "Japan": 1,
      "Kamchatka": 1,
    },
    "New Guinea": {
      "Indonesia": 1,
      "Eastern Australia": 1,
      "Western Australia": 1,
    },
    "North Africa": {
      "Brazil": 1,
      "Congo": 1,
      "Egypt": 1,
      "Western Europe": 1,
      "Southern Europe": 1,
    },
    "Northern Europe": {
      "Great Britain": 1,
      "Scandinavia": 1,
      "Ukraine": 1,
      "Southern Europe": 1,
      "Western Europe": 1,
    },
    "Northwest Territory": {
      "Alaska": 1,
      "Alberta": 1,
      "Ontario": 1,
      "Quebec": 1,
      "Greenland": 1,
    },
    "Ontario": {
      "Northwest Territory": 1,
      "Alberta": 1,
      "Quebec": 1,
      "Greenland": 1,
      "Western United States": 1,
      "Eastern United States": 1,
    },
    "Peru": {
      "Venezuela": 1,
      "Brazil": 1,
      "Argentina": 1,
    },
    "Quebec": {
      "Greenland": 1,
      "Ontario": 1,
      "Eastern United States": 1,
    },
    "Scandinavia": {
      "Iceland": 1,
      "Great Britain": 1,
      "Northern Europe": 1,
      "Ukraine": 1,
    },
    "Siam": {
      "China": 1,
      "India": 1,
      "Indonesia": 1,
    },
    "Siberia": {
      "Ural": 1,
      "China": 1,
      "Yakutsk": 1,
      "Irkutsk": 1,
      "Mongolia": 1,
    },
    "South Africa": {
      "Congo": 1,
      "East Africa": 1,
      "Madagascar": 1,
    },
    "Southern Europe": {
      "Western Europe": 1,
      "Northern Europe": 1,
      "Ukraine": 1,
      "Middle East": 1,
      "Egypt": 1,
    },
    "Ukraine": {
      "Scandinavia": 1,
      "Northern Europe": 1,
      "Southern Europe": 1,
      "Middle East": 1,
      "Afghanistan": 1,
      "Ural": 1,
    },
    "Ural": {
      "Ukraine": 1,
      "Afghanistan": 1,
      "Siberia": 1,
      "China": 1,
    },
    "Venezuela": {
      "Central America": 1,
      "Peru": 1,
      "Brazil": 1,
    },
    "Western Australia": {
      "Eastern Australia": 1,
      "Indonesia": 1,
      "New Guinea": 1,
    },
    "Western Europe": {
      "Southern Europe": 1,
      "Eastern Europe": 1,
      "Ukraine": 1,
      "Scandinavia": 1,
      "Great Britain": 1,
    },
    "Western United States": {
      "Alberta": 1,
      "Eastern United States": 1,
      "Central America": 1,
    },
    "Yakutsk": {
      "Siberia": 1,
      "Irkutsk": 1,
      "Kamchatka": 1,
    }
  }
};

module.exports = utils;