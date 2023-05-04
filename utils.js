class Deque {
  constructor(maxSize, reserve) {
    if (maxSize) {
      this.maxSize = maxSize;
      this.data = new Array(reserve ? reserve : maxSize);
    } else {
      this.maxSize = Infinity;
      this.data = new Array(reserve ? reserve : 10);
    }
    this.start = 0;
    this.length = 0;
  }
  double_size() {
    let A = new Array(Math.min(this.maxSize, this.data.length * 2));
    for (let i = 0; i < this.length; ++i) {
      A[i] = this.get(i);
    }
    this.data = A;
    this.start = 0;
  }
  get(i) {
    if (i >= this.length) {
      throw Error();
    }
    if (i < 0) {
      throw Error();
    }
    return this.data[(i + this.start) % this.data.length];
  }
  push_back(val) {
    if (this.length + 1 > this.maxSize) {
      throw Error('');
    }
    if (this.length === this.data.length) {
      this.double_size();
    }
    this.data[(this.start + this.length) % this.data.length] = val;
    this.length += 1;
  }
  pop_back() {
    if (this.length === 0) {
      throw Error('');
    }
    let i = (this.start + this.length - 1) % this.data.length;
    let val = this.data[i];
    this.data[i] = null;
    this.length -= 1;
    return val;
  }
  pop_front() {
    if (this.length === 0) {
      throw Error('');
    }
    let val = this.data[this.start];
    this.data[this.start] = null;
    this.start = (this.start + 1) % this.data.length;
    this.length -= 1;
    return val;
  }
  push_front(val) {
    if (this.length + 1 > this.maxSize) {
      throw Error('');
    }
    if (this.length === this.data.length) {
      this.double_size();
    }
    this.start = (this.start + this.data.length - 1) % this.data.length;
    this.length += 1;
    this.data[this.start] = val;
  }
}

const HexType = {
  none: "none",
  infantry: "infantry",
}

const kHexTypeNone = 'none';
const kHexTypeInfantry = 'infanty';

