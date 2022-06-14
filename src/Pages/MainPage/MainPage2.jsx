import React from 'react';
import { Provider, useGameContext } from '../../Context';
import { useEffect } from 'react';
import Player from '../../Components/Player/Player';
import "./MainPage.css"
import { ACTION_TYPES, defaultState, reducer } from "../../State/State";

export default function MainPage2() {
   const { state, dispatch } = useGameContext();
   useEffect(() => {
     const {
       gameStart,
       player1: { isReady: ready1 },
       player2: { isReady: ready2 },
     } = state;
     if (ready1 && ready2 && !gameStart) {
       dispatch({ type: ACTION_TYPES.START_GAME });
     }
   }, [state]);

   return (
     <div className="game">
       <div className="players">
         <h1 className="turn"> Turn {state.turn} </h1>
         <Player playerId="player2" />
       </div>
     </div>
   );
}
