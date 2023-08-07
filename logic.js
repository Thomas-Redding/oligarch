const fs = require('fs')

let utils = require('./utils.js')
let Battle = require('./battle.js')
let log = require('./log.js');
const { puppeteer } = require('./utils.js');
const { throws } = require('assert');

const SHARES_FROM_TURN = [1,1,1,1,1,1];

log.enabled = true;

//macro for pythonic list indexing
Array.prototype.fromback = function(i=1) {
    return this[this.length - i];
}
const reverse = (A) =>  A.map((v, i) => A[A.length - i - 1]) 

//global lists and macros defined here
const ROUNDS = [1, 2, 3, 4, 5, 6]
const PHASES = ['Taxation','Discuss','Auction','Action']
const TURNS = ['North America', 'South America',
    'Europe', 'Africa', 'Asia', 'Australia']
const SUBPHASES = [null,'Election','Move','Attack','Spawn','Build','Dividends']
const BLACKLISTED_NAMES = ['NA','SA','EU','AF','AS','AU', 'TOTAL']
const UNITS = ['Cavalry','Infantry','Artillery']
const COSTS = {'factory' : 10, 'barracks' : 10, 'Infantry': 8, 
    'Artillery':12, 'Cavalry':12 }




//game class defined below

class History {
  constructor(prayer) {
    log()
    this._prayer = prayer
    this._states = [];
    this._args = [];
    this._checkpoint_types = [];
  }
  save(checkpoint_type, args, mother_state) {
    log(checkpoint_type, args)
    this._checkpoint_types.push(checkpoint_type);
    this._args.push(args);
    this._states.push(utils.deep_copy(mother_state));
  }
  last_save() {
    log()
    return [this._checkpoint_types.fromback(), this._args.fromback(),
        this._states.fromback()];
  }
  undo() {
    log()
    if (this._states.length == 0) {
        throw Exception("Attempted to undo with a history of length 1.")
    }
    let checkpoint_type = this._checkpoint_types.pop();
    let args = this._args.pop();
    let state = this._states.pop();
    return [checkpoint_type, args, state];
  }
}

class Game
{
    fetchGameState()
    {
        log();
        if (this.timer && this.timer.isRunning()) {
            this.mother_state.clock = this.timer.queryTime();
        }
        let state = utils.deep_copy(this.mother_state)
        return state
    }

    is_admin(username) {
        log(username);
        return this.mother_state.players[username].auth === 'admin';
    }

    undo(username) {
        log(username);
        if (this.mother_state.players[username].auth !== 'admin') return;
        let [action, args, state] = this._history.undo();
        this._resetServerWithUndoParts(action, args, state)
    }

    _resetServerWithUndoParts(action, args, state) {
        if (this.timer) this.timer.stop();
        // TODO: Allow undoing to the beginning of any subphase. To do this, we
        // need to add a global variable indicating whether any action has been
        // taken during this subphase.
        if (action === "lobby") {
            // Go back to the lobby.
            this.mother_state = state
            this._save("lobby", null);
        } else if (action === "auction_start") {
            // Go back to the start of an auction (before any bids).
            this.mother_state = state
        } else if (action === "election_start") {
            this.mother_state = state
            this.timer.start(this.mother_state.settings.electionTime, this._conclude_election.bind(this))
        } else {
            throw Exception("Can't undo an action of type '%s'" % action);
        }
        this._prayer("undo", '')
    }

    setSettings(userame, new_settings) {
        if (this.mother_state.stage.phase !== 'lobby') return
        this.mother_state.settings = new_settings
        this._prayer("update_settings", '')
    }

    saveToDisk(save_name) {
        log(save_name);
        if (!/^[0-9a-zA-Z]+$/.test(save_name)) {
            // TODO: Tell user saving failed.
            return;
        }
        let [action, args, state] = this._history.last_save();
        try {
            fs.writeFileSync("data/" + save_name + ".json", JSON.stringify([action, args, state]))
        } catch (err) {
            log("ERROR:", err)
            return;
        }
    }

