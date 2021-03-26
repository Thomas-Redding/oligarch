function toast(html, duration=2000) {
  if (!("queue" in toast)) {
    toast.queue = [];
    toast.lastToastTime = 0;
    setInterval(() => {
      if (new Date().getTime() < toast.timeToDismiss) return;
      let toastDivs = document.getElementsByClassName("toast");
      for (let toastDiv of toastDivs) {
        toastDiv.parentElement.removeChild(toastDiv);
      }
      if (toast.queue.length == 0) return;
      let [html, duration] = toast.queue[0];
      toast.queue = toast.queue.slice(1);
      let rtn = document.createElement("div");
      rtn.classList.add("toast")
      rtn.innerHTML = html;
      rtn.addEventListener("click", () => {
        // If a user clicks on a toast, clear the toast queue.
        toast.queue = [];
        rtn.parentElement.removeChild(rtn);
      })
      document.body.insertBefore(rtn, pauseDiv);
      toast.timeToDismiss = new Date().getTime() + duration;
    }, 100);
  }
  toast.queue.push([html, duration]);
}

function moneyString(num) {
  return gLatestState.settings.moneyPrefix + num + gLatestState.settings.moneyPostfix;
}

class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toString() {
    return '(' + this.x + ', ' + this.y + ')';
  }
  plus(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }
  plusEquals(v) {
    this.x += v.x;
    this.y += v.y;
  }
  scale_(s) {
    this.x *= s;
    this.y *= s;
  }
}

function bid(val, button) {
  if (button.classList.contains('disabled-button')) {
    return;
  }
  gLatestState
  if (gLatestState.players[gUsername].cash < val) return;
  send({
    "method": "bid",
    "args": [val]
  });
  close_modal();
}

function svg_text(text, x, y, attrs={}) {
  if (!("style" in attrs)) {
    attrs["style"] = "";
    attrs["style"] += "; font-family: myfont";
    attrs["style"] += "; font-size: 16px";
  }
  return svg.text(text, x, y, attrs);
}

function create_label(text, x, y) {
  return svg_text(txt, x, y, {
    'style': 'font-style:normal;font-weight:normal;fill:black;fill-opacity:1;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1',
    'pointerEvents': 'none',
    'text-anchor': 'middle',
    'font-family': 'myfont',
  });
}

function create_circle(x, y, r) {
  let rtn = svg.circle(x, y, r);
  rtn.classList.add("piece-circle");
  return rtn;
}

function argmax(A) {
  let r = 0;
  for (let i = 1; i < A.length; ++i) {
    if (A[i] > A[r]) {
      r = i;
    }
  }
  return r;
}

function render_table(state, table, isEndOfGame) {
  if (!table) {
    table = mainTable;
  }
  let tbody = table.children[0];
  tbody.innerHTML = `
    <tr>
      <td></td>
      <td class="column-NA">NA</td>
      <td class="column-SA">SA</td>
      <td class="column-EU">EU</td>
      <td class="column-AF">AF</td>
      <td class="column-AS">AS</td>
      <td class="column-AU">AU</td>
      <td>Cash</td>
      <td>Worth</td>
    </tr>
  `;

  let playernames = Object.keys(state.players);
  playernames.sort();
  for (let name of playernames) {
    let player = state.players[name];

    let tr = document.createElement("TR");
    if (name === gUsername) {
      tr.style.backgroundColor = '#444';
    }
    // We pretend everyone is connected for now.
    if (isEndOfGame) {
      tr.innerHTML += `<td>` + player.username + " </td>";
    } else {
      // tr.innerHTML += `<td><svg width=16 height=16><circle cx=8 cy=8 r=8 style="fill:` + color + `;"></svg> ` + player.username + " </td>";
      let opacity = state.players[name].connected * 0.5 + 0.5;
      tr.innerHTML += `<td style="opacity:` + opacity + `">` + player.username + " </td>";
    }
    tr.innerHTML += '<td class="column-NA">' + player.shares["North America"] + "</td>";
    tr.innerHTML += '<td class="column-SA">' + player.shares["South America"] + "</td>";
    tr.innerHTML += '<td class="column-EU">' + player.shares["Europe"] + "</td>";
    tr.innerHTML += '<td class="column-AF">' + player.shares["Africa"] + "</td>";
    tr.innerHTML += '<td class="column-AS">' + player.shares["Asia"] + "</td>";
    tr.innerHTML += '<td class="column-AU">' + player.shares["Australia"] + "</td>";
    tr.innerHTML += "<td>" + moneyString(Math.floor(player.cash)) + "</td>";
    tr.innerHTML += "<td>" + Math.round(utils.score_of_player(state, player.username)) + "</td>";

    tbody.appendChild(tr);
  }

  const players = Object.values(gLatestState.players);
  function all_shares_out(nation_name) {
    let r = 0;
    for (let player of players) {
      r += player.shares[nation_name];
    }
    return r;
  }

  // sum row
  if (!isEndOfGame) {
    let tr;

    tr = document.createElement("TR");
    tr.style.borderTop = 'solid white 1px';
    tr.innerHTML += "<td>TOTAL</td>";
    tr.innerHTML += '<td class="column-NA">' + all_shares_out("North America") + "</td>";
    tr.innerHTML += '<td class="column-SA">' + all_shares_out("South America") + "</td>";
    tr.innerHTML += '<td class="column-EU">' + all_shares_out("Europe") + "</td>";
    tr.innerHTML += '<td class="column-AF">' + all_shares_out("Africa") + "</td>";
    tr.innerHTML += '<td class="column-AS">' + all_shares_out("Asia") + "</td>";
    tr.innerHTML += '<td class="column-AU">' + all_shares_out("Australia") + "</td>";
    tr.innerHTML += "<td>" + Math.round(utils.sum(players.map(x => x.cash))) + "</td>";
    tr.innerHTML += "<td></td>";
    tbody.appendChild(tr);
  }

  render_map(state);
}

function render_nation_rects(state) {
  let shares = utils.num_shares_already_auctioned_for_nation(state);
  nationRects.innerHTML = "";
  for (let name in nations) {
    let nation = state.nations[name];
    let coords = nations[name].rect;

    nation.income = utils.income_of_nation(state, name);

    let rect = svg.rect(coords.x, coords.y, 115, 48);
    rect.classList.add("nationRect");
    nationRects.appendChild(rect);

    let cashText = svg_text("Cash: " + moneyString(nation.cash), coords.x + 4, coords.y + 14);
    nationRects.appendChild(cashText);

    let incomeText = svg_text("Income: " + moneyString(nation.income), coords.x + 4, coords.y + 28);
    nationRects.appendChild(incomeText);

    let sharesText = svg_text(shares[name] + "/" + utils.total_shares(state, name) + " shares", coords.x + 4, coords.y + 42);
    nationRects.appendChild(sharesText);
  }
}

let moveState = null;

function ocean_clicked() {
  change_move_state(null);
}