let utils = {
  load_map(jsonDict) {
    let rtn = jsonDict;
    for (let path of rtn.waterPaths) {
      // TODO: Add water paths.
      // rtn.states[path.from]["adjacencies"].push(path.to);
      // rtn.states[path.to]["adjacencies"].push(path.from);
    }
    return rtn;
  },
  CAPITALS: ["819", "246", "767", "258", "310", "874"],
  NATIONS: {
    "Africa": {
      "capital": "819",
      // "base_income_per_territory" : 6,
      // "territories": ["Madagascar", "North Africa", "Egypt", "East Africa", "Congo", "South Africa"],
      "num_auction_rounds": 5
    },
    "North America": {
      "capital": "246",
      // "base_income_per_territory" : 4,
      // "territories": ["Alaska", "Ontario", "Northwest Territory", "Greenland", "Eastern United States", "Western United States", "Quebec", "Central America", "Alberta"],
      "num_auction_rounds": 6
    },
    "South America": {
      "capital": "767",
      // "base_income_per_territory" : 9,
      // "territories": ["Venezuela", "Brazil", "Argentina", "Peru"],
      "num_auction_rounds": 5
    },
    "Europe": {
      "capital": "258",
      // "base_income_per_territory" : 5,
      // "territories": ["Iceland", "Great Britain", "Scandinavia", "Southern Europe", "Western Europe", "Northern Europe", "Ukraine"],
      "num_auction_rounds": 6
    },
    "Asia": {
      "capital": "310",
      // "base_income_per_territory" : 3,
      // "territories": ["Japan", "Yakursk", "Kamchatka", "Siberia", "Ural", "Afghanistan", "Middle East", "India", "Siam", "China", "Mongolia", "Irkutsk"],
      "num_auction_rounds": 6
    },
    "Australia": {
      "capital": "874",
      // "base_income_per_territory" : 9,
      // "territories": ["Eastern Australia", "Indonesia", "New Guinea", "Western Australia"],
      "num_auction_rounds": 4
    }
  },

  name_from_nation: (nation) => {
    for (let nation_name in utils.NATIONS) {
      if (utils.NATIONS[nation_name] == nation) {
        return nation_name;
      }
    }
    throw Error();
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
    let nationName = utils.nation_name_from_abbr(mother_state, mother_state.map.states[territory].homeContinent);
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
      let hexIds = Object.values(mother_state.map.states).filter(x => x.homeContinent == utils.abbr_from_nation_name(mother_state, nat)).map(x => x.id);
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
    let neighbors = mother_state.map.states[territory]["adjacencies"];
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

    let adjacencies = mother_state.map.states[territoryId]["adjacencies"];
    adjacencies = adjacencies.filter(x => utils.is_hex_occupied(mother_state, x));
    return adjacencies;
  },

  _enemy_units: (motherState, yourNationName) => {
    let r = [];
    for (let nationName in motherState.nations) {
      if (nationName === yourNationName) {
        continue;
      }
      r = r.concat(motherState.nations[nationName].army);
    }
    return r;
  },

  /*
   * @param {string} nation_name the name of the nation whose unit want to move
   * @param {string} territory the territory where the unit are
   * @param {string} troop_type the type of troop to move; one of {"Infantry", "Artillery", "Cavalry"}
   * @returns {Object} a dictionary whose keys are territories a unit can move to
   */
  valid_moves_for_troop: (motherState, nationName, territoryID, troopType) => {
    let enemyUnits = utils._enemy_units(motherState, nationName);
    let territoriesAdjacentToEnemies = [];
    for (let enemyUnit of enemyUnits) {
      territoriesAdjacentToEnemies = territoriesAdjacentToEnemies.concat(kMap[enemyUnit.territory].adjacencies);
    }
    territoriesAdjacentToEnemies = new Set(territoriesAdjacentToEnemies);

    let myArmy = motherState.nations[nationName].army;
    let territoriesWithFriendlyUnits = new Set(myArmy.map(x => x.territory));

    const getAdjacencies = (territoryID) => {
      let r = kMap[territoryID]["adjacencies"];
      r = r.filter(id => !territoriesAdjacentToEnemies.has(id));
      r = r.filter(id => !territoriesWithFriendlyUnits.has(id));
      r = r.filter(id => {
        let continent = utils.nation_name_from_abbr(motherState, kMap[id].homeContinent);
        let ter = motherState.nations[continent][id];
        return ter.n_barracks + ter.n_factories === 0;
      });
      return r;
    };
    const kTroopTypeToSpeed = {
      "Infantry": 2,
      "Artillery": 2,
      "Calvary": 4,
    };
    let D = utils.distance_to_hexes(territoryID, getAdjacencies, kTroopTypeToSpeed[troopType]);
    return D;
  },

  distance_to_hexes: (territoryID, getAdjacencies, maxDistance) => {
    let D = {};
    D[territoryID] = 0;
    let open = new Deque();
    let openSet = new Set();
    open.push_back(territoryID);
    openSet.add(territoryID);
    let it = 0;
    while (open.length > 0) {
      if (++it > 400) {
        break;
      }
      let node = open.pop_front();
      console.log(node, D);
      if (D[node] + 1 >= maxDistance) {
        continue;
      }
      for (let neighbor of getAdjacencies(node)) {
        if (neighbor in D) {
          if (D[neighbor] <= D[node] + 1) {
            continue;
          }
          D[neighbor] = Math.min(D[neighbor], D[node] + 1);
        } else {
          D[neighbor] = D[node] + 1;
        }
        if (D[neighbor] >= maxDistance) {
          continue;
        }
        if (!openSet.has(neighbor)) {   // O(n) but bite me.
          open.push_back(neighbor);
          openSet.add(neighbor);
        }
      }
    }
    return D;
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
    let neighbors = mother_state.map.states[territory]["adjacencies"].map(x => x + '');

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

    return utils.puppeteer(mother_state, mother_state.map.states[territory].homeContinent);
  },

  /*
   * @param {Object} mother_state - the mother state
   * @param {string} territoryId
   * @returns {string[]} array of territoryIds a barrack in territoryId can spawn in
   */
  territories_barracks_can_spawn_to: (mother_state, territoryId) => {
    territoryId = territoryId + '';
    let continent = utils.terr2continentName(mother_state)[territoryId];
    let territory = mother_state.nations[continent][territoryId];
    if (territory.n_barracks_can_spawn === 0) {
      return [];
    }
    let owner = utils.territory_to_owner(mother_state, territoryId);
    if (owner !== mother_state.stage.turn) {
      return [];
    }
    adjacencies = mother_state.map.states[territoryId]["adjacencies"].filter(x => !utils.is_hex_occupied(mother_state, x));
    return adjacencies;
  },

  /*
   * @param {Object} mother_state - the mother state
   * @param {string} territoryId
   * @returns {boolean} whether the hex has a unit or building on it.
   */
  is_hex_occupied(mother_state, territoryId) {
    let continent = utils.terr2continentName(mother_state)[territoryId];
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

  territories_of_nation_that_can_spawn: (mother_state, nation_name) => {
    //let nation_name = utils.name_from_nation(nation);
    let nation = mother_state.nations[nation_name];
    let territoriesWithArmy = {};
    for (let nationName in mother_state.nations) {
      let nat = mother_state.nations[nationName];
      for (let unit of nat.army) {
        territoriesWithArmy[unit.territory] = 1;
      }
    }

    let territory_names = utils.territories_of_nation(mother_state, nation_name);
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
      for (let hexId of mother_state.map.states[territory_name].adjacencies) {
        let adjacentTerritory = utils.territory_for_territory_name(mother_state, hexId);
        if (adjacentTerritory.n_barracks) {
          if (utils.territory_to_owner(mother_state, hexId) == nation_name) {
            rtn.push(territory_name);
            break;
          }
        }
      }
    }
    return rtn;
  },

  unit_for_territory(mother_state, territory_name) {
    let nationName = utils.nation_name_from_abbr(mother_state, mother_state.map.states[territory_name].homeContinent);
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
      let nat = mother_state.nations[nationName];
      for (let unit of nat.army) {
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
    try {
      nation = utils.nation_name_from_abbr(mother_state, nation);
    } catch {
      // TODO: Remove this try-catch
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
    const continent = utils.terr2continentName(mother_state)[territory_name];
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
    let nationName = utils.terr2continentName(mother_state)[territory_name];
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
  },

  terr2continentName(mother_state) {
    let rtn = {};
    for (let territoryId in mother_state.map.states) {
      rtn[territoryId] = utils.nation_name_from_abbr(mother_state, mother_state.map.states[territoryId].homeContinent);
    }
    return rtn;
  },

  nation_name_from_abbr(mother_state, nation_abbreviation) {
    for (let continent of mother_state.map.continents) {
      if (continent.abbreviation == nation_abbreviation) {
        return continent.name;
      }
    }
    throw Error("Nation abbreviation not found: " + nation_abbreviation);
  },

  abbr_from_nation_name(mother_state, nation_name) {
    for (let continent of mother_state.map.continents) {
      if (continent.name == nation_name) {
        return continent.abbreviation;
      }
    }
    throw Error("Nation name not found: " + nation_abbreviation);
  }
};

// Terrible hack so this can be included on frontend.
try { module.exports = utils; } catch (err) {}
