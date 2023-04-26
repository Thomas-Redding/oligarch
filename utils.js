try {
  kMap = require('./map.js');
} catch {
  // Frontend just uses <script src="utils.js"></script> :)
}

let waterPaths = [
  // // Madagascar
  [19+40*20 ,21+40*20],
  [19+40*19 ,21+40*19],
  [19+40*19 ,21+40*20],

  // Mediterranean
  [14+40*10 ,15+40*12],
  [14+40*12 ,14+40*10],
  [13+40*10 ,14+40*12],
  [17+40*10 ,17+40*12],
  [17+40*10 ,16+40*12],

  // North America and Greenland
  [8+40*5 ,10+40*4],
  [8+40*4 ,9+40*3],

  // Greenland to Great Britain
  [12+40*4 ,13+40*3],
  [12+40*4 ,14+40*4],
  [12+40*4 ,13+40*5],

  // Great Britain to Europe
  [13+40*5 ,15+40*6],
  [14+40*4 ,15+40*5],

  // North America and South America
  [4+40*10 ,5+40*12],

  // South America to Africa
  [9+40*15 ,13+40*14],
  [9+40*15 ,13+40*15],

  // Asia and Australia
  [30+40*11 ,31+40*15],
  [30+40*11 ,32+40*15],
  [30+40*11 ,30+40*16],

  // Asia and Japan
  [31+40*8 ,33+40*8],
  [31+40*7 ,33+40*7],

  // Australia
  [32+40*15 ,34+40*16],
  [32+40*16 ,34+40*16],
  [34+40*17 ,34+40*19],
  [35+40*17 ,34+40*19],
  [30+40*17 ,31+40*19],
  [31+40*15 ,30+40*16],
  [30+40*17 ,32+40*16],
];

for (let path of waterPaths) {
  path = path.map(x => x + 1);
  kMap[path[0]]["adjacencies"].push(path[1]);
  kMap[path[1]]["adjacencies"].push(path[0]);
}

const HexType = {
  none: "none",
  infantry: "infantry",
}

const kHexTypeNone = 'none';
const kHexTypeInfantry = 'infanty';

const kAbbr2Name = {
  "NA": "North America",
  "SA": "South America",
  "EU": "Europe",
  "AF": "Africa",
  "AS": "Asia",
  "AU": "Australia",
}

