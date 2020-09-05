let geography = require('./geography.js')

//macro for pythonic list indexing
Array.prototype.fromback = function(i=1) {
    return this[this.length - i];
}

//global lists defined here
const rounds = [1,2,3,4,5,6] 
const phases = ['taxation','auction','action']
const turns = ['NA','SA','EU','AF','AS','AU']
const subphases = ['election','move','attack','spawn','build','dividends']
const blacklisted_names = []

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
    constructor(prayer) 
    {
        this.prayer = prayer
        this.mother_state = { }
        this.mother_state.players = { }
        this.mother_state.nations = geography.nations
        this.mother_state.blacklisted_names = turns.concat(blacklisted_names)
        this.mother_state.phase = phases
        this.mother_state.subphase = subphases
        this.mother_state.turn = turns
        this.mother_state.round = rounds
        this.mother_state.order = ['round', 'phase', 'turn', 'subphase']
        this.mother_state.time = 0
        //this.mother_state.phase = 'lobby'
        this.mother_state.stage.round = 0
        this.mother_state.stage.phase = 'lobby'
        this.mother_state.stage.turn = null
        this.mother_state.stage.subphase = null
        this._nation_init()
    }

    _nation_init()
    {
        terr2nat = {}
        for (nation of this.mother_state.nations) {
            this.mother_state.nations[nation].cash = 0
            for (terr of this.mother_state.nations[nation].territories) {
                this.mother_state.nations[nation].owns = terr
                terr2nat[terr] = nation
            }
        }
        this.terr2nat = this.terr2nat
    }

    endLobby(username)
    {
        let rtn;
        if (this.mother_state.player.username.auth !== 'admin') {
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
    }

    _compute_income(nation)
    {
        inc = 0
        for (terr of this.mother_state.nations[nation].owns) {
            defnat = geography.nations[this.terr2nat[terr]]
            inc += defnat.base_income_per_territory  
        }
        this.nations.cash += inc
        return inc
    }

    _act()
    {
        if (this.mother_state.stage.phase === 'taxation') {
            this._compute_income(this.mother_state.stage.turn)
            this._transition()
        }

        else if (this.mother_state.stage.phase === 'auction') {


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


    addPlayer(username, auth='admin')
    {
        player = {}
        rtn = true
        if (this.stage.phase !== 'lobby') {
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
            for (let key in geography.nations) {
                this.shares[key] = 0
            }        
            this.mother_state.players.username = player
        }
        return rtn
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