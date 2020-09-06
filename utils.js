let utils = {
  NATIONS: {
    "Africa": {
      "capital": "South Africa",
      "base_income_per_territory" : 6,
      "territories": ["Madagascar", "North Africa", "Egypt", "East Africa", "Congo", "South Africa"],
      "total_shares": 5
    },
    "North America": {
      "capital": "Ontario",
      "base_income_per_territory" : 4,
      "territories": ["Alaska", "Ontario", "Northwest Territory", "Greenland", "Eastern United States", "Western United States", "Quebec", "Central America", "Alberta"],
      "total_shares": 7
    },
    "South America": {
      "capital": "Argentina",
      "base_income_per_territory" : 9,
      "territories": ["Venezuela", "Brazil", "Argentina", "Peru"],
      "total_shares": 4
    },
    "Europe": {
      "capital": "Northern Europe",
      "base_income_per_territory" : 5,
      "territories": ["Iceland", "Great Britain", "Scandinavia", "Southern Europe", "Western Europe", "Northern Europe", "Ukraine"],
      "total_shares": 6
    },
    "Asia": {
      "capital": "Japan",
      "base_income_per_territory" : 3,
      "territories": ["Japan", "Yakursk", "Kamchatka", "Siberia", "Ural", "Afghanistan", "Middle East", "India", "Siam", "China", "Mongolia", "Irkutsk"],
      "total_shares": 8
    },
    "Australia": {
      "capital": "Eastern Australia",
      "base_income_per_territory" : 9,
      "territories": ["Eastern Australia", "Indonesia", "New Guinea", "Western Australia"],
      "total_shares": 3
    }
  },
  NEIGHBORS: {
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
      "North Africa": 1,
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
  },

  /*
   * Find how many shares have already been auctioned off for each nation.
   * @returns {Object} a dictionary with nation names as keys and number of
   * shares as values.
   */
  num_shares_already_auctioned_for_nation: (mother_state) => {
    let rtn = {};
    for (let nation in mother_state.nations) {
      rtn[nation] = utils.shares_sold(mother_state, nation);
    }
    return rtn;
  },

  /*
   * @param {string} nation - the nation whose owners to fetch
   * @returns {Object} - a dictionary of usernames to number-of-shares owned
   */
  owners: (mother_state, nation) => {
    let rtn = {};
    for (let username in mother_state.players) {
      rtn[username] = mother_state.players[username].shares[nation];
    }
    return rtn;
  },

  /*
   * @param {string} nation - the nation whose income to compute
   * @returns {int} the income of the given country
   */
  income_of_nation: (mother_state, nation) => {
    let rtn = 0;
    let territories = utils.territories_of_nation(mother_state, nation);
    for (let territory of territories) {
      rtn += utils.income_of_territory(mother_state, territory);
    }
    return rtn;
  },

  /*
   * @param {string} territory - the territory whose income to compute
   * @returns {int} the income of the given territory
   */
  income_of_territory: (mother_state, territory) => {
    let natural_income = utils.natural_income_of_territory(territory);
    let nation = utils.nation_of_territory(mother_state, territory);
    let factory_income = 5 * mother_state.nations[nation][territory].n_factories;
    return natural_income + factory_income;
  },

  /*
   * @param {string} territory - the territory whose natural income we want
   * @returns the natural income of the given territory
   */
  natural_income_of_territory: (territory) => {
    for (let nation in utils.NATIONS) {
      if (utils.NATIONS[nation].territories.includes(territory)) {
        return utils.NATIONS[nation].base_income_per_territory;
      }
    }
    throw Error("Unrecognized `territory`.");
  },

  /*
   * @param username - the user whose score we are computing
   * @returns {int} the score the given user would have if the game ended now
   */
  score_of_player: (mother_state, username) => {
    let player = mother_state.players[username];
    let rtn = player.cash;
    for (let nation in player.shares) {
      let income = utils.income_of_nation(mother_state, nation);
      let shares_sold = utils.shares_sold(mother_state, nation);
      if (shares_sold == 0) continue;
      let percent_owned = player.shares[nation] / shares_sold;
      rtn += (2 + utils.rounds_left(mother_state)) * percent_owned * income;
    }
    return rtn;
  },

  rounds_left: (mother_state) => {
    return 6 - mother_state.stage.round;
  },

  /*
   * @param {string} nation
   * @returns {int} the number of shares sold by the given nation.
   */
  shares_sold: (mother_state, nation) => {
    let rtn = 0;
    for (let username in mother_state.players) {
      rtn += mother_state.players[username].shares[nation];
    }
    return rtn;
  },

  /*
   * @param {string} nation - the nation whose territories you want
   * @returns {Array<string>} the territories that nation owns
   */
  territories_of_nation: (mother_state, nation) => {
    let rtn = [];
    for (let nat in utils.NATIONS) {
      for (let territory of utils.NATIONS[nat].territories) {
        if (utils.nation_of_territory(mother_state, territory) == nation) {
          rtn.push(territory);
        }
      }
    }
    return rtn;
  },

  territory_for_territory_name: (mother_state, territory_name) => {
    for (let nation in mother_state.nations) {
      if (mother_state.nations[nation].territories.includes(territory_name)) {
        let i = mother_state.nations[nation].territories.indexOf(territory_name);
        return mother_state.nations[nation][territory_name];
      }
    }
    return undefined;
  },

  /*
   * Compute the sum of the given array.
   */
  sum: (arr) => {
    return arr.reduce((a, b) => a + b, 0);
  },

  /*
   * Computes the bias towards the given nation for a conflict in the given
   * territory. This is based on the number of troops in the territory and the
   * number of cannons in adjacent territories. To compute the net bias (for the
   * dice roll), take the difference between the two relevant nation's biases.
   *
   * @param {string} nation - the name of the nation
   * @param {string} territory - the name of the territory
   * @returns {int} the bias for the nation's military in the territory
   */
  military_bias: (mother_state, nation, territory) => {
    let rtn = 0;
    let type_to_action_to_count = utils.army_in_territory(mother_state.nations[nation].army, territory, "move");
    for (let type in type_to_action_to_count) {
      for (let n of type_to_action_to_count[type]) {
        rtn += n;
      }
    }
    let neighbors = utils.NEIGHBORS[territory];
    for (let neighbor in neighbors) {
      rtn += utils.sum(utils.army_in_territory(mother_state.nations[nation].army, neighbor, "move")["Artillery"]);
    }
    return rtn;
  },

  /*
   * TODO: Support puppeteering.
   * @param {Object} mother_state - the mother state
   * @param {string} territory
   * @returns {string} the name of the nation that owns the territory. Returns
   * `null`` if the territory is contested.
   */
  nation_of_territory: (mother_state, territory) => {
    // If a territory is contested, return `null`; if a territory has one
    // nation's troops, it is owned by that nation.
    let owner = null;
    for (let nation in mother_state.nations) {
      if (mother_state.nations[nation].army.filter(x => x.territory == territory).length > 0) {
        if (owner !== null) return null;
        owner = nation;
      }
    }
    if (owner) return owner;

    // Otherwise, choose the default owner (or their puppeteer).
    for (let nation in utils.NATIONS) {
      if (utils.NATIONS[nation].territories.includes(territory)) {
        return utils.puppeteer(mother_state, nation);
      }
    }
    throw Error("Something went wrong in `utils.nation_of_territory()`.");
  },

  territories_of_nation_that_can_spawn: (mother_state, nation) => {
    let territory_names = utils.territories_of_nation(mother_state, nation);
    let rtn = [];
    for (let territory_name of territory_names) {
      let territory = utils.territory_for_territory_name(mother_state, territory_name);
      if (territory.n_barracks_can_spawn) {
        rtn.push(territory_name);
      }
    }
    return rtn;
  },

  territories_of_nation_that_can_build: (mother_state, nation) => {
    let territory_names = utils.territories_of_nation(mother_state, nation);
    let rtn = [];
    for (let territory_name of territory_names) {
      let territory = utils.territory_for_territory_name(mother_state, territory_name);
      if (territory.n_factories + territory.n_barracks < 4) {
        rtn.push(territory_name);
      }
    }
    return rtn;
  },

  /*
   * @returns the puppeteer of the given nation. If the nation owns itself, then
   * the puppeteer is itself. If the capital is contested only by enemies, then
   * this method returns null.
   */
  puppeteer: (mother_state, nation) => {
    if (mother_state.nations[nation].army.filter(x => x.territory == utils.NATIONS[nation].capital).length > 0) {
      return nation;
    }
    let owner = null;
    for (let n in mother_state.nations) {
      if (n === nation) continue;
      if (mother_state.nations[n].army.filter(x => x.territory == utils.NATIONS[nation].capital).length > 0) {
        if (owner !== null) return null;
        owner = n;
      }
    }
    if (owner) return owner;
    return nation;
  },

  /*
   * @returns {Object} a dictionary from usernames to how many votes that user
   * has received.
   */
  candidate_votes: (mother_state) => {
    let rtn = {};
    let nation = mother_state.stage.turn;
    let owners = utils.owners(mother_state, nation);
    for (let username in owners) {
      let candidate = mother_state.players[username].vote;
      if (candidate === null) continue;
      if (!(candidate in rtn)) rtn[candidate] = 0;
      rtn[candidate] += owners[username];
    }
    return rtn;
  },

  /*
   * This method returns a dictionary. The keys of the dictionary are the troop
   * types ("Cavalry" | "Infantry" | "Artillery"). The values are an array with two
   * natural numbers. The first number represents the number of troops of that
   * type in the given territory that have no `action` left; the second number
   * represents the number of troops with an `action` left. In this way, each
   * non-zero number returned in the dictionary corresponds to a "stack" to
   * render.
   *
   * @param {Array} army - mother_state.nations[nation].army
   * @param {string} territory - the territory
   * @param {string} stage - either "move" or "attack"
   * @return {Object} the dictionary described above.
   */
   army_in_territory: (army, territory, action) => {
     if (action != "move" && action != "attack") {
       throw Error("Unrecognized `stage` parameter.");
     }
     let arr = army.filter(x => x.territory == territory);
     let rtn = {
       "Cavalry": [0, 0],
       "Infantry": [0, 0],
       "Artillery": [0, 0],
     };
     for (let troop of arr) {
       let index;
       if (action == "move") {
         index = troop.can_move ? 1 : 0;
       } else {
         index = troop.can_attack ? 1 : 0;
       }
       rtn[troop.type][index] += 1;
     }
     return rtn;
  },

  /*
   * @param {int} troop_id - the id of the desired troop
   * @returns {Object} troop - the json representing the desired troop
   */
  toop_from_id: (mother_state, troop_id) => {
    for (let nation in mother_state.nations) {
      let arr = mother_state.nations[nation].army.filter(x => x.id == troop_id);
      if (arr.length == 0) continue;
      if (arr.length > 1) throw Error("Multiple troops share an ID.");
      return arr[0];
    }
    throw Error("Troop not found with the given ID.");
  },

  /*
   * @param {int} troop_id - id of the troop whose allegiance you want to know
   * @returns {string} the nation owning the troop
   */
  allegiance_from_troop_id: (mother_state, troop_id) => {
    for (let nation in mother_state.nations) {
      let arr = mother_state.nations[nation].army.filter(x => x.id == troop_id);
      if (arr.length == 0) continue;
      if (arr.length > 1) throw Error("Multiple troops share an ID.");
      return nation;
    }
    throw Error("Troop not found with the given ID.");
  },

  /*
   * Perform a deep copy of a json object. This method does not support
   * functions.
   */
  deep_copy: (x) => {
    return JSON.parse(JSON.stringify(x));
  },

  uuid: (username="") => {
    if (this._counter === undefined) this._counter = 0;
    ++this._counter;
    let usernameHash = username.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    return usernameHash + (this._counter - 1);
  },
};

// Terrible hack so this can be included on frontend.
try { module.exports = utils; } catch (err) {}
