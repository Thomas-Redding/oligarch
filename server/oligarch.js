const WebSocket = require('ws')

var Room = require("./room.js");
var Game = require("../logic.js");

class OligarchRoom extends Room {
  constructor() {
    super()
    this.game = new Game(this.prayer.bind(this))
  }

  sendDataToAll(data) {
    let users = super.connectedUsers();
    for (let user of users) {
      super.sendData(user, JSON.stringify(data));
    }
  }

  prayer(action, details, newModel) {
    console.log('<<<', JSON.stringify([action, details, "<state clock:" + newModel.clock + ">"]));
    this.sendDataToAll([ action, details, newModel ]);
  }

  didReceiveData(username, data) {
    console.log('>>>', data)
    data = JSON.parse(data);
    if (!Array.isArray(data)) {
      data = [data];
    }
    for (let x of data) {
      if (x.method === "get_state") {
        let mother_state = this.game.fetchGameState()
        console.log('<<<', "<state clock:" + mother_state.clock + ">");
        super.sendData(username, JSON.stringify(["get_state", null, mother_state]));
      } else  {
        if (x.method.startsWith("_")) {
          console.log("WARNING: User attempted to call a private method on Game.");
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
    console.log('tryToJoin("' + username + '", "' + password + '")');
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
