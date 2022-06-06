import React from "react";
import "../../App.css";
import groupArray from "../../helpers/groupArray";
import setClass, { setOpponentClass } from "../../helpers/setClass";
import { ACTION_TYPES } from "../../State/State";

export default function OpponentBoard({ state, dispatch, player }) {

  const playerId = player === "player1" ? "player2" : "player1";

  const {
    [playerId]: { isSetShipMode }
  } = state;

  const hitShip = (id) => {
    if (state.player1.ships.has(id)) {
      dispatch({ type: ACTION_TYPES.SET_BEATEN, id });
    } else {
      dispatch({ type: ACTION_TYPES.SET_PASS, id });
    }
  };

  return (
    <div className={setClass(isSetShipMode, "set-ships-mode")}>
      <h1> Player {player} </h1>
      {groupArray().map((row) => (
        <div className="row">
          {row.map((square) => (
            <div onClick={() => hitShip(square)} className="square">
              <div className={setOpponentClass(state[playerId], square)}></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
