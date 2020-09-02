let q;
let network = {
  "makeWebSocket": (gameType, username, password) => {
    window.location.pathname.startsWith("/room/")
    let roomName = window.location.pathname.substr(6);
    if (roomName === "") {
      return new Promise((resolve, reject) => {
        reject("No room name provide");
      });
    }
    return new Promise((resolve, reject) => {
      let arr = window.location.host.split(":");
      arr[1] = (parseInt(arr[1])+1) + "";
      // The port address is 1 higher than the file address.
      let socket = new WebSocket("ws://" + arr.join(":"));
      q = socket;
      let foo = socket.addEventListener("open", (e) => {
        socket.removeEventListener("message", foo);
        socket.removeEventListener("message", baz);
        socket.removeEventListener("message", qux);
        socket.send(JSON.stringify({
          "gameType": gameType,
          "room": roomName,
          "username": username,
          "password": password,
        }));
      });
      let bar = socket.addEventListener("message", (e) => {
        socket.removeEventListener("message", bar);
        network.cookie.set("lorem3216", username + "@" + password);
        resolve(socket);
      });
      let baz = socket.addEventListener("error", (e) => {
        socket.removeEventListener("message", foo);
        socket.removeEventListener("message", bar);
        socket.removeEventListener("message", baz);
        socket.removeEventListener("message", qux);
        reject(e);
      });
      let qux = socket.addEventListener("close", (e) => {
        socket.removeEventListener("message", foo);
        socket.removeEventListener("message", bar);
        socket.removeEventListener("message", baz);
        socket.removeEventListener("message", qux);
        reject(e);
      });
    });
  },
  "fetchExistingUsernamePassword": () => {
    let usernamePassword = network.cookie.get("lorem3216");
    if (usernamePassword) {
      return usernamePassword.split("@");
    }
  },
  "cookie": {
    "set": (key, value) => {
      // Cookie is saved for 1 day.
      if (!key.match(/^[^=;]+$/)) throw Error("cookie.set(): key must not contain '=' or ';'.")
      if (!value.match(/^[^=;]+$/)) throw Error("cookie.set: value must not contain '=' or ';'.")
      document.cookie = key + "=" + value + "; max-age=86400; path=/";
    },
    "get": (key) => {
      if (!key.match(/^[^=;]+$/)) throw Error("cookie.get(): key must not contain '=' or ';'.")
      let cookieStr = document.cookie;
      let keyIndex = cookieStr.search(key+"=");
      if (keyIndex == -1) return undefined;
      let postKey = cookieStr.substr(keyIndex + key.length + 1);
      let semicolonIndex = postKey.search(";");
      if (semicolonIndex == -1) semicolonIndex = postKey.length;
      return postKey.substr(0, semicolonIndex);
    },
    "delete": (key) => {
      if (!key.match(/^[^=;]+$/)) throw Error("cookie.delete(): key must not contain '=' or ';'.")
      document.cookie = key + "=; max-age=0; path=/";
    }
  },
};