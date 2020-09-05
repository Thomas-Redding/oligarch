const WebSocket = require('ws')

var Room = require("./room.js");

class OligarchRoom extends Room {
  constructor() {
    super()
    this.game = Game()
  }

  sendData(data) {
    super.sendData(JSON.stringify(data));
  }

  prayer(action, details, newModel) {
    sendData({
      "action": action,
      "details": details,
      "model": newModel,
    })
  }

  didReceiveData(username, data) {
    console.log('didReceiveData("' + username + '", ' + data + '")')
    data = JSON.parse(data);
    if (data.action == "state") {
      super.sendData(this.game.mother_state);
    } else if (data.action == "endLobby") {
      this.game.endLobby(username)
    }
  }

  tryToJoin(username, password, ws) {
    if (super.users().indexOf(username)) {
      return super.tryToJoin(username, password, ws);
    } else {
      let allowJoin = true;
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