    loadFromDisk(username, save_name) {
        // 1599955249143
        if (this.mother_state.players[username].auth !== 'admin') return
        let [action, args, state] =
            JSON.parse(fs.readFileSync("data/" + save_name + ".json"))
        this._resetServerWithUndoParts(action, args, state)
    }

    loadMostRecentSaveFromDisk() {
        let save_names = this.fetchListOfSaves();
        save_names.sort();
        let latest_save_name = save_names[save_names.length - 1];
        this.loadFromDisk(latest_save_name)
    }

    fetchListOfSaves() {
        let files = fs.readdirSync("data");
        return files.map(x => x.substr(0, x.length - 5));
    }

    _save(checkpoint_type, args) {
        this._history.save(checkpoint_type, args, this.mother_state)
        let file_name = new Date().getTime()
        this.saveToDisk(file_name)
    }

    endLobby(username)
    {
        log(username)
        // TODO: QQQ load from disk
        this._save("lobby", null);
        log(username);
        let rtn;
        if (this.mother_state.players[username].auth !== 'admin') {
            rtn = false
        }
        else {
            for (let ord of this.mother_state.order) {
                this.mother_state.stage[ord] = this.mother_state[ord][0]
            }
            rtn = true

        }
        this.prayer('end_lobby', {}, this.mother_state)
        return rtn
    }

    startGame(username)
    {
        log( username);
        this._player_cash_init()
        this.prayer('game_start', {}, this.mother_state)
        this._act()
    }

    addPlayer(username)
    {
        log(username);
        let player = {}
        let rtn = true
        if (this.mother_state.stage.phase !== 'lobby') {
            //allow spects
            return true
        }
        else {
            player.username = username
            player.cash = 0
            // The first player to join is the admin.
            console.log(Object.keys(this.mother_state.players).length);
            if (Object.keys(this.mother_state.players).length == 0) {
                player.auth = 'admin';
            } else {
                player.auth = 'user';
            }
            player.shares = {}
            player.ready = false
            player.vote = null
            player.ready = false
            if (this.mother_state.settings.debug) {
                for (let countinent of this.mother_state.map.continents) {
                    player.shares[countinent.name] = Math.random() * 2 | 0
                }
            } else {
                for (let countinent of this.mother_state.map.continents) {
                    player.shares[countinent.name] = 0
                }
            }
            this.mother_state.players[username] = player
        }
        this._prayer("player_added",username)
        return rtn
    }

    rdyUp(username)
    {
        log(username);
        if (this.mother_state.players[username].ready) return;
        this.mother_state.players[username].ready = true
        this._prayer('user_ready', '');
        let all_ready = true
        for (let player of Object.values(this.mother_state.players)) {
            all_ready &= player.ready
        }
        if (all_ready) {
            this.mother_state.clock = this.timer.queryTime()
            this.timer.stop(true);
        }
    }

    bid(username, amount)
    {
        //log(username, amount);
        if (this.mother_state.players[username].cash >= amount &&
            this.mother_state.current_bid < amount) {
            this._register_bid(amount, username)
        }
    }

    move(username, uid_list, from_terr, target)
    {
        //log(username, unit_id_list, from_territory, target);
        let nat = this.mother_state.stage.turn
        if (this.mother_state.stage.subphase == 'Move' &&
            this.mother_state.nations[nat].president === username) {
            let all_move = uid_list.every(
                uid => utils.troop_from_id(this.mother_state, uid).can_move)

            if (all_move) {
                for (let uid of uid_list){
                    let [idx, unat] = this._unit2idx(uid)
                    this.mother_state.nations[unat].army[idx].territory = target
                    this.mother_state.nations[unat].army[idx].can_move = false
                }
            }
           
            this._manage_conquest(utils.terr2continentName(this.mother_state)[target])
            this._prayer('moves_made','')
        }
    }

    raze(username, unit_id, building, terr)
    {
        log(username, unit_id, building, terr)
        let target_nat = utils.continent_from_territory(this.mother_state, terr)
        let nat = this.mother_state.stage.turn
        let troop = utils.troop_from_id(this.mother_state, unit_id)
        if (this.mother_state.stage.subphase == 'Attack' &&
        this.mother_state.nations[nat].president == username &&
        utils.territory_to_owner(this.mother_state, terr) !== null &&
        troop.can_attack) {
            let bldg_type = building == 'barrack' ? 'n_barracks' : 'n_factories'
            if (target_nat[terr][bldg_type] > 0){
                target_nat[terr][bldg_type]--
                troop.can_attack = false
                this._prayer('bldg_razed','')
            }
        }
    }
    
