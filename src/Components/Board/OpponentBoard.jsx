import React from "react";
import "../../App.css";
import { useGameContext } from "../../Context";
import groupArray from "../../helpers/groupArray";
import setClass, { setOpponentClass } from "../../helpers/setClass";
import { ACTION_TYPES } from "../../State/State";

export default function OpponentBoard({ playerId, opponentId }) {
  const { state, dispatch } = useGameContext();

  const {
    [opponentId]: { isSetShipMode },
  } = state;

  const hitShip = (id) => {
    if (state[opponentId].ships.has(id)) {
      dispatch({ type: ACTION_TYPES.SET_BEATEN, id, opponentId });
    } else {
      dispatch({ type: ACTION_TYPES.SET_PASS, id, opponentId });
    }
  };

  return (
    <div className={setClass(isSetShipMode, "set-ships-mode")}>
      <h1 className="player2-header"> Player {opponentId} </h1>
      {groupArray().map((row) => (
        <div className="row">
          {row.map((square) => (
            <div onClick={() => hitShip(square)} className="square">
              <div
                className={setOpponentClass(state[opponentId], square)}
              ></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
