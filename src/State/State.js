export const defaultState = {
  player1: {
    isSetShipMode: false,
    ships: new Set(),
    beaten: new Set(),
    pass: new Set(),
  },
  player2: {
    isSetShipMode: false,
    ships: new Set(),
    beaten: new Set(),
    pass: new Set(),
  },
  turn: "player1",
};

export const ACTION_TYPES = {
  SET_SHIPS: "SET_SHIPS",
  SET_BEATEN: "SET_BEATEN",
  SET_PASS: "SET_PASS",
  SET_SET_SHIPS_MODE: "SET_SET_SHIPS_MODE",
};

export const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_SET_SHIPS_MODE: {
      return {
        ...state,
        [action.playerId]: {
          ...state[action.playerId],
          isSetShipMode: !state[action.playerId].isSetShipMode,
        },
      };
    }
    case ACTION_TYPES.SET_SHIPS: {
      let newShips = new Set([...state[action.playerId].ships]);
      if (newShips.has(action.square)) {
        newShips.delete(action.square);
      } else {
        newShips.add(action.square);
      }
      return {
        ...state,
        [action.playerId]: { ...state[action.playerId], ships: newShips },
      };
    }
    case ACTION_TYPES.SET_BEATEN: {
      let newBeaten = new Set([...state[action.opponentId].beaten]);
      newBeaten.add(action.id);
      return { ...state,[action.opponentId]: { ...state[action.opponentId], beaten: newBeaten } };
    }
    case ACTION_TYPES.SET_PASS: {
      let newPass = new Set([...state[action.opponentId].pass]);
      newPass.add(action.id);
      return { ...state,[action.opponentId]: { ...state[action.opponentId], pass: newPass } };
    }
  }
};
