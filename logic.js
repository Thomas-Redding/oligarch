let geography = require('./geography.js')



const phases = ['deliberation','auction','election','actions']
const subphases = ['move','attack','spawn','build','dividends']
const blacknames = ['NA','EU','AS','SA','AF','AU']

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

class Stage
{
    constructor()
    this.round = 0
    this.phase = 'lobby'
    this.turn = 'north meri'
    this.subphase = 'buy'

}

class Player
{
    constructor(username, auth='player')
    {
        this.username = username
        this.cash = 0
        this.auth = auth  
        this.shares = {}
        for (let key in geography.nations) 
        {
            this.shares[key] = 0
        }
        
        //{ for nation in  Object.keys(nations) : 0 }
    }
}


class Game
{
    constructor(prayer) 
    {
        this.prayer = prayer
        this.mother_state = { }
        this.mother_state.players = { }
        this.mother_state.nations = nations
        this.mother_state.time = {}
        this.mother_state.phase = 'lobby'

       
    }

    addPlayer(username)
    {
        player = Player(username)
        this.mother_state.players.username = player
    }

    
}

functionTests

timer = new Timer(100,()=>{})
timer.terminateTime()