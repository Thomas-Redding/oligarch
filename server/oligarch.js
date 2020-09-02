const WebSocket = require('ws')

var Room = require("./room.js");

class OligarchRoom extends Room {
  didReceiveData(username, data) {
    console.log('didReceiveData("' + username + '", ' + data + '")')
    if (data == "ping") {
      super.sendData(username, "pong");
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
