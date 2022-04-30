import React from "react";
import "../../App.css";
import groupArray from "../../helpers/groupArray";
import setClass, { setPlayerClass } from "../../helpers/setClass";
import { ACTION_TYPES } from "../../State/State";

export default function PlayerBoard({ state, dispatch, player }) {
  const {
    player1: { isSetShipMode, ships },
  } = state;

  const setShips = (id) => {
    if (state.player1.isSetShipMode) {
      dispatch({ type: ACTION_TYPES.SET_SHIPS, square: id });
    }
  };

  return (
    <div className={setClass(isSetShipMode, "set-ships-mode")}>
      <h1> Player {player} </h1>
      {groupArray().map((row) => (
        <div className="row">
          {row.map((square) => (
            <div className="square" onClick={() => setShips(square)}>
              <div className={setPlayerClass(state.player1, square)}></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
