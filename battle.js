class Battle {
    constructor(atk_pts, def_pts) {
      this._atk_pts = atk_pts
      this._def_pts = def_pts
      this.metadata = {}
    }
    // return true if atk wins else false
    differential_die_battle(sides = Infinity) {
        this.metadata.sides = sides
        this.metadata.die_val  = Math.floor(Math.random()*sides) + 1
        return false
    }
    linear_die_battle(max_pts = Infinity) {
        let atk = Math.min(this._atk_pts, max_pts)
        let def = Math.min(this._def_pts, max_pts) 
        this.metadata.max_roll = max_pts
        this.metadata.atk_roll = Math.floor(Math.random()*atk) + 1
        this.metadata.def_roll = Math.floor(Math.random()*def) + 1
        let n = Math.min(atk, def)
        this.metadata.win_prob = 0.5*n*(n-1) + Math.min(def*(atk-def), 0)
        this.metadata.outcome = this.metadata.atk_roll > this.metadata.def_roll
    }
}
module.exports = Battle


let k = 0;

for (let c = 0; c < 100000; c++){

    battle = new Battle(5,3)
    battle.linear_die_battle()
    if (battle.metadata.outcome) {
        k += 1
    }
}

console.log(k)