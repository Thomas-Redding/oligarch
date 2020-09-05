let utils = require('./utils.js')
let Timer = require('./timer.js')

//macro for pythonic list indexing
Array.prototype.fromback = function(i=1) {
    return this[this.length - i];
}


//global lists and macros defined here
const ROUNDS = [1,2,3,4,5,6] 
const PHASES = ['Taxation','Deliberation','Auction','Action']
const TURNS = ['North America', 'South America', 
    'Europe', 'Africa', 'Asia', 'Australia']
const SUBPHASES = [null,'Election','Move','Attack','Spawn','Build','Dividends']
const BLACKLISTED_NAMES = ['NA','SA','EU','AF','AS','AU']
const TIMING = {'deliberation' : 90*1000, 'bidding' : 10*1000}


//game class defined below

class Game
{
    endLobby(username)
    {
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
        this.prayer('game_start', {}, this.mother_state)
        this._act()
    }

    addPlayer(username, auth='admin')
    {
        console.log('addPlayer')
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
        this.mother_state.players[username].ready = true
        let all_ready = true
        for (let player of Object.values(this.mother_state.players)) {
            all_ready &= player.ready
        }

        if (all_ready){
            this.mother_state.clock = this.timer.queryTime 
            this.timer.terminateTime(true);
        }
    }

    bid(username, amount)
    {
        //console.log(username)
        //console.log(this.mother_state.players)
        //console.log(this.mother_state.players[username])
        if (this.mother_state.players[username].cash >= amount &&
            this.mother_state.current_bid < amount) {
            this._register_bid(amount, username)
        }
    }

    constructor(prayer) 
    {
        this.prayer = prayer
        this.timer = null
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

    _prayer(prayer_id, signal)
    {
        let tau = 0;
        if (this.isRunning) tau = this.timer.queryTime()
        this.mother_state.clock = tau
        this.prayer(prayer_id, signal, this.mother_state)
    }

    _nation_init()
    {
        let terr2nat = {}
        for (let nation in this.mother_state.nations) {
            this.mother_state.nations[nation].cash = 0
            this.mother_state.nations[nation].owns = []
            
            for (let terr of utils.NATIONS[nation].territories) {
                this.mother_state.nations[nation].owns.push(terr)
                this.mother_state.nations[nation][terr] = {}
                this.mother_state.nations[nation][terr].n_factories = Math.random() < 0.5 ? 1 :0 
                this.mother_state.nations[nation][terr].n_baracks = 1
                this.mother_state.nations[nation][terr].n_baracks = 1
                this.mother_state.nations[nation].army = []
                terr2nat[terr] = nation
            }
        }
        this.terr2nat = terr2nat
    }

    _register_bid(amount, username)
    {
        this.mother_state.current_bid = amount
        this.mother_state.highest_bidder = username
        if (this.timer) this.timer.terminateTime(false)
            this.timer = new Timer(TIMING.bidding, this._conclude_bidding.bind(this))
            
        this._prayer('bid_recieved', {'amount' : amount, 'player': username})

    }

    _start_election(nation)
    {
        this.mother_state.clock = 0
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        let voters = utils.owners(this.mother_state, nation)
        for (let player in voters){
            if (voters[player] == 0) this.mother_state.player.ready = true
            else this.mother_state.player.ready = false
        }
        //this._prayer('auction_start', nation)

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

    _finish_deliberation()
    {
        this._prayer('deliberation_over','')
        this._transition()
    }


    _start_auction(nation)
    {
        this.mother_state.clock = 0
        this.timer.terminateTime(false)
        this.mother_state.current_bid = -1
        this.mother_state.highest_bidder = null
        console.log(this.mother_state.clock)
        this._prayer('auction_start', nation)
    }

    _act()
    {
        if (this.mother_state.stage.phase === 'Taxation') {
            utils.income_of_nation(this.mother_state, this.mother_state.stage.turn)
            this._transition()
        }
    
        else if (this.mother_state.stage.phase === 'Deliberation') {
            this.mother_state.clock = TIMING.deliberation
            if (this.timer) this.timer.terminateTime(false)
            this.timer = new Timer(TIMING.deliberation, this._finish_deliberation.bind(this))
            this._prayer('begin_deliberation',TIMING.deliberation)

        }

        else if (this.mother_state.stage.phase === 'Auction') {
            this._start_auction(this.mother_state.stage.turn)            
        }

    }

    _transition()
    {
        function next(cur, table) {
            let next_idx = (table.indexOf(cur) + 1) % table.length
            return table[next_idx]
        }

        function is_last(cur, table){
            return table.indexOf(cur) == table.length - 1
        }

        function parse_stage(stage){
            return [stage.round, stage.phase, stage.turn, stage.subphase]
        }

        let [round, phase, turn, subphase] = parse_stage(this.mother_state.stage)

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

        else if (phase == 'Deliberation'){
            this.mother_state.stage.phase = next(phase, PHASES)
        }

        else if (phase == 'Action'){
            this.mother_state.stage.subphase = next(phase, PHASES)
        }

        this._act()
    }
}
module.exports = Game;