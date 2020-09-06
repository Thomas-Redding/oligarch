const WebSocket = require('ws')

var Room = require("./room.js");
var utils = require("../utils.js");
var Game = require("../logic.js");
let Timer = require('../timer.js')
let log = require("../log.js");

class OligarchRoom extends Room {
  constructor() {
    super()
    this.timer = new Timer()
    this.game = new Game(this.prayer.bind(this), this.timer)
  }

  sendDataToAll(data) {
    let users = super.connectedUsers();
    for (let user of users) {
      super.sendData(user, JSON.stringify(data));
    }
  }

  prayer(action, details, newModel) {
    newModel = utils.deep_copy(newModel)
    console.log('<<<', JSON.stringify([action, details, "<state clock:" + newModel.clock + ">"]));
    this.sendDataToAll([ action, details, newModel ]);
  }

  fetchGameState() {
    let rtn = this.game.fetchGameState()
    rtn.is_paused = this.timer.isPaused()
    return rtn
  }

  didReceiveData(username, data) {
    console.log('>>>', data)
    data = JSON.parse(data);
    if (!Array.isArray(data)) {
      data = [data];
    }
    for (let x of data) {
      if (x.method === "get_state") {
        let mother_state = this.fetchGameState()
        console.log('<<<', "<state clock:" + mother_state.clock + ">");
        super.sendData(username, JSON.stringify(["get_state", null, mother_state]));
      } else if (x.method == "pause") {
        if (!this.game.is_admin(username)) continue;
        this.timer.pause()
        this.sendDataToAll(["pause", null, this.fetchGameState()])
      } else if (x.method == "resume") {
        if (!this.game.is_admin(username)) continue;
        this.timer.resume()
        this.sendDataToAll(["resume", null, this.fetchGameState()])
      } else if (x.method == "is_admin") {
        let mother_state = this.fetchGameState()
        console.log('<<<', this.game.is_admin(username), "<state clock:" + mother_state.clock + ">");
        this.sendData(username, JSON.stringify(["is_admin", this.game.is_admin(username), mother_state]))
      } else  {
        if (this.timer.isPaused()) continue;
        if (x.method.startsWith("_")) {
          log("WARNING: User attempted to call a private method on Game.");
          continue;
        }
        if (x.args) {
          this.game[x.method](username, ...x.args);
        } else {
          this.game[x.method](username);
        }
      }
    }
  }

  tryToJoin(username, password, ws) {
    log('tryToJoin("' + username + '", "' + password + '")');
    if (super.users().indexOf(username) > -1) {
      return super.tryToJoin(username, password, ws);
    } else {
      let allowJoin = this.game.addPlayer(username)
      if (allowJoin) {
        return super.tryToJoin(username, password, ws);
      } else {
        // Return some reason to deny the user.
        return "The game has already started."
      }
    }
  }
}

module.exports = OligarchRoom;