    attack(username, unit_id, target_id)
    {
        //log(username, unit_id, target_id)

        let [idx_cur, nat] = this._unit2idx(unit_id)
        let [idx_t, target_nat] = this._unit2idx(target_id)

        if (this.mother_state.stage.subphase == 'Attack' &&
            this.mother_state.nations[nat].president == username) {
                let terrA = utils.troop_from_id(
                    this.mother_state, unit_id).territory;
                let terrB = utils.troop_from_id(
                    this.mother_state, target_id).territory
                let atk_pts = utils.military_bias(
                    this.mother_state, nat, terrA, terrB, true)
                let def_pts = utils.military_bias(
                    this.mother_state, target_nat, terrA, terrB, false)
                console.log('bias')
                console.log(atk_pts)
                console.log(def_pts)
                let details = this._battle(atk_pts,def_pts)
                console.log(details)
                this.mother_state.nations[nat].army[idx_cur].can_attack = false
                if (details.outcome) {
                    this.mother_state.nations[target_nat].army.splice(idx_t,1)
                }
                else {
                    console.log('defeat')
                    this.mother_state.nations[nat].army.splice(idx_cur,1)
                }
                this._manage_conquest(target_nat)
                this._prayer('battle_outcome',details,this.mother_state)
        }
    }

    done(username)
    {
        log(username);
        let nat = this.mother_state.stage.turn
        if (username === this.mother_state.nations[nat].president) {
            this._transition()
        }
    }

    build(username, terr, type)
    {
        log(username, terr, type);
        let nat = this.mother_state.stage.turn
        let terr_info = utils.territory_for_territory_name(
            this.mother_state, terr)
        let n_buildings = terr_info.n_barracks + terr_info.n_factories
        let afford = this.mother_state.nations[nat].cash >= COSTS[type]
        if (n_buildings < 4 && afford &&
             username === this.mother_state.nations[nat].president) {
                let t_str = type == 'barracks' ? 'n_barracks' : 'n_factories'
                let terrInfo =
                    utils.territory_for_territory_name(this.mother_state, terr);
                terrInfo[t_str] += 1
                this.mother_state.nations[nat].cash -= COSTS[type]
        }
        this._prayer('built_infrastructure', {'type': type, 'territory': terr});
    }

    spawn(username, terr, type)
    {
        log(username, terr, type);
        // cast terr to str
        terr = terr.toString()
        let nat = this.mother_state.stage.turn
        let afford = this.mother_state.nations[nat].cash >=  COSTS[type]
        let val_terr = utils.territories_of_nation_that_can_spawn(
            this.mother_state, nat)
        console.log(afford)
        console.log(val_terr)
        console.log(terr)
        console.log(val_terr.includes(terr))

        if (val_terr.includes(terr) && afford){
            let terrInfo =
                utils.territory_for_territory_name(this.mother_state, terr);
            terrInfo.n_barracks_can_spawn -= 1
            let unit = {"type": type, "territory":terr,
                "id":utils.uuid(), 'can_move':false, 'can_move':false}
            this.mother_state.nations[nat].army.push(unit)
            this.mother_state.nations[nat].cash -= COSTS[type]
        }
        console.log(this.mother_state.nations[nat].army)
        this._prayer('spawned_unit','')
    }

    vote(username, candidate_username)
    {
        log(username, candidate_username);
        let cur_nat = this.mother_state.stage.turn
        let cur_r = this.mother_state.stage.round
        if (this.mother_state.stage.subphase == 'Election'){
            if (this.mother_state.players[username].vote == null) {
                this._register_vote(username, candidate_username)
            }
        }
        // need to check again in case election is resolved
        if(this.mother_state.stage.subphase == 'Election' && 
            this.mother_state.stage.turn == cur_nat &&
            this.mother_state.stage.round == cur_r)  {
               this.rdyUp(username)
        }
    }

