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
    console.log('<<<', JSON.stringify([action, details, "<state>"]));
    this.sendDataToAll([ action, details, newModel ]);
  }

  didReceiveData(username, data) {
    console.log('>>>', data)
    data = JSON.parse(data);
    if (!Array.isArray(data)) {
      data = [data];
    }
    for (let x of data) {
      if (x.action == "state") {
        console.log('<<<', "<state>");
        this.sendDataToAll(["state", null, this.game.mother_state]);
      } else if (x.action == "forward") {
        if (x.method == "_") {
          console.log("WARNING: User attempted to call a private method on Game.");
          continue;
        }
        if (x.args) {
          this.game[x.method](username, ...x.args);
        } else {
          this.game[x.method](username);
        }
      } else {
        throw Error("Unrecognized `action` type.")
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