function unit_clicked(territory_name, unit_type, nation_name, is_grey) {
  if (gLatestState.stage.phase !== "Action") {
    change_move_state(null);
    return;
  }
  const subphase = gLatestState.stage.subphase;
  if (subphase === "Move") {
    if (is_grey) {
      change_move_state(null);
      return;
    }
    if (!moveState) {
      change_move_state({
        "from": territory_name,
        "Infantry": 0,
        "Cavalry": 0,
        "Artillery": 0
      });
    } else if (territory_name !== moveState.from) {
      // Pretend we clicked the territory
      document.getElementById(territory_name).dispatchEvent(new MouseEvent("click", {
        "view": window,
        "bubbles": true,
        "cancelable": false
      }));
      return;
    }
    if (territory_name !== moveState.from) {
      return;
    }

    let army = gLatestState.nations[nation_name].army;
    army = army.filter(x => x.territory === territory_name);
    army = army.filter(x => x.type === unit_type);
    army = army.filter(x => x.can_move);
    let n = army.length;

    if (unit_type in moveState) {
      {
        let c = utils.deep_copy(moveState);
        c[unit_type] = (moveState[unit_type] + 1) % (n + 1);
        change_move_state(c);
      }
    } else {
      {
        let c = utils.deep_copy(moveState);
        c[unit_type] = 1;
        change_move_state(c);
      }
    }
  } else if (subphase === "Attack") {
    let army = gLatestState.nations[nation_name].army;
    army = army.filter(x => x.territory === territory_name);
    army = army.filter(x => x.type === unit_type);
    if (nation_name === gLatestState.stage.turn) {
      army = army.filter(x => x.can_attack);
    }
    if (!moveState) {
      change_move_state({
        "territory": territory_name,
      });
    }
    {
      let c = utils.deep_copy(moveState);
      c[nation_name] = army[0];
      change_move_state(c);
    }
    if (Object.keys(moveState).length === 3) {
      if (!(gLatestState.stage.turn in moveState)) {
        change_move_state(null);
        return;
      }
      let other_key = Object.keys(moveState);
      other_key.splice(other_key.indexOf(gLatestState.stage.turn), 1);
      other_key.splice(other_key.indexOf("territory"), 1);
      send({
        "method": "attack",
        "args": [
          moveState[gLatestState.stage.turn].id,
          moveState[other_key].id
        ]
      })
      change_move_state(null);
    }
  }

}

function make_sword(x, y, sw, sh) {
  x += 6.5;
  y += 6.5;
  let path = svg.path({
    "d": "M 26 0 L 20 2 L 7.59375 15.59375 L 9.3125 16.6875 L 10.40625 18.40625 L 24 6 L 26 0 z M 3.90625 14.09375 L 2.59375 15.40625 L 5.3125 18.125 L 2.09375 22.21875 C 2.0298776 22.212263 1.9718338 22.1875 1.90625 22.1875 C 0.85690896 22.1875 0 23.044409 0 24.09375 C -2.9605947e-16 25.143091 0.85690896 26 1.90625 26 C 2.955591 26 3.8125 25.143091 3.8125 24.09375 C 3.8125 24.028166 3.7877366 23.970122 3.78125 23.90625 L 7.875 20.6875 L 10.59375 23.40625 L 11.90625 22.09375 L 8.59375 17.40625 L 3.90625 14.09375 z",
    "transform": "translate(" + x + " " +  y + ") scale(" + sw / 28 + " " + sh / 28 + ")"
  });
  path.style.fill = 'black';
  return path;
}

function make_bow(x, y, sw, sh) {
  x += 4.5;
  y += 4.5;
  let transform = "translate(" + x + " " +  y + ") scale(" + sw / 800 + " " + sh / 800 + ")";
  let fill = "black";
  let path1 = svg.path({
    "d": "M235.8,425.1L458,123.2c0.5,0.1,1.1,0.3,1.6,0.4c9.7,2.4,20.1,5.5,30.8,9.1c21.6,7.3,44.9,17.2,68.4,30.7c23.5,13.5,47.1,30.4,69.2,51c22.1,20.5,42.7,44.6,60.3,71.8c17.6,27.1,32.3,57.1,42.9,88.9c7.7,22.9,13.2,46.8,16.5,71h102c-4.3-36.1-13.2-71.6-26.4-104.9c-15.8-40-37.6-76.7-63.4-108.1c-25.8-31.4-55.5-57.6-86.3-77.8c-30.8-20.3-62.7-34.5-93-43.6c-30.3-9.1-58.9-13.1-84-13.9c-12.5-0.4-24.2,0-34.9,0.8c-2.7,0.2-5.3,0.4-7.8,0.7c-2.6,0.3-5,0.6-7.5,0.9c-2.4,0.3-4.8,0.6-7.1,1l-47.3-28.4l12.1,26L163.8,425.1H235.8z",
    "transform": transform
  });
  path1.style.fill = fill;

  let poly1 = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  poly1.setAttribute("points", "888.7,422.9 888.7,479.8 182.3,479.8 163.2,453.9 10,454 62.4,500.8 990,500.1");
  poly1.setAttribute("transform", transform);
  poly1.style.fill = fill;

  let path2 = svg.path({
    "d": "M235.8,574.9L458,876.8c0.5-0.1,1.1-0.3,1.6-0.4c9.7-2.4,20.1-5.5,30.8-9.1c21.6-7.3,44.9-17.2,68.4-30.7c23.5-13.5,47.1-30.4,69.2-51c22.1-20.5,42.7-44.6,60.3-71.8c17.6-27.1,32.3-57.1,42.9-88.9c7.7-22.9,13.2-46.8,16.5-71h102c-4.3,36.1-13.2,71.6-26.4,104.9c-15.8,40-37.6,76.7-63.4,108.1c-25.8,31.4-55.5,57.6-86.3,77.8c-30.8,20.3-62.7,34.5-93,43.6c-30.3,9.1-58.9,13.1-84,13.9c-12.5,0.4-24.2,0-34.9-0.8c-2.7-0.2-5.3-0.4-7.8-0.7c-2.6-0.3-5-0.6-7.5-0.9c-2.4-0.3-4.8-0.6-7.1-1l-47.3,28.4l12.1-26L163.8,574.9H235.8z",
    "transform": transform
  });
  path2.style.fill = fill;



  let poly2 = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  poly2.setAttribute("points", "888.7,577.1 888.7,520.2 182.3,520.2 163.2,546.1 10,546 62.4,499.2 990,499.9 ");
  poly2.setAttribute("transform", transform);
  poly2.style.fill = fill;

  let g = svg.g();
  g.appendChild(path1);
  g.appendChild(poly1);
  g.appendChild(path2);
  g.appendChild(poly2);

  return g;
}

function make_horse(x, y, sw, sh) {
  x += 3;
  y += 2.5;

  let path = svg.path({
    "d": "M36,18l2.4,6.1c-5.1,6.1-9.7,11.3-14.8,17.5c-2.1,2.5,3.1,9,6.3,8.7c5-2.1,10.9-4.5,16.2-7.3c2.4,9.5-17,11.6-19.5,22.6h37.9c-1.6-9.2,11.8-13.9,7.3-28.3C66.9,21.3,50.8,19.5,36,18z M23.7,68.8V78h44.1v-9.2H23.7z",
    "transform": "translate(" + x + " " +  y + ") scale(" + sw / 64 + " " + sh / 64 + ")"
  });
  path.style.fill = 'black';
  return path;
}