    dividends(username, amount)
    {
        log(username, amount);
        let nat = this.mother_state.stage.turn
        let is_prez = username === this.mother_state.nations[nat].president
        let n_shares = utils.total_shares(this.mother_state, nat)
        let is_int = amount % n_shares == 0
        let can_afford = amount <= this.mother_state.nations[nat].cash
        if (is_prez && is_int && can_afford) {
            this.mother_state.nations[nat].cash -= amount
            let income_per_share = amount / n_shares
            let owners = utils.owners(this.mother_state, nat)
            for (let owner in owners){
                let inc = owners[owner] * income_per_share
                this.mother_state.players[owner].cash += inc
            }
            this._prayer('dividends_paid',amount,this.mother_state)
            this.timer.stop(true)
        }
    }

    bribe(username, amount, nation)
    {
        if (this.mother_state.players[username].cash >= amount) {
            this.mother_state.players[username].cash -= amount
            this.mother_state.nations[nation].cash += amount
            let details = { 'amount' : amount,
                'player':username, 'nation':nation }
            this._prayer('bribe', details, this.mother_state)
        }
    }

    //shares_to / shares_from is a list with shares as strings (potential dupes)
    //first share and cash args (shares_to & cash_to) go to player (second user)
    initTrade(username, player, shares_to, shares_from, cash_to, cash_from)
    {
        log(username, player, shares_to,
            shares_from, cash_to, cash_from)
        let t_pairs = this.mother_state.trading_pairs.reduce(
            (a,b) => a.concat(b), []) 

        let trade = {}
        trade.from = username
        trade.to = player
        trade.shares_to = shares_to
        trade.shares_from = shares_from
        trade.cash_to = cash_to
        trade.cash_from = cash_from

        if (t_pairs.includes(username)||t_pairs.includes(player)) {
            this._prayer('players_busy',trade,this.mother_state)
        } 
        else if (this._trade_verification(
            username, player, shares_to, shares_from, cash_to, cash_from)) {
        
            this.mother_state.trading_pairs.push([username, player, trade])
            this._prayer('trade_proposed',trade,this.mother_state)
        }
    }

    respondTrade(username, player, 
        shares_to, shares_from, cash_to, cash_from, accept)
    {
        log(username, player, shares_to, shares_from,
            cash_to, cash_from)
        // Terrible terrible hack that's #tonyendorsed to hotfix respondTrade.
        // This should be refactored.
        {
            log("this.mother_state.trading_pairs", this.mother_state.trading_pairs);
            let tradesFrom = this.mother_state.trading_pairs.map(x => x[2].from);
            let tradesTo = this.mother_state.trading_pairs.map(x => x[2].to);
            let i = Math.max(tradesFrom.indexOf(username),
                tradesTo.indexOf(username));
            log("i", i);
            let trade = this.mother_state.trading_pairs[i][2];
            log("trade", trade);
            username = trade.from;
            player = trade.to;
            shares_to = trade.shares_to;
            shares_from = trade.shares_from;
            cash_to = trade.cash_to;
            cash_from = trade.cash_from;
        }

        // Swap username/player so we can view this from the same perspective as initTrade
        [username, player] = [player, username]

        if (accept && this._trade_verification(
            player, username, shares_to, shares_from, cash_to, cash_from)) {
                
            for(let share of shares_to) {
                this.mother_state.players[username].shares[share]++
                this.mother_state.players[player].shares[share]--
            }
            
            for(let share of shares_from) {
                this.mother_state.players[username].shares[share]--
                this.mother_state.players[player].shares[share]++
            }
            this.mother_state.players[username].cash -= cash_from
            this.mother_state.players[player].cash -= cash_to
            this.mother_state.players[username].cash += cash_to
            this.mother_state.players[player].cash += cash_from
            this._trade_dequeue(username, player)
            this._prayer('trade_accepted','',this.mother_state)
        }
        else {
            this._trade_dequeue(username, player)
            this._prayer('trade_rejected','',this.mother_state)
        }
    }

