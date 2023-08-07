const kTileTypeEmpty = '';
const kCapitalIcon = "whitestar.png";
const kTileTypeCalvary = "horse.png";
const kTileTypeFactory = "factory.png";
const kTileTypeInfantry = "helmet.png";
const kTileTypeCannon = "cannon.png";
const kTileTypeBarracks = "castle.png";

const kMapScale = 31;
const a = 0.6;
const b = 1.03;  // Make ~1.03 to give small gaps between hexagons.

let gSelectedHex = null;

function unwrap(A) {
  if (A.length !== 1) {
    throw Error('Unwrap error (A.length = ' + A.length + ')');
  }
  return A[0];
}

class Hex {
  constructor(id, mother_state, info) {
    this.id = parseInt(id);
    this.x = info.x - 1;
    this.y = info.y;
    this.adjacencies = info.adjacencies;
    this.homeContinent = info.homeContinent;
    this.type = null;  // one of TileType
    this.isCapital = utils.is_tile_capital(mother_state, this.id);

    const thetas = [0, 1, 2, 3, 4, 5].map(x => x * Math.PI * 2 / 6);
    this.screenX = Hex.get_screen_x(this.x, this.y);
    this.screenY = Hex.get_screen_y(this.x, this.y);
    let xs = thetas.map(
      x => Math.sin(x) * a * kMapScale + this.screenX);
    let ys = thetas.map(
      y => Math.cos(y) * a * kMapScale + this.screenY);

    this.path = svg.polygon(xs, ys, {});
    this.path.setAttribute('hexid', id);
    this.color = null;
    for (let continent of mother_state.map.continents) {
      if (continent.abbreviation == this.homeContinent) {
        this.color = new Color(continent.color.r, continent.color.g, continent.color.b);
      }
    }
    if (this.color === null) {
      throw Error();
    }
    this.path.style.fill = this.color.hex();
    mapHexes.appendChild(this.path);

    this.image = null;

    this.capitalIcon = null;
    if (this.isCapital) {
      let x = Math.min.apply(null, xs);
      let y = Math.min.apply(null, ys) + kMapScale * 0.05;
      let w = kMapScale;
      let h = kMapScale;
      this.capitalIcon = svg.image(
        "./assets/" + kCapitalIcon,
        x, y,
        { "width": w, "height": h },
      );
      this.capitalIcon.style.pointerEvents = 'none';

      mapCapitals.appendChild(this.capitalIcon);
    }

    this.path.addEventListener('click', (e) => {
      this.click(e);
    });
  }
  static get_screen_x(x, y) {
    return (x + y % 2 / 2) * 1.03 * b * kMapScale;
  }
  static get_screen_y(x, y) {
    return y * 0.89 * b * kMapScale;
  }
  on_select() {
    gSelectedHex = this;
    this.path.style.fill = 'white';
    gHexes[this.id].path.style.strokeWidth = 2;
    gHexes[this.id].path.style.stroke = 'white';
  }
  on_deselect() {
    gSelectedHex = null;
    this.path.style.fill = this.owner_color().hex();
    gHexes[this.id].path.style.strokeWidth = 0;
    gHexes[this.id].path.style.stroke = '#0000';
  }
  get owner() {
    return utils.territory_to_owner(gLatestState, this.id);
  }
  unit_owned_by(nationName) {
    if (!this.troopType) {
      return null;
    }
    let army = gLatestState.nations[nationName].army;
    return army.filter(x => x.territory == this.id).length > 0;
  }
  disabled() {
    let nationName = gLatestState.stage.turn;
    let owner = utils.territory_to_owner(gLatestState, this.id);

    if (gLatestState.stage.phase !== 'Action') {
      return false;
    }
    if (nationName !== owner) {
      return true;
    }

    let a = utils.num_barracks_and_factories_in_territory(gLatestState, this.id);

    let territory = gLatestState.nations[nationName][this.id];
    let army = gLatestState.nations[nationName].army;
    army = army.filter(x => x.territory == this.id);

    if (army.length > 0) {
      if (gLatestState.stage.subphase === 'Move') {
        return !unwrap(army).can_move;
      }
      if (gLatestState.stage.subphase === 'Attack') {
        return !unwrap(army).can_attack;
      }
    } else {
      if (gLatestState.stage.subphase === 'Spawn') {
        return a.n_barracks_can_spawn === 0;
      }
    }
    return true;
  }
  _moveclick() {
    let nationName = gLatestState.stage.turn;

    if (gSelectedHex) {
      if (!gSelectedHex.unit_owned_by(nationName)) {
        return;
      }
      let moves = utils.valid_moves_for_troop(gLatestState, nationName, gSelectedHex.id, gSelectedHex.troopType);
      if (this.id in moves) {
        let troopId = gSelectedHex.troop_id();
        if (troopId) {
          send({
            "method": "move",
            "args": [[troopId], gSelectedHex.id, this.id]
          });
        }
      }
      gSelectedHex.on_deselect();
      Hex.unhighlight_all_hexes();
      return;
    }

    Hex.unhighlight_all_hexes();

    // Highlight adjacent hexagons
    if (this.troopType) {
      let army = gLatestState.nations[nationName].army;
      let unit = unwrap(army.filter(x => x.territory == this.id));
      if (unit.can_move) {
        this.on_select();
        let moves = utils.valid_moves_for_troop(gLatestState, nationName, this.id, this.troopType);
        this.highlight_hexes(Object.keys(moves));
      }
    }
  }
  update() {
    this.set_type(gHexIdToUnitType[this.id]);
    if (this.image) {
      if (this.disabled()) {
        this.image.style.opacity = 0.5;
      } else {
        this.image.style.opacity = 1.0;
      }
    }
    this.path.style.fill = this.owner_color().hex();
  }
  owner_color() {
    let owner = utils.territory_to_owner(gLatestState, this.id);
    if (owner === null) {
      return new Color(255, 255, 255);
    }
    for (let continent of gLatestState.map.continents) {
      if (continent.name == owner) {
        return new Color(continent.color.r, continent.color.g, continent.color.b);
      }
    }
    throw Error();
  }
  highlight_hexes(hexIds) {
    for (let id of hexIds) {
      gHexes[id].path.style.strokeWidth = 2;
      gHexes[id].path.style.stroke = 'white';
    }
  }
  static unhighlight_all_hexes() {
    // Unhighlight all hexagons
    for (let id in gLatestState.map.states) {
      gHexes[id].path.style.strokeWidth = 0;
      gHexes[id].path.style.stroke = '#0000';
    }
  }
  troop_id() {
    let armies = [];
    for (let nationName in gLatestState.nations) {
      let army = gLatestState.nations[nationName].army;
      armies = armies.concat(army);
    }
    armies = armies.filter(x => x.territory == this.id);
    if (armies.length === 0) {
      return null;
    }
    return armies[0].id;
  }
  _attackclick() {
    let nationName = gLatestState.stage.turn;

    if (gSelectedHex) {
      let attacker = gSelectedHex.troop_id();
      if (!attacker) {
        return;
      }
      if (!gSelectedHex.unit_owned_by(nationName)) {
        return;
      }
      let targets = utils.valid_attacks_for_troop(gLatestState, gSelectedHex.id).map(x => x + '');
      if (targets.includes(this.id + '')) {
        if (this.troop_id()) {
          send({
            "method": "attack",
            "args": [attacker, this.troop_id()]
          });
        } else {
          let type = null;
          switch (this.type) {
            case kTileTypeFactory:
              type = 'factory';
              break;
            case kTileTypeBarracks:
              type = 'barrack';
              break;
          }
          if (type) {
            send({
              "method": "raze",
              "args": [attacker, type, this.id]
            });
          }
        }
      }
      gSelectedHex.on_deselect();
      Hex.unhighlight_all_hexes();
      return;
    }

    Hex.unhighlight_all_hexes();

    // Highlight adjacent hexagons
    if (this.troopType) {
      let army = gLatestState.nations[nationName].army;
      let unit = unwrap(army.filter(x => x.territory == this.id));
      if (unit.can_attack) {
        this.on_select();
        let targets = utils.valid_attacks_for_troop(gLatestState, this.id);
        this.highlight_hexes(targets);
      }
    }
  }
  _spawnclick() {
    let nationName = gLatestState.stage.turn;
    let owner = utils.territory_to_owner(gLatestState, this.id);
    let homeContinentAbbr = utils.nation_name_from_abbr(gLatestState, this.homeContinent);
    let territory = gLatestState.nations[homeContinentAbbr][this.id];

    if (nationName !== owner) {
      Hex.unhighlight_all_hexes();
      return;
    }

    if (gSelectedHex) {
      let valid = utils.territories_barracks_can_spawn_to(gLatestState, gSelectedHex.id);


      let type = null;
      if (soldierRadio.checked) {
        type = "Infantry";
      } else if (artilleryRadio.checked) {
        type = "Artillery";
      } else if (calvaryRadio.checked) {
        type = "Cavalry";
      }

      if (type && valid.includes(this.id)) {
        send({
          "method": "spawn",
          "args": [this.id, type]
        });
      }
      gSelectedHex.on_deselect();
      Hex.unhighlight_all_hexes();
      return;
    }

    Hex.unhighlight_all_hexes();

    if (this.disabled()) {
      return;
    }

    let targets = utils.territories_barracks_can_spawn_to(gLatestState, this.id);
    if (targets.length > 0) {
      this.on_select();
      this.highlight_hexes(targets);
    }
  }
  _buildclick() {
    let type = null;
    if (barracksRadio.checked) {
      type = "barracks";
    } else if (factoryRadio.checked) {
      type = "factory";
    }
    if (type && this.owner == gLatestState.stage.turn) {
      send({
        "method": "build",
        "args": [this.id, type]
      });
    }
  }
  click() {
    console.log('click', this.id);
    if (gLatestState.stage.phase !== 'Action') {
      if (gSelectedHex) {
        gSelectedHex.on_deselect();
      }
      return;
    }
    let nationName = gLatestState.stage.turn;
    if (gLatestState.nations[nationName].president != gUsername) {
      if (gSelectedHex) {
        gSelectedHex.on_deselect();
      }
      return;
    }

    if (gLatestState.stage.subphase === 'Move') {
      this._moveclick();
      return;
    }
    else if (gLatestState.stage.subphase === 'Attack') {
      this._attackclick();
      return;
    }
    else if (gLatestState.stage.subphase === 'Spawn') {
      this._spawnclick();
      return;
    }
    else if (gLatestState.stage.subphase === 'Build') {
      this._buildclick();
      return;
    }
  }
  get troopType() {
    if (this.type === kTileTypeCannon) {
      return 'Artillery';
    }
    if (this.type === kTileTypeCalvary) {
      return 'Calvary';
    }
    if (this.type === kTileTypeInfantry) {
      return 'Infantry';
    }
    return null;
  }
  set_type(type) {
    if (type === this.type) {
      return;
    }
    this.type = type;

    if (this.image && hexMap.contains(this.image)) {
      mapIcons.removeChild(this.image);
    }

    if (type === kTileTypeEmpty) {
      return;
    }

    let x = this.screenX - kMapScale / 2;
    let y = this.screenY - kMapScale / 2;
    let w = kMapScale;
    let h = kMapScale;

    if (type == kTileTypeBarracks) {
      y -= kMapScale * 0.1;
    } else if (type == kTileTypeFactory) {
      x += kMapScale * 0.1;
      y += kMapScale * 0.05;
      w *= 0.8;
      h *= 0.8;
    }

    this.image = svg.image(
      "./assets/" + type,
      x, y,
      { "width": w, "height": h }
    );

    mapIcons.appendChild(this.image);
    this.image.addEventListener('click', (e) => {
      this.click(e);
    });
  }
}
