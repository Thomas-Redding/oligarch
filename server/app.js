const http = require('http');
const fs = require('fs');
const WebSocket = require('ws')
let log = require('../log.js');

const OligarchRoom = require("./oligarch.js");
const ChatRoom = require("./chat.js");

/********** Serving Files **********/

function sendFile(response, filePath) {
  fs.readFile(filePath, function (err, data) {
    if (err) {
      fs.readFile(filePath + "/index.html", function (err2, data) {
        if (err2) {
          sendCode(response, 404, JSON.stringify(err))
        } else {
          response.writeHead(200);
          response.end(data);
        }
      })
    } else {
      response.writeHead(200);
      response.end(data);
    }
  });
}

function sendCode(response, code, specific_message=undefined) {
  let message;
  if (code == 200) {
    message = ': Ok';
  } else if (code == 400) {
    message = ': Bad Request';
  } else if (code == 401) {
    message = ': Unauthorized';
  } else if (code == 403) {
    message = ': Forbidden';
  } else if (code == 404) {
    message = ': Not Found';
  } else if (code == 500) {
    message = ': Internal Server Error';
  } else if (code == 501) {
    message = ': Not Implemented';
  } else {
    message = '';
    console.log('Unrecognized code');
  }
  response.writeHead(code, {'Content-Type': 'text/plain'});
  if (specific_message) {
    response.end('Error ' + code + message + ' - ' + specific_message);
  } else {
    response.end('Error ' + code + message);
  }
}

// Create an instance of the http server to handle HTTP requests
let app = http.createServer((request, response) => {
  log("HTTP:", request.url)
  if (request.url.startsWith('/api/')) {
    sendCode(response, 501);
  } else if (request.url.startsWith('/room/')) {
    if (request.url.startsWith('/room/utils.js')) {
      sendFile(response, 'utils.js')
    } else if (request.url.startsWith('/room/map.js')) {
      sendFile(response, 'map.js')
    } else if (request.url.indexOf(".") > -1) {
      sendFile(response, 'frontend' + request.url)
    } else {
      let path = request.url.substr(6);
      sendFile(response, 'frontend/room/index.html')
    }
  } else {
    sendFile(response, 'frontend/room' + request.url)
  }
});

// If you want to host for a LAN party, choose the IP address assigned by your router.
// Start the server on port 3000
 app.listen(3000, '127.0.0.1');
// app.listen(3000, '10.0.0.50');
// app.listen(3000, '10.30.18.174');
// app.listen(3000, '192.168.1.172');




/********** WebSocket Logic **********/

const wss = new WebSocket.Server({ port: 3001 })

let rooms = {};
wss.on('connection', ws => {
  let listener = message => {
    ws.removeEventListener("message", listener);
    let data = JSON.parse(message.data);
    if (!(data.room in rooms)) {
      if (data.gameType == "oligarch") {
        rooms[data.room] = new OligarchRoom()
      } else {
        rooms[data.room] = new ChatRoom()
      }
    }
    let errorMessage = rooms[data.room].tryToJoin(data.username, data.password, ws);
    if (errorMessage) {
      ws.close(1000, errorMessage)
      return;
    } else {
      ws.send("");
    }
  };
  ws.addEventListener('message', listener);
})
