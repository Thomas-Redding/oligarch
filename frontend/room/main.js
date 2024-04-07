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
  if (gLatestState.players[gUsername].cash < val && gLatestState.settings.debt != 'automatic') return;
  send({
    "method": "bid",
    "args": [{'amount': val, 'nation': gLatestState.stage.turn}]
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

function render_playerTable(state, table, isEndOfGame) {
  // TODO(debt): Add debt.
  if (!table) {
    table = playerTable;
  }
  let tbody = table.children[0];
  tbody.style.textAlign = 'right';
  let arrowChar = utils.isCountryOrderReversed(state) ? '←' : '→';
  tbody.innerHTML = `
    <tr>
      <td id="tableArrowCell" colspan="10" style="text-align: center;">` + arrowChar + `</td>
    </tr>
    <tr>
      <td></td>
      <td></td>
      <td class="column-NA">NA</td>
      <td class="column-SA">SA</td>
      <td class="column-EU">EU</td>
      <td class="column-AF">AF</td>
      <td class="column-AS">AS</td>
      <td class="column-AU">AU</td>
      <td>Cash</td>
      <td>Profit</td>
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
    let connectionCircleColor = player.connected ? 'green' : '#888';
    tr.innerHTML += `<td><div style="background-color:` + connectionCircleColor + `; width: 0.5em; height: 0.5em; border-radius: 0.25em;"></div></td>`;
    tr.innerHTML += `<td style="text-align: left;">` + player.username + " </td>";
    tr.innerHTML += '<td class="column-NA">' + player.shares["North America"] + "</td>";
    tr.innerHTML += '<td class="column-SA">' + player.shares["South America"] + "</td>";
    tr.innerHTML += '<td class="column-EU">' + player.shares["Europe"] + "</td>";
    tr.innerHTML += '<td class="column-AF">' + player.shares["Africa"] + "</td>";
    tr.innerHTML += '<td class="column-AS">' + player.shares["Asia"] + "</td>";
    tr.innerHTML += '<td class="column-AU">' + player.shares["Australia"] + "</td>";
    tr.innerHTML += "<td>" + Math.floor(player.cash) + "</td>";
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
  if (isEndOfGame) {
    let tr;

    tr = document.createElement("TR");
    tr.style.borderTop = 'solid white 1px';
    tr.innerHTML += "<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>";
    tbody.appendChild(tr);

    tr = document.createElement("TR");
    tr.innerHTML += '<td></td><td style="text-align: left;">Score:</td>';
    tr.innerHTML += '<td class="column-NA">' + utils.end_score_of_nation(gLatestState, "North America") + "</td>";
    tr.innerHTML += '<td class="column-SA">' + utils.end_score_of_nation(gLatestState, "South America") + "</td>";
    tr.innerHTML += '<td class="column-EU">' + utils.end_score_of_nation(gLatestState, "Europe") + "</td>";
    tr.innerHTML += '<td class="column-AF">' + utils.end_score_of_nation(gLatestState, "Africa") + "</td>";
    tr.innerHTML += '<td class="column-AS">' + utils.end_score_of_nation(gLatestState, "Asia") + "</td>";
    tr.innerHTML += '<td class="column-AU">' + utils.end_score_of_nation(gLatestState, "Australia") + "</td>";
    tr.innerHTML += "<td></td>";
    tr.innerHTML += "<td></td>";
    tbody.appendChild(tr);
  }

  {
    // World Bank
    let sharesLeft = {};
    let tr = document.createElement("TR");
    tr.innerHTML += `<td></td>`;
    tr.innerHTML += `<td style="text-align: left;"><i>World Bank</i></td>`;
    tr.innerHTML += '<td class="column-NA">' + utils.unowned_shares(state, 'North America') + "</td>";
    tr.innerHTML += '<td class="column-SA">' + utils.unowned_shares(state, 'South America') + "</td>";
    tr.innerHTML += '<td class="column-EU">' + utils.unowned_shares(state, 'Europe') + "</td>";
    tr.innerHTML += '<td class="column-AF">' + utils.unowned_shares(state, 'Africa') + "</td>";
    tr.innerHTML += '<td class="column-AS">' + utils.unowned_shares(state, 'Asia') + "</td>";
    tr.innerHTML += '<td class="column-AU">' + utils.unowned_shares(state, 'Australia') + "</td>";
    tr.innerHTML += "<td>∞</td>";
    tr.innerHTML += "<td></td>";
    tbody.appendChild(tr);
  }

  {
    let tr = document.createElement("TR");
    tr.style.borderTop = 'solid white 1px';
    tr.innerHTML += `<td></td>`;
    tr.innerHTML += `<td style="text-align: left;"><i>Cash ($)</i></td>`;
    tr.innerHTML += '<td class="column-NA">' + state.nations['North America'].cash + "</td>";
    tr.innerHTML += '<td class="column-SA">' + state.nations['South America'].cash + "</td>";
    tr.innerHTML += '<td class="column-EU">' + state.nations['Europe'].cash + "</td>";
    tr.innerHTML += '<td class="column-AF">' + state.nations['Africa'].cash + "</td>";
    tr.innerHTML += '<td class="column-AS">' + state.nations['Asia'].cash + "</td>";
    tr.innerHTML += '<td class="column-AU">' + state.nations['Australia'].cash + "</td>";
    tr.innerHTML += "<td></td>";
    tr.innerHTML += "<td></td>";
    tbody.appendChild(tr);

    let tr2 = document.createElement("TR");
    tr2.innerHTML += `<td></td>`;
    tr2.innerHTML += `<td><i>Revenue ($)</i></td>`;
    tr2.innerHTML += '<td class="column-NA">' + utils.income_of_nation(state, 'North America') + "</td>";
    tr2.innerHTML += '<td class="column-SA">' + utils.income_of_nation(state, 'South America') + "</td>";
    tr2.innerHTML += '<td class="column-EU">' + utils.income_of_nation(state, 'Europe') + "</td>";
    tr2.innerHTML += '<td class="column-AF">' + utils.income_of_nation(state, 'Africa') + "</td>";
    tr2.innerHTML += '<td class="column-AS">' + utils.income_of_nation(state, 'Asia') + "</td>";
    tr2.innerHTML += '<td class="column-AU">' + utils.income_of_nation(state, 'Australia') + "</td>";
    tr2.innerHTML += "<td></td>";
    tr2.innerHTML += "<td></td>";
    tbody.appendChild(tr2);
  }

  let turn = gLatestState.stage.turn;
  let turnIndex = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Australia'].indexOf(turn);
  for (let i = 1; i < tbody.children.length; ++i) {
    let tr = tbody.children[i];
    tr.children[turnIndex + 2].style.backgroundColor = '#444';
  }

  render_map(state);
}

function help_clicked() {
  show_modal('Help');
}

// function render_nation_rects(state) {
//   let shares = utils.num_shares_already_auctioned_for_nation(state);
//   nationRects.innerHTML = "";
//   for (let name in nations) {
//     let nation = state.nations[name];
//     let coords = nations[name].rect;

//     nation.income = utils.income_of_nation(state, name);

//     let rect = svg.rect(coords.x, coords.y, 115, 48);
//     rect.classList.add("nationRect");
//     nationRects.appendChild(rect);

//     let cashText = svg_text("Cash: $" + nation.cash + "B", coords.x + 4, coords.y + 14);
//     nationRects.appendChild(cashText);

//     let incomeText = svg_text("Income: $" + nation.income + "B", coords.x + 4, coords.y + 28);
//     nationRects.appendChild(incomeText);

//     let sharesText = svg_text(shares[name] + "/" + utils.total_shares(state, name) + " shares", coords.x + 4, coords.y + 42);
//     nationRects.appendChild(sharesText);
//   }
// }


function ocean_clicked() {
  Hex.unhighlight_all_hexes();
  if (gSelectedHex) {
    gSelectedHex.on_deselect();
  }
}

let gHexes = {};

function draw_map_table(state) {
  const kColumnWidth = 80;
  const kFontSize = 20;
  function font(size) {
    return "bold " + kFontSize + "px sans-serif";
  }
  let incomeTable = document.getElementById("incomeTable");
  if (!incomeTable) {
    incomeTable = svg.g();
    incomeTable.setAttribute("id", "incomeTable");
  }
  incomeTable.innerHTML = "";
  incomeTable.setAttribute('transform', "translate(780,450)");
  const nations = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Australia'];
  const abbrs = ['NA', 'SA', 'EU', 'AF', 'AS', 'AU'];
  {
    incomeTable.appendChild(svg.text(
      "cash",
      kColumnWidth * 1,
      0,
      {
        "text-anchor": "end",
      }
    ));
    incomeTable.children[incomeTable.children.length - 1].style.font = font(kFontSize * 0.8);
    incomeTable.appendChild(svg.text(
      "rev",
      kColumnWidth * 2,
      0,
      {
        "text-anchor": "end",
      }
    ));
    incomeTable.children[incomeTable.children.length - 1].style.font = font(kFontSize * 0.8);
  }
  for (let i = 0; i < nations.length; ++i) {
    incomeTable.appendChild(svg.text(
      abbrs[i],
      0,
      (i + 1) * kFontSize,
      {
        "text-anchor": "end",
      }
    ));
    incomeTable.children[incomeTable.children.length - 1].style.font = font(kFontSize);
    incomeTable.appendChild(svg.text(
      "$" + gLatestState.nations[nations[i]].cash,
      kColumnWidth,
      (i + 1) * kFontSize,
      {"text-anchor": "end"}
    ));
    incomeTable.children[incomeTable.children.length - 1].style.font = font(kFontSize);
    incomeTable.appendChild(svg.text(
      "$" + utils.income_of_nation(state, nations[i]),
      kColumnWidth * 2,
      (i + 1) * kFontSize,
      {"text-anchor": "end"}
    ));
    incomeTable.children[incomeTable.children.length - 1].style.font = font(kFontSize);
  }
  hexMap.appendChild(incomeTable);
}

function render_map(state) {
  // render_nation_rects(state);

  // let out = svg.g();

  const unittype2icon = {
    "Infantry": "sword.svg",
    "Cavalry": "knight.svg",
    "Artillery": "bow.svg",
  }

  // This code only runs once!
  if (Object.keys(gHexes).length === 0) {
    // Draw water lines
    function style_water_line(line) {
      line.style.stroke = 'white';
      line.style.strokeWidth = 2;
      return line;
    }
    for (let waterPath of gLatestState.map.waterPaths) {
      let stateA = gLatestState.map.states[waterPath.from];
      let stateB = gLatestState.map.states[waterPath.to];
      if (waterPath.type === "simple") {
        mapLines.appendChild(style_water_line(svg.line(
          Hex.get_screen_x(stateA.x - 1, stateA.y),
          Hex.get_screen_y(stateA.x - 1, stateA.y),
          Hex.get_screen_x(stateB.x - 1, stateB.y),
          Hex.get_screen_y(stateB.x - 1, stateB.y),
        )));
      } else {
        // Assumes stateA is left of stateB
        mapLines.appendChild(style_water_line(svg.line(
          Hex.get_screen_x(stateA.x - 1, stateA.y),
          Hex.get_screen_y(stateA.x - 1, stateA.y),
          Hex.get_screen_x(-1, stateA.y),
          Hex.get_screen_y(-1, stateA.y),
        )));
        mapLines.appendChild(style_water_line(svg.line(
          Hex.get_screen_x(stateB.x - 1, stateB.y),
          Hex.get_screen_y(stateB.x - 1, stateB.y),
          Hex.get_screen_x(35, stateB.y),
          Hex.get_screen_y(35, stateB.y),
        )));
      }
    }

    // Draw hexagons
    for (let id in gLatestState.map.states) {
      gHexes[id] = new Hex(id, gLatestState, gLatestState.map.states[id]);
    }

    hexMap.addEventListener('click', (e) => {
      if (e.target === hexMap) {
        ocean_clicked();
      }
    });
  }

  // draw_map_table(state);

  for (let hexId in gLatestState.map.states) {
    if (gHexIdToUnitType[hexId] === undefined) {
      throw Error(hexId, gHexIdToUnitType[hexId]);
    }
    gHexes[hexId].update();
  }

  // Array.from(territoryLayer.getElementsByTagName('path')).forEach(path => {
  //   let territory_name = path.id;
  //   let territory = state.nations[utils.terr2continentName[territory_name]][territory_name];

  //   {
  //     let [x, y] = territories[territory_name].center;
  //     let circle = svg.circle(x, y, 16);
  //     circle.style.fill = 'none';
  //     circle.style.stroke = '#fff4';
  //     circle.style.cursor = 'pointer';
  //     circle.addEventListener('click', () => {
  //       document.getElementById(territory_name).dispatchEvent(new MouseEvent("click", {
  //         "view": window,
  //         "bubbles": true,
  //         "cancelable": false
  //       }));
  //     });
  //     circle.addEventListener('mouseover', () => {
  //       document.getElementById(territory_name).dispatchEvent(new MouseEvent("mouseover", {
  //         "view": window,
  //         "bubbles": true,
  //         "cancelable": false
  //       }));
  //     });
  //     circle.addEventListener('mouseleave', () => {
  //       document.getElementById(territory_name).dispatchEvent(new MouseEvent("mouseleave", {
  //         "view": window,
  //         "bubbles": true,
  //         "cancelable": false
  //       }));
  //     });
  //     out.appendChild(circle);
  //   }

  //   let icon_drawers = [];

  //   for (let nation_name in state.nations) {
  //     let army = utils.army_in_territory(gLatestState, nation_name, territory_name, (["Move", "Attack"].includes(state.stage.subphase) ? state.stage.subphase : "Move"), "join");
  //     for (let unit_type in army) {
  //       for (let can_action = 0; can_action < 2; ++can_action) {
  //         let n = army[unit_type][can_action];
  //         if (n > 0) {
  //           icon_drawers.push((x, y) => {
  //             let onclick = (e) => {
  //               unit_clicked(territory_name, unit_type, nation_name, !can_action);
  //             }

  //             let background = svg.circle(x, y, s * 0.35);
  //             background.style.fill = nations[nation_name].color.hex();
  //             background.style.stroke = "black";
  //             background.style.cursor = "pointer";
  //             background.addEventListener("click", onclick);
  //             out.appendChild(background);

  //             // let src = "./assets/" + unittype2icon[unit_type];
  //             // let img = svg.image(src, x - s/2, y - s/2, {width:s, height:s, "xlink:href":src});
  //             let img;
  //             if (unit_type === "Infantry") {
  //               img = make_sword(x - s/2, y - s/2, s/2, s/2);
  //             } else if (unit_type === "Cavalry") {
  //               img = make_horse(x - s/2, y - s/2, s/2, s/2);
  //             } else {
  //               img = make_bow(x - s/2, y - s/2, s/2, s/2);
  //             }
  //             img.style.cursor = 'pointer';
  //             img.addEventListener("click", onclick);
  //             out.appendChild(img);

  //             // This adds the (often invisible) circle indicating how many units from a stack have been
  //             // selected.
  //             {
  //               const idSuffix = territory_name + "_" + nation_name + "_" + unit_type + "_" + can_action;
  //               let circ = svg.circle(x - 5, y - 6.5, s * 0.23);
  //               circ.style.fill = '#ff0';
  //               circ.style.display = 'none';
  //               circ.addEventListener("click", onclick);
  //               circ.id = "stackcircle_" + idSuffix;
  //               out.appendChild(circ);

  //               let text = svg_text(n, x - 8, y - 3, {
  //                 "style": "font-size: 0.7em; text-align:center;"
  //               });
  //               text.addEventListener("click", onclick);
  //               text.id = "stacktext_" + idSuffix;
  //               text.style.fill = 'black';
  //               text.style.display = 'none';
  //               text.style.textShadow = "6px 6px 20px black";
  //               out.appendChild(text);
  //             }

  //             // We use this grayed-out circle to prevent user clicks when an action is not available.
  //             if (gLatestState.stage.phase === "Action") {
  //               if ((!can_action && ["Attack", "Move"].includes(gLatestState.stage.subphase) || (nation_name !== gLatestState.stage.turn))) {
  //                 let circ = svg.circle(x, y, s * 0.35);
  //                 circ.style.fill = '#0008';
  //                 circ.addEventListener("click", onclick);
  //                 out.appendChild(circ);
  //               }
  //             }

  //             if (n > 1) {
  //               let circ = svg.circle(x + 5, y - 6.5, s * 0.23);
  //               circ.addEventListener('click', onclick);
  //               circ.style.fill = 'red';
  //               out.appendChild(circ);

  //               let text = svg_text(n, x + 2, y - 3, {
  //                 "style": "font-size: 0.7em; text-align:center;"
  //               });
  //               text.addEventListener('click', onclick);
  //               text.style.fill = 'white';
  //               text.style.textShadow = "6px 6px 20px black";
  //               out.appendChild(text);
  //             }
  //           });
  //         }
  //       }
  //     }
  //   }

  //   if (territory.n_factories > 0) {
  //     icon_drawers.push((x, y) => {
  //       // let img = make_factory(x - s/2, y - s/2, s, s);
  //       let img = svg.image("./assets/factory.png", x - s/2, y - s/2, {width:s*0.8, height:s*0.8});
  //       img.addEventListener("click", () => {
  //         factory_clicked(territory_name);
  //       });
  //       out.appendChild(img);

  //       if (territory.n_factories > 1) {
  //         let text = svg_text(territory.n_factories, x - 5, y + 6);
  //         text.style.fill = 'white';
  //         text.style.textShadow = "6px 6px 20px black";
  //         text.addEventListener("click", () => {
  //           factory_clicked(territory_name);
  //         });
  //         out.appendChild(text);
  //       }
  //     });
  //   }

  //   if (territory.n_barracks > 0) {
  //     icon_drawers.push((x, y) => {
  //       let img = svg.image("./assets/castle.png", x - s/2, y - s/2, {width:s*0.8, height:s*0.8});
  //       img.addEventListener("click", () => {
  //         barrack_clicked(territory_name);
  //       });
  //       out.appendChild(img);

  //       if (territory.n_barracks > 1) {
  //         let text = svg_text(territory.n_barracks, x - 5, y + 6);
  //         text.addEventListener("click", () => {
  //           barrack_clicked(territory_name);
  //         })
  //         text.style.fill = 'white';
  //         text.style.textShadow = "6px 6px 20px black";
  //         out.appendChild(text);
  //       }
  //     });
  //   }

  //   const r = 16;
  //   const s = 24;
  //   const tau = Math.PI * 2;
  //   for (let t = 0; t < icon_drawers.length; ++t) {
  //     let angle = tau * t / icon_drawers.length - Math.PI / 2;
  //     let [x, y] = territories[territory_name].center;
  //     x += Math.cos(angle) * r * 1.3;
  //     y += Math.sin(angle) * r * 1.3;
  //     icon_drawers[t](x, y);
  //   }

  //   if (utils.CAPITALS.includes(territory_name)) {
  //     let [x, y] = territories[territory_name].center;
  //     let star = svg.image("assets/whitestar.png", x - 10, y - 10, {
  //       width: 20,
  //       height: 20
  //     });
  //     star.addEventListener('click', () => {
  //       document.getElementById(territory_name).dispatchEvent(new MouseEvent("click", {
  //         "view": window,
  //         "bubbles": true,
  //         "cancelable": false
  //       }));
  //     });
  //     star.addEventListener('mouseover', () => {
  //       document.getElementById(territory_name).dispatchEvent(new MouseEvent("mouseover", {
  //         "view": window,
  //         "bubbles": true,
  //         "cancelable": false
  //       }));
  //     });
  //     star.addEventListener('mouseleave', () => {
  //       document.getElementById(territory_name).dispatchEvent(new MouseEvent("mouseleave", {
  //         "view": window,
  //         "bubbles": true,
  //         "cancelable": false
  //       }));
  //     });
  //     star.style.cursor = 'pointer';
  //     star.style.fill = 'white';
  //     out.appendChild(star);
  //   }
  // });

  // riskMap.appendChild(out);
  // riskMap.removeChild(document.getElementById("unitIcons"));
  // out.id = "unitIcons";
}

function add_player(details, state) {
  render_playerTable(state);
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
  // riskMap.addEventListener('click', (e) => {
  //   let pt = riskMap.createSVGPoint();
  //   pt.x = e.clientX;
  //   pt.y = e.clientY;
  //   let loc = pt.matrixTransform(riskMap.getScreenCTM().inverse());
  //   // console.log(Math.round(loc.x), Math.round(loc.y));
  // });

  maybe_show_trade_proposal(state);

  // Array.from(territoryLayer.getElementsByTagName('path')).forEach(path => {
  //   let territory = path.id;
  //   let nation = utils.terr2continentName[territory];
  //   let nationColor = nations[nation].color;
  //   let randColor = Color.random().scale(0.15);
  //   let color = nationColor.scale(0.85).plus(randColor);

  //   path.style = '';
  //   path.style.fill = color.hex();
  //   path.style.stroke = 'black';

  //   let onclick = (e) => {
  //     if (true) {
  //       // Print out coordinates.
  //       let pt = riskMap.createSVGPoint();
  //       pt.x = e.clientX;
  //       pt.y = e.clientY;
  //       let loc = pt.matrixTransform(riskMap.getScreenCTM().inverse());
  //       console.log('"' + territory + '": { "center": [' + [Math.round(loc.x), Math.round(loc.y)] + '] },');
  //     }

  //     if (gLatestState.stage.phase === "Action") {
  //       if (gLatestState.stage.subphase === "Build") {
  //         if (factoryRadio.checked) {
  //           build(gLatestState, territory, "factory");
  //         } else if (barracksRadio.checked) {
  //           build(gLatestState, territory, "barracks");
  //         }
  //       } else if (gLatestState.stage.subphase === "Spawn") {
  //         if (soldierRadio.checked) {
  //           spawn(gLatestState, territory, "Infantry");
  //         } else if (artilleryRadio.checked) {
  //           spawn(gLatestState, territory, "Artillery");
  //         } else if (calvaryRadio.checked) {
  //           spawn(gLatestState, territory, "Cavalry");
  //         }
  //       } else if (gLatestState.stage.subphase === "Move") {
  //         if (moveState) {
  //           let nation_name = gLatestState.stage.turn;
  //           let validIds = {
  //             "Infantry": [],
  //             "Cavalry": [],
  //             "Artillery": []
  //           };
  //           for (let unit of gLatestState.nations[nation_name].army) {
  //             if (unit.can_move && unit.territory === moveState.from) {
  //               validIds[unit.type].push(unit.id)
  //             }
  //           }

  //           let unitIds = [];
  //           for (let type of ["Infantry", "Cavalry", "Artillery"]) {
  //             console.log(type, validIds, moveState);
  //             if (validIds[type].length < moveState[type]) {
  //               alert("Invalid Move (1)");
  //               change_move_state(null);
  //               return;
  //             }
  //             for (let i = 0; i < moveState[type]; ++i) {
  //               unitIds.push(validIds[type][i]);
  //             }
  //           }


  //           let legalMoves = utils.valid_moves_for_troop(
  //             gLatestState,
  //             gLatestState.stage.turn,
  //             moveState.from,
  //             moveState["Cavalry"] === unitIds.length ? "Cavalry" : "Infantry");

  //           if (territory in legalMoves) {
  //             send({
  //               "method": "move",
  //               "args": [unitIds, moveState.from, territory]
  //             })
  //           } else {
  //             alert("Invalid Move (2)");
  //           }

  //           change_move_state(null);
  //         }
  //       }
  //     }
  //   }
  //   path.onclick = onclick;
  //   // path.addEventListener('click', onclick);

  //   let onmouseover = (e) => {
  //     path.style.fill = color.plus(new Color(255, 255, 255)).scale(0.5).hex();
  //   }
  //   path.addEventListener("mouseover", onmouseover);

  //   let onmouseleave = (e) => {
  //     path.style.fill = color.hex();
  //   };
  //   path.addEventListener("mouseleave", onmouseleave);

  //   if (false) {
  //     let [x, y] = territories[territory].center;
  //     circ = create_circle(x, y, 20);
  //     circ.style.fill = 'none';
  //     circ.style.stroke = 'white';
  //     riskMap.appendChild(circ);
  //   }
  // });

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
    leftPanel.style.width = '31em';
    playerTable.style.display = 'table';
    actionPanel.style.display = 'block';
    mapDiv.style.display = 'block';
    mapDiv.style.flex = 1;
    gameLogContainer.style.display = 'block';
    gameLogContainer.style.maxWidth = '20em';
    bottomNavBarDiv.style.display = 'none';
    currentVotesDiv.style.display = "block";

    playerTable.style.fontSize = '1.3em';
    pauseDiv.style.height = '100%';
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
    playerTable.style.display = (tab === kTabInfo ? "table" : "none");
    bottomNavBarDiv.style.display = 'flex';
    currentVotesDiv.style.display = (tab === kTabInfo ? "block" : "none");

    playerTable.style.fontSize = '1em';
    pauseDiv.style.height = 'calc(100% - 1.5em - 13px)';
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
    while (!utils.is_username_valid(username)) {
      username = prompt("username?");
    }
    while (password.length == 0) {
      password = prompt("password?");
    }
  }
  gUsername = username;
  return network.makeWebSocket("oligarch", username, password);
}

function render_status_bar(state) {
  statusBarRoundDiv.innerHTML = "Round " + state.stage.round;
  if (state.stage.phase === "Action") {
    statusBarPhaseDiv.innerHTML = state.stage.subphase;
  } else {
    statusBarPhaseDiv.innerHTML = state.stage.phase;
  }
  let next = utils.next_turn(state);
  if (next) {
    statusBarNationDiv.innerHTML = state.stage.turn;
  } else {
    statusBarNationDiv.innerHTML = state.stage.turn;
  }
  if (state.stage.phase === "action") {
    statusBarSubphaseDiv.previousElementSibling.style.display = "block";
    statusBarSubphaseDiv.innerHTML = state.stage.subphase;
  } else {
    statusBarSubphaseDiv.previousElementSibling.style.display = "none";
    statusBarSubphaseDiv.innerHTML = "";
  }

  statusBarYourCash
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
    return "<b>" + details.winner + "</b> bought a share of " + details.nation + " for $" + details.price + "B";
  } else if (action == "auctions_complete") {
    return "Auctions concluded.";
  } else if (action == "start_election") {
    return "Election began in " + details;
  } else if (action == "vote_tallied") {
    return "Someone voted";
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
    if (details == 0) {
      return "Dividends skipped";
    } else {
      return "$" + details + "B paid in dividends";
    }
  } else if (action == "end_presidential_command") {
    return "The reign has ended.";
  } else if (action == "donate") {
    return "<b>" + details.player + "</b> donated " + details.nation + " with $" + details.amount + "B";
  } else if (action == "borrowed") {
    return "<b>" + details.player + "</b> borrowed $" + details.amount + "B";
  } else if (action == "paid_back") {
    return "<b>" + details.player + "</b> paid back $" + details.amount + "B in debt";
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
  } else if (action == "built_infrastructure") {
    return details.type + ' built in ' + details.territory;
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
        <td colspan=3>Votes (` + utils.total_shares(gLatestState, gLatestState.stage.turn) + ` total)</td>
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
  // updateDiv(state.stage.turn + " to <b>" + state.highest_bidder + '</b> for $' + state.current_bid + " B");
  if (state.stage.phase == "lobby") {
    updateDiv(null);
  } else if (state.stage.phase == "Taxation") {
    updateDiv("Taxation");
  } else if (state.stage.phase == "Discuss") {
    let num_ready = utils.sum(Object.values(gLatestState.players).map(x => x.ready));
    updateDiv("Discuss (" + num_ready + "/" + Object.keys(gLatestState.players).length + " want to skip)");
  } else if (state.stage.phase == "Auction") {
    let n = gLatestState.supershares_from_turn[gLatestState.stage.round - 1];
    let adviceString = "";
    if (gLatestState.settings.advice) {
      let advisedPrice = Math.round(utils.advised_share_price(gLatestState, state.stage.turn, n));
      adviceString += "<br/><br/> <i>( Your advisor recommends a share price of $" + advisedPrice + "B )</i>";
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

let gHexIdToUnitType = {};

let gStateEventTarget = new EventTarget();

let gFirstStateLoadedPromise;
{
  let outerResolve;
  gFirstStateLoadedPromise = new Promise((resolve, reject) => {
    outerResolve = resolve;
  });
  gFirstStateLoadedPromise.resolve = outerResolve;
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
        if (event.data.length == 0) {
          // This is a "doubleTap" event (see prayer() in oligarch.js).
          return;
        }
        let [action, details, state] = JSON.parse(event.data);

        const oldState = gLatestState;
        gLatestState = state;

        if (!oldState) {
          gFirstStateLoadedPromise.resolve(state);
        }

        // Populate gHexIdToUnitType for convenience.
        for (let id in gLatestState.map.states) {
          gHexIdToUnitType[id] = kTileTypeEmpty;
        }
        for (let nationName in gLatestState.nations) {
          let nation = gLatestState.nations[nationName];
          for (let unit of nation.army) {
            gHexIdToUnitType[unit.territory] = {
              "Infantry": kTileTypeInfantry,
              "Cavalry": kTileTypeCalvary,
              "Artillery": kTileTypeCannon,
            }[unit.type];
          }
          for (let key in nation) {
            if (key in gLatestState.map.states) {
              let territory = gLatestState.nations[nationName][key];
              if (territory.n_factories > 0) {
                gHexIdToUnitType[key] = kTileTypeFactory;
              } else if (territory.n_barracks > 0) {
                gHexIdToUnitType[key] = kTileTypeBarracks;
              }
            }
          }
        }

        console.log("========================");
        console.log(new Date());
        console.log("Received action:", action);
        console.log("Received details:", details);
        console.log("Received state:", state);
        console.log("========================");

        if (["get_state", "pause", "resume"].includes(action)) {
          pauseDiv.style.display = (state.is_paused ? "flex" : "none");
        }

        statusBarYourCash.innerHTML = "$" + Math.floor(state.players[gUsername].cash) + "B";
        document.getElementById("factoryRadioLabel").innerHTML = "Factory (cost: $" + COSTS['factory'] + "B; yield: $" + state.settings.factoryIncome + "B/turn)";
        document.getElementById("barracksRadioLabel").innerHTML = "Barracks (cost: $" + COSTS['barracks'] + "B)";
        if (gLatestState.settings.enabledTroops.includes('infantry')) {
          document.getElementById("soldierRadioLabel").innerHTML = "Infantry ($" + COSTS['Infantry'] + "B)";
        } else {
          document.getElementById("soldierRadioContainer").style.display = 'none';
        }
        if (gLatestState.settings.enabledTroops.includes('calvary')) {
          document.getElementById("calvaryRadioLabel").innerHTML = "Cavalry ($" + COSTS['Cavalry'] + "B)";
        } else {
          document.getElementById("calvaryRadioContainer").style.display = 'none';
        }
        if (gLatestState.settings.enabledTroops.includes('artillery')) {
          document.getElementById("artilleryRadioLabel").innerHTML = "Artillery ($" + COSTS['Artillery'] + "B)";
        } else {
          document.getElementById("artilleryRadioContainer").style.display = 'none';
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
            render_presidential_div(state);
            window.onresize();
          }
          render_playerTable(state);
          gClock.set_time_remaining(state.clock);
          if (state.is_paused) {
            gClock.pause();
          }
          updateLobbyUsernames();
        }
        else if (action === "game_over") {
          // foobar
          render_playerTable(state, endOfGameTable, true);
          let best = -Infinity;
          let winner = null;
          for (let player_name in state.players) {
            let score = utils.end_score_of_player(state, player_name)
            if (score > best) {
              best = score;
              winner = player_name;
            }
          }
          winnerDiv.innerHTML = winner + ' wins!';
          endOfGameContainer.style.display = 'block';
        }
        else if (action === "begin_spawn") {
          render_map(state);
          Hex.unhighlight_all_hexes();
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
          render_playerTable(state);
        }
        else if (action === "spawned_unit") {
          render_playerTable(state);
        }
        else if (action === "trade_proposed") {
          maybe_show_trade_proposal(state);
        }
        else if (action === "trade_accepted") {
          tradeSnackbarContainer.style.display = "none";
          render_playerTable(state);
        }
        else if (action === "battle_outcome") {
          render_map(state);
          render_playerTable(state);
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
          render_playerTable(state);
        }
        else if (action === "taxes_collected") {
          render_playerTable(state);
        }
        else if (action === "donate") {
          render_playerTable(state);
        }
        else if (action === "borrowed") {
          render_playerTable(state);
        }
        else if (action === "begin_deliberation") {
          gClock.set_time_remaining(state.clock);
          render_playerTable(state);
        }
        else if (action === "deliberation_over") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "auction_start") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "start_election") {
          gClock.set_time_remaining(state.clock);
          render_playerTable(state);
        }
        else if (action === "vote_tallied") {
          render_map(state);
          render_vote_table(state);
        }
        else if (action === "begin_presidential_command") {
          gClock.set_time_remaining(state.clock);
        }
        else if (action === "begin_build") {
          Hex.unhighlight_all_hexes();
          factoryRadio.checked = true;
        }
        else if (action === "begin_move") {
          Hex.unhighlight_all_hexes();
          render_map(state);
        }
        else if (action === "begin_attack") {
          Hex.unhighlight_all_hexes();
          render_map(state);
        }
        else if (action === "built_infrastructure") {
          Hex.unhighlight_all_hexes();
          render_playerTable(state);
        }
        else if (action === "bldg_razed") {
          render_map(state);
          render_playerTable(state);
        }
        else if (action === "dividends_paid") {
          render_playerTable(state);
        }
        else if (action === "conclude_bidding") {
          render_playerTable(state);
          // render_nation_rects(state);
        }
        else if (action === "moves_made") {
          render_map(state);
          render_playerTable(state);
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
          gStateEventTarget.dispatchEvent(new CustomEvent("bid_received", {
            "detail": {
              "state": gLatestState,
              "details": details,
            },
          }));
        } else if (action == "connection_change") {
          render_playerTable(state);
        }

        render_map(state);

        if (state.stage.phase === "Action") {
          render_vote_table(state);
        }

        gStateEventTarget.dispatchEvent(new CustomEvent("statechange", {
          "detail": {
            oldState: oldState,
            newState: state,
          }
        }));

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
  let quote = chooseQuote();
  lobbyQuoteDivQuote.innerHTML = "<i>\"" + quote.quote + "\"</i>";
  lobbyQuoteDivWho.innerHTML = "</br>- " + quote.who;
}, (error) => {
  alert("Error occurred while connecting...");
});

class AuctionController {
  constructor(gStateEventTarget, state) {
    gStateEventTarget.addEventListener('statechange', (event) => {
      const oldState = event.detail.oldState;
      const newState = event.detail.newState;
      if (newState.stage.phase !== 'Auction') {
        this.end_auction();
        return;
      }
      if (oldState.stage.phase === 'Auction') {
        return;
      }
      this.begin_auction(newState);
    });
    gStateEventTarget.addEventListener('bid_received', (event) => {
      this.bid_received(event.detail.state, event.detail.details);
    });
    if (state.stage.phase === 'Auction') {
      this.begin_auction(event.detail.state);
    }
  }
}

class FirstPriceAuctionController extends AuctionController {
  begin_auction(state) {
    bid1Button.style.display = "inline-block";
    bid5Button.style.display = "inline-block";
    bid25Button.style.display = "inline-block";
  }
  end_auction(state) {
    bid1Button.style.display = "none";
    bid5Button.style.display = "none";
    bid25Button.style.display = "none";
  }
  bid_received(state, details) {
    gClock.set_time_remaining(state.clock);
    if (details.player === gUsername) {
      if (state.players[gUsername].cash > state.current_bid || state.settings.debt == 'automatic') {
        bid1Button.classList.remove("disabled-button");
      } else {
        bid1Button.classList.add("disabled-button");
      }
      if (state.players[gUsername].cash > state.current_bid + 5 || state.settings.debt == 'automatic') {
        bid5Button.classList.remove("disabled-button");
      } else {
        bid5Button.classList.add("disabled-button");
      }
      if (state.players[gUsername].cash > state.current_bid + 25 || state.settings.debt == 'automatic') {
        bid25Button.classList.remove("disabled-button");
      } else {
        bid25Button.classList.add("disabled-button");
      }
    } else {
      bid1Button.classList.add("disabled-button");
      bid5Button.classList.add("disabled-button");
      bid25Button.classList.add("disabled-button");
      setTimeout(() => {
        if (state.players[gUsername].cash > state.current_bid || state.settings.debt == 'automatic') {
          bid1Button.classList.remove("disabled-button");
        }
        if (state.players[gUsername].cash > state.current_bid + 5 || state.settings.debt == 'automatic') {
          bid5Button.classList.remove("disabled-button");
        }
        if (state.players[gUsername].cash > state.current_bid + 25 || state.settings.debt == 'automatic') {
          bid25Button.classList.remove("disabled-button");
        }
      }, kBidDisableTime * 1000);
    }
  }
}

class LimitOrderAuctionController extends AuctionController {
  constructor(eventTarget, state) {
    super(eventTarget, state);
    document.getElementById("limitOrderUI").innerHTML = `
      <table>
        <tbody>
          <tr>
            <td>Bid (Buy)</td>
            <td><input id="limitOrderBidInput" type="number" style="width: 6em; padding: 0.2em;"></td>
          </tr>
          <tr>
            <td>Ask (Sell)</td>
            <td><input id="limitOrderAskInput" type="number" style="width: 6em; padding: 0.2em;"></td>
          </tr>
          <tr>
            <td colspan=2><div class='button' id="limitOrderSubmitButton">Submit</div></td>
            <td colspan=2><div class='button' id="limitOrderCancelbutton">Cancel</div></td>
          </tr>
        </tbody>
      </table>
    `;

    this.bidInput = document.getElementById("limitOrderBidInput");
    this.askInput = document.getElementById("limitOrderAskInput");
    this.submitButton = document.getElementById("limitOrderSubmitButton");
    this.cancelButton = document.getElementById("limitOrderCancelbutton");

    this.bidInput.addEventListener('change', () => {
      this.submitButton.classList.remove("disabled-button");
      if (parseInt(this.bidInput.value) < 0) {
        this.bidInput.value = 0;
      }
      if (parseInt(this.bidInput.value) > gLatestState.players[gUsername].cash) {
        this.bidInput.value = gLatestState.players[gUsername].cash;
      }
    });
    // TODO: if you receive a new share, you're free to set ask price.
    this.askInput.addEventListener('change', () => {
      this.submitButton.classList.remove("disabled-button");
      const myShares = this.myShares(gLatestState);
      if (parseInt(this.askInput.value) < 0) {
        this.askInput.value = 0;
      }
      if (parseInt(this.askInput.value) > myShares) {
        this.askInput.value = myShares;
      }
    });
    this.submitButton.addEventListener('click', () => {
      this.submitButton.classList.add("disabled-button");

      let bidPrice = parseInt(this.bidInput.value);
      if (isNaN(bidPrice)) {
        bidPrice = null;
      }

      let askPrice = parseInt(this.askInput.value);
      if (isNaN(askPrice)) {
        askPrice = null;
      }

      send({
        "method": "bid",
        "args": [{'amount': bidPrice, 'nation': gLatestState.stage.turn}],
        "orderType": "bid",
      });
      send({
        "method": "bid",
        "args": [{'amount': askPrice, 'nation': gLatestState.stage.turn}],
        "orderType": "ask",
      });
    });
    this.cancelButton.addEventListener('click', () => {
      this._reset(gLatestState);
      send({
        "method": "bid",
        "args": [{'amount': null, 'nation': gLatestState.stage.turn}],
        "orderType": "bid",
      });
      send({
        "method": "bid",
        "args": [{'amount': null, 'nation': gLatestState.stage.turn}],
        "orderType": "ask",
      });
    });
  }
  _reset(state) {
    this.bidInput.value = 0;
    this.askInput.value = (this.myShares(state) === 0 ? "" : 0);
    this.submitButton.classList.add("disabled-button");
  }
  myShares(state) {
    return state.players[gUsername].shares[gLatestState.stage.turn];
  }
  begin_auction(state) {
    this._reset(state);
    limitOrderUI.style.display = "block";

  }
  end_auction(state) {
    limitOrderUI.style.display = "none";
  }
  bid_received(state) {
    // 
  }
}

let gAuctionController;
gFirstStateLoadedPromise.then((state) => {
  if (gLatestState.settings.auctionType === "first-price") {
    gAuctionController = new FirstPriceAuctionController(gStateEventTarget, state);
  } else {
    gAuctionController = new LimitOrderAuctionController(gStateEventTarget, state);
  }
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

function limit_order_bid_clicked() {
  limitOrderBidButton.innerHTML = "Bid $0";
  limitOrderAskButton.innerHTML = "Bid $na";
}

function update_buttons(state) {
  const stage = state.stage;

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

  // Switch lines if you want to enable bribing (i.e. donating to a country)
  // donateButton.style.display = (stage.phase === "Action" ? "inline-block" : "none");
  // donateButton.style.display = "none";
  borrowButton.style.display = (gLatestState.settings.debt == 'manual' ? "inline-block" : "none");
  payBackButton.style.display = (gLatestState.settings.debt == 'manual' && gLatestState.players[gUsername].manualDebt > 0 ? "inline-block" : "none");

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

  donateInput.max = myCash;
  donateInput.value = Math.min(parseInt(donateInput.value), myCash);

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
    presidentialHeader.innerHTML = state.stage.turn + " ($" + nation.cash + " B)";
    let num_shares;
    if (state.settings.doesBankReceiveDividends) {
      num_shares = utils.total_shares(state, state.stage.turn);
    } else {
      num_shares = utils.shares_sold(state, state.stage.turn);
    }
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

function donate_input_changed() {
  let amount = parseInt(donateInput.value);

  if (canSpendAmount(amount + 5)) {
    donate5Button.classList.remove('disabled-button');
  } else {
    donate5Button.classList.add('disabled-button');
  }
  if (canSpendAmount(amount + 20)) {
    donate20Button.classList.remove('disabled-button');
  } else {
    donate20Button.classList.add('disabled-button');
  }

  let canSend = amount > 0 && canSpendAmount(amount);
  let nationButtons = document.getElementsByClassName('donate-nation-button');
  for (let nationButton of nationButtons) {
    if (canSend) {
      nationButton.classList.remove('disabled-button');
    } else {
      nationButton.classList.add('disabled-button');
    }
  }
}

function canSpendAmount(amount) {
  return amount <= gLatestState.players[gUsername].cash || gLatestState.settings.debt == 'automatic';
}

function increment_bid_input(delta) {
  let newBid = parseInt(bidInput.value) + delta;
  if (!canSpendAmount(newBid)) return;
  newBid = Math.max(newBid, 0);
  bidInput.value = newBid;
}

function increment_donate_input(delta) {
  let newDonation = parseInt(donateInput.value) + delta;
  if (!canSpendAmount(newDonation)) return;
  newDonation = Math.max(newDonation, 0);
  if (gLatestState.settings.debt != 'automatic') {
    newDonation = Math.min(newDonation, gLatestState.players[gUsername].cash);
  }
  donateInput.value = newDonation;
  donate_input_changed();
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
    button.innerHTML = "<i>abstain</i>";
    button.addEventListener('click', (e) => {
      close_modal();
      vote_for("abstain");
    })
    votePlayerButtonsContainer.appendChild(button);
  }

  tradePopup2Div.style.display = "none";
  tradePopupDiv.style.display = (type === "Trade" ? "block" : "none");
  donatePopupDiv.style.display = (type === "Donate" ? "block" : "none");
  borrowPopupDiv.style.display = (type === "Borrow" ? "block" : "none");
  payBackPopupDiv.style.display = (type === "PayBack" ? "block" : "none");
  votePopupDiv.style.display = (type === "Vote" ? "block" : "none");
  helpPopupDiv.style.display = (type === "Help" ? "block" : "none");

  if (type === "Donate") {
    donate_input_changed();
  } else if (type === "Borrow") {
  	borrowInput.value = 0;
    borrow_input_changed();
  } else if (type === "PayBack") {
  	payBackInput.value = 0;
    payBack_input_changed();
  }

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
  console.log(new Date());
  console.log("SEND", obj);
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

function skip_dividends() {
  send({
    "method": "dividends",
    "args": [0]
  });
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
  for (let territoryName in utils.terr2continentName) {
    let nation = utils.terr2continentName[territoryName];
    let path = document.getElementById(territoryName);
    if (!path) {
      console.log('missing node with id "' + territoryName + '"');
    }
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

function send_donate(nation_name) {
  let donateValue = parseInt(donateInput.value);
  if (donateValue === 0) return;
  close_modal();
  send({
    "method": "donate",
    "args":[donateValue, nation_name]
  });
  donateInput.value = 0;
}

function borrow_input_changed() {
  if (parseInt(borrowInput.value) > 0) {
    submitBorrowButton.classList.remove('disabled-button');
  } else {
    submitBorrowButton.classList.add('disabled-button');
  }
}

function increment_borrow_input(delta) {
  let newLoan = parseInt(borrowInput.value) + delta;
  newLoan = Math.max(newLoan, 0);
  borrowInput.value = newLoan;
  borrow_input_changed();
}

function borrow() {
  let borrowValue = parseInt(borrowInput.value);
  if (borrowValue == 0) return;
  close_modal();
  borrowInput.value = 0;
  send({
    "method": "borrow",
    "args":[borrowValue]
  });
}

function payBack_input_changed() {
  let amount = parseInt(payBackInput.value);
  if (amount > gLatestState.players[gUsername].cash) {
    payBackInput.value = gLatestState.players[gUsername].cash;
  }
  if (amount > gLatestState.players[gUsername].manualDebt) {
    payBackInput.value = gLatestState.players[gUsername].manualDebt;
  }
  if (parseInt(payBackInput.value) > 0) {
    submitPayBackButton.classList.remove('disabled-button');
  } else {
    submitPayBackButton.classList.add('disabled-button');
  }
}

function increment_payBack_input(delta) {
  let newPayment = parseInt(payBackInput.value) + delta;
  if (newPayment > gLatestState.players[gUsername].cash) return;
  if (newPayment > gLatestState.players[gUsername].debt) return;
  newPayment = Math.max(newPayment, 0);
  payBackInput.value = newPayment;
  payBack_input_changed();
}

function payBack() {
  let payBackValue = parseInt(payBackInput.value);
  if (payBackValue == 0) return;
  if (payBackValue > gLatestState.players[gUsername].cash) return;
  if (payBackValue > gLatestState.players[gUsername].debt) return;
  close_modal();
  payBackInput.value = 0;
  send({
    "method": "payBack",
    "args":[payBackValue]
  });
}

function chooseQuote() {
  let quotes = [
    {"who": "Adolf Hitler", "quote": "If you win, you need not have to explain...If you lose, you should not be there to explain!"},
    {"who": "Adolf Hitler", "quote": "The very first essential for success is a perpetually constant and regular employment of violence."},
    {"who": "Adolf Hitler", "quote": "When diplomacy ends, War begins."},
    {"who": "Friedrich Nietzsche", "quote": "Terribleness is part of greatness: let us not deceive ourselves."},
    {"who": "Giuseppe Prezzolini", "quote": "Representative government is artifice, a political myth, designed to conceal from the masses the dominance of a self-selected, self-perpetuating, and self-serving traditional ruling class."},
    {"who": "Henry Kissinger", "quote": "America has no permanent friends or enemies, only interests"},
    {"who": "Henry Kissinger", "quote": "I don't see why we need to stand by and watch a country go communist due to the irresponsibility of its people. The issues are much too important for the Chilean voters to be left to decide for themselves."},
    {"who": "Henry Kissinger", "quote": "In crises the most daring course is often safest."},
    {"who": "Henry Kissinger", "quote": "The illegal we do immediately. The unconstitutional takes a little longer."},
    {"who": "Joseph Stalin", "quote": "Mankind is divided into rich and poor, into property owners and exploited; and to abstract oneself from this fundamental division; and from the antagonism between poor and rich means abstracting oneself from fundamental facts."},
    {"who": "Joseph Stalin", "quote": "One death is a tragedy; one million is a statistic."},
    {"who": "Theodore Roosevelt", "quote": "Do what you can, with what you have, where you are."},
    {"who": "Theodore Roosevelt", "quote": "Speak softly and carry a big stick."},
  ]
  return quotes[Math.floor(Math.random() * quotes.length)];
}
