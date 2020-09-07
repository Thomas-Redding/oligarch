let utils = require('./utils.js')
let Battle = require('./battle.js')
let log = require('./log.js');

log.enabled = true;

//macro for pythonic list indexing
Array.prototype.fromback = function(i=1) {
    return this[this.length - i];
}
const reverse = (A) =>  A.map((v, i) => A[A.length - i - 1]) 

//global lists and macros defined here
const TOTAL_INIT_CASH = 600
const ROUNDS = [1,2,3,4,5,6]
const PHASES = ['Taxation','Discuss','Auction','Action']
const TURNS = ['North America', 'South America',
    'Europe', 'Africa', 'Asia', 'Australia']
const SUBPHASES = [null,'Election','Move','Attack','Spawn','Build','Dividends']
const BLACKLISTED_NAMES = ['NA','SA','EU','AF','AS','AU']
const TIMING = {'deliberation' : 10*1000, 'bidding' : 1*1000,
 'election':10*1000, 'actions':1200*1000}
const UNITS = ['Cavalry','Infantry','Artillery']
const COSTS = {'factory' : 10, 'barracks' : 15, 'Infantry': 10, 
    'Artillery':15, 'Cavalry':15 }


//game class defined below

class History {
  constructor(prayer) {
    this._prayer = prayer
    this._states = [];
    this._args = [];
    this._actions = [];
  }
  save(action, args, mother_state) {
    this._actions.push(action);
    this._args.push(args);
    this._states.push(utils.deep_copy(mother_state));
  }
  undo() {
    if (this._states.length <= 1) {
        throw Exception("Attempted to undo with a history of length 1.")
    }
    let action = this._actions.pop();
    let args = this._args.pop();
    let state = this._actions.pop();
    return [action, args, state];
  }
}

class Game
{
    fetchGameState()
    {
        log("");
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
        throw Exception("Game.undo() is not implemented yet.");
        if (this.mother_state.players[username].auth !== 'admin') return;
        let [action, args, state] = this._history.undo();
        this.mother_state = state;
        if (this.timer) this.timer.stop();
        if (action === "endLobby") {
            log("UNDO", action, args);
        } else if (action === "bid") {
            log("UNDO", action, args);
        }
    }