function make_factory(x, y, sw, sh) {
  let paths = [
    svg.path({"d": "m25.178 195.613-25.178 314.72h147.796l-33.57-314.72z"}),
    svg.path({"d": "m31.178 120.613-3.6 45h83.448l-4.8-45z"}),
    svg.path({"d": "m470.156 210.613-80.337 97.121v-97.121h-41.044l-84.685 101.797v-101.797h-41.087l-68.178 82.762 10.372 97.238h46.029v30h-42.829l9.6 90h333.229v-300zm-168.93 210h-60v-30h60zm90 0h-60v-30h60zm90 0h-60v-30h60z"}),
    svg.path({"d": "m133.196 90.613 10.099 94.679c15.558-1.388 30.38-7.317 42.579-16.962 13.696 7.981 29.403 12.283 45.351 12.283 24.818 0 48.319-10.251 65.181-27.959 10.783 5.236 22.605 7.959 34.819 7.959 17.581 0 34.645-5.858 48.486-16.39 11.564 7.41 25.024 11.39 39.014 11.39 39.977 0 72.5-32.523 72.5-72.5s-32.523-72.5-72.5-72.5c-12.471 0-24.67 3.229-35.428 9.258-14.39-12.363-32.752-19.258-52.072-19.258-17.536 0-34.544 5.82-48.36 16.291-15.044-10.581-32.949-16.291-51.64-16.291-25.879 0-50.145 11.03-67.101 ;30.027-8.891-3.31-18.349-5.027-27.899-5.027-38.984 0-71.526 28.036-78.569 65z"})
  ];
  let g = svg.g();
  for (let path of paths) {
    path.style.fill = 'black';
    g.appendChild(path);
  }
  g.setAttribute("transform", "translate(" + x + " " +  y + ") scale(" + sw / 900 + " " + sh / 900 + ")");
  return g;
}

function change_move_state(newState) {
  let oldState = moveState;
  moveState = newState;
  render_move_state(oldState, newState);
}

function render_move_state(oldState, moveState) {
  // Hide oldState's stack numbers.
  if (oldState) {
    let territory_name = ('territory' in oldState ? oldState.territory : oldState.from);
    for (let unit_type of ["Infantry", "Artillery", "Cavalry"]) {
      let cid = ["stackcircle", territory_name, gLatestState.stage.turn, unit_type, "1"].join("_")
      let tid = ["stacktext", territory_name, gLatestState.stage.turn, unit_type, "1"].join("_")
      let circ = document.getElementById(cid);
      let text = document.getElementById(tid);
      if (circ) {
        circ.style.display = "none";
        text.style.display = "none";
      }
    }
  }

  if (moveState === null) {
    highlightTerritories([]);
    moveStateDiv.style.display = "none";
    return;
  }
  if (kDebugMode) {
    moveStateDiv.style.display = "block";
    moveStateDiv.innerHTML = JSON.stringify(moveState, null, 2);
  }

  // circ.id = territory_name + "_" + nation_name + "_" + unit_type + "_" + can_action
  if (gLatestState.stage.subphase === "Move") {
    for (let unit_type of ["Infantry", "Cavalry", "Artillery"]) {
      let cid = ["stackcircle", moveState.from, gLatestState.stage.turn, unit_type, "1"].join("_")
      let tid = ["stacktext", moveState.from, gLatestState.stage.turn, unit_type, "1"].join("_")
      let circ = document.getElementById(cid);
      let text = document.getElementById(tid);
      if (!circ) {
        continue;
      }
      if (moveState[unit_type] > 0) {
        text.innerHTML = moveState[unit_type];
        circ.style.display = "block";
        text.style.display = "block";
      } else {
        circ.style.display = "none";
        text.style.display = "none";
      }
    }

    let nation_name = gLatestState.stage.turn;
    if (moveState["Infantry"] + moveState["Artillery"] + moveState["Cavalry"] > 0) {
      // Cause territories you can move to to glow.
      let includesNonCavalary = false;
      if ("Infantry" in moveState && moveState["Infantry"] > 0) {
        includesNonCavalary = true
      }
      if ("Artillery" in moveState && moveState["Artillery"] > 0) {
        includesNonCavalary = true
      }
      let territoryNames = utils.valid_moves_for_troop(gLatestState, nation_name, moveState.from, includesNonCavalary ? "Infantry" : "Cavalry");
      highlightTerritories(Object.keys(territoryNames));
    } else {
      highlightTerritories([]);
    }
  } else {
    for (let nation_name in moveState) {
      if (typeof(moveState[nation_name]) === "string") {
        continue;
      }
      let unit = moveState[nation_name];
      let can_action = (gLatestState.stage.subphase === "Move" ? unit.can_move : unit.can_attack) * 1;
      let cid = ["stackcircle", unit.territory, nation_name, unit.type, 1].join("_");
      let tid = ["stacktext", unit.territory, nation_name, unit.type, 1].join("_");
      let circ = document.getElementById(cid);
      let text = document.getElementById(tid);
      if (!circ) {
        continue;
      }
      text.innerHTML = '1';
      circ.style.display = "block";
      text.style.display = "block";
    }
  }
}

function structure_clicked(territory_name, structure_type) {
  console.log('structure_clicked', moveState);
  if (!moveState) {
    document.getElementById(territory_name).dispatchEvent(new MouseEvent("click", {
      "view": window,
      "bubbles": true,
      "cancelable": false
    }));
    return;
  }
  console.log(gLatestState.stage);
  if (gLatestState.stage.phase !== "Action") {
    return;
  }
  if (gLatestState.stage.subphase !== "Attack") {
    return;
  }
  send({
    "method": "raze",
    "args": [
      moveState[gLatestState.stage.turn].id,
      structure_type,
      territory_name
    ]
  })
}

function factory_clicked(territory_name) {
  structure_clicked(territory_name, "factory");
}

function barrack_clicked(territory_name) {
  structure_clicked(territory_name, "barrack");
}

// TODO(mredding): make this more efficient.
function refresh_map_highlighting(state) {
  render_map(state);
}

