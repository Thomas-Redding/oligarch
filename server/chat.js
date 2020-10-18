const WebSocket = require('ws')

var Room = require("./room.js");

class ChatRoom extends Room {
  constructor() {
    super();
    this.__messages = [];
  }

  didReceiveData(username, data) {
    let x = {
      "username": username,
      "message": data
    };
    this.__messages.push(x);
    let users = super.connectedUsers();
    for (let username of users) {
      super.sendData(username, JSON.stringify(x));
    }
  }

  tryToJoin(username, password, ws) {
    if (super.users().indexOf(username)) {
      return super.tryToJoin(username, password, ws);
    } else {
      let allowJoin = true;
      if (allowJoin) {
        setTimeout(() => {
          if (super.connectedUsers().indexOf(username) > -1) {
            ws.send(JSON.stringify(this.__messages));
          }
        }, 0);
        return super.tryToJoin(username, password, ws);
      } else {
        // Return some reason to deny the user.
        return "The game has already started."
      }
    }
  }
}

module.exports = ChatRoom;