    endLobby(username)
    {
        log(username);
        let rtn;
        if (this.mother_state.players[username].auth !== 'admin') {
            rtn = false
        }
        else {
            this._history.save("endLobby", [username], this.mother_state,
                "<b>" + username + "</b> closed the lobby.");
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
        log("Game.startGame()", username);
        this._player_cash_init()
        this.prayer('game_start', {}, this.mother_state)
        this._act()
    }

    addPlayer(username)
    {
        log("Game.addPlayer()", username);
        let player = {}
        let rtn = true
        if (this.mother_state.stage.phase !== 'lobby') {
            return !rtn
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
            for (let key in utils.NATIONS) {
                player.shares[key] = 0
            }
            this.mother_state.players[username] = player
        }
        return rtn
    }

    rdyUp(username)
    {
        log("Game.rdyUp()", username);
        if (this.mother_state.players[username].ready) return;
        this._history.save("rdyUp", [username], this.mother_state,
            "<b>" + username + "</b> readied up");
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
        //log("Game.bid()", username, amount);
        if (this.mother_state.players[username].cash >= amount &&
            this.mother_state.current_bid < amount) {
            this._history.save("bid", [username], this.mother_state,
                "<b>" + username +  "</b> bid $" + amount);
            this._register_bid(amount, username)
        }
    }

    move(username, uid_list, from_terr, target)
    {
        //log("Game.move()", username, unit_id_list, from_territory, target);
        let nat = this.mother_state.stage.turn
        if (this.mother_state.stage.subphase == 'Move' &&
            this.mother_state.nations[nat].president === username) {
            let all_move = uid_list.every(
                uid => utils.troop_from_id(uid).can_move)

            if (all_move) {
                for (let uid of uid_list){
                    let [idx2uid, unat] = this._unit2idx(uid)
                    let idx = idx2uid.indexOf(uid)
                    this.mother_state.nations[unat].army[idx].territory = target
                    this.mother_state.nations[unat].army[idx].can_move = false
                }
            }
            this._prayer('moves_made','')
        }
    }

    raze(username, unit_id, building, terr)
    {
        let target_nat = this.terr2nat(terr)
        if (this.mother_state.stage.subphase == 'Attack' &&
        this.mother_state.nations[nat].president == username &&
        utils.troop_from_id(unit_id).can_attack) {
            bldg_type = building == 'barracks' ? 'n_barracks' : 'n_factories'
            if (this.mother_state.nations[target_nat][terr]['bldg_type'] > 0){
                this.mother_state.nations[target_nat][terr]['bldg_type']--
                this._prayer('bldg_razed','')
            }
        }
    }
    
    attack(username, unit_id, target_id)
    {
        //log("Game.attack()", username, unit_id, target_id)

        let [idx2uid_cur, nat] = this._unit2idx(unit_id)
        let [idx2uid_target, target_nat] = this._unit2idx(target_id)

        if (this.mother_state.stage.subphase == 'Attack' &&
            this.mother_state.nations[nat].president == username) {
                let terr = utils.troop_from_id(unit_id).territory
                let atk_pts = utils.military_bias(nat, terr)
                let def_pts = utils.military_bias(target_nat, terr)
                let details = this._battle(atk_pts,def_pts)
                if (details.outcome) {
                    let idx = idx2uid_target.indexOf(target_id)
                    this.mother_state.nations[target_nat].army.splice(idx,1)
                }
                else {
                    let idx = idx2uid_cur.indexOf(unit_id)
                    this.mother_state.nations[target_nat].army.splice(idx,1)
                }
                this._prayer('battle_outcome',details,this.mother_state)
        }
    }

    done(username)
    {
        log("Game.done()", username);
        let nat = this.mother_state.stage.turn
        if (username === this.mother_state.nations[nat].president) {
            this._transition()
        }
    }

    build(username, terr, type)
    {
        log("Game.build()", username, terr, type);
        let nat = this.mother_state.stage.turn
        let terr_info = utils.territory_for_territory_name(
            this.mother_state, terr)
        let n_buildings = terr_info.n_barracks + terr_info.n_factories
        let afford = this.mother_state.nations[nat].cash >=  COSTS[type]
        if (n_buildings < 4 && afford &&
             username === this.mother_state.nations[nat].president) {
                let t_str = type == 'barracks' ? 'n_barracks' : 'n_factories'
                this.mother_state.nations[nat][terr][t_str] += 1
                this.mother_state.nations[nat].cash -= COSTS[type]
        }
        this._prayer('built_infrastructure','')
    }

    spawn(username, terr, type)
    {
        log("Game.spawn()", username, terr, type);
        let nat = this.mother_state.stage.turn
        let afford = this.mother_state.nations[nat].cash >=  COSTS[type]
        let val_terr = utils.territories_of_nation_that_can_spawn(
            this.mother_state, nat)
        if (val_terr.includes(terr) && afford){
            this.mother_state.nations[nat][terr].n_barracks_can_spawn -= 1
            let unit = {"type": type, "territory":terr,
                "id":utils.uuid(), 'can_move':false, 'can_move':false}
            this.mother_state.nations[nat].army.push(unit)
            this.mother_state.nations[nat].cash -= COSTS[type]
        }
        this._prayer('spawned_unit','')
    }

    vote(username, candidate_username)
    {
        log("Game.vote()", username, candidate_username);
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
        log("Game.dividends()", username, amount);
        let nat = this.mother_state.stage.turn
        let is_prez = username === this.mother_state.nations[nat].president
        let n_shares = utils.shares_sold(this.mother_state, nat)
        let is_int = amount % n_shares == 0
        let can_afford = amount <= this.mother_state.nations[nat].cash
        if (is_prez && is_int && can_afford){
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

    //shares_to / shares_from is a list with shares as strings (potential dupes)
    //first share and cash args (shares_to & cash_to) go to player (second user)
    initTrade(username, player, shares_to, shares_from, cash_to, cash_from)
    {
        log("Game.initTrade()", username, player, shares_to,
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
        
            this.mother_state.trading_pairs.push([username, player])
            this._prayer('trade_proposed',trade,this.mother_state)
        }
    }

    respondTrade(username, player, 
        shares_to, shares_from, cash_to, cash_from, accept)
    {
        // Swap username/player so we can view this from the same perspective as initTrade
        [username, player] = [player, username]
        log("Game.respondTrade()", username, player, shares_to, shares_from,
            cash_to, cash_from)

        if (accept && this._trade_verification(
            username, player, shares_to, shares_from, cash_to, cash_from)) {
                
            for(let share of shares_to) {
                this.mother_state.players[username].shares[share]--
                this.mother_state.players[player].shares[share]++
            }
            
            for(let share of shares_from) {
                this.mother_state.players[username].shares[share]++
                this.mother_state.players[player].shares[share]--
            }
            this.mother_state.players[username].cash += cash_to
            this.mother_state.players[player].cash += cash_from
            this.mother_state.players[username].cash -= cash_from
            this.mother_state.players[player].cash -= cash_to
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
        this.mother_state.players = { }
        this.mother_state.nations = utils.NATIONS
        this.mother_state.blacklisted_names = TURNS.concat(BLACKLISTED_NAMES)
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
        log.enable = false
        this._nation_init()
    }


    //prayer wrapper for automatic timing
    _prayer(prayer_id, signal)
    {
        log("Game._prayer()", prayer_id, signal);
        this._log([prayer_id, signal]);
        let tau = 0;
        if (this.timer && this.timer.isRunning()) tau = this.timer.queryTime()
        this.mother_state.clock = tau
        this.prayer(prayer_id, signal, this.mother_state)
    }

    //acts based on current game state
    _parse_stage(stage) 
    {
        log("Game._parse_stage()", stage);
        return [stage.round, stage.phase, stage.turn, stage.subphase]
    }

    //act mutates the state as necessary for the game
    //this method must either call _transition to update to the next state
    //OR it can ensure that another method called by _act
    //will eventually call _transition (i.e. timer events)
    _act()
    {
        log("Game._act()");
        let [round, phase, turn, subphase] = this._parse_stage(
            this.mother_state.stage)
        let nat = this.mother_state.stage.turn
        let prez = this.mother_state.nations[turn].president
        let noop = (prez === null || prez === 'abstain')

        if (this.mother_state.stage.phase === 'Taxation') {
            this.mother_state.nations[nat].cash = utils.income_of_nation(
                this.mother_state, nat)
            this._transition()
        }
        else if (this.mother_state.stage.phase === 'Discuss') {
            this._begin_deliberation()
        }
        else if (this.mother_state.stage.phase === 'Auction') {
            if (utils.shares_sold(this.mother_state, turn) <
                utils.NATIONS[turn].total_shares)
                {
                    this._start_auction(turn)
                }
            else this._transition()
        }
        else if (this.mother_state.stage.subphase === 'Election') {
            this._start_election(this.mother_state.stage.turn)
        }
        else if (this.mother_state.stage.subphase == 'Move') {
            this._start_presidential_command()
            this._prayer('begin_move','')
            for (let nation_name in this.mother_state.nations) {
                let army = this.mother_state.nations[nation_name].army
                for (let unit of army) {
                    unit.can_move = (nation_name == nat)
                    unit.can_attack = (nation_name == nat)
                }
            }
            let no_army = this.mother_state.nations[nat].army.length === 0
            if (noop|| no_army) {
                this._transition()
            }
        }
        else if (this.mother_state.stage.subphase == 'Attack'){
            this._prayer('begin_attack','')
            if (this.mother_state.nations[nat].army.filter(
                x => x.can_move).length == 0 || noop) {
                    this._transition()
                }
        }
        else if (this.mother_state.stage.subphase == 'Spawn'){
            this._prayer('begin_spawn','')
            for (let terr of utils.territories_of_nation(this.mother_state, nat)){
                let nb = this.mother_state.nations[nat][terr].n_barracks
                this.mother_state.nations[nat][terr].n_barracks_can_spawn = nb
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
            if (terr_list.length == 0 || noop)
                {
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
        log("Game._transition()")
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
                if (phase == 'Taxation'){
                    this._prayer('taxes_collected','')
                }
                else{
                    this._prayer('auctions_complete','')
                }
                this.mother_state.stage.phase = next(phase, PHASES)
            }
            this.mother_state.stage.turn = next(turn, curTURNS)
        }
        else if (phase == PHASES.fromback() && subphase == SUBPHASES.fromback()
            && turn == curTURNS.fromback()) {
                this.mother_state.stage.round += 1
                this.mother_state.stage.phase = PHASES[0]
                this.mother_state.stage.turn = curTURNS[0]
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
        log("Game._nation_init()");
        let terr2nat = {}
        for (let nation in this.mother_state.nations) {
            this.mother_state.nations[nation].cash = 0
            this.mother_state.nations[nation].owns = []
            this.mother_state.nations[nation].army = []
            this.mother_state.nations[nation].president = null
            for (let terr of utils.NATIONS[nation].territories) {
                this.mother_state.nations[nation].owns.push(terr)
                this.mother_state.nations[nation][terr] = {}
                this.mother_state.nations[nation][terr].n_factories = 2
                this.mother_state.nations[nation][terr].n_barracks = 2
                this.mother_state.nations[nation][terr].n_barracks_can_spawn = 2
                for (let type of ["Infantry", "Cavalry", "Artillery"]) {
                    this.mother_state.nations[nation].army.push({
                        "type": type,
                        "territory": terr,
                        "id": utils.uuid(),
                        "can_move": true,
                        "can_attack": true
                    });
                }
                terr2nat[terr] = nation
            }
        }
        this.terr2nat = terr2nat
    }


    _player_cash_init()
    {
        log("Game._player_cash_init()");
        let n_players = Object.keys(this.mother_state.players).length
        let inicash = Math.floor(TOTAL_INIT_CASH/n_players)
        for (let player in this.mother_state.players){
            this.mother_state.players[player].cash = inicash
        }
    }

    //deliberation routines
    _begin_deliberation()
    {
        log("Game._begin_deliberation()");
        this.mother_state.clock = TIMING.deliberation
            if (this.timer.isRunning()) this.timer.stop(false)
            this.timer.start(TIMING.deliberation,
                this._finish_deliberation.bind(this))
            this._prayer('begin_deliberation',TIMING.deliberation)
    }

    _finish_deliberation()
    {
        console.trace()
        log("Game._finish_deliberation()");
        this.timer.stop(true);
        this.timer.stop(true);
        console.trace()
        this._prayer('deliberation_over','')
        this._transition()
    }

    //auction routines
    _start_auction(nation)
    {
        log("Game._start_auction()", nation);
        this.mother_state.clock = 0
        this.timer.stop(false)
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        this._prayer('auction_start', nation)
    }

    _register_bid(amount, username)
    {
        log("Game._register_bid()", amount, username);
        this.mother_state.current_bid = amount
        this.mother_state.highest_bidder = username
        if (this.timer) this.timer.stop(false)
            this.timer.start(TIMING.bidding, this._conclude_bidding.bind(this))
        console.log('register bid called')
        this._prayer('bid_received', {'amount' : amount, 'player': username,
            'nation': this.mother_state.stage.turn})

    }

    _conclude_bidding()
    {
        log("Game._conclude_bidding()");
        let price = this.mother_state.current_bid
        let winner = this.mother_state.highest_bidder
        let curnat = this.mother_state.stage.turn
        this.mother_state.players[winner].shares[curnat] += 1
        this.mother_state.players[winner].cash -= price
        this.mother_state.nations[curnat].cash += price
        let details = {'winner' : winner, 'nation' : curnat, 'price':price}
        details.winner = winner
        this._prayer('conclude_bidding', details)
        this._transition()
    }

    //election routines
    _start_election(nation)
    {
        log("Game._start_election()", nation);
        this.mother_state.clock = 0
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        let voters = utils.owners(this.mother_state, nation)
        for (let player in voters) {
            this.mother_state.players[player].ready = (voters[player] == 0)
        }
        if (this.timer.isRunning()) this.timer.stop(false)
        this.timer.start(TIMING.election, this._conclude_election.bind(this))
        this._prayer('start_election', nation)
    }

    _register_vote(username, candidate_username)
    {
        log("Game._register_vote()", username, candidate_username);
        this.mother_state.players[username].vote = candidate_username
        let nat = this.mother_state.stage.turn
        let candidate_votes = utils.candidate_votes(this.mother_state)
        console.log(utils.candidate_votes(this.mother_state))
        this._prayer('vote_tallied', candidate_votes)
        let n_votes = 0
        for (let player in candidate_votes) {
            if (candidate_votes[player] >= n_votes) {
                this.mother_state.nations[nat].president = player
                this.timer.stop(true)
            }
        }
        n_votes = Math.floor(n_votes/2)+1
        //this.rdyUp(username)
    }

    _conclude_election()
    {
        log("Game._conclude_election()");
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
        log("Game._start_presidential_command()");
        let nat = this.mother_state.stage.turn
        let prez = this.mother_state.nations[nat].president
        let details = {'president':prez, 'nation':nat}
        let tau = this.timer.queryTime() + TIMING.actions
        details['time'] = tau
        this.mother_state.clock = tau
        this.timer.start(tau, this._end_presidential_command.bind(this))
        this._prayer('begin_presidential_command',details)
    }

    _end_presidential_command()
    {
        log("Game._end_presidential_command()");
        this._prayer('end_presidential_command','')
        let nat = this.mother_state.stage.turn
        this.mother_state.nations[nat].president = null
        this._transition()
    }

    //battle routines
    _unit2idx(unit_id) { 
        for (let nats of TURNS){ 
            let army = this.mother_state.nations[nat].army
            if (army.filter(x => x.id == unit_id).length == 1) {
                var target_nat = nats
                var idx2id_target = nats.army.map(x => x.id)
                let idx = idx2id_target.indexOf(target_id)
                this.mother_state.army[nats].army[idx].can_attack = false
            }
        }
        return [idx2id_target, target_nat]
    }
    _attack_helper(nat, target_id)
    {
        for (let nats of TURNS){ 
            let army = this.mother_state.nations[nat].army
            if (army.filter(x => x.id == target_id).length == 1) {
                var target_nat = nats
                var idx2id_target = nats.army.map(x => x.id)
                let idx = idx2id_target.indexOf(target_id)
                this.mother_state.army[nats].army[idx].can_attack = false
            }
            else if (nats == nat) {
                var idx2id_cur = army.map(x => x.id)
            }
        }
        return [idx2id_cur, idx2id_target, target_nat]
    }

    _battle(atk_pts, def_pts)
    {
        let battle = new Battle(atk_pts, def_pts)
        battle.linear_die_battle()
        return battle.metadata
    }
    //

    _trade_dequeue(username, player)
    {
        for (let pair of this.mother_state.trading_pairs) {
            if (pair[0] === username && pair[1] === player) {
                var idx = this.mother_state.trading_pairs.indexOf(pair)
                this.mother_state.trading_pairs.splice(idx,1)
                break
            }
        }
        
    }

    _trade_verification(user, player, shares_to, shares_from, cash_to, cash_from)
    {
        let shares_valid = (share_list, p) => {
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