function render_map(state) {
  render_nation_rects(state);

  let out = svg.g();

  const unittype2icon = {
    "Infantry": "sword.svg",
    "Cavalry": "knight.svg",
    "Artillery": "bow.svg",
  }

  Array.from(territoryLayer.getElementsByTagName('path')).forEach(path => {
    let territory_name = path.id;
    let territory = state.nations[utils.terr2continentName[territory_name]][territory_name];

    {
      let [x, y] = territories[territory_name].center;
      let circle = svg.circle(x, y, 16);
      circle.style.fill = 'none';
      circle.style.stroke = '#fff4';
      circle.style.cursor = 'pointer';
      circle.addEventListener('click', () => {
        document.getElementById(territory_name).dispatchEvent(new MouseEvent("click", {
          "view": window,
          "bubbles": true,
          "cancelable": false
        }));
      });
      circle.addEventListener('mouseover', () => {
        document.getElementById(territory_name).dispatchEvent(new MouseEvent("mouseover", {
          "view": window,
          "bubbles": true,
          "cancelable": false
        }));
      });
      circle.addEventListener('mouseleave', () => {
        document.getElementById(territory_name).dispatchEvent(new MouseEvent("mouseleave", {
          "view": window,
          "bubbles": true,
          "cancelable": false
        }));
      });
      out.appendChild(circle);
    }

    let icon_drawers = [];

    for (let nation_name in state.nations) {
      let army = utils.army_in_territory(gLatestState, nation_name, territory_name, (["Move", "Attack"].includes(state.stage.subphase) ? state.stage.subphase : "Move"), "join");
      for (let unit_type in army) {
        for (let can_action = 0; can_action < 2; ++can_action) {
          let n = army[unit_type][can_action];
          if (n > 0) {
            icon_drawers.push((x, y) => {
              let onclick = (e) => {
                unit_clicked(territory_name, unit_type, nation_name, !can_action);
              }

              let background = svg.circle(x, y, s * 0.35);
              background.style.fill = nations[nation_name].color.hex();
              background.style.stroke = "black";
              background.style.cursor = "pointer";
              background.addEventListener("click", onclick);
              out.appendChild(background);

              // let src = "./assets/" + unittype2icon[unit_type];
              // let img = svg.image(src, x - s/2, y - s/2, {width:s, height:s, "xlink:href":src});
              let img;
              if (unit_type === "Infantry") {
                img = make_sword(x - s/2, y - s/2, s/2, s/2);
              } else if (unit_type === "Cavalry") {
                img = make_horse(x - s/2, y - s/2, s/2, s/2);
              } else {
                img = make_bow(x - s/2, y - s/2, s/2, s/2);
              }
              img.style.cursor = 'pointer';
              img.addEventListener("click", onclick);
              out.appendChild(img);

              // This adds the (often invisible) circle indicating how many units from a stack have been
              // selected.
              {
                const idSuffix = territory_name + "_" + nation_name + "_" + unit_type + "_" + can_action;
                let circ = svg.circle(x - 5, y - 6.5, s * 0.23);
                circ.style.fill = '#ff0';
                circ.style.display = 'none';
                circ.addEventListener("click", onclick);
                circ.id = "stackcircle_" + idSuffix;
                out.appendChild(circ);

                let text = svg_text(n, x - 8, y - 3, {
                  "style": "font-size: 0.7em; text-align:center;"
                });
                text.addEventListener("click", onclick);
                text.id = "stacktext_" + idSuffix;
                text.style.fill = 'black';
                text.style.display = 'none';
                text.style.textShadow = "6px 6px 20px black";
                out.appendChild(text);
              }

              // We use this grayed-out circle to prevent user clicks when an action is not available.
              if (gLatestState.stage.phase === "Action") {
                if ((!can_action && ["Attack", "Move"].includes(gLatestState.stage.subphase) || (nation_name !== gLatestState.stage.turn))) {
                  let circ = svg.circle(x, y, s * 0.35);
                  circ.style.fill = '#0008';
                  circ.addEventListener("click", onclick);
                  out.appendChild(circ);
                }
              }

              if (n > 1) {
                let circ = svg.circle(x + 5, y - 6.5, s * 0.23);
                circ.addEventListener('click', onclick);
                circ.style.fill = 'red';
                out.appendChild(circ);

                let text = svg_text(n, x + 2, y - 3, {
                  "style": "font-size: 0.7em; text-align:center;"
                });
                text.addEventListener('click', onclick);
                text.style.fill = 'white';
                text.style.textShadow = "6px 6px 20px black";
                out.appendChild(text);
              }
            });
          }
        }
      }
    }

    if (territory.n_factories > 0) {
      icon_drawers.push((x, y) => {
        // let img = make_factory(x - s/2, y - s/2, s, s);
        let img = svg.image("./assets/factory.png", x - s/2, y - s/2, {width:s*0.8, height:s*0.8});
        img.addEventListener("click", () => {
          factory_clicked(territory_name);
        });
        out.appendChild(img);

        if (territory.n_factories > 1) {
          let text = svg_text(territory.n_factories, x - 5, y + 6);
          text.style.fill = 'white';
          text.style.textShadow = "6px 6px 20px black";
          text.addEventListener("click", () => {
            factory_clicked(territory_name);
          });
          out.appendChild(text);
        }
      });
    }

    if (territory.n_barracks > 0) {
      icon_drawers.push((x, y) => {
        let img = svg.image("./assets/castle.png", x - s/2, y - s/2, {width:s*0.8, height:s*0.8});
        img.addEventListener("click", () => {
          barrack_clicked(territory_name);
        });
        out.appendChild(img);

        if (territory.n_barracks > 1) {
          let text = svg_text(territory.n_barracks, x - 5, y + 6);
          text.addEventListener("click", () => {
            barrack_clicked(territory_name);
          })
          text.style.fill = 'white';
          text.style.textShadow = "6px 6px 20px black";
          out.appendChild(text);
        }
      });
    }

    const r = 16;
    const s = 24;
    const tau = Math.PI * 2;
    for (let t = 0; t < icon_drawers.length; ++t) {
      let angle = tau * t / icon_drawers.length - Math.PI / 2;
      let [x, y] = territories[territory_name].center;
      x += Math.cos(angle) * r * 1.3;
      y += Math.sin(angle) * r * 1.3;
      icon_drawers[t](x, y);
    }

    if (utils.CAPITALS.includes(territory_name)) {
      let [x, y] = territories[territory_name].center;
      let star = svg.image("assets/whitestar.png", x - 10, y - 10, {
        width: 20,
        height: 20
      });
      star.addEventListener('click', () => {
        document.getElementById(territory_name).dispatchEvent(new MouseEvent("click", {
          "view": window,
          "bubbles": true,
          "cancelable": false
        }));
      });
      star.addEventListener('mouseover', () => {
        document.getElementById(territory_name).dispatchEvent(new MouseEvent("mouseover", {
          "view": window,
          "bubbles": true,
          "cancelable": false
        }));
      });
      star.addEventListener('mouseleave', () => {
        document.getElementById(territory_name).dispatchEvent(new MouseEvent("mouseleave", {
          "view": window,
          "bubbles": true,
          "cancelable": false
        }));
      });
      star.style.cursor = 'pointer';
      star.style.fill = 'white';
      out.appendChild(star);
    }
  });

  riskMap.appendChild(out);
  riskMap.removeChild(document.getElementById("unitIcons"));
  out.id = "unitIcons";
}

function add_player(details, state) {
  render_table(state);
}

let theme = {
  "_validThemes": ["light", "dark"],
  "_callbacks": [],
  "set": (newTheme) => {
    if (theme._validThemes.indexOf(newTheme) == -1) {
      newTheme = "dark";
    }
    network.cookie.set("theme", newTheme);
    let themeStyleSheets = document.getElementsByClassName("theme");
    for (let themeStyleSheet of themeStyleSheets) {
      if (themeStyleSheet.id == "stylesheet-" + newTheme) {
        themeStyleSheet.disabled = false;
      } else {
        themeStyleSheet.disabled = true;
      }
    }
    for (let i = 0; i < theme["_callbacks"].length; ++i) {
      theme._callbacks[i](newTheme);
    }
  },
  "get": () => {
    let newTheme = network.cookie.get("theme");
    if (!newTheme) {
      theme.set("dark");
      newTheme = "dark";
    }
    return newTheme;
  },
  "subscribe": (callback) => {
    theme["_callbacks"].push(callback);
  }
}
theme.set(theme.get());

function spawn(state, territory, unit_type) {
  send({
    "method": "spawn",
    "args": [territory, unit_type]
  });
}


function build(state, territory, building_type) {
  let nationName = state.stage.turn;
  if (state.nations[nationName].president !== gUsername) {
    return;
  }
  if (utils.territory_to_owner(gLatestState, territory) !== nationName) {
    return;
  }
  send({
    "method": "build",
    "args": [territory, building_type]
  })
}

window.addEventListener("DOMContentLoaded", () => {
  let path = "/room/lobby/0.jpg";
  let lobbyDiv = document.getElementById("lobbyDiv");
  lobbyDiv.style.background = "linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ), url('" + path + "')";
  lobbyDiv.style.backgroundSize = "cover"
  lobbyDiv.style.backgroundPosition = "center center";
})

