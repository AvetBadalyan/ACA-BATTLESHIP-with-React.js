import React from "react";
import { useGameContext } from "../../Context";
import { ACTION_TYPES } from "../../State/State";
import OpponentBoard from "../Board/OpponentBoard";
import PlayerBoard from "../Board/PlayerBoard";


export default function Player({playerId}) {
  const {  dispatch } = useGameContext();

  const opponentId = playerId === "player1" ? "player2" : "player1";

  const setShipsMode = () => {
    dispatch({ type: ACTION_TYPES.SET_SET_SHIPS_MODE });
  };

  return (
    <div>
      <PlayerBoard playerId={playerId} />
      <button onClick={setShipsMode}> Set Ships </button>
      <OpponentBoard playerId={opponentId} />
    </div>
  );
}
