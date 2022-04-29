import { useReducer } from "react";
import "./App.css";
import OponentBoard from "./Components/OponentBoard";
import PlayerBoard from "./Components/PlayerBoard";
import { ACTION_TYPES, defaultState, reducer } from "./State/State";

function App() {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const setShipsMode = () => {
    dispatch({ type: ACTION_TYPES.SET_SET_SHIPS_MODE });
  };

  return (
    <>
      <PlayerBoard state={state} dispatch={dispatch} player={1} />
      <button onClick={setShipsMode}>Set ships</button>
      <OponentBoard state={state} dispatch={dispatch} player={2} />
    </>
  );
}

export default App;