let mainCounter = 0;
function main(state) {
  mainCounter += 1;
  if (mainCounter > 1) {
    // alert("eeek!!!");
    // throw Error("eeek!!!");
    return;
  }
  riskMap.addEventListener('click', (e) => {
    let pt = riskMap.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    let loc = pt.matrixTransform(riskMap.getScreenCTM().inverse());
    // console.log(Math.round(loc.x), Math.round(loc.y));
  });

  maybe_show_trade_proposal(state);

  Array.from(territoryLayer.getElementsByTagName('path')).forEach(path => {
    let territory = path.id;
    let nation = utils.terr2continentName[territory];
    let nationColor = nations[nation].color;
    let randColor = Color.random().scale(0.15);
    let color = nationColor.scale(0.85).plus(randColor);

    path.style = '';
    path.style.fill = color.hex();
    path.style.stroke = 'black';

    let onclick = (e) => {
      if (true) {
        // Print out coordinates.
        let pt = riskMap.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        let loc = pt.matrixTransform(riskMap.getScreenCTM().inverse());
        console.log('"' + territory + '": { "center": [' + [Math.round(loc.x), Math.round(loc.y)] + '] },');
      }

      if (gLatestState.stage.phase === "Action") {
        if (gLatestState.stage.subphase === "Build") {
          if (factoryRadio.checked) {
            build(gLatestState, territory, "factory");
          } else if (barracksRadio.checked) {
            build(gLatestState, territory, "barracks");
          }
        } else if (gLatestState.stage.subphase === "Spawn") {
          if (soldierRadio.checked) {
            spawn(gLatestState, territory, "Infantry");
          } else if (artilleryRadio.checked) {
            spawn(gLatestState, territory, "Artillery");
          } else if (calvaryRadio.checked) {
            spawn(gLatestState, territory, "Cavalry");
          }
        } else if (gLatestState.stage.subphase === "Move") {
          if (moveState) {
            let nation_name = gLatestState.stage.turn;
            let validIds = {
              "Infantry": [],
              "Cavalry": [],
              "Artillery": []
            };
            for (let unit of gLatestState.nations[nation_name].army) {
              if (unit.can_move && unit.territory === moveState.from) {
                validIds[unit.type].push(unit.id)
              }
            }

            let unitIds = [];
            for (let type of ["Infantry", "Cavalry", "Artillery"]) {
              console.log(type, validIds, moveState);
              if (validIds[type].length < moveState[type]) {
                alert("Invalid Move (1)");
                change_move_state(null);
                return;
              }
              for (let i = 0; i < moveState[type]; ++i) {
                unitIds.push(validIds[type][i]);
              }
            }


            let legalMoves = utils.valid_moves_for_troop(
              gLatestState,
              gLatestState.stage.turn,
              moveState.from,
              moveState["Cavalry"] === unitIds.length ? "Cavalry" : "Infantry");

            if (territory in legalMoves) {
              send({
                "method": "move",
                "args": [unitIds, moveState.from, territory]
              })
            } else {
              alert("Invalid Move (2)");
            }

            change_move_state(null);
          }
        }
      }
    }
    path.onclick = onclick;
    // path.addEventListener('click', onclick);

    let onmouseover = (e) => {
      path.style.fill = color.plus(new Color(255, 255, 255)).scale(0.5).hex();
    }
    path.addEventListener("mouseover", onmouseover);

    let onmouseleave = (e) => {
      path.style.fill = color.hex();
    };
    path.addEventListener("mouseleave", onmouseleave);

    if (false) {
      let [x, y] = territories[territory].center;
      circ = create_circle(x, y, 20);
      circ.style.fill = 'none';
      circ.style.stroke = 'white';
      riskMap.appendChild(circ);
    }
  });

  render_presidential_div(gLatestState);

  window.onresize();
};

const kTabMap = 'kTabMap';
const kTabInfo = 'kTabInfo';
const kTabLog = 'kTabLog';
const kTabLobby = 'kTabLobby';

let stage = {
  round: 0,
  phase: "Auction",
  turn: "North America",
  subphase: null,
};

let tab = kTabLobby;

const kIsBoard = false;

window.onresize = () => {
  const bodyRect = document.body.getBoundingClientRect();

  mapButton.classList.remove("tab-on");
  infoButton.classList.remove("tab-on");
  logButton.classList.remove("tab-on");
  mapButton.classList.remove("tab-off");
  infoButton.classList.remove("tab-off");
  logButton.classList.remove("tab-off");
  if (tab === kTabMap) {
    mapButton.classList.add("tab-on");
  } else {
    mapButton.classList.add("tab-off");
  }
  if (tab === kTabInfo) {
    infoButton.classList.add("tab-on");
  } else {
    infoButton.classList.add("tab-off");
  }
  if (tab === kTabLog) {
    logButton.classList.add("tab-on");
  } else {
    logButton.classList.add("tab-off");
  }

  let emSize = parseFloat(getComputedStyle(document.body).fontSize);
  if (bodyRect.width > 70*emSize) {
    // Desktop
    statusBarDiv.style.fontSize = '1.5em';
    contentDiv.style.display = 'flex';
    contentDiv.style.flexDirection = 'row';
    leftPanel.style.display = 'block';
    leftPanel.style.width = '30em';
    mainTable.style.display = 'table';
    actionPanel.style.display = 'block';
    mapDiv.style.display = 'block';
    mapDiv.style.flex = 1;
    gameLogContainer.style.display = 'block';
    gameLogContainer.style.maxWidth = '20em';
    bottomNavBarDiv.style.display = 'none';
    currentVotesDiv.style.display = "block";

    mainTable.style.fontSize = '1.3em';
  } else {
    // Mobile
    statusBarDiv.style.fontSize = '1em';
    contentDiv.style.display = 'block';

    leftPanel.style.display = (tab == kTabMap ? "none" : "block");
    leftPanel.style.width = '100%';
    mapDiv.style.display = (tab === kTabMap ? "block" : "none");
    mapDiv.style.flex = 0;
    mapDiv.style.maxWidth = "100%";
    mapDiv.style.maxHeight = "100%";
    gameLogContainer.style.display = (tab === kTabLog ? "block" : "none");
    gameLogContainer.style.maxWidth = 'none';
    actionPanel.style.display = (tab === kTabInfo ? "block" : "none");
    mainTable.style.display = (tab === kTabInfo ? "table" : "none");
    bottomNavBarDiv.style.display = 'flex';
    currentVotesDiv.style.display = (tab === kTabInfo ? "block" : "none");

    mainTable.style.fontSize = '1em';
  }

  lobbyDiv.style.display = (tab === kTabLobby ? "block" : "none");

  if (kIsBoard) {
    actionPanel.style.display = "none";
  }

  if (statusBarDiv.getBoundingClientRect().width / parseInt(getComputedStyle(statusBarDiv).fontSize) > 48) {
    statusBarDiv.style.display = "flex";
    statusBarDiv.style.flexDirection = "row";
  } else {
    statusBarDiv.style.display = "block";
  }

  // When the page first loads we set body opacity to 0 so the user
  // doesn't see a weird UI flash before window.onresize is called.
  // Setting opacity to 1 here makes it visible.
  document.body.style.opacity = 1;
}

let gUsername;
function login() {
  let username = "";
  let password = "";
  let arr = network.fetchExistingUsernamePassword();
  if (arr) {
    username = arr[0];
    password = arr[1];
  } else {
    while (username.length == 0 || username.length > 9) {
      username = prompt("username?");
    }
    while (password.length == 0) {
      password = prompt("password?");
    }
  }
  gUsername = username;
  // return network.makeWebSocket("chat", username, password);
  return network.makeWebSocket("oligarch", username, password);
}

function render_status_bar(state) {
  const turn2label = {
    "North America": "America",
    "South America": "Banana Republic",
    "Europe":        "Reichland",
    "Africa":        "Afrika",
    "Asia":          "The Orient",
    "Australia":     "The Downunder",
  };

  statusBarRoundDiv.innerHTML = "Round " + state.stage.round;
  if (state.stage.phase === "Action") {
    statusBarPhaseDiv.innerHTML = state.stage.subphase;
  } else {
    statusBarPhaseDiv.innerHTML = state.stage.phase;
  }
  statusBarNationDiv.innerHTML = turn2label[state.stage.turn];
  if (state.stage.phase === "action") {
    statusBarSubphaseDiv.previousElementSibling.style.display = "block";
    statusBarSubphaseDiv.innerHTML = state.stage.subphase;
  } else {
    statusBarSubphaseDiv.previousElementSibling.style.display = "none";
    statusBarSubphaseDiv.innerHTML = "";
  }
}

