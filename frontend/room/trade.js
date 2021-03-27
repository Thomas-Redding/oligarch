
function _trade_moneyString(num) {
  return gLatestState.settings.moneyPrefix + num + gLatestState.settings.moneyPostfix;
}

let _trade_nationColors = {
  'North America': '#e0e060',
  'South America': '#60ffff',
  'Europe': '#6080ff',
  'Africa': '#e08060',
  'Asia': '#60ff60',
  'Australia': '#ff60ff',
}

let gTradeYou = null;
let gTradeThem = null;
let gTradeDelta = null;
let gTradeIcon = null;
function increment_offer(delta) {
  if (!gTradeIcon) {
    gTradeIcon = document.createElement("div");
    gTradeIcon.classList.add("button");
    gTradeIcon.style.backgroundColor = '#8f8';
    gTradeIcon.style.cursor = 'default';
  }

  if (gTradeIcon.parentNode) {
    gTradeIcon.parentNode.removeChild(gTradeIcon);
  }

  gTradeDelta += delta;
  if (gTradeDelta > gLatestState.players[gTradeYou].cash) {
    gTradeDelta = gLatestState.players[gTradeYou].cash;
  } else if (-gTradeDelta > gLatestState.players[gTradeThem].cash) {
    gTradeDelta = -gLatestState.players[gTradeThem].cash;
  }
  gTradeIcon.innerHTML = _trade_moneyString(Math.abs(gTradeDelta));

  if (gTradeDelta > 0) {
    tradeDivYourOffer.appendChild(gTradeIcon);
    update_offer_trade_button();
  } else if (gTradeDelta < 0) {
    tradeDivTheirOffer.appendChild(gTradeIcon);
    update_offer_trade_button();
  }
}

function offer_trade() {
  if (offerTradeButton.classList.contains('disabled-button')) {
    return;
  }

  let player = tradeWithDiv.innerHTML.slice(13);

  let yourOffer = [];
  for (let div of tradeDivYourOffer.children) {
    yourOffer.push(div.innerHTML);
  }

  let theirOffer = [];
  for (let div of tradeDivTheirOffer.children) {
    theirOffer.push(div.innerHTML);
  }

  let arr2val = (val) => {
    if (val.startsWith("$")) {
      val = val.slice(gLatestState.settings.moneyPrefix.length, val.length - gLatestState.settings.moneyPostfix.length);
      return parseInt(val);
    }
    return {
      "NA": "North America",
      "SA": "South America",
      "EU": "Europe",
      "AF": "Africa",
      "AS": "Asia",
      "AU": "Australia"
    }[val];
  }

  yourOffer = yourOffer.map(arr2val);
  theirOffer = theirOffer.map(arr2val);

  let yourCashOffer = utils.sum(yourOffer.map(x => typeof(x) === "number" ? x : 0));
  let theirCashOffer = utils.sum(theirOffer.map(x => typeof(x) === "number" ? x : 0));

  yourOffer = yourOffer.filter(x => typeof(x) !== "number");
  theirOffer = theirOffer.filter(x => typeof(x) !== "number");

  send({
    "method": "initTrade",
    "args": [ player, yourOffer, theirOffer, yourCashOffer, theirCashOffer ]
  });
  close_modal();
}

function update_offer_trade_button() {
  if (tradeDivYourOffer.children.length + tradeDivTheirOffer.children.length > 0) {
    offerTradeButton.classList.remove('disabled-button');
  } else {
    offerTradeButton.classList.add('disabled-button');
  }
}

function trade_with(playername) {
  gTradeDelta = 0;
  gTradeIcon = null;
  tradeWithDiv.innerHTML = "Trading with " + playername;

  tradeDivYourAssets.innerHTML = "";
  tradeDivTheirAssets.innerHTML = "";
  tradeDivYourOffer.innerHTML = "";
  tradeDivTheirOffer.innerHTML = "";

  gTradeYou = gUsername;
  gTradeThem = playername;

  let you = gLatestState.players[gTradeYou];
  let them = gLatestState.players[gTradeThem];

  let playerIncomeIcon = {};

  const shortenName = {
    "North America": "NA",
    "South America": "SA",
    "Europe": "EU",
    "Africa": "AF",
    "Asia": "AS",
    "Australia": "AU",
  }

  for (let i = 0; i < 2; ++i) {
    let player = (i == 0 ? you : them);
    let td = (i == 0 ? tradeDivYourAssets : tradeDivTheirAssets);

    {
      let button = document.createElement("DIV");
      button.classList.add("button");
      button.innerHTML = _trade_moneyString(player.cash);
      button.style.margin = '0.5em';
      button.style.backgroundColor = '#777';
      button.style.cursor = 'default';
      playerIncomeIcon[player.username] = playerIncomeIcon;
      td.appendChild(button);
    }

    for (let share in player.shares) {
      for (let i = 0; i < player.shares[share]; ++i) {
        let button = document.createElement("DIV");
        button.classList.add("button");
        button.innerHTML = shortenName[share];
        button.style.margin = '0.5em';
        button.onclick = () => {
          let parent = button.parentNode;
          button.parentNode.removeChild(button);
          if (parent === tradeDivYourAssets) {
            tradeDivYourOffer.appendChild(button);
            update_offer_trade_button();
          } else if (parent === tradeDivTheirAssets) {
            tradeDivTheirOffer.appendChild(button);
            update_offer_trade_button();
          } else if (parent === tradeDivYourOffer) {
            tradeDivYourAssets.appendChild(button);
            update_offer_trade_button();
          } else if (parent === tradeDivTheirOffer) {
            tradeDivTheirAssets.appendChild(button);
            update_offer_trade_button();
          }
        }
        td.appendChild(button);
      }
    }
  }

  tradePopupDiv.style.display = "none";
  tradePopup2Div.style.display = "flex";
  offerTradeButton.classList.add('disabled-button');
}

