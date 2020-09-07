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
        this.metadata.outcome = this.metadata.atk_roll > this.metadata.def_roll
    }
}
module.exports = Battle