let gAreAdmin = undefined;
function areAdminFetched(areAdmin) {
  gAreAdmin = areAdmin;
  let pauseIcon = document.getElementById("pause-icon");
  let lobbySettingButton = document.getElementById("lobby-setting-button");
  if (gAreAdmin) {
    pauseIcon.classList.add("clickable-svg");
    pauseIcon.classList.remove("unclickable-svg");
    resumeButton.classList.add("clickable-svg");
    resumeButton.classList.remove("unclickable-svg");
    lobbySettingButton.classList.add("clickable-svg");
    lobbySettingButton.classList.remove("unclickable-svg");
    pauseIcon.onclick = () => {
      send({"method": "pause" });
    };
    document.getElementById("save-icon").classList.add("clickable-svg");
    document.getElementById("save-icon").addEventListener("click", () => {
      let save_name = prompt("Enter a save name");
      if (save_name == null) return;
      send({
        "method": "loadFromDisk",
        "args": [save_name],
      })
    });
    document.getElementById("start-game-button").classList.remove("invisible-button")
    document.getElementById("undo-button").classList.remove("invisible-button")
  } else {
    pauseIcon.classList.remove("clickable-svg");
    pauseIcon.classList.add("unclickable-svg");
    resumeButton.classList.remove("clickable-svg");
    resumeButton.classList.add("unclickable-svg");
    lobbySettingButton.classList.add("unclickable-svg");
    lobbySettingButton.classList.remove("clickable-svg");
    pauseIcon.onclick = () => {};
    document.getElementById("save-icon").style.display = "none";
    document.getElementById("start-game-button").classList.add("invisible-button")
    document.getElementById("undo-button").classList.add("invisible-button")
  }
}

function htmlFromLog(action, details, isToast) {
  // console.log(action, details);
  if (action == "get_state") {
    return undefined;
  } else if (action == "is_admin") {
    return undefined;
  } else if (action == "player_added") {
    if (isToast) return undefined;
    else return "<b>" + details + "</b> joined";
  } else if (action == "end_lobby") {
    if (isToast) return undefined;
    else return "Exited Lobby";
  } else if (action == "game_start") {
    if (isToast) return undefined;
    else return "Game started";
  } else if (action == "taxes_collected") {
    return undefined;
  } else if (action == "begin_deliberation") {
    return "Began deliberation"
  } else if (action == "user_ready") {
    return undefined;
  } else if (action == "deliberation_over") {
    if (isToast) return undefined;
    else return "Ended deliberation";
  } else if (action == "auction_start") {
    return "Auction began for " + details;
  } else if (action == "bid_received") {
    return undefined;
  } else if (action == "conclude_bidding") {
    return "<b>" + details.winner + "</b> bought a share of " + details.nation + " for " + moneyString(details.price);
  } else if (action == "auctions_complete") {
    return "Auctions concluded.";
  } else if (action == "start_election") {
    return "Election began in " + details;
  } else if (action == "vote_tallied") {
    let candidate = Object.keys(details)[0];
    return "Someone voted for <b>" + candidate + "</b>";
  } else if (action == "conclude_election") {
    if (details.winner) {
      return "<b>" + details.winner + "</b> won the election";
    } else {
      return "Election concluded with no winner";
    }
  } else if (action == "begin_presidential_command") {
    if (details.president) {
      return "The reign of <b>" + details.president + "</b> began in " + details.nation + "."
    } else {
      return undefined;
    }
  } else if (action == "begin_move") {
    if (isToast) return undefined
    else return "Troop movement began";
  } else if (action == "begin_attack") {
    if (isToast) return undefined
    else return "Troop attacks began";
  } else if (action == "begin_spawn") {
    if (isToast) return undefined
    else return "Troop recruitment began"
  } else if (action == "begin_build") {
    if (isToast) return undefined
    else return "Construction began";
  } else if (action == "begin_dividends") {
    if (isToast) return undefined
    else return "Dividend deliberations began";
  } else if (action == "dividends_paid") {
    return moneyString(details) + " paid in dividends";
  } else if (action == "end_presidential_command") {
    return "The reign has ended.";
  } else if (action == "bribe") {
    return "<b>" + details.player + "</b> bribed " + details.nation + " with " + moneyString(details.amount);
  } else if (action == "player_added") {
    if (isToast) return undefined;
    else return "<b>" + details + "</b> joined";
  } else if (action == "trade_proposed") {
    if (isToast) return undefined;
    else return "<b>" + details.from + "</b> proposed a trade to <b>" + details.to + "</b>";
  } else if (action == "trade_accepted") {
    if (isToast) return undefined;
    else return "Trade accepted";
  } else if (action == "trade_rejected") {
    if (isToast) return undefined;
    else return "Trade rejected";
  } else {
    if (isToast) return undefined;
    else return action + "@" + details;
  }
}

function possiblyToast(actions, details) {
  let s = htmlFromLog(actions, details, true);
  if (s === undefined) return;
  toast(s);
}

function rewriteActivityLogFromScratch() {
  let html = "";
  let logs = gLatestState.logs;
  if (logs === undefined) logs = [];
  for (let i = logs.length - 1; i >= 0; --i) {
    let log = logs[i];
    let s = htmlFromLog(log[0], log[1], false);
    if (s === undefined) continue;
    html += "<li>" + s + "</li>";
  }
  gameLogDiv.innerHTML = html;
  let rects = gameLogDiv.getClientRects();
  if (rects.length > 0) {
    gameLogContainer.scrollTop = 0;
  }
}

function updateLobbyUsernames() {
  let html = "";
  for (let username in gLatestState.players) {
    html += username + "<br>";
  }
  document.getElementById("lobby-usernames").innerHTML = html;
}

function render_vote_table(state) {
  let html = `
  <table>
    <tbody>
      <tr>
        <td colspan=3>Votes (` + utils.NATIONS[gLatestState.stage.turn].total_shares + ` total)</td>
      </tr>
  `;
  let votesFor = utils.candidate_votes(state);
  if (Object.keys(votesFor).length === 0) {
    currentVotesDiv.innerHTML = "";
    return;
  }
  console.log(votesFor);
  for (let player_name in votesFor) {
    html += "<tr><td>" + player_name + "</td><td> : </td><td>" + votesFor[player_name] + " votes</td></tr>";
  }
  html += "</table></tbody>";
  currentVotesDiv.innerHTML = html;
}

function updateCurrentActionDivFromState(state) {
  let updateDiv = (message) => {
    if (message) {
      currentActionDiv.style.opacity = 1;
      currentActionDiv.children[0].innerHTML = message;
    } else {
      currentActionDiv.style.opacity = 0;
      currentActionDiv.children[0].innerHTML = "";
    }
  };
  // updateDiv("Auction for " + details + " has opened");
  // updateDiv(null);j
  // updateDiv(state.stage.turn + " to <b>" + state.highest_bidder + '</b> for ' + moneyString(state.current_bid));
  if (state.stage.phase == "lobby") {
    updateDiv(null);
  } else if (state.stage.phase == "Taxation") {
    updateDiv("Taxation");
  } else if (state.stage.phase == "Discuss") {
    let num_ready = utils.sum(Object.values(gLatestState.players).map(x => x.ready));
    updateDiv("Discuss (" + num_ready + "/" + Object.keys(gLatestState.players).length + " want to skip)");
  } else if (state.stage.phase == "Auction") {
    let n = gLatestState.supershares[gLatestState.stage.round - 1];
    let adviceString = "";
    if (gLatestState.settings.showSharePriceAdvice) {
      let advisedPrice = Math.round(utils.advised_share_price(gLatestState, state.stage.turn, n));
      adviceString += "<br/><br/> <i>( Assuming no future human actions are taken, the expected future cash flow of this share is " + moneyString(advisedPrice) + " )</i>";
    }
    if (state.highest_bidder == null) {
      updateDiv("Bidding for <u>" + n + " share" + (n > 1 ? "s" : "") + "</u> is open for " + state.stage.turn + ". Every bid will extend the countdown." + adviceString);
    } else {
      updateDiv("<b>" + state.highest_bidder + "</b> bid $" + state.current_bid + "B for " + state.stage.turn + adviceString);
    }
  } else if (state.stage.phase == "Action") {
    if (state.stage.subphase == "Election") {
      // TODO: Determine whether you've already voted.
      if (state.players[gUsername].shares[state.stage.turn] == 0) {
        updateDiv("Wait for the shareholders of " + state.stage.turn + " to elect a president");
      } else if (state.players[gUsername].vote === null) {
        updateDiv("Cast your vote for the president of " + state.stage.turn);
      } else {
        updateDiv("You have voted for the president of " + state.stage.turn + ". Wait for other shareholders to cast their votes.");
      }
    } else if (gUsername != state.nations[state.stage.turn].president) {
      let president = state.nations[state.stage.turn].president;
      updateDiv("<b>" + president + "</b> is the president of " + state.stage.turn + ". Wait for them to finish acting.");
    } else {
      updateDiv("You are the president of " + state.stage.turn + ". Bend the nation to your will.");
    }
  } else {
    throw Error("Unrecognized state.stage.phase: " + state.stage.phase);
  }
}

let gSocket
let gLatestState;
let loadPromises = [
  new Promise((resolve, reject) => {

    login().then((socket) => {
      console.log("CONNECTED");
      gSocket = socket;
      gSocket.addEventListener("close", (event) => {
        window.location.reload();
      });
      gSocket.addEventListener("message", (event) => {
        if (event.data.length == 0) return;
        let [action, details, state] = JSON.parse(event.data);
        gLatestState = state;
        console.log("========================");
        console.log("Received action:", action);
        console.log("Received details:", details);
        console.log("Received state:", state);
        console.log("========================");

        if (["get_state", "pause", "resume"].includes(action)) {
          pauseDiv.style.display = (state.is_paused ? "flex" : "none");
        }

        if (gLatestState.settings.showYourCashInStatusBar) {
          statusBarYourCash.innerHTML = moneyString(Math.floor(state.players[gUsername].cash));
        }


        if (action === "get_state" || action === "undo") {
          // We assume get_state is only called when the user
          // reloads the page.
          if (state.stage.phase === "lobby") {
            tab = kTabLobby;
          } else {
            tab = kTabInfo;
          }
          if (action === "get_state") {
            main(state);
          } else {
            render_presidential_div(gLatestState);
            window.onresize();
          }
          render_table(state);
          gClock.set_time_remaining(state.clock);
          if (gLatestState.is_paused) {
            gClock.pause();
          }
          updateLobbyUsernames();
        }
        else if (action === "game_over") {
          render_table(gLatestState, endOfGameTable, true);
          let best = -Infinity;
          let winner = null;
          for (let player_name in gLatestState.players) {
            let score = utils.end_score_of_player(gLatestState, player_name)
            if (score > best) {
              best = score;
              winner = player_name;
            }
          }
          winnerDiv.innerHTML = winner + ' wins!';
          endOfGameContainer.style.display = 'block';
        }
        else if (action === "begin_spawn") {
          refresh_map_highlighting(state);
        }
        else if (action === "undo") {
        }
        else if (action === "user_ready") {
        }
        else if (action == "player_added") {
          updateLobbyUsernames();
        }
        else if (action === "refresh") {
          // Called when an undo is performed.
          window.location.reload(true);
        }
        else if (action === "built_infrastructure") {
          render_table(state);
        }
        else if (action === "spawned_unit") {
          render_table(state);
        }
        else if (action === "trade_proposed") {
          maybe_show_trade_proposal(state);
        }
        else if (action === "trade_accepted") {
          tradeSnackbarContainer.style.display = "none";
          render_table(state);
        }
        else if (action === "battle_outcome") {
          render_map(state);
          render_table(state);
        }
        else if (action === "is_admin") {
          areAdminFetched(details);
        }
        else if (action === "pause") {
          gClock.pause();
        }
        else if (action === "resume") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "end_lobby") {
          // Equivalent to game_start
        }
        else if (action === "game_start") {
          tab = kTabInfo;
          window.onresize();
        }
        else if (action === "buy_share") {
          render_table(state);
        }
        else if (action === "taxes_collected") {
          render_table(state);
        }
        else if (action === "bribe") {
          render_table(state);
        }
        else if (action === "begin_deliberation") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "deliberation_over") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "auction_start") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "start_election") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "vote_tallied") {
          render_map(state);
          render_vote_table(state);
        }
        else if (action === "begin_presidential_command") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "begin_build") {
          factoryRadio.checked = true;
        }
        else if (action === "begin_move") {
          render_map(state);
          change_move_state(null);
        }
        else if (action === "begin_attack") {
          render_map(state);
          change_move_state(null);
        }
        else if (action === "built_infrastructure") {
          render_table(state);
        }
        else if (action === "bldg_razed") {
          render_map(state);
          render_table(state);
        }
        else if (action === "dividends_paid") {
          render_table(state);
        }
        else if (action === "conclude_bidding") {
          render_table(state);
          render_nation_rects(state);
        }
        else if (action === "moves_made") {
          render_map(state);
          render_table(state);
        }
        else if (action === "players_busy") {
          // TODO: this message should look different depending on
          // whether the recipient is busy or you are busy.
          if (gUsername === action.from) {
            alert("Trade rejected (either your or that player have an ongoing trade)")
          }
        }
        else if (action === "trade_rejected") {
          tradeSnackbarContainer.style.display = "none";
        }
        else if (action === "bid_received") {
          gClock.set_time_remaining(state.clock);
          if (details.player === gUsername) {
            if (state.players[gUsername].cash > state.current_bid) {
              bid1Button.classList.remove("disabled-button");
            } else {
              bid1Button.classList.add("disabled-button");
            }
            if (state.players[gUsername].cash > state.current_bid + 5) {
              bid5Button.classList.remove("disabled-button");
            } else {
              bid5Button.classList.add("disabled-button");
            }
            if (state.players[gUsername].cash > state.current_bid + 25) {
              bid25Button.classList.remove("disabled-button");
            } else {
              bid25Button.classList.add("disabled-button");
            }
          } else {
            bid1Button.classList.add("disabled-button");
            bid5Button.classList.add("disabled-button");
            bid25Button.classList.add("disabled-button");
            setTimeout(() => {
              if (state.players[gUsername].cash > state.current_bid) {
                bid1Button.classList.remove("disabled-button");
              }
              if (state.players[gUsername].cash > state.current_bid + 5) {
                bid5Button.classList.remove("disabled-button");
              }
              if (state.players[gUsername].cash > state.current_bid + 25) {
                bid25Button.classList.remove("disabled-button");
              }
            }, kBidDisableTime * 1000);
          }
        } else if (action == "connection_change") {
          render_table(state);
        }

        if (state.stage.phase === "Action") {
          render_vote_table(state);
        }

        possiblyToast(action, details);
        rewriteActivityLogFromScratch()
        onstagechange(state);
        updateCurrentActionDivFromState(state);
      });
      gSocket.addEventListener("close", () => {
        console.log("CLOSED");
      });
      resolve();
    }, (error) => {
      console.log("ERROR:", error);
      reject();
    });
  }),
  new Promise((resolve, reject) => {
    window.addEventListener('load', () => {
      resolve();
    })
  }),
];

