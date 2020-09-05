let geography = require('./geography.js')

//macro for pythonic list indexing
Array.prototype.fromback = function(i=1) {
    return this[this.length - i];
}


//global lists and macros defined here
const ROUNDS = [1,2,3,4,5,6] 
const PHASES = ['taxation','deliberation','auction','action']
const TURNS = ['NA','SA','EU','AF','AS','AU']
const SUBPHASES = ['election','move','attack','spawn','build','dividends']
const BLACKLISTED_NAMES = []
const TIMING = {'deliberation' : 90}

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
    terminateTime() {
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
        this._act()
        this.prayer('game_start', {}, this.mother_state)
    }

    addPlayer(username, auth='admin')
    {
        console.log("addPlayer", username);
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
            for (let key in geography.nations) {
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
            this.timer.terminateTime()
        }
    }

    constructor(prayer) 
    {
        this.prayer = prayer
        this.timer = null
        this.mother_state = { }
        this.mother_state.players = { }
        this.mother_state.nations = geography.nations
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
            for (let terr in this.mother_state.nations[nation].territories) {
                this.mother_state.nations[nation].owns = terr
                terr2nat[terr] = nation
            }
        }
        this.terr2nat = this.terr2nat
    }

    _compute_income(nation)
    {
        let inc = 0
        console.log("QQQ", nation)
        console.log(this.mother_state.nations)
        for (let terr of this.mother_state.nations[nation].owns) {
            let defnat = geography.nations[this.terr2nat[terr]]
            inc += defnat.base_income_per_territory  
        }
        this.nations.cash += inc
        return inc
    }


    _finish_deliberation()
    {
        while (this.mother_state.stage.phase == 'deliberation'){
            this._transition()
        }
            
    }

    _act()
    {
        if (this.mother_state.stage.phase === 'taxation') {
            this._compute_income(this.mother_state.stage.turn)
            this._transition()
        }

        else if (this.mother_state.stage.phase === 'deliberation') {
            //function 

            //this.timer = new Timer(TIMING.deliberation, )

        }



    }

    startAuction(nation)
    {
        //this.timer = new Timer()
        this.prayer('auction_start', 'nation', this.mother_state)

    }

    //player auctions 
    rdyUp(username)
    {
        this.mother_state.players.username['ready'] = true
        
        all_ready = true
        for (let player of this.mother_state.players) {
            all_ready = all_ready && player.ready
        }

        if (all_ready){

        }
    }

    _transition()
    {
        function _transition(cur, table)
        {
            next_idx = (table.indexOf(cur) + 1) % table.length
            return [table[next_idx], cur === table.fromback()] 
        }

        for (let ord of this.mother_state.order) {

            let popup;
            this.mother_state.stage[ord], popup = _transition(
                this.mother_state.stage[ord], this.mother_state[ord])

            if (!popup) {
                break
            }
        }

        this.prayer('transition')
    }



    
}

module.exports = Game;