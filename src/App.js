import { useReducer } from "react";
import "./App.css";
import groupArray from "./helpers/groupArray";
import setClass from "./helpers/setClass";
import { ACTION_TYPES, defaultState, reducer } from "./State/State";

function App() {
  const [state, dispatch] = useReducer(reducer, defaultState);

  const setShipsMode = () => {
    dispatch({ type: ACTION_TYPES.SET_SET_SHIPS_MODE });
  };

  const setShips = (id) => {
    if (state.player1.isSetShipMode) {
      dispatch({ type: ACTION_TYPES.SET_SHIPS, square: id });
    }
  };

  const {
    player1: { isSetShipMode, ships },
  } = state;

  return (
    <div className={setClass(isSetShipMode, "set-ships-mode")}>
      {groupArray().map((row) => (
        <div className="row">
          {row.map((square) => (
            <div className="square" onClick={() => setShips(square)}>
              <div className={setClass(ships.has(square), "has-ship")}></div>
            </div>
          ))}
        </div>
      ))}
      <button onClick={setShipsMode}>Set ships</button>
    </div>
  );
}

export default App;
