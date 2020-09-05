let GEOGRAPHY = require('./geography.js')
let utils = require('./utils.js')

//macro for pythonic list indexing
Array.prototype.fromback = function(i=1) {
    return this[this.length - i];
}


//global lists and macros defined here
const ROUNDS = [1,2,3,4,5,6] 
const PHASES = ['taxation','deliberation','auction','action']
const TURNS = ['North America', 'South America', 
    'Europe', 'Africa', 'Asia', 'Australia']
const SUBPHASES = [null, 'election','move','attack','spawn','build','dividends']
const BLACKLISTED_NAMES = ['NA','SA','EU','AF','AS','AU']
const TIMING = {'deliberation' : 90*1000}

//game logic classes below
class Timer
{
    
    constructor(time, callback) {
        this._callback = callback;
        this._startTime = new Date().getTime();
        this._t = time;
        this._id = setTimeout(this._callback, time);
    }
    queryTime() {
        let timeElapsed = new Date().getTime() - this._startTime;
        return this._t - timeElapsed;
    }
    extendTime(newTime) {
        this._startTime = new Date().getTime();
        this._t = newTime;
        clearTimeout(this._id);
        this._id = setTimeout(this._callback, time);
    }
    terminateTime(do_callback) {
        if (do_callback) {
            this._callback()
        }
        clearTimeout(this._id);
    }
}

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

    startGame()
    {
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
            player.curbid = 0
            player.vote = null
            player.ready = false
            for (let key in GEOGRAPHY.nations) {
                player.shares[key] = 0
            }        
            this.mother_state.players[username] = player
        }
        return rtn
    }

    rdyUp(username)
    {
        this.mother_state.players[username]['ready'] = true
        
        all_ready = true
        for (let player of this.mother_state.players) {
            all_ready = all_ready && player.ready
        }

        if (all_ready){
            this.mother_state.clock = this.timer.queryTime 
            this.timer.terminateTime(do_callback)
        }
    }

    constructor(prayer) 
    {
        this.prayer = prayer
        this.timer = null
        this.mother_state = { }
        this.mother_state.players = { }
        this.mother_state.nations = GEOGRAPHY.nations
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
        this._nation_init()
    }

    _nation_init()
    {
        let terr2nat = {}
        for (let nation in this.mother_state.nations) {
            this.mother_state.nations[nation].cash = 0
            this.mother_state.nations[nation].owns = []
            
            for (let terr of GEOGRAPHY.nations[nation].territories) {
                this.mother_state.nations[nation].owns.push(terr)
                this.mother_state.nations[nation][terr].n_factories = Math.random() < 0.5 ? 1 :0 

                this.mother_state.nations[nation][terr].n_baracks = 1

                terr2nat[terr] = nation
            }
        }
        this.terr2nat = terr2nat
    }

    _compute_income(nation)
    {
        let inc = 0
        for (let terr of this.mother_state.nations[nation].owns) {
            let defnat = GEOGRAPHY.nations[this.terr2nat[terr]]
            inc += defnat.base_income_per_territory  
        }
        this.mother_state.nations[nation].cash += inc
        return inc
    }


    _finish_deliberation()
    {
        this.prayer('deliberation_over','',this.mother_state)
        this._transition()
    }

    _act()
    {
        if (this.mother_state.stage.phase === 'taxation') {
                this._compute_income(this.mother_state.stage.turn)
                this._transition()
        }
    
        else if (this.mother_state.stage.phase === 'deliberation') {
            this.prayer('begin_deliberation','',this.mother_state)
            this.timer = new Timer(TIMING.deliberation, this._finish_deliberation.bind(this))

        }

        else if (this.mother_state.stage.phase === 'action') {
            
        }

    }

    startAuction(nation)
    {
        //this.timer = new Timer()
        this.prayer('auction_start', 'nation', this.mother_state)

    }

    //player auctions 
    rdyUp(username)


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

        if (['taxation','auction'].includes(phase)){
            if (is_last(turn, TURNS)) {
                if (phase == 'taxation'){
                    this.prayer('taxes_collected','',this.mother_state)
                }
                else{
                    this.prayer('auctions_complete','',this.mother_state)
                }
                this.mother_state.stage.phase = next(phase, PHASES)
            }
            this.mother_state.stage.turn = next(turn, TURNS)
        }

        else if (phase == 'deliberation'){
            this.mother_state.stage.phase = next(phase, PHASES)
        }

        //else if (this.mother_state.stage.phase )

        this._act()
    }
}
module.exports = Game;