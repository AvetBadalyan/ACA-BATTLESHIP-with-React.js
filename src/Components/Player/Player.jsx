import React from "react";
import { useGameContext } from "../../Context";
import OpponentBoard from "../Board/OpponentBoard";
import PlayerBoard from "../Board/PlayerBoard";

export default function Player(playerId) {
  const { state, dispatch } = useGameContext();

  const setShipsMode = () => {
    dispatch({ type: ACTION_TYPES.SET_SET_SHIPS_MODE });
  };

  return (
    <div>
      <PlayerBoard state={state} dispatch={dispatch} player={1} />
      <button onClick={setShipsMode}> Set Ships </button>
      <OpponentBoard state={state} dispatch={dispatch} player={2} />
    </div>
  );
}