let tradeProposal = null;
function show_trade_proposal(proposal) {
  tradeProposal = proposal;
  let shares_to_player = count(proposal.shares_to);
  let shares_from_player = count(proposal.shares_from);

  let foo;
  if (proposal.shares_to.length === 0) {
    if (proposal.cash_to === 0) {
      foo = "nothing";
    } else {
      foo = _trade_moneyString(proposal.cash_to);
    }
  } else {
    foo = '';
    for (let nation in shares_to_player) {
      foo += ` <span style="color:` + _trade_nationColors[nation] + ` ">` + utils.NATIONS[nation].abbr + '</span>x' + shares_to_player[nation] + ' ';
    }
    if (proposal.cash_to > 0) {
      foo += " and " + _trade_moneyString(proposal.cash_to);
    }
  }

  let bar;
  if (proposal.shares_from.length === 0) {
    if (proposal.cash_from === 0) {
      bar = "nothing";
    } else {
      bar = _trade_moneyString(proposal.cash_from);
    }
  } else {
    bar = '';
    for (let nation in shares_from_player) {
      bar += ` <span style="color:` + _trade_nationColors[nation] + ` ">` + utils.NATIONS[nation].abbr + '</span>x' + shares_from_player[nation] + ' ';
    }
    if (proposal.cash_from > 0) {
      bar += " and " + _trade_moneyString(proposal.cash_from);
    }
  }

  let t = proposal.to + " receives " + foo;
  t += "<br>" + proposal.from + " receives " + bar;

  tradeSnackbarMessage.innerHTML = t;

  if (proposal.from === gUsername) {
    rescindTradeButton.style.display = "inline-block";
    declineTradeButton.style.display = "none";
    acceptTradeButton.style.display = "none";
  } else {
    rescindTradeButton.style.display = "none";
    declineTradeButton.style.display = "inline-block";
    acceptTradeButton.style.display = "inline-block";
  }

  tradeSnackbarContainer.style.display = "block";
}

function respond_trade(accept) {
  const myUsername = gUsername;

  let i;
  for (i = 0; i < gLatestState.trading_pairs.length; ++i) {
    if (gLatestState.trading_pairs[i].includes(myUsername)) {
      break;
    }
  }

  let pair = gLatestState.trading_pairs[i];
  let tradingPartner = (pair[0] === myUsername ? pair[1] : pair[0]);

  send({
    "method": "respondTrade",
    "args": [
      tradingPartner,
      tradeProposal.shares_to,
      tradeProposal.shares_from,
      tradeProposal.cash_to,
      tradeProposal.cash_from,
      accept
    ]
  });
  tradeSnackbarContainer.style.display = "none";
}

function maybe_show_trade_proposal(state) {
  let trades = gLatestState.trading_pairs.map(x => x[2]);
  let tradesFrom = trades.map(x => x.from);
  let tradesTo = trades.map(x => x.to);
  if (tradesFrom.concat(tradesTo).includes(gUsername)) {
    let i = Math.max(tradesFrom.indexOf(gUsername), tradesTo.indexOf(gUsername));
    show_trade_proposal(trades[i]);
  } else {
    tradeSnackbarContainer.style.display = "none";
  }
}

function update_trade_button(state) {
  if (!["Election", "Auction"].includes(state.phase)) {
    tradeButton.style.display = "inline-block";
  } else {
    tradeButton.style.display = "none";
  }
  if (state.trading_pairs.map(x => x[0]).concat(state.trading_pairs.map(x => x[1])).includes(gUsername)) {
    tradeButton.classList.add('disabled-button');
  } else {
    tradeButton.classList.remove('disabled-button');
  }
}