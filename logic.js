const fs = require('fs')

let { utils, reverse, PHASES, TURNS, SUBPHASES, UNITS, COSTS } = require('./utils.js')
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
            if (!fs.existsSync("data")) {
                fs.mkdirSync("data");
            }
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
        if (!utils.is_username_valid(username)) {
            return 'Username is invalid.';
        }
        else if (this.mother_state.stage.phase !== 'lobby') {
            // Allow spectators.
            return null
        }
        else {
            // Allow player.
            player.username = username
            player.cash = 0
            player.manualDebt = 0
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
            this._prayer("player_added",username)
            return null;
        }
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

    bid(username, bidInfo)
    {
        //log(username, bidInfo);
        let hasLiquidity = (this.mother_state.players[username].cash >= bidInfo.amount || this.mother_state.settings.debt == 'automatic');
        if (hasLiquidity && this.mother_state.current_bid < bidInfo.amount) {
            this._register_bid(bidInfo, username)
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

        if (nat === target_nat) {
            return;
        }

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
                this._prayer('battle_outcome', details)
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
        if (n_buildings == 0 && afford && username === this.mother_state.nations[nat].president) {
            let t_str = type == 'barracks' ? 'n_barracks' : 'n_factories'
            let terrInfo = utils.territory_for_territory_name(this.mother_state, terr);
            terrInfo[t_str] += 1
            this.mother_state.nations[nat].cash -= COSTS[type]
            this._prayer('built_infrastructure', {'type': type, 'territory': terr});
        }
    }

    spawn(username, barrackTerritoryId, spawnTerritoryId, type)
    {
        log(username, barrackTerritoryId, spawnTerritoryId, type);
        // cast terr to str
        barrackTerritoryId = barrackTerritoryId.toString();
        spawnTerritoryId = spawnTerritoryId.toString();
        let nationName = this.mother_state.stage.turn;
        let afford = this.mother_state.nations[nationName].cash >= COSTS[type];
        let validTerritories = utils.territories_barracks_can_spawn_to(this.mother_state, barrackTerritoryId);

        if (validTerritories.includes(spawnTerritoryId) && afford) {
            console.log('yay');
            let bTerritory = utils.territory_for_territory_name(this.mother_state, barrackTerritoryId);
            let sTerritory = utils.territory_for_territory_name(this.mother_state, spawnTerritoryId);
            bTerritory.n_barracks_can_spawn -= 1
            this.mother_state.nations[nationName].army.push({
                "type": type,
                "territory": spawnTerritoryId,
                "id":utils.uuid(),
                'can_move': false,
                'can_move': false,
            });
            this.mother_state.nations[nationName].cash -= COSTS[type];
        }
        this._prayer('spawned_unit','')
    }

    vote(username, candidate_username)
    {
        log(username, candidate_username);
        let cur_nat = this.mother_state.stage.turn
        let cur_r = this.mother_state.stage.round
        if (this.mother_state.stage.subphase == 'Election') {
            // TODO: Remove the following if-check to allow users to vote multiple times.
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
        let n_shares;
        if (this.mother_state.settings.doesBankReceiveDividends) {
          n_shares = utils.total_shares(this.mother_state, nat);
        } else {
          n_shares = utils.shares_sold(this.mother_state, nat);
        }
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
            this._prayer('dividends_paid', amount)
            this.timer.stop(true)
        }
    }

    donate(username, amount, nation)
    {
        if (this.mother_state.players[username].cash >= amount || this.mother_state.settings.debt == 'automatic') {
            this.mother_state.players[username].cash -= amount
            this.mother_state.nations[nation].cash += amount
            let details = { 'amount' : amount,
                'player':username, 'nation':nation }
            this._prayer('donate', details)
        }
    }

    borrow(username, amount)
    {
        // TODO(debt): Add interest calculations.
        if (this.mother_state.settings.debt != 'manual') return;
        this.mother_state.players[username].cash += amount;
        this.mother_state.players[username].manualDebt += amount;
        this._prayer('borrowed', {'player': username, 'amount': amount});
    }

    payBack(username, amount)
    {
        if (this.mother_state.settings.debt != 'manual') return;
        if (amount > this.mother_state.players[username].cash) return;
        this.mother_state.players[username].cash -= amount;
        this.mother_state.players[username].manualDebt -= amount;
        this._prayer('paid_back', {'player': username, 'amount': amount});
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
            this._prayer('players_busy', trade)
        } 
        else if (this._trade_verification(
            username, player, shares_to, shares_from, cash_to, cash_from)) {
        
            this.mother_state.trading_pairs.push([username, player, trade])
            this._prayer('trade_proposed', trade)
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
            this._prayer('trade_accepted', '')
        }
        else {
            this._trade_dequeue(username, player)
            this._prayer('trade_rejected', '')
        }
    }

    constructor(prayer, timer)
    {
        this.prayer = prayer
        this.timer = timer
        this._history = new History(this.prayer);
        this.mother_state = { }
        this.mother_state.map = utils.load_map(JSON.parse(fs.readFileSync('map.json')));
        const kDebug = false;
        this.mother_state.settings = {
            "debug": kDebug,
            "deliberationTime": (kDebug ?   1 : 30)* 1*1000,
            "biddingTime":      (kDebug ?   1 : 12)* 1*1000,
            "electionTime":     (kDebug ? 999 :  2)*60*1000,
            "actionsTime":      (kDebug ? 999 :  3)*60*1000,
            "startingCash": 2584,
            "advice": true,
            'debt': 'none', // 'none', 'manual', 'auto'
            'factoryIncome': 15,
            'auctionMoneyRecipient': 'county', // 'bank', 'old-human-owners', 'new-human-owners', 'county'
            'doesBankReceiveDividends': true,
            'endGameIncomeMultiplier': 2,
            'enabledTroops': ['cavalry'], // ['infantry', 'calvary', 'artillery']
            'auctionType': 'limit-orders', // 'first-price' or 'limit-orders'
        }
        if (this.mother_state.settings.auctionType == 'limit-orders') {
          this.mother_state.settings.biddingTime *= 2;
        }
        this.mother_state.players = { }
        this.mother_state.nations = { }
        for (let nation of this.mother_state.map.continents) {
          this.mother_state.nations[nation.name] = {
            army: [],
          };
        }
        this.mother_state.phase = PHASES
        this.mother_state.subphase = SUBPHASES
        this.mother_state.turn = TURNS
        this.mother_state.round = [];
        for (let i = 0; i < utils.total_rounds(); ++i) {
          this.mother_state.round.push(i + 1);
        }
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
        this.mother_state.allow_bids = false
        this.mother_state.trading_pairs = []
        this.mother_state.supershares_from_turn = SHARES_FROM_TURN
        // log.enable = false
        this._nation_init()
    }


    //prayer wrapper for automatic timing
    _prayer(prayer_id, signal, doubleTap=false)
    {
        log(prayer_id, signal);
        this._log([prayer_id, signal]);
        let tau = 0;
        if (this.timer && this.timer.isRunning()) tau = this.timer.queryTime()
        this.mother_state.clock = tau
        this.prayer(prayer_id, signal, doubleTap)
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
                utils.total_shares(this.mother_state, nat) || this.mother_state.settings.auctionType === 'limit-orders')
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
            this._prayer('begin_spawn', '', true)
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
        console.log(this.mother_state.stage)
        let curTURNS = cur_ord ? TURNS : reverse(TURNS)
      
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
                if (this.mother_state.stage.round > utils.total_rounds()){
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
                    } else if (Math.random() < 0.3) {
                        // let T = ["Infantry", "Cavalry", "Artillery"];
                        let T = ["Cavalry"];
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
            this.mother_state.players[player].manualDebt = 0
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
        log();
        this.timer.stop(true);
        this.timer.stop(true);
        this._prayer('deliberation_over','')
        this._transition()
    }

    //auction routines
    _start_auction(nation)
    {
        log(nation);
        if (this.mother_state.settings.auctionType == 'first-price') {
          this.mother_state.clock = 0
          this.timer.stop(false)
          this.mother_state.current_bid = -1
          this.mother_state.highest_bidder = null
        } else if (this.mother_state.settings.auctionType == 'limit-orders') {
          this.mother_state.limitOrderAuction = {}; // username -> {'bid': {'value': int, 'time': int}, 'ask': {'value': int, 'time': int}}
          this.timer.start(this.mother_state.settings.biddingTime, this._conclude_bidding.bind(this));
        }
        this.mother_state.allow_bids = true;
        this._prayer('auction_start', nation, true);
    }

    _register_bid(bidInfo, username)
    {
        if (!this.mother_state.allow_bids) {
            return;
        }
        if (bidInfo.nation != this.mother_state.stage.turn) {
          // Delayed bid from earlier auction.
          return;
        }
        if (this.mother_state.settings.auctionType == 'first-price') {
          if (this.mother_state.highest_bidder === null) {
              this._save("auction_start", null);
          }
          log(bidInfo, username);
          this.mother_state.current_bid = bidInfo.amount
          this.mother_state.highest_bidder = username
          if (this.timer) this.timer.stop(false)
          this.timer.start(this.mother_state.settings.biddingTime, this._conclude_bidding.bind(this))
          console.log('register bid called')
          this._prayer('bid_received', {'amount' : bidInfo.amount, 'player': username,
              'nation': this.mother_state.stage.turn}, true)
        } else if (this.mother_state.settings.auctionType == 'limit-orders') {
          if (!(username in this.mother_state.limitOrderAuction)) {
            this.mother_state.limitOrderAuction[username] = {'bid': null, 'ask': null};
          }
          this.mother_state.limitOrderAuction[username][bidInfo.orderType] = {'value': bidInfo.amount, 'time': new Date().getTime()};
        }
    }

    _conclude_bidding()
    {
        log();
        if (this.mother_state.settings.auctionType == 'first-price') {
          let i = this.mother_state.stage.round
          let price = this.mother_state.current_bid
          console.log('_conclude_bidding', price);
          let winner = this.mother_state.highest_bidder
          let curnat = this.mother_state.stage.turn
          this.mother_state.players[winner].cash -= price
          let oldHumanShares = 0;
          for (let player in this.mother_state.players) {
            oldHumanShares += this.mother_state.players[player].shares[curnat];
          }
          switch(this.mother_state.settings.auctionMoneyRecipient) {
            case 'bank':
              // Do nothing.
              break;
            case 'old-human-owners':
              for (let player in this.mother_state.players) {
                this.mother_state.nations[curnat].cash += price * this.mother_state.players[player].shares[curnat] / oldHumanShares;
              }
              break;
            case 'new-human-owners':
              for (let player in this.mother_state.players) {
                this.mother_state.nations[curnat].cash += price * this.mother_state.players[player].shares[curnat] / (oldHumanShares + SHARES_FROM_TURN[i-1]);
              }
              this.mother_state.players[winner].shares[curnat] += price * SHARES_FROM_TURN[i-1] / (oldHumanShares + SHARES_FROM_TURN[i-1]);
              break;
            case 'county':
              this.mother_state.nations[curnat].cash += price;
              break;
            default:
              throw Exception('Unrecognized auctionMoneyRecipient value: "' + this.mother_state.settings.auctionMoneyRecipient + '"');
          }
          this.mother_state.players[winner].shares[curnat] += SHARES_FROM_TURN[i-1]
          let details = {'winner' : winner, 'nation' : curnat, 'price':price}
          details.winner = winner
          this.mother_state.allow_bids = false;
          this._prayer('conclude_bidding', details, true)
        } else if (this.mother_state.settings.auctionType == 'limit-orders') {
          let bids = [];
          for (let username in this.mother_state.limitOrderAuction) {
            if (this.mother_state.limitOrderAuction[username]['bid'] == null) continue;
            if (this.mother_state.limitOrderAuction[username]['bid']['value'] == null) continue;
            bids.push({
              'username': username,
              'value': this.mother_state.limitOrderAuction[username]['bid']['value'],
              'time': this.mother_state.limitOrderAuction[username]['bid']['time'],
            });
          }
          let asks = [];
          for (let username in this.mother_state.limitOrderAuction) {
            if (this.mother_state.limitOrderAuction[username]['ask'] == null) continue;
            if (this.mother_state.limitOrderAuction[username]['ask']['value'] == null) continue;
            asks.push({
              'username': username,
              'value': this.mother_state.limitOrderAuction[username]['ask']['value'],
              'time': this.mother_state.limitOrderAuction[username]['ask']['time'],
            });
          }
          let curnat = this.mother_state.stage.turn;
          if (utils.shares_sold(this.mother_state, curnat) < utils.total_shares(this.mother_state, curnat)) {
            asks.push({
              'username': null,
              'value': 0,
              'time': 0,
            });
          }
          bids.sort((x, y) => {
            if (x['value'] < y['value']) {
              return 1;
            } else if (x['value'] > y['value']) {
              return -1;
            } else if (x['time'] > y['time']) {
              return 1;
            } else if (x['time'] < y['time']) {
              return -1;
            }
            return 0;
          });
          asks.sort((x, y) => {
            if (x['value'] > y['value']) {
              return 1;
            } else if (x['value'] < y['value']) {
              return -1;
            } else if (x['time'] > y['time']) {
              return 1;
            } else if (x['time'] < y['time']) {
              return -1;
            }
            return 0;
          });
          console.log('bids', bids);
          console.log('asks', asks);
          let trades = [];
          for (let i = 0; i < Math.min(bids.length, asks.length); ++i) {
            if (asks[i]['value'] > bids[i]['value']) {
              break;
            }
            trades.push({
              'ask': asks[i],
              'bid': bids[i],
            });
          }
          console.log('trades', asks);
          if (trades.length == 0) {
            this._prayer('conclude_bidding', {
              'buyers': [],
              'sellers': [],
              'marketPrice': null,
            }, true);
          } else {
            let marketPrice = trades[trades.length-1]['bid']['value'];
            console.log('marketPrice', marketPrice);
            let buyers = [];
            let sellers = [];
            for (let trade of trades) {
              this.mother_state.players[trade['bid']['username']].cash -= marketPrice;
              this.mother_state.players[trade['bid']['username']].shares[this.mother_state.stage.turn] += 1;
              buyers.push(trade['bid']['username']);
              if (trade['ask']['username'] == null) {
                // world bank
                if (this.mother_state.settings.auctionMoneyRecipient == 'bank') {
                  // do nothing
                } else {
                  // TODO: 'country'. 'old-human-owners', 'new-human-owners'
                }
              } else {
                this.mother_state.players[trade['ask']['username']].cash += marketPrice;
                this.mother_state.players[trade['ask']['username']].shares[this.mother_state.stage.turn] -= 1;
                sellers.push(trade['ask']['username']);
              }
            }
            this._prayer('conclude_bidding', {
              'buyers': buyers,
              'sellers': sellers,
              'marketPrice': marketPrice,
            }, true);
          }
        }
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
        battle.odds_battle()
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
        trade_ok &= (this.mother_state.players[player].cash >= cash_from || this.mother_state.settings.debt == 'automatic')
        trade_ok &= (this.mother_state.players[user].cash >= cash_to || this.mother_state.settings.debt == 'automatic')
        return trade_ok
    }

    _log(html) {
        if (!("logs" in this.mother_state)) this.mother_state.logs = [];
        this.mother_state.logs.push(html);
    }

}
module.exports = Game;
