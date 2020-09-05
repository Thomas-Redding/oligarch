const WebSocket = require('ws')

var Room = require("./room.js");
var Game = require("../logic.js");

class OligarchRoom extends Room {
  constructor() {
    super()
    this.game = new Game(this.prayer.bind(this))
  }

  sendDataToAll(data) {
    console.log("sendDataToAll", JSON.stringify(data))
    let users = super.connectedUsers();
    for (let user of users) {
      super.sendData(user, JSON.stringify(data));
    }
  }

  prayer(action, details, newModel) {
    this.sendDataToAll([ action, details, newModel ]);
  }

  didReceiveData(username, data) {
    console.log('didReceiveData("' + username + '", ' + data + '")')
    data = JSON.parse(data);
    if (data.action == "state") {
      this.sendDataToAll(this.game.mother_state);
    } else if (data.action == "endLobby") {
      this.game.endLobby(username)
      this.game.startGame()
    }
  }

  tryToJoin(username, password, ws) {
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
