import { useReducer } from "react";
import "./App.css";
import OpponentBoard from "./Components/Board/OpponentBoard";
import PlayerBoard from "./Components/Board/PlayerBoard";
import { Provider } from "./Context";

import { ACTION_TYPES, defaultState, reducer } from "./State/State";

function App() {


  return (
    <Provider>
      <PlayerBoard player={1} />
      <OpponentBoard player={2} />
    </Provider>
  );
}

export default App;