let utils = {
  CAPITALS: ["South Africa", "Ontario", "Argentina", "Northern Europe", "Japan", "Eastern Australia"],
  NATIONS: {
    "Africa": {
      "capital": "South Africa",
      "base_income_per_territory" : 6,
      // "territories": ["Madagascar", "North Africa", "Egypt", "East Africa", "Congo", "South Africa"],
      "num_auction_rounds": 5,
      "abbr": "AF"
    },
    "North America": {
      "capital": "Ontario",
      "base_income_per_territory" : 4,
      // "territories": ["Alaska", "Ontario", "Northwest Territory", "Greenland", "Eastern United States", "Western United States", "Quebec", "Central America", "Alberta"],
      "num_auction_rounds": 6,
      "abbr": "NA"
    },
    "South America": {
      "capital": "Argentina",
      "base_income_per_territory" : 9,
      // "territories": ["Venezuela", "Brazil", "Argentina", "Peru"],
      "num_auction_rounds": 5,
      "abbr": "SA"
    },
    "Europe": {
      "capital": "Northern Europe",
      "base_income_per_territory" : 5,
      // "territories": ["Iceland", "Great Britain", "Scandinavia", "Southern Europe", "Western Europe", "Northern Europe", "Ukraine"],
      "num_auction_rounds": 6,
      "abbr": "EU"
    },
    "Asia": {
      "capital": "Japan",
      "base_income_per_territory" : 3,
      // "territories": ["Japan", "Yakursk", "Kamchatka", "Siberia", "Ural", "Afghanistan", "Middle East", "India", "Siam", "China", "Mongolia", "Irkutsk"],
      "num_auction_rounds": 6,
      "abbr": "AS"
    },
    "Australia": {
      "capital": "Eastern Australia",
      "base_income_per_territory" : 9,
      // "territories": ["Eastern Australia", "Indonesia", "New Guinea", "Western Australia"],
      "num_auction_rounds": 4,
      "abbr": "AU"
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
    let nationName = kAbbr2Name[kMap[territory].homeContinent];
    let factory_income = 5 * mother_state.nations[nationName][territory].n_factories;
    return natural_income + factory_income;
  },

  /*
   * @param {string} territory - the territory whose natural income we want
   * @returns the natural income of the given territory
   */
  natural_income_of_territory: (territory) => {
    return 1;
  },

  /*
   * @param username - the user whose score we are computing
   * @returns {int} the score the given user would have if the game ended now
   */
  score_of_nation: (mother_state, nation_name) => {
    let income_mult = 2 + utils.rounds_left(mother_state);
    return cash + income_mult * income;
  },

  /*
   * @param username - the user whose score we are computing
   * @returns {int} the score the given user would have if the game ended now
   */
  score_of_player: (mother_state, username, auctionsCompletedSoFar) => {
    let player = mother_state.players[username];
    let rtn = parseFloat(player.cash);
    for (let nation_name in player.shares) {
      if (player.shares[nation_name] == 0) continue;
      let cash = mother_state.nations[nation_name].cash;
      let income = utils.income_of_nation(mother_state, nation_name);
      let existingShares = utils.shares_sold(mother_state, nation_name);
      let sharesArray = mother_state.supershares;
      let sum = 0;
      let i;
      for (i = 0; i < existingShares; ++i) {
        if (sum >= existingShares) {
          sharesArray = sharesArray.slice(i);
          break;
        }
        sum += sharesArray[i];
      }
      let valueOfShare = utils._private_advised_price_for_one_share(cash, income, existingShares, sharesArray);
      let percent_owned = player.shares[nation_name] / existingShares;
      rtn += percent_owned * valueOfShare;
    }
    return rtn;
  },

  /*
   * Only call at the end of the game.
   * @param username - the user whose score we are computing
   * @returns {int} the score the given user has
   */
  end_score_of_player: (mother_state, username) => {
    let player = mother_state.players[username];
    let rtn = parseFloat(player.cash);
    for (let nation in player.shares) {
      let shares_sold = utils.shares_sold(mother_state, nation);
      if (shares_sold == 0) continue;
      let income = utils.income_of_nation(mother_state, nation);
      let percent_owned = player.shares[nation] / shares_sold;
      rtn += 2 * percent_owned * income;
    }
    return rtn;
  },

  /*
   * @returns the number of rounds left (excluding the current round).
   */
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

  advised_share_price: (mother_state, nation_name, new_shares) => {
    // TODO: At the moment we assume bids are either burned or go to the existing shareholders.
    // This is set in `mother_state.settings` but needs to be implemented here.
    let cash = mother_state.nations[nation_name].cash;
    let income = utils.income_of_nation(mother_state, nation_name);
    let existingShares = utils.shares_sold(mother_state, nation_name);
    let sharesArray = mother_state.supershares.slice(mother_state.stage.round-1);
    return sharesArray[0] * utils._private_advised_price_for_one_share(cash, income, existingShares, sharesArray);
  },

  _private_advised_price_for_one_share: (cash, income, existingShares, sharesArray) => {
    let percent = 1 / (existingShares + sharesArray[0]);
    let rtn = percent * cash;
    rtn += percent * income;
    if (sharesArray.length == 0) {
      throw Error();
    } else if (sharesArray.length == 1) {
      return percent * (cash + income + 2 * income);
    } else {
      let immediateValue = percent * (cash + income);
      let valueNextRound = sharesArray[0] * utils._private_advised_price_for_one_share(0, income, existingShares + sharesArray[0], sharesArray.slice(1));
      return immediateValue + valueNextRound;
    }
  },

  /*
   * @param {string} nation - the nation whose territories you want
   * @returns {Array<string>} the territories that nation owns
   */
  territories_of_nation: (mother_state, nation) => {
    let rtn = [];
    for (let nat in utils.NATIONS) {
      let hexIds = Object.values(kMap).filter(x => x.homeContinent == utils.NATIONS[nat].abbr).map(x => x.id);
      for (let hexId of hexIds) {
        if (utils.territory_to_owner(mother_state, hexId) == nation) {
          rtn.push(hexId);
        }
      }
    }
    return rtn;
  },

  /*
   * @param {string} the name of the territory
   * @returns {Object} the json object representing the territory
   */
  territory_for_territory_name: (mother_state, territory_name) => {
    for (let nation in mother_state.nations) {
      if (territory_name in mother_state.nations[nation]) {
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
    let type_to_action_to_count = utils.army_in_territory(mother_state, nation, territory, "Move");
    for (let type in type_to_action_to_count) {
      for (let n of type_to_action_to_count[type]) {
        rtn += n;
      }
    }
    let neighbors = kMap[territory]["adjacencies"];
    for (let neighbor of neighbors) {
      rtn += utils.sum(utils.army_in_territory(mother_state, nation, neighbor, "Move")["Artillery"]);
    }
    return rtn;
  },

  valid_attacks_for_troop: (mother_state, territoryId) => {
    let turn = mother_state.stage.turn;
    let army = mother_state.nations[turn].army;
    army = army.filter(x => x.territory == territoryId);
    if (army.length === 0) {
      return [];
    }
    if (army.length > 1) {
      throw Error('');
    }
    let unit = army[0];

    if (!unit.can_attack) {
      return [];
    }

    let adjacencies = kMap[territoryId]["adjacencies"];
    adjacencies = adjacencies.filter(x => utils.is_hex_occupied(mother_state, x));
    return adjacencies;
  },

  /*
   * @param {string} nation_name the name of the nation whose cavalry want to move
   * @param {string} territory the territory where the cavalry are
   * @param {string} troop_type the type of troop to move; one of {"Infantry", "Artillery", "Cavalry"}
   * @returns {Object} a dictionary whose keys are states a cavalry can move to
   */
  valid_moves_for_troop: (mother_state, nation_name, territory, troop_type) => {
    if (troop_type == "Cavalry") {
      return utils._valid_moves_for_cavalry(mother_state, nation_name, territory);
    }
    let is_territory_uncontested = (utils.territory_to_owner(mother_state, territory) == nation_name);
    let neighbors = kMap[territory]["adjacencies"];
    let rtn = {};
    for (let neighbor of neighbors) {
      if (!utils.is_hex_occupied(mother_state, neighbor)) {
        rtn[neighbor] = 1;
      }
    }
    return rtn;
  },

  /*
   * @param {string} nation_name the name of the nation whose cavalry want to move
   * @param {string} territory the territory where the cavalry are
   * @returns {Object} a dictionary whose keys are states a cavalry can move to
   */
  _valid_moves_for_cavalry: (mother_state, nation_name, territory) => {
    let is_territory_uncontested = (utils.territory_to_owner(mother_state, territory) == nation_name);
    let rtn = new Set();
    let neighbors = kMap[territory]["adjacencies"];
    let uncontested_neighbors = [];
    for (let neighbor of neighbors) {
      if (is_territory_uncontested) {
        if (utils.territory_to_owner(mother_state, neighbor) == nation_name) {
          // If my tile is contested, I can only move into tiles I own.
          uncontested_neighbors.push(neighbor);
          rtn.add(neighbor);
        }
      } else {
        console.log(neighbor, is_territory_uncontested);
        if (utils.territory_to_owner(mother_state, neighbor) == nation_name) {
          // I own the neighbor.
          console.log("a");
          uncontested_neighbors.push(neighbor);
          rtn.add(neighbor);
        }
      }
    }
    for (let neighbor of uncontested_neighbors) {
      for (territoryId of kMap[neighbor]["adjacencies"]) {
        rtn.add(territoryId);
      }
    }
    if (territory in rtn) {
      rtn.delete(territory);
    }
    return rtn;
  },

  /*
   * @param {string} the territory to query
   * @returns {bool} whether the territory has any troops on it
   */
  does_territory_have_troops: (mother_state, territory) => {
    for (let nation in mother_state.nations) {
      if (mother_state.nations[nation].army.filter(x => x.territory == territory).length > 0) {
        return true;
      }
    }
    return false;
  },

  /*
   * @param {Object} mother_state - the mother state
   * @param {string} territory
   * @returns {string} the name of the nation that owns the territory. Returns
   * `null`` if the territory is contested.
   */
  territory_to_owner: (mother_state, territory) => {
    territory = territory + '';
    let neighbors = kMap[territory]["adjacencies"].map(x => x + '');

    let claimants = [];
    for (let nationName in mother_state.nations) {
      let nation = mother_state.nations[nationName];
      for (let unit of nation.army) {
        if (unit.territory + '' === territory) {
          return nationName;
        }
        if (neighbors.includes(unit.territory + '')) {
          claimants.push(nationName);
          break;
        }
      }
    }
    if (claimants.length === 1) {
      return claimants[0];
    }

    return utils.puppeteer(mother_state, kMap[territory].homeContinent);
  },

  /*
   * @param {Object} mother_state - the mother state
   * @param {string} territoryId
   * @returns {string[]} array of territoryIds a barrack in territoryId can spawn in
   */
  territories_barracks_can_spawn_to: (mother_state, territoryId) => {
    territoryId = territoryId + '';
    let continent = utils.terr2continentName[territoryId];
    let territory = mother_state.nations[continent][territoryId];
    if (territory.n_barracks_can_spawn === 0) {
      return [];
    }
    let owner = utils.territory_to_owner(mother_state, territoryId);
    if (owner !== mother_state.stage.turn) {
      return [];
    }
    adjacencies = kMap[territoryId]["adjacencies"].filter(x => !utils.is_hex_occupied(mother_state, x));
    return adjacencies;
  },

  /*
   * @param {Object} mother_state - the mother state
   * @param {string} territoryId
   * @returns {boolean} whether the hex has a unit or building on it.
   */
  is_hex_occupied(mother_state, territoryId) {
    let continent = utils.terr2continentName[territoryId];
    if (mother_state.nations[continent][territoryId].n_barracks > 0) {
      return true;
    }
    if (mother_state.nations[continent][territoryId].n_factories > 0) {
      return true;
    }
    territoryId = territoryId + '';
    let armies = utils.armies(mother_state).map(x => x.territory + '');
    return armies.includes(territoryId);
  },

  armies(mother_state) {
    let armies = [];
    for (let k in mother_state.nations) {
      armies = armies.concat(mother_state.nations[k].army);
    }
    return armies;
  },

  territories_of_nation_that_can_spawn: (mother_state, nation) => {
    let territoriesWithArmy = {};
    for (let nationName in mother_state.nations) {
      let nation = mother_state.nations[nationName];
      for (let unit of nation.army) {
        territoriesWithArmy[unit.territory] = 1;
      }
    }

    let territory_names = utils.territories_of_nation(mother_state, nation);
    let rtn = [];
    for (let territory_name of territory_names) {
      let territory = utils.territory_for_territory_name(mother_state, territory_name);
      if (territory.n_factories) {
        continue;
      }
      if (territory.n_barracks) {
        continue;
      }
      if (territory_name in territoriesWithArmy) {
        continue;
      }
      // Must be adjacent to barrack that you own.
      let adjacencies = kMap[territory_name].adjacencies;
      for (let hexId of adjacencies)
      rtn.push(territory_name);
    }
    return rtn;
  },

  unit_for_territory(mother_state, territory_name) {
    let nationName = kAbbr2Name[kMap[territory_name].homeContinent];
    let territory = mother_state.nations[nationName][territory_name];
    if (territory.n_barracks) {
      return 'barrack';
    }
    if (territory.n_factories) {
      return 'factory';
    }
  },

  territories_of_nation_that_can_build: (mother_state, nation) => {
    let territoriesWithArmy = {};
    for (let nationName in mother_state.nations) {
      let nation = mother_state.nations[nationName];
      for (let unit of nation.army) {
        territoriesWithArmy[unit.territory] = 1;
      }
    }

    let territory_names = utils.territories_of_nation(mother_state, nation);
    let rtn = [];
    for (let territory_name of territory_names) {
      let territory = utils.territory_for_territory_name(mother_state, territory_name);
      if (territory.n_factories) {
        continue;
      }
      if (territory.n_barracks) {
        continue;
      }
      if (territory_name in territoriesWithArmy) {
        continue;
      }
      rtn.push(territory_name);
    }
    return rtn;
  },

  /*
   * @returns the puppeteer of the given nation. If the nation owns itself, then
   * the puppeteer is itself. If the capital is contested only by enemies, then
   * this method returns null.
   */
  puppeteer: (mother_state, nation) => {
    if (nation in kAbbr2Name) {
      nation = kAbbr2Name[nation];
    }

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
   army_in_territory: (mother_state, nation_name, territory, action) => {
    if (action != "Move" && action != "Attack") {
      throw Error("Unrecognized `stage` parameter.");
    }
    let army = mother_state.nations[nation_name].army;
    let arr = army.filter(x => x.territory == territory);
    if (action === "join") {
      return {
        "Cavalry": arr.filter(x => x.type === "Cavalry").length,
        "Infantry":  arr.filter(x => x.type === "Infantry").length,
        "Artillery":  arr.filter(x => x.type === "Artillery").length
      }
    }
    let rtn = {
      "Cavalry": [0, 0],
      "Infantry": [0, 0],
      "Artillery": [0, 0],
    };
    for (let troop of arr) {
      let index;
      if (action == "Move") {
        index = troop.can_move ? 1 : 0;
      } else {
        if (!utils.has_valid_targets(mother_state, nation_name, territory)) {
          index = 0;
        } else {
          index = troop.can_attack ? 1 : 0;
        }
      }
      rtn[troop.type][index] += 1;
    }
    return rtn;
  },

  troop_ids_that_can_act_in_territory: (mother_state, territory_name) => {
    if (mother_state.stage.phase !== "Action") {
      throw Error("");
    }
    const subphase = mother_state.stage.subphase;
    if (!["Attack", "Move"].includes(subphase)) {
      throw Error("");
    }
    let nation_name = mother_state.stage.turn;
    let army = mother_state.nations[nation_name].army;
    army = army.filter(x => x.territory === territory_name);
    if (subphase === "Move") {
      army = army.filter(x => x.can_move);
    } else {
      army = army.filter(x => x.can_attack);
    }
    return army;
  },

  troop_ids_in_territory: (mother_state, territory_name, nation_name, unit_type) => {
     let army = mother_state.nations[nation_name].army;
     army = army.filter(x => x.territory === territory_name);
     army = army.filter(x => x.type === unit_type);
     return army;
  },

  /*
   * @param {int} troop_id - the id of the desired troop
   * @returns {Object} troop - the json representing the desired troop
   */
  troop_from_id: (mother_state, troop_id) => {
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

  can_vote: (mother_state, player_name) => {
    let stage = mother_state.stage;
    if (stage.phase !== "Action" || stage.subphase !== "Election") {
      return false;
    }
    return mother_state.players[player_name].shares[stage.turn] > 0;
  },

  has_valid_targets: (mother_state, nation_name, territory_name) => {
    const continent = utils.terr2continentName[territory_name];
    const territory = mother_state.nations[continent][territory_name];
    for (let name in mother_state.nations) {
      if (name === nation_name) {
        continue;
      }
      let army = mother_state.nations[name].army;
      if (army.filter(x => x.territory === territory_name).length > 0) {
        return true;
      }
      if (territory.n_barracks + territory.n_factories > 0) {
        return true;
      }
    }
    return false;
  },

  continent_from_territory: (mother_state, territory_name) => {
    let nationName = utils.terr2continentName[territory_name];
    return mother_state.nations[nationName];
  },

  total_shares: (mother_state, nation_name) => {
    let r = 0;
    for (let i = 0; i < mother_state.nations[nation_name].num_auction_rounds; ++i) {
      r += mother_state.supershares[i];
    }
    return r;
  },

  /*
   * Perform a deep copy of a json object. This method does not support
   * functions.
   */
  deep_copy: (x) => {
    return JSON.parse(JSON.stringify(x));
  },

  uuid: (username="") => {
    return Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER));
  },

  union_dict: (d1, d2) => {
    return Object.assign({}, d1, d2);
  }
};

{
  let terr2continentName = {};
  for (let territoryId in kMap) {
    terr2continentName[territoryId] = kAbbr2Name[kMap[territoryId].homeContinent];
  }
  utils.terr2continentName = terr2continentName;
}

// Terrible hack so this can be included on frontend.
try { module.exports = utils; } catch (err) {}
