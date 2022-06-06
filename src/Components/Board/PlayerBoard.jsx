import React from "react";
import "../../App.css";
import { useGameContext } from "../../Context";
import groupArray from "../../helpers/groupArray";
import setClass, { setPlayerClass } from "../../helpers/setClass";
import { ACTION_TYPES } from "../../State/State";

export default function PlayerBoard({ playerId }) {
  const {
    state: {
      [playerId]: { isSetShipMode },
    },
    state,
    dispatch,
  } = useGameContext();

  const setShips = (id) => {
    if (isSetShipMode) {
      dispatch({ type: ACTION_TYPES.SET_SHIPS, square: id });
    }
  };

  return (
    <div className={setClass(isSetShipMode, "set-ships-mode")}>
      <h1> Player {playerId} </h1>
      {groupArray().map((row) => (
        <div className="row">
          {row.map((square) => (
            <div onClick={() => setShips(square)} className="square">
              <div className={setPlayerClass(state[playerId], square)}></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
