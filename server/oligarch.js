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
    let s = data == null ? "" : JSON.stringify(data);
    for (let user of users) {
      super.sendData(user, s);
    }
  }

  // If `doubleTap` is true, we send a dummy message after a delay.
  // See https://github.com/Thomas-Redding/oligarch/issues/153 for details.
  prayer(action, details, doubleTap=false) {
    let newModel = this.fetchGameState();
    console.log('<<<', JSON.stringify([action, details, "<state clock:" + newModel.clock + ">"]));
    this.sendDataToAll([ action, details, newModel ]);
    if (doubleTap) {
      setTimeout(() => {
        this.sendDataToAll(null);
      }, 1000);
    }
  }

  fetchGameState() {
    let rtn = this.game.fetchGameState();
    rtn.is_paused = this.timer.isPaused();
    for (let user of super.connectedUsers()) {
      if (user in rtn.players) {
        rtn.players[user].connected = true;
      }
    }
    for (let user of super.disconnectedUsers()) {
      if (user in rtn.players) {
        rtn.players[user].connected = false;
      }
    }
    return rtn
  }

  _isSpectator(username) {
    let gameState = this.game.fetchGameState();
    log(username, Object.keys(gameState.players))
    return !(username in gameState.players);
  }

  didReceiveData(username, data) {
    data = JSON.parse(data);
    console.log('>>>', username, data)
    if (!Array.isArray(data)) {
      data = [data];
    }
    for (let x of data) {
      if (x.method === "get_state") {
        let mother_state = this.fetchGameState()
        console.log('<<<', "<state clock:" + mother_state.clock + ">");
        super.sendData(username, JSON.stringify(["get_state", null, mother_state]));
        continue;
      }
      if (this._isSpectator(username)) continue;
      if (x.method == "pause") {
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
    log(username, password)
    if (super.users().indexOf(username) > -1) {
      return super.tryToJoin(username, password, ws);
    } else {
      console.log('username', username);
      let denyReason = this.game.addPlayer(username);
      console.log('denyReason', denyReason);
      if (denyReason) {
        return denyReason;
      } else {
        return super.tryToJoin(username, password, ws);
      }
    }
  }

  userConnected(username) {
    log(username);
    super.userConnected(username);
    this._sendUserConnectionUpdate(username);
  }

  userDisconnected(username) {
    log(username);
    super.userDisconnected(username);
    this._sendUserConnectionUpdate(username);
  }

  _sendUserConnectionUpdate(username) {
    log(username)
    let users = {}
    for (let user of super.connectedUsers()) {
      users[user] = true;
    }
    for (let user of super.disconnectedUsers()) {
      users[user] = false;
    }
    let model = this.fetchGameState();
    console.log('<<<', JSON.stringify(["connection_change", username, "<state clock:" + model.clock + ">"]));
    this.sendDataToAll(["connection_change", username, model])
  }
}

module.exports = OligarchRoom;
