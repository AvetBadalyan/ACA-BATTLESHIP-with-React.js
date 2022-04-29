export const defaultState = {
  player1: {
    isSetShipMode: false,
    ships: new Set(),
  },
  player2: {},
  turn: "player1",
};

export const ACTION_TYPES = {
  SET_SHIPS: "SET_SHIPS",
  SET_SET_SHIPS_MODE: "SET_SET_SHIPS_MODE",
};

export const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_SET_SHIPS_MODE: {
      return {
        ...state,
        player1: {
          ...state.player1,
          isSetShipMode: !state.player1.isSetShipMode,
        },
      };
    }
    case ACTION_TYPES.SET_SHIPS: {
      let newShips = new Set([...state.player1.ships]);
      if (newShips.has(action.square)) {
        newShips.delete(action.square);
      } else {
        newShips.add(action.square);
      }
      return { ...state, player1: { ...state.player1, ships: newShips } };
    }
  }
};
