import { useEffect } from "react";
import "./App.css";
import Player from "./Components/Player/Player";
import { Provider, useGameContext } from "./Context";

import { ACTION_TYPES, defaultState, reducer } from "./State/State";

function App() {
  const { state, dispatch } = useGameContext();
  useEffect(() => {
    const {gameStart, player1: { isReady: ready1 }, player2: { isReady: ready2 } } = state;
    if (ready1 && ready2 && !gameStart) {
      dispatch({ type: ACTION_TYPES.START_GAME });
    }
} , [state])

  return (
    <div className="game">
      <div className="players">
        <h1> Turn {state.turn} </h1>
        <Player playerId="player1" />
        <Player playerId="player2" />
      </div>
    </div>
  );
}

export default App;