Promise.all(loadPromises).then(() => {
  send([
    {"method": "get_state"},
    {"method": "is_admin"},
  ]);
}, (error) => {
  alert("Error occurred while connecting...");
});

function count(A) {
  let R = {};
  for (let a of A) {
    if (a in R) {
      R[a] += 1;
    } else {
      R[a] = 1;
    }
  }
  return R;
}

function get_current_modal_type() {
  if (popupDiv.style.display === "none") {
    return null;
  }
  return popupTitle.innerHTML;
}

function update_buttons(state) {
  const stage = state.stage;

  if (stage.phase === "Auction") {
    bid1Button.style.display = "inline-block";
    bid5Button.style.display = "inline-block";
    bid25Button.style.display = "inline-block";
  } else {
    bid1Button.style.display = "none";
    bid5Button.style.display = "none";
    bid25Button.style.display = "none";
  }

  if (stage.phase === "Discuss") {
    endDeliberationButton.style.display = "inline-block";
  } else {
    endDeliberationButton.style.display = "none";
  }

  update_trade_button(state);
  if (state.players[gUsername].ready) {
    endDeliberationButton.classList.add("disabled-button");
  } else {
    endDeliberationButton.classList.remove("disabled-button");
  }

  bribeButton.style.display = (stage.phase === "Action" ? "inline-block" : "none");

  if (stage.phase === "Action" && stage.subphase == "Election") {
    voteButton.style.display = "inline-block";
  } else {
    voteButton.style.display = "none";
  }
  if (utils.can_vote(state, gUsername)) {
    voteButton.classList.remove("disabled-button");
  } else {
    voteButton.classList.add("disabled-button");
  }
}

function onstagechange(state) {
  update_buttons(state);
  render_status_bar(state);

  const myCash = state.players[gUsername].cash;

  bribeInput.max = myCash;
  bribeInput.value = Math.min(parseInt(bribeInput.value), myCash);

  render_presidential_div(state);
}

function render_presidential_div(state) {
  if (state.stage.phase === "Action") {
    const subphase = state.stage.subphase;
    const nation = state.nations[state.stage.turn];

    movingDiv.style.display = (subphase === "Move" ? "block" : "none");
    attackingDiv.style.display = (subphase === "Attack" ? "block" : "none");
    spwaningDiv.style.display = (subphase === "Spawn" ? "block" : "none")
    buildingDiv.style.display = (subphase === "Build" ? "block" : "none");
    dividendsDiv.style.display = (subphase === "Dividends" ? "block" : "none");
    presidentialHeader.innerHTML = state.stage.turn + " (" + moneyString(nation.cash) + ")";

    const num_shares = utils.num_shares_already_auctioned_for_nation(state)[state.stage.turn];
    dividendSlider.step = num_shares;
    dividendSlider.max = nation.cash;
    dividendSlider.value = (nation.cash / num_shares | 0) * num_shares;
    dividendValueDiv.innerHTML = dividendSlider.value;

    if (state.nations[state.stage.turn].president === gUsername) {
      presidentDiv.style.display = "block";
    } else {
      presidentDiv.style.display = "none";
    }
  } else {
    presidentDiv.style.display = "none";
  }
}

function increment_bid_input(delta) {
  let newBid = parseInt(bidInput.value) + delta;
  newBid = Math.max(newBid, 0);
  newBid = Math.min(newBid, gLatestState.players[gUsername].cash);
  bidInput.value = newBid;
}

function increment_bribe_input(delta) {
  let newBribe = parseInt(bribeInput.value) + delta;
  newBribe = Math.max(newBribe, 0);
  newBribe = Math.min(newBribe, gLatestState.players[gUsername].cash);
  bribeInput.value = newBribe;
}

function vote_for(playername) {
  send({
    "method": "vote",
    "args": [playername],
  })
}

function vote_button_clicked() {
  console.log(utils.can_vote(gLatestState, gUsername));
  if (utils.can_vote(gLatestState, gUsername)) {
    show_modal('Vote');
  }
}

function show_modal(type) {
  // Update divs that need a button per player
  tradePlayerButtonsContainer.innerHTML = "";
  votePlayerButtonsContainer.innerHTML = "";
  for (let playername of Object.keys(gLatestState.players)) {
    if (playername !== gUsername) {
      let button = document.createElement('DIV');
      button.classList.add("button");
      button.innerHTML = playername;
      button.addEventListener('click', (e) => {
        trade_with(playername);
      })
      tradePlayerButtonsContainer.appendChild(button);
    }
    {
      let button = document.createElement('DIV');
      button.classList.add("button");
      button.innerHTML = playername;
      button.addEventListener('click', (e) => {
        close_modal();
        vote_for(playername);
      })
      votePlayerButtonsContainer.appendChild(button);
    }
  }

  {
    let button = document.createElement('DIV');
    button.classList.add("button");
    button.innerHTML = "abstain";
    button.addEventListener('click', (e) => {
      close_modal();
      vote_for("abstain");
    })
    votePlayerButtonsContainer.appendChild(button);
  }

  tradePopup2Div.style.display = "none";
  tradePopupDiv.style.display = (type === "Trade" ? "block" : "none");
  votePopupDiv.style.display = (type === "Vote" ? "block" : "none");
  bribePopupDiv.style.display = (type === "Bribe" ? "block" : "none");

  popupDiv.children[0].onclick = close_modal;
  popupDiv.style.display = 'block';
}

function close_modal() {
  popupDiv.style.display = 'none';
}

function end_moving() {
  send({
    "method": "done",
    "args": []
  })
}
function end_attacking() {
  send({
    "method": "done",
    "args": []
  })
}
function end_recruiting() {
  send({
    "method": "done",
    "args": []
  })
}

function end_deliberation() {
  if (gLatestState.players[gUsername].ready) return;
  send({
    "action": "forward",
    "method": "rdyUp",
    "args": [],
  });
}

function send(obj) {
  console.log("SEND", obj)
  gSocket.send(JSON.stringify(obj));
}

function start_game() {
  if (gAreAdmin) {
    send([
    {
      "action": "forward",
      "method": "endLobby",
    }, {
      "action": "forward",
      "method": "startGame",
    }]);
  }
}

function pay_dividends() {
  send({
    "method": "dividends",
    "args": [parseInt(dividendSlider.value)]
  });
}

function finish_building() {
  send({
    "method": "done",
    "args": []
  });
}

function undo() {
  if (gAreAdmin) {
    send({"method": "undo"});
  }
}

function highlightTerritories(territoryNames) {
  let territoryLayer = document.getElementById("territoryLayer");
  for (let nation in utils.NATIONS) {
    for (let territoryName of utils.NATIONS[nation].territories) {
      let path = document.getElementById(territoryName);
      if (territoryNames.indexOf(territoryName) > -1) {
        // Highlight
        path.style.stroke = "white";
        path.style.strokeWidth = "2px";
        let firstChild = territoryLayer.children[0];
        territoryLayer.insertBefore(path, null);
      } else {
        // Unhighlight
        path.style.stroke = "black";
        path.style.strokeWidth = "1px";
      }
    }
  }
}

function send_bribe(nation_name) {
  close_modal();
  send({
    "method": "bribe",
    "args": [
      parseInt(bribeInput.value),
      nation_name
    ]
  });
  bribeInput.value = 0;
}