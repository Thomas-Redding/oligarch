
var lobbySettings = {
  open: () => {
    console.log("open");
    let overlayDiv = lobbySettings._make("div", {
      "id": "lobby-overlay-div",
    }, {
      "position": "fixed",
      "left": 0,
      "top": 0,
      "width": "100vw",
      "height": "100vh",
      "background-color": "rgba(0, 0, 0, 0.5)",
    });
    overlayDiv.addEventListener("click", (event) => {
      if (event.target != overlayDiv) return;
      let div = document.getElementById("lobby-overlay-div");
      div.parentElement.removeChild(div);
    });

    let modalDiv = lobbySettings._make("div", {}, {
      "position": "absolute",
      "left": "50vw",
      "top": "50vh",
      "transform": "translate(-50%, -50%)",
      "padding": "1em",
      "backgroundColor": "#222",
    });
    overlayDiv.appendChild(modalDiv);

    modalDiv.appendChild(lobbySettings._make("h1", {
      "innerHTML": "Game Settings"
    }, { "margin-bottom": "1em" }));

    let table = lobbySettings._make("table");
    let tbody = lobbySettings._make("tbody");
    table.appendChild(tbody);
    tbody.appendChild(lobbySettings._make("tr", {"innerHTML": `<td><input style="width:3.5em" type="checkbox" id="lobby-debug-checkbox" onclick="lobbySettings.didChange();"></td><td>Enable Debug Mode</td>`}));
    tbody.appendChild(lobbySettings._make("tr", {"innerHTML": `<td><input style="width:3.5em" type="number" id="lobby-deliberation-number" oninput="lobbySettings.didChange();"></td><td>Deliberation Time (sec)</td>`}));
    tbody.appendChild(lobbySettings._make("tr", {"innerHTML": `<td><input style="width:3.5em" type="number" id="lobby-bidding-number" oninput="lobbySettings.didChange();"></td><td>Bidding Time (sec)</td>`}));
    tbody.appendChild(lobbySettings._make("tr", {"innerHTML": `<td><input style="width:3.5em" type="number" id="lobby-election-number" oninput="lobbySettings.didChange();"></td><td>Election Time (sec)</td>`}));
    tbody.appendChild(lobbySettings._make("tr", {"innerHTML": `<td><input style="width:3.5em" type="number" id="lobby-actions-number" oninput="lobbySettings.didChange();"></td><td>Actions Time (sec)</td>`}));
    modalDiv.appendChild(table);

    document.body.appendChild(overlayDiv);

    gSocket.addEventListener("message", (event) => {
      if (event.data.length == 0) return;
      let [action, details, state] = JSON.parse(event.data);
      lobbySettings._update(state.settings);
    });
    lobbySettings._update(gLatestState.settings);
  },
  didChange: () => {
    console.log("didChange");
    if (document.getElementById("lobby-debug-checkbox") == undefined) return; // The modal isn't up.
    let newSettings = {};
    newSettings.debug = document.getElementById("lobby-debug-checkbox").checked;
    newSettings.deliberationTime = 1000 * document.getElementById("lobby-deliberation-number").value;
    newSettings.biddingTime = 1000 * document.getElementById("lobby-bidding-number").value;
    newSettings.electionTime = 1000 * document.getElementById("lobby-election-number").value;
    newSettings.actionsTime = 1000 * document.getElementById("lobby-actions-number").value;
    gSocket.send(JSON.stringify({
      "method": "setSettings",
      "args": [newSettings]
    }));
  },
  _update: (newSettings) => {
    console.log("_update", newSettings);
    document.getElementById("lobby-debug-checkbox").checked = newSettings.debug;
    document.getElementById("lobby-deliberation-number").value = newSettings.deliberationTime / 1000;
    document.getElementById("lobby-bidding-number").value = newSettings.biddingTime / 1000;
    document.getElementById("lobby-election-number").value = newSettings.electionTime / 1000;
    document.getElementById("lobby-actions-number").value = newSettings.actionsTime / 1000;
  },
  _make: (tagName, attributes, styles) => {
    console.log("_make");
    let rtn = document.createElement(tagName);
    for (let key in attributes) {
      if (key == "innerHTML") {
        rtn.innerHTML = attributes["innerHTML"];
      } else {
        rtn.setAttribute(key, attributes[key]);
      }
    }
    for (let key in styles) {
      rtn.style[key] = styles[key];
    }
    return rtn;
  }
};