    constructor(prayer, timer)
    {
        this.prayer = prayer
        this.timer = timer
        this._history = new History(this.prayer);
        this.mother_state = { }
        this.mother_state.map = utils.load_map(JSON.parse(fs.readFileSync('map.json')));
        const kDebug = true;
        this.mother_state.settings = {
            "debug": kDebug,
            "deliberationTime": (kDebug ?   1 : 30)* 1*1000,
            "biddingTime":      (kDebug ?   1 : 12)* 1*1000,
            "electionTime":     (kDebug ? 999 :  2)*60*1000,
            "actionsTime":      (kDebug ? 999 :  3)*60*1000,
            "bidsGoToOwners": true,
            "burnCashFirstRound": true,
            "startingCash": 1475,
            "advice": true,
        }
        this.mother_state.players = { }
        this.mother_state.nations = { }
        for (let nation of this.mother_state.map.continents) {
          this.mother_state.nations[nation.name] = {
            army: [],
          };
        }
        this.mother_state.blacklisted_names = TURNS.concat(BLACKLISTED_NAMES)
        this.mother_state.blacklisted_names.push('abstain');
        this.mother_state.phase = PHASES
        this.mother_state.subphase = SUBPHASES
        this.mother_state.turn = TURNS
        this.mother_state.round = ROUNDS
        this.mother_state.order = ['subphase', 'turn', 'phase', 'round']
        this.mother_state.clock = 0
        //this.mother_state.phase = 'lobby'
        this.mother_state.stage = {}
        this.mother_state.stage.round = 0
        this.mother_state.stage.phase = 'lobby'
        this.mother_state.stage.turn = null
        this.mother_state.stage.subphase = null
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        this.mother_state.trading_pairs = []
        this.mother_state.supershares_from_turn = SHARES_FROM_TURN
        // log.enable = false
        this._nation_init()
    }


    //prayer wrapper for automatic timing
    _prayer(prayer_id, signal)
    {
        log(prayer_id, signal);
        this._log([prayer_id, signal]);
        let tau = 0;
        if (this.timer && this.timer.isRunning()) tau = this.timer.queryTime()
        this.mother_state.clock = tau
        this.prayer(prayer_id, signal)
    }

    //acts based on current game state
    _parse_stage(stage) 
    {
        log(stage);
        return [stage.round, stage.phase, stage.turn, stage.subphase]
    }

    //act mutates the state as necessary for the game
    //this method must either call _transition to update to the next state
    //OR it can ensure that another method called by _act
    //will eventually call _transition (i.e. timer events)
    _act()
    {
        log();
        let [round, phase, turn, subphase] = this._parse_stage(
            this.mother_state.stage)
        let nat = this.mother_state.stage.turn
        let prez = this.mother_state.nations[turn].president
        let is_puppet = utils.puppeteer(this.mother_state, nat) !== nat
        let noop = (prez === null || prez === 'abstain' || is_puppet)

        if (this.mother_state.stage.phase === 'Taxation') {
            this.mother_state.nations[nat].cash += utils.income_of_nation(
                this.mother_state, nat)
            this._prayer('taxes_collected','')
            this._transition()
        }
        else if (this.mother_state.stage.phase === 'Discuss') {
            this._begin_deliberation()
        }
        else if (this.mother_state.stage.phase === 'Auction') {
            if (utils.shares_sold(this.mother_state, turn) <
                utils.total_shares(this.mother_state, nat))
                {
                    this._start_auction(turn)
                }
            else this._transition()
        }
        else if (this.mother_state.stage.subphase === 'Election') {
            if (is_puppet){
                this._transition()
            }
            else{
                this._start_election(this.mother_state.stage.turn)
            }
        }
        else if (this.mother_state.stage.subphase == 'Move') {
                this._start_presidential_command()
                for (let nation_name in this.mother_state.nations) {
                    let army = this.mother_state.nations[nation_name].army
                    for (let unit of army) {
                        unit.can_move = (nation_name == nat)
                        unit.can_attack = (nation_name == nat)
                        if (unit.type == 'Artillery') {
                            unit.can_attack = false
                        }
                    }
                }
            this._prayer('begin_move','')
            let no_army = this.mother_state.nations[nat].army.length === 0
            if (noop|| no_army) {
                this._transition()
            }
        }
        else if (this.mother_state.stage.subphase == 'Attack'){
            this._prayer('begin_attack','')
            if (this.mother_state.nations[nat].army.filter(
                x => x.can_attack).length == 0 || noop) {
                    this._transition()
                }
        }
        else if (this.mother_state.stage.subphase == 'Spawn'){
            this._prayer('begin_spawn','')
            for (let terr of utils.territories_of_nation(this.mother_state, nat)) {
                let terrInfo =
                    utils.territory_for_territory_name(this.mother_state, terr);
                let nb = terrInfo.n_barracks
                terrInfo.n_barracks_can_spawn = nb
            }
            let terrs = utils.territories_of_nation_that_can_spawn(
                this.mother_state, nat)
            console.log(terrs)
            if (terrs.length == 0 || noop){
                    this._transition()
            }
        }
        else if (this.mother_state.stage.subphase == 'Build'){
            this._prayer('begin_build','')
            let terr_list = utils.territories_of_nation_that_can_build(
                this.mother_state, nat)
            console.log(terr_list)
            if (terr_list.length == 0 || noop) {
                    this._transition()
                }
        }
        else if (this.mother_state.stage.subphase == 'Dividends'){
            this._prayer('begin_dividends','')
            if (noop) this._transition()
        }
        else if (this.mother_state.stage.phase === 'Action'){
            this._transition()

        }
    }

    //computes the transition based on game state
    //always calls act on end
    _transition()
    {
        log()
        let cur_ord = (this.mother_state.stage.round % 2 == 1)
        //let curTURNS = TURNS
        console.log(this.mother_state.stage)
        let curTURNS = cur_ord ? TURNS : reverse(TURNS)
        //console.log(curTURNS)
      
        function next(cur, table) {
            let next_idx = (table.indexOf(cur) + 1) % table.length
            return table[next_idx]
        }
        function is_last(cur, table){
            return table.indexOf(cur) == table.length - 1
        }

        let [round, phase, turn, subphase] = this._parse_stage(
            this.mother_state.stage)

        if (['Taxation','Auction'].includes(phase)){
            if (is_last(turn, curTURNS)) {
                this.mother_state.stage.phase = next(phase, PHASES)
            }
            else if (phase == 'Auction'){
                this.mother_state.stage.phase = 'Discuss'
            }
            this.mother_state.stage.turn = next(turn, curTURNS)
        }
        else if (phase == PHASES.fromback() && subphase == SUBPHASES.fromback()
            && turn == curTURNS.fromback()) {
                this.mother_state.stage.round += 1
                if (this.mother_state.stage.round > ROUNDS.fromback()){
                    this._prayer('game_over')
                    return
                }
                this.mother_state.stage.phase = PHASES[0]
                this.mother_state.stage.turn = curTURNS.fromback()
                this.mother_state.stage.subphase = SUBPHASES[0]
            }

        else if (phase == 'Discuss'){
            this.mother_state.stage.phase = next(phase, PHASES)
        }
        else if (phase == 'Action'){
            let nextsubphase = next(subphase, SUBPHASES)
            if (subphase == SUBPHASES.fromback()) {
                this.mother_state.stage.turn = next(turn, curTURNS)
                this.timer.stop(false)
            }
            this.mother_state.stage.subphase = nextsubphase
        }
        this._act()
    }

    _nation_init()
    {
        log();
        for (let nationName in this.mother_state.nations) {
            let nation = this.mother_state.nations[nationName];
            nation.cash = 0
            nation.owns = []
            nation.army = []
            nation.president = null
            let hexIds = Object.values(this.mother_state.map.states).filter(x => x.homeContinent == utils.abbr_from_nation_name(this.mother_state, nationName)).map(x => x.id);
            for (let hexId of hexIds) {
                nation.owns.push(hexId)
                nation[hexId] = {}
                nation[hexId].n_factories = 0
                nation[hexId].n_barracks = 0
                nation[hexId].n_barracks_can_spawn = 0
                if (this.mother_state.settings.debug) {
                    if (utils.is_tile_capital(this.mother_state, hexId)) {
                        continue;
                    }
                    if (Math.random() < 0.125) {
                        nation[hexId].n_factories = 1
                    } else if (Math.random() < 0.14) {
                        nation[hexId].n_barracks = 1
                    } else if (Math.random() < 0.17) {
                        let T = ["Infantry", "Cavalry", "Artillery"];
                        let type = T[Math.random() * T.length | 0];
                        nation.army.push({
                            "type": type,
                            "territory": hexId,
                            "id": utils.uuid(),
                            "can_move": true,
                            "can_attack": true,
                        });
                    }
                    nation[hexId].n_barracks_can_spawn = nation[hexId].n_barracks;
                }
            }
        }
    }


