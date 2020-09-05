let utils = {
	num_shares_already_auctioned_for_nation: (state) => {
	  let r = {};
	  for (let name in state.nations) {
	    r[name] = 0;
	  }
	  for (let player of Object.values(state.players)) {
	    for (let nation in player.shares) {
	      r[nation] += player.shares[nation];
	    }
	  }
	  return r;
	}
};

// Terrible hack so this can be included on frontend.
try { module.exports = utils; } catch (err) {}
