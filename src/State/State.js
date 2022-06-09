export const defaultState = {
  player1: {
    isSetShipMode: false,
    ships: new Set(),
    beaten: new Set(),
    pass: new Set(),
    isReady: false,
  },
  player2: {
    isSetShipMode: false,
    ships: new Set(),
    beaten: new Set(),
    pass: new Set(),
    isReady: false,
  },
  gameStart: false,
  turn: "player1",
};

export const ACTION_TYPES = {
  SET_SHIPS: "SET_SHIPS",
  SET_BEATEN: "SET_BEATEN",
  SET_PASS: "SET_PASS",
  SET_SET_SHIPS_MODE: "SET_SET_SHIPS_MODE",
  START_GAME: "START_GAME",
  SET_IS_READY: "SET_IS_READY",
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
      return {
        ...state,
        [action.opponentId]: { ...state[action.opponentId], beaten: newBeaten },
      };
    }
    case ACTION_TYPES.SET_PASS: {
      let newPass = new Set([...state[action.opponentId].pass]);
      newPass.add(action.id);
      return {
        ...state,
        [action.opponentId]: { ...state[action.opponentId], pass: newPass },
      };
    }
    case ACTION_TYPES.START_GAME: {
      return { ...state, gameStart: true };
    }
    case ACTION_TYPES.SET_IS_READY: {
      return {
        ...state,
        [action.playerID]: { ...state[action.playerID], isReady: true },
      };
    }
  }
};
