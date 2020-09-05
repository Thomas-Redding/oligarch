let utils = require('./utils.js')

//macro for pythonic list indexing
Array.prototype.fromback = function(i=1) {
    return this[this.length - i];
}

//global lists and macros defined here
const TOTAL_INIT_CASH = 600
const ROUNDS = [1,2,3,4,5,6] 
const PHASES = ['Taxation','Deliberation','Auction','Action']
const TURNS = ['North America', 'South America', 
    'Europe', 'Africa', 'Asia', 'Australia']
const SUBPHASES = [null,'Election','Move','Attack','Spawn','Build','Dividends']
const BLACKLISTED_NAMES = ['NA','SA','EU','AF','AS','AU']
const TIMING = {'deliberation' : 90*1000, 'bidding' : 1*1000,
 'election':120*1000}
const UNITS = ['Cavalry','Infantry','Artillery']


//game class defined below

class History {
  constructor() {
    this._states = [];
    this._args = [];
    this._actions = [];
    this._logs = [];
  }
  save(action, args, mother_state, log) {
    this._actions.push(action);
    this._args.push(args);
    this._states.push(utils.deep_copy(mother_state));
    this._logs.push(log);
  }
  logs() {
    return utils.deep_copy(this._logs);
  }
  undo() {
    let action = this._actions.pop();
    let args = this._args.pop();
    let state = this._actions.pop();
    this._logs.pop();
    if (this._historicalStates.length <= 1) {
        throw Exception("Attempted to undo witha history of length 1.")
    }
    return [action, args, state];
  }
}

class Game
{
    fetchGameState()
    {
        if (this.timer && this.timer.isRunning())
        this.mother_state.clock = this.timer.queryTime();
        return this.mother_state
    }

    logs(username)
    {
        return this._history.logs();
    }

    is_admin(username) {
        return this.mother_state.players[username].auth === 'admin';
    }

    undo(username) {
        throw Exception("Game.undo() is not implemented yet.");
        if (this._historicalStates.length !== this._historicalActions.length) {
            throw Exception("Invalid history.");
        }
        if (this.mother_state.players[username].auth !== 'admin') return;
        [action, args, state] = this._history.undo();
        this.mother_state = state;
        if (this.timer) this.timer.stop();
        if (action)
        this.timer.start(this.mother_state.clock);
    }