    _player_cash_init()
    {
        log();
        let n_players = Object.keys(this.mother_state.players).length
        let inicash = Math.floor(this.mother_state.settings.startingCash/n_players)
        for (let player in this.mother_state.players){
            this.mother_state.players[player].cash = inicash
        }
    }

    //deliberation routines
    _begin_deliberation()
    {
        log();
        for (let player in this.mother_state.players) {
            this.mother_state.players[player].ready = false
        }
        this.mother_state.clock = this.mother_state.settings.deliberationTime
            if (this.timer.isRunning()) this.timer.stop(false)
            this.timer.start(this.mother_state.settings.deliberationTime,
                this._finish_deliberation.bind(this))
            this._prayer('begin_deliberation', this.mother_state.settings.deliberationTime)
    }

    _finish_deliberation()
    {
        console.trace()
        log();
        this.timer.stop(true);
        this.timer.stop(true);
        console.trace()
        this._prayer('deliberation_over','')
        this._transition()
    }

    //auction routines
    _start_auction(nation)
    {
        log(nation);
        this.mother_state.clock = 0
        this.timer.stop(false)
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        this._prayer('auction_start', nation)
    }

    _register_bid(amount, username)
    {
        if (this.mother_state.highest_bidder === null) {
            this._save("auction_start", null);
        }
        log(amount, username);
        this.mother_state.current_bid = amount
        this.mother_state.highest_bidder = username
        if (this.timer) this.timer.stop(false)
        this.timer.start(this.mother_state.settings.biddingTime, this._conclude_bidding.bind(this))
        console.log('register bid called')
        this._prayer('bid_received', {'amount' : amount, 'player': username,
            'nation': this.mother_state.stage.turn})

    }

    _conclude_bidding()
    {
        log();
        let i = this.mother_state.stage.round
        let price = this.mother_state.current_bid
        let winner = this.mother_state.highest_bidder
        let curnat = this.mother_state.stage.turn
        this.mother_state.players[winner].cash -= price
        let dem = utils.num_shares_already_auctioned_for_nation(
            this.mother_state)[curnat]
        if (this.mother_state.settings.bidsGoToOwners && dem > 0) {
            let owners = utils.owners(this.mother_state, curnat) 
            for (let p in owners) {
                this.mother_state.players[p].cash += price*owners[p]/dem
            }
        }
        else if (this.mother_state.stage.round > 1 || !this.mother_state.settings.burnCashFirstRound){
            this.mother_state.nations[curnat].cash += price
        }
        this.mother_state.players[winner].shares[curnat] += SHARES_FROM_TURN[i-1]
        let details = {'winner' : winner, 'nation' : curnat, 'price':price}
        details.winner = winner
        this._prayer('conclude_bidding', details)
        this._transition()
    }

    //election routines
    _start_election(nation)
    {
        log(nation);
        this.mother_state.clock = 0
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        let voters = utils.owners(this.mother_state, nation)
        for (let player in voters) {
            this.mother_state.players[player].ready = (voters[player] == 0)
        }
        if (this.timer.isRunning()) this.timer.stop(false)
        this.timer.start(this.mother_state.settings.electionTime, this._conclude_election.bind(this))
        this._prayer('start_election', nation)
    }

    _register_vote(username, candidate_username)
    {
        log(username, candidate_username);
        if (utils.sum(Object.values(utils.candidate_votes(this.mother_state))) == 0) {
            // This is the first vote.
            this._save("election_start", null);
        }
        this.mother_state.players[username].vote = candidate_username
        let nat = this.mother_state.stage.turn
        let candidate_votes = utils.candidate_votes(this.mother_state)
        console.log(utils.candidate_votes(this.mother_state))
        this._prayer('vote_tallied', candidate_votes)
        let votes_needed = Math.floor(
            utils.shares_sold(this.mother_state, nat)/2) + 1
        for (let player in candidate_votes) {
            if (candidate_votes[player] >= votes_needed) {
                this.mother_state.nations[nat].president = player
                this.timer.stop(true)
            }
        }
    }

    _conclude_election()
    {
        log();
        if (utils.sum(Object.values(utils.candidate_votes(this.mother_state))) == 0) {
            // No votes were cast.
            this._save("election_start", null);
        }
        for (let player in this.mother_state.players){
            this.mother_state.players[player].vote = null
            this.mother_state.players[player].ready = false
        }
        let nat = this.mother_state.stage.turn
        let details = {'winner' : this.mother_state.nations[nat].president}
        this._prayer('conclude_election', details)
        this._transition()
    }

    //start presidential command & clock
    _start_presidential_command()
    {
        log();
        let nat = this.mother_state.stage.turn
        let prez = this.mother_state.nations[nat].president
        let details = {'president':prez, 'nation':nat}
        let tau = this.timer.queryTime() + this.mother_state.settings.actionsTime
        details['time'] = tau
        this.mother_state.clock = tau
        this.timer.start(tau, this._end_presidential_command.bind(this))
        this._prayer('begin_presidential_command',details)
    }

    _end_presidential_command()
    {
        log();
        this._prayer('end_presidential_command','')
        let nat = this.mother_state.stage.turn
        this.mother_state.nations[nat].president = null
        this._transition()
    }

    //battle routines
    _unit2idx(unit_id) { 
        for (let nats of TURNS){ 
            let nation = this.mother_state.nations[nats]
            let army = nation.army
            if (army.filter(x => x.id == unit_id).length == 1) {
                let idx2id = nation.army.map(x => x.id)
                return [idx2id.indexOf(unit_id), nats]
            }
        }
    }

    _battle(atk_pts, def_pts)
    {
        let battle = new Battle(atk_pts, def_pts)
        battle.linear_die_battle()
        return battle.metadata
    }

    _manage_conquest(nation)
    {
       log(nation)
       let puppeteer = utils.puppeteer(this.mother_state, nation)
       if (puppeteer !== null && puppeteer !== nation) {
           this.mother_state.nations[nation].army = []
           let cash = this.mother_state.nations[nation].cash
           this.mother_state.nations[nation].cash = 0
           this.mother_state.nations[puppeteer].cash += cash
           this._prayer('conquest', {'nation':nation, 'puppeteer':puppeteer})
       }
    }
    //

    _trade_dequeue(username, player)
    {
        log(username, player)
        for (let pair of this.mother_state.trading_pairs) {
            if (pair[1] === username && pair[0] === player) {
                var idx = this.mother_state.trading_pairs.indexOf(pair)
                this.mother_state.trading_pairs.splice(idx,1)
                break
            }
        }
    }

    _trade_verification(user, player, shares_to, shares_from, cash_to, cash_from)
    {
        log(user, player, shares_to, shares_from, cash_to, cash_from)
        let shares_valid = (share_list, p) => {
            log(share_list, p);
            let share_to_counts = {}
            for(let share of share_list) {
                if (share in share_to_counts) {
                    share_to_counts[share]++
                } 
                else {
                    share_to_counts[share] = 1
                } 
            }
            let rtn = true
            for(let s in share_to_counts) {
                rtn &= (this.mother_state.players[p].shares[s] >= share_to_counts[s])
            }
            return rtn
        }

        let trade_ok = shares_valid(shares_from, player)
        trade_ok &= shares_valid(shares_to, user)
        trade_ok &= (this.mother_state.players[player].cash >= cash_from)
        trade_ok &= (this.mother_state.players[user].cash >= cash_to)
        return trade_ok
    }

    _log(html) {
        if (!("logs" in this.mother_state)) this.mother_state.logs = [];
        this.mother_state.logs.push(html);
    }

}
module.exports = Game;
