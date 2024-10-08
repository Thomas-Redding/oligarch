//global lists and macros defined here
const PHASES = ['Taxation','Discuss','Auction','Action']
const TURNS = ['North America', 'South America',
    'Europe', 'Africa', 'Asia', 'Australia']
const SUBPHASES = [null,'Election','Move','Attack','Spawn','Build','Dividends']
const UNITS = ['Cavalry','Infantry','Artillery']
const COSTS = {'factory' : 40, 'barracks' : 30, 'Infantry': 4,
    'Artillery':6, 'Cavalry':6 }

const reverse = (A) =>  A.map((v, i) => A[A.length - i - 1])

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
  is_username_valid(username) {
    if (username.search(/[a-zA-Z0-9]/) == -1) {
      // username must contain at least 1 alphanumeric character
      return false;
    }
    if ('\n'.search(/[^a-zA-Z0-9]/)) {
      // username may not contain newlines
      return false;
    }
    let blacklist = [
      // continents
      'na','sa','eu','af','as','au',
      'north america', 'south america', 'europe', 'africa', 'asia', 'australia',
      // game words
      'cash', 'score', 'total', 'abstain', 'world bank'
    ];
    if (blacklist.includes(username.toLowerCase())) {
      // username is explicitly forbidden
      return false;
    }
    return true;
  },

  load_map(jsonDict) {
    let rtn = jsonDict;
    for (let path of rtn.waterPaths) {
      let a = path["from"];
      let b = path["to"];
      rtn.states[a]["adjacencies"].push(b);
      rtn.states[b]["adjacencies"].push(a);
    }
    return rtn;
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
    let factory_income = mother_state.settings.factoryIncome * mother_state.nations[nationName][territory].n_factories;
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
   * @param nation_name - the nation whose score we are computing
   * @returns {int} the cash the given nation would have if the game entered stasis now
   */
  score_of_nation: (mother_state, nation_name) => {
    let income_mult = 2 + utils.taxations_left(mother_state);
    let cash = mother_state.nations[nation_name].cash;
    let income = utils.income_of_nation(mother_state, nation_name);
    return cash + income_mult * income;
  },

  doesBankCountAsOwner: (mother_state) => {
    return mother_state.settings.auctionMoneyRecipient == 'bank' || mother_state.settings.doesBankReceiveDividends;
  },

  /*
   * @param nation_name - the nation whose score we are computing
   * @returns {int} the score of the given nation if the game ended now
   */
  end_score_of_nation: (mother_state, nation_name) => {
    let cash = mother_state.nations[nation_name].cash;
    let income = utils.income_of_nation(mother_state, nation_name);
    return cash + mother_state.settings.endGameIncomeMultiplier * income;
  },

  /*
   * @param username - the user whose score we are computing
   * @returns {int} the score the given user would have if the game ended now
   */
  score_of_player: (mother_state, username) => {
    let player = mother_state.players[username];
    let share_value = 0;
    for (let nation_name in player.shares) {
      if (player.shares[nation_name] == 0) continue;
      let cash = mother_state.nations[nation_name].cash;
      let income = utils.income_of_nation(mother_state, nation_name);
      let share_n = utils.total_shares(mother_state, nation_name);
      if (!utils.doesBankCountAsOwner(mother_state, username)) {
        share_n -= utils.unowned_shares(mother_state, nation_name);
      }
      let percent_owned = player.shares[nation_name] / share_n;
      share_value += percent_owned * (cash + mother_state.settings.endGameIncomeMultiplier * income);
    }

    let n_players = Object.keys(mother_state.players).length
    let inicash = Math.floor(mother_state.settings.startingCash/n_players)

    return share_value + parseFloat(player.cash) - inicash;
  },

  /*
   * Computes the break-even price of new shares for the given nation assuming
   * no further actions are taken by anyone.
   *
   * Note: new shares are assumed to essentially go do a dummy player, who gets them for free
   *
   * @param nation_name - the name of the nation who's advised share price is being computed
   * @param new_shares - the number of new shares being valued
   */
  advised_share_price: (mother_state, nation_name, new_shares) => {
    let share_n = utils.total_shares(mother_state, nation_name);
    let cash = mother_state.nations[nation_name].cash;
    let income = utils.income_of_nation(mother_state, nation_name);
    let value_of_nation = cash + (utils.taxations_left(mother_state) + mother_state.settings.endGameIncomeMultiplier) * income;
    return value_of_nation * new_shares / share_n;
  },

  /*
   * Only call at the end of the game.
   * @param username - the user whose score we are computing
   * @returns {int} the score the given user has
   */
  end_score_of_player: (mother_state, username) => {
    return utils.score_of_player(mother_state, username);
  },

  total_rounds: () => {
    return 6;
  },

  /*
   * @returns the number of rounds left (excluding the current round).
   */
  taxations_left: (mother_state) => {
    return utils.total_rounds() - mother_state.stage.round;
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
    for (let nat of mother_state.map.continents) {
      let hexIds = Object.values(mother_state.map.states).filter(x => x.homeContinent == nat.abbreviation).map(x => x.id);
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
  military_bias_old: (mother_state, nation, territory) => {
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

  military_bias: (mother_state, nation, terrA, terrB, is_aggressor) => {
    let action_terrs = mother_state.map.states[terrA]["adjacencies"];
    // concat terrB adj to action_terrs
    action_terrs = action_terrs.concat(
      mother_state.map.states[terrB]["adjacencies"]);
    let neighbors =  action_terrs;
    // turn neighbors into a set
    neighbors = new Set(neighbors);
    let unit_stats = {
      'Cavalry': {
        'attack': 1,
        'defense': 1,
      },
      'Artillery': {
        'attack': 1,
        'defense': 1,
      },
      'Infantry': {
        'attack': 1,
        'defense': 1,
      },
    }

    let bias = 1;
    for (let neighbor of neighbors) {
      let tid = utils.troop_ids_in_territory(
        mother_state, neighbor, nation);
      // check if tid is empty
      if (tid.length === 0) {
        continue;
      }
      // should only ever be one troop in a territory
      let troop = tid[0];
      let attack = unit_stats[troop.type]['attack'];
      let defense = unit_stats[troop.type]['defense'];
      if (is_aggressor) {
        bias += attack;
      } else {
        bias += defense;
      }
    }
    return bias;
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

  num_barracks_and_factories_in_territory: (motherState, territoryID) => {
    let continent = utils.nation_name_from_abbr(motherState, motherState.map.states[territoryID].homeContinent);
    return motherState.nations[continent][territoryID];
  },

  territory_to_continent: (motherState, territoryID) => {
    let homeContinentAbbr = motherState.map.states[territoryID].homeContinent;
    let C = motherState.map.continents.filter(continent => continent.abbreviation === homeContinentAbbr);
    if (C.length !== 1) {
      throw Error();
    }
    return C[0];
  },

  /*
   * @param {string} nation_name the name of the nation whose unit want to move
   * @param {string} territory the territory where the unit are
   * @param {string} troop_type the type of troop to move; one of {"Infantry", "Artillery", "Cavalry"}
   * @returns {Object} a dictionary whose keys are territories a unit can move to
   */
  valid_moves_for_troop: (motherState, nationName, territoryID, troopType) => {
    territoryID = territoryID + '';
    let enemyUnits = utils._enemy_units(motherState, nationName);
    let territoriesAdjacentToEnemies = [];
    for (let enemyUnit of enemyUnits) {
      territoriesAdjacentToEnemies = territoriesAdjacentToEnemies.concat(motherState.map.states[enemyUnit.territory].adjacencies);
    }
    territoriesAdjacentToEnemies = territoriesAdjacentToEnemies.concat(enemyUnits.map(x => x.territory));
    territoriesAdjacentToEnemies = new Set(territoriesAdjacentToEnemies);

    let myArmy = motherState.nations[nationName].army;
    let territoriesWithFriendlyUnits = new Set(myArmy.map(x => x.territory));

    const getAdjacencies = (territoryID) => {
      if (territoriesAdjacentToEnemies.has(territoryID)) {
        return [];
      }
      return motherState.map.states[territoryID]["adjacencies"];
    };
    const kTroopTypeToSpeed = {
      "Infantry": 2,
      "Artillery": 2,
      "Calvary": 4,
    };
    let D = utils.distance_to_hexes(territoryID, getAdjacencies, kTroopTypeToSpeed[troopType]);
    for (let id of Object.keys(D)) {
      if (territoriesWithFriendlyUnits.has(id)) {
        delete D[id];
        continue;
      }
      if (utils.is_hex_occupied(motherState, id)) {
        delete D[id];
      }
    }
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
      if (D[node] + 1 > maxDistance) {
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
   * @param {string} territoryId
   * @returns {?string} the name of the nation that owns the territory. Returns
   * null if the territory is contested.
   */
  territory_to_owner: (mother_state, territoryId) => {
    territoryId = territoryId + '';
    let neighbors = mother_state.map.states[territoryId]["adjacencies"].map(x => x + '');

    let claimants = new Set();
    for (let nationName in mother_state.nations) {
      let nation = mother_state.nations[nationName];
      for (let unit of nation.army) {
        if (unit.territory + '' === territoryId) {
          return nationName;
        }
        if (neighbors.includes(unit.territory + '')) {
          claimants.add(nationName);
        }
      }
    }
    if (claimants.size === 1) {
      return Array.from(claimants)[0];
    }
    if (claimants.size > 1) {
      return null;
    }

    return utils.puppeteer(mother_state, mother_state.map.states[territoryId].homeContinent);
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
    return adjacencies.map(x => x + '');
  },

  /*
   * @param {Object} mother_state - the mother state
   * @param {string} territoryId
   * @returns {boolean} whether the hex has a unit or building on it.
   */
  is_hex_occupied(mother_state, territoryId) {
    territoryId = territoryId + '';
    let continent = utils.terr2continentName(mother_state)[territoryId];
    if (mother_state.nations[continent][territoryId].n_barracks > 0) {
      return true;
    }
    if (mother_state.nations[continent][territoryId].n_factories > 0) {
      return true;
    }
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

  /**
   * @returns the name of the continent who plays next; null if game is ending.
   */
  next_turn: (motherState) => {
    let turns = TURNS;
    if (motherState.stage.round % 2 === 0) {
      turns = reverse(turns);
    }
    let i = turns.indexOf(motherState.stage.turn);

    if (i + 1 < turns.length) {
      return turns[i + 1];
    } else {
      return null;
    }
  },

  isCountryOrderReversed: (mother_state) => {
    return mother_state.stage.round % 2 === 0
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
    if (mother_state.nations[nation].army.filter(x => x.territory == utils.continent_from_name(mother_state, nation).capital + '').length > 0) {
      return nation;
    }
    let owner = null;
    for (let n in mother_state.nations) {
      if (n === nation) continue;
      if (mother_state.nations[n].army.filter(x => x.territory == utils.continent_from_name(mother_state, nation).capital + '').length > 0) {
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
    army = army.filter(x => x.territory == territory_name);
    if (unit_type) {
      army = army.filter(x => x.type === unit_type);
    }
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
    for (let i = 0; i < utils.continent_from_name(mother_state, nation_name).num_auction_rounds; ++i) {
      r += mother_state.supershares_from_turn[i];
    }
    return r;
  },

  unowned_shares: (mother_state, nation_name) => {
    let owned_shares = 0;
    for (let username in mother_state.players) {
      owned_shares += mother_state.players[username].shares[nation_name];
    }
    let rtn = utils.total_shares(mother_state, nation_name) - owned_shares;
    if (rtn < 0) {
      throw Error();
    }
    return rtn;
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

  continent_from_name(mother_state, continent_name) {
    for (let continent of mother_state.map.continents) {
      if (continent.name == continent_name) {
        return continent;
      }
    }
    throw Error("Continent name not found: " + continent_name);
  },

  is_tile_capital(mother_state, tile_id) {
    tile_id = parseInt(tile_id);
    for (let continent of mother_state.map.continents) {
      if (continent.capital == tile_id) {
        return true;
      }
    }
    return false;
  },

  abbr_from_nation_name(mother_state, nation_name) {
    for (let continent of mother_state.map.continents) {
      if (continent.name == nation_name) {
        return continent.abbreviation;
      }
    }
    throw Error("Nation name not found: " + nation_name);
  }
};

// Terrible hack so this can be included on frontend.
try { module.exports = {
  utils,
  reverse,
  PHASES,
  TURNS,
  SUBPHASES,
  UNITS,
  COSTS,
}; } catch (err) {}
