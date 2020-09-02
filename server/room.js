const WebSocket = require('ws')

class Room {
  constructor() {
    this.__users = {};
  }

  /*
   * Sends a message to all websockets associated with a user.
   * @param {string} username the user to send the message to
   * @param {Any} data the data to send
   */
  sendData(username, data) {
    if (!(username in this.__users)) {
      return;
    }
    for (let socket of this.__users[username].sockets) {
      socket.send(data);
    }
  }

  /*
   * This method is called when a message is received from a user.
   * @param {string} username the user who sent the message
   * @param {String|Buffer|ArrayBuffer|Buffer[]} the data sent by the user
   */
  didReceiveData(username, data) {
    // Do nothing.
  }

  /*
   * Called by the server when a client attempts a new websocket connection.
   * When subclassing you should write your overridng method like
   *
   * tryToJoin(username, password, ws) {
   *   if (users().indexOf(username)) {
   *     return super.tryToJoin(username, password, ws);
   *   } else {
   *     // Custom logic to determine if a new user can join.
   *     if (allowJoin) {
   *       return super.tryToJoin(username, password, ws);
   *     } else {
   *       // Return some reason to deny the user.
   *       return "The game has already started."
   *     }
   *   }
   * }
   *
   * Do not retain the `ws` parameter. Do not send any messages to the new user
   * during this method's run - though you may send methods immediately after.
   * If you want to send a message to only this socket, you may use
   * `ws.send(data)` in lieu of the recommended
   * `super.sendData(username, data)`.
   *
   * @param {string} username
   * @param {string} password
   * @param {WebSocket} ws
   * @return {string} error message on failure; otherwise null
   */
  tryToJoin(username, password, ws) {
    if (!(username in this.__users)) {
      this.__users[username] = {
        "password": password,
        "sockets": [],
      }
    }
    if (this.__users[username].password != password) {
      return "Incorrect password.";
    }
    this.__users[username].sockets.push(ws);
    ws.on("close", (code, reason) => {
      for (let i in this.__users[username].sockets) {
        if (this.__users[username].sockets[i] == ws) {
          this.__users[username].sockets.splice(i, 1);
          break;
        }
      }
    });
    ws.on("message", (data) => {
      this.didReceiveData(username, data);
    })
    return null;
  }

  /*
   * @param {string} The username to kick out of the game. After this, they will
   * not be returned by `users()`, `connectedUsers()`, or `disconnectedUsers()`.
   * They will be allowed to attempt to join again.
   */
  kick(username) {
    if (!(username in this.__users)) return;
    for (let ws of this.__users[username].sockets) {
      ws.close();
    }
    delete this.__users[username];
  }

  /*
   * @return {Array} All usernames.
   */
  users() {
    let rtn = [];
    for (let username in this.__users) {
      rtn.push(username);
    }
    return rtn;
  }

  /*
   * @return {Array} All usernames who have a live websocket connection to the server.
   */
  connectedUsers() {
    let rtn = [];
    for (let username in this.__users) {
      if (this.__users[username].sockets.length > 0) {
        rtn.push(username);
      }
    }
    return rtn;
  }

  /*
   * @return {Array} All usernames who don't have a live websocket connection to the server.
   */
  disconnectedUsers() {
    let rtn = [];
    for (let username in this.__users) {
      if (this.__users[username].sockets.length == 0) {
        rtn.push(username);
      }
    }
    return rtn;
  }
}

module.exports = Room;