    endLobby(username)
    {
        let rtn;
        if (this.mother_state.players[username].auth !== 'admin') {
            rtn = false
        }
        else {
            this._history.save("endLobby", [username], this.mother_state, "<b>" + username + "</b> closed the lobby.");
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
        this._history.save("startGame", [username], this.mother_state, "<b>" + username + "</b> started the game.");
        this._player_cash_init()
        this.prayer('game_start', {}, this.mother_state)
        this._act()
    }

    addPlayer(username, auth='admin')
    {
        let player = {}
        let rtn = true
        if (this.mother_state.stage.phase !== 'lobby') {
            return !rtn
        }
        else {
            player.username = username
            player.cash = 0
            player.auth = auth  
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
        if (this.mother_state.players[username].ready) return;
        this._history.save("rdyUp", [username], this.mother_state, "<b>" + username + "</b> readied up");
        this.mother_state.players[username].ready = true
        let all_ready = true
        for (let player of Object.values(this.mother_state.players)) {
            all_ready &= player.ready
        }
        if (all_ready) {
            this.mother_state.clock = this.timer.queryTime 
            this.timer.stop(true);
        }
    }

    bid(username, amount)
    {
        //console.log(username)
        //console.log(this.mother_state.players)
        //console.log(this.mother_state.players[username])
        if (this.mother_state.players[username].cash >= amount &&
            this.mother_state.current_bid < amount) {
            this._history.save("bid", [username], this.mother_state, "<b>" + username +  "</b> bid $" + amount);
            this._register_bid(amount, username)
        }
    }

    move(username, unit_id, target_territory)
    {
        nat = this.mother_state.stage.turn
        if (this.mother_state.nations[nat].president === username) {
            this._register_move(unit_id, target_territory)
        }
    }

    vote(username, candidate_username)
    {
        if (this.mother_state.players[username].vote == null) {
            this._register_vote(username, candidate_username)
        }
        this.rdyUp(username)
    }

    initTrade(username, player, shares_to, shares_from, cash_to, cash_from)
    {
        if (this.mother_state.players[username].vote == null) {
            this._register_vote(username, player)
        }
        //this.rdyUp(username)
    }

    constructor(prayer, timer)
    {
        this.prayer = prayer
        this.timer = timer
        this._history = new History();
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
        this._nation_init()
    }


    //prayer wrapper for automatic timing
    _prayer(prayer_id, signal)
    {
        let tau = 0;
        if (this.timer && this.timer.isRunning()) tau = this.timer.queryTime()
        this.mother_state.clock = tau
        this.prayer(prayer_id, signal, this.mother_state)
    }

    //acts based on current game state
    _parse_stage(stage){
        return [stage.round, stage.phase, stage.turn, stage.subphase]
    }

    //act mutates the state as necessary for the game
    //this method must either call _transition to update to the next state
    //OR it can ensure that another method called by _act
    //will eventually call _transition (i.e. timer events)
    _act()
    {
    
        let [round, phase, turn, subphase] = this._parse_stage(
            this.mother_state.stage)
        
        console.log(this.mother_state.stage.phase)
        if (this.mother_state.stage.phase === 'Taxation') {
            let nat = this.mother_state.stage.turn
            this.mother_state.nations[nat].cash = utils.income_of_nation(
                this.mother_state, nat)
            this._transition()
        }
    
        else if (this.mother_state.stage.phase === 'Deliberation') {
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
            let prez = this.mother_state.nations[turn].president
            let no_army = this.mother_state.nations[turn].army.length === 0
            if (prez === null || prez === 'abstain') {
                this.mother_state.subphase = 'Dividends'
                this._transition()
            }
            else if(no_army){
                this.mother_state.subphase = 'Attack'
                this._transition()
            }
            else{
                this._movement()
            }
        }

        else if (this.mother_state.stage.phase === 'Action'){
            this._transition()

        }
    }

    //computes the transition based on game state
    //always calls act on end
    _transition()
    {
        console.log(this.mother_state.stage)
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
            if (is_last(turn, TURNS)) {
                if (phase == 'Taxation'){
                    this._prayer('taxes_collected','')
                }
                else{
                    this._prayer('auctions_complete','')
                }
                this.mother_state.stage.phase = next(phase, PHASES)
            }
            this.mother_state.stage.turn = next(turn, TURNS)
        }

        else if (phase == PHASES.fromback() && subphase == SUBPHASES.fromback() 
            && turn == TURNS.fromback()) {
                this.mother_state.stage.round += 1
                this.mother_state.stage.phase = PHASES[0]
                this.mother_state.stage.turn = TURNS[0]
                this.mother_state.stage.subphase = SUBPHASES[0]
            }

        else if (phase == 'Deliberation'){
            this.mother_state.stage.phase = next(phase, PHASES)
        }

        else if (phase == 'Action'){
            console.log('action transition')
            if (subphase == SUBPHASES.fromback()) {
                this.mother_state.stage.turn = next(turn, TURNS)
            }
            this.mother_state.stage.subphase = next(subphase, SUBPHASES)
            console.log(this.mother_state.stage.subphase)
        }
        this._act()
    }

    _nation_init()
    {
        let terr2nat = {}
        for (let nation in this.mother_state.nations) {
            this.mother_state.nations[nation].cash = 0
            this.mother_state.nations[nation].owns = []
            this.mother_state.nations[nation].army = []
            this.mother_state.nations[nation].president = null
            for (let terr of utils.NATIONS[nation].territories) {
                this.mother_state.nations[nation].owns.push(terr)
                this.mother_state.nations[nation][terr] = {}
                this.mother_state.nations[nation][terr].n_factories = 0
                this.mother_state.nations[nation][terr].n_barracks = 0
                this.mother_state.nations[nation].army = []
                terr2nat[terr] = nation
            }
        }
        this.terr2nat = terr2nat
    }


    _player_cash_init()
    {
        let n_players = Object.keys(this.mother_state.players).length
        let inicash = Math.floor(TOTAL_INIT_CASH/n_players)
        for (let player in this.mother_state.players){
            console.log(inicash)
            console.log(player)
            this.mother_state.players[player].cash = inicash
        }

    }

    //deliberation routines
    _begin_deliberation()
    {
        this.mother_state.clock = TIMING.deliberation
            if (this.isRunning) this.timer.stop(false)
            this.timer.start(TIMING.deliberation,
                this._finish_deliberation.bind(this))
            this._prayer('begin_deliberation',TIMING.deliberation)
    }

    _finish_deliberation()
    {
        this._prayer('deliberation_over','')
        this._transition()
    }

    //auction routines
    _start_auction(nation)
    {
        this.mother_state.clock = 0
        this.timer.stop(false)
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        this._prayer('auction_start', nation)
    }

    _register_bid(amount, username)
    {
        this.mother_state.current_bid = amount
        this.mother_state.highest_bidder = username
        if (this.timer) this.timer.stop(false)
            this.timer.start(TIMING.bidding, this._conclude_bidding.bind(this))
        console.log('register bid called')
        this._prayer('bid_received', {'amount' : amount, 'player': username})

    }

    _conclude_bidding()
    {
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
        this.mother_state.clock = 0
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        let voters = utils.owners(this.mother_state, nation)
        for (let player in voters){
            this.mother_state.players[player].ready = (voters[player] == 0)
        }
        if (this.timer.isRunning) this.timer.stop(false)
        this.timer.start(TIMING.election, this._conclude_election.bind(this))
        this._prayer('start_election', nation)
    }

    _register_vote(username, candidate_username)
    {
        let candidate_votes = utils.candidate_votes(this.mother_state)
        //check majority
        let voters = utils.owners(this.mother_state, nation)
        this._prayer('vote_tallied', candidate_votes)
        let n_votes = 0
        for (let player in voters) {
            n_votes += voters[player]
        }
        n_votes = Math.floor(n_votes/2)+1


    }

    _conclude_election()
    {
        let nat = this.mother_state.stage.turn
        let details = {'winner' : this.mother_state.nations[nat].president}
        this._prayer('conclude_election', details)
        this._transition()  
    }

    //movement routines

    //_find

    _move_is_valid( uid, target_territory)
    {
        


    }
    _movement()
    {

    }

    //spawn routines

    _spawn_unit()
    {

    }
    
    
    
}
module.exports = Game;