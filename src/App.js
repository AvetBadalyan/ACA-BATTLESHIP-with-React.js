import "./App.css";
import Player from "./Components/Player/Player";
import { Provider } from "./Context";

import { ACTION_TYPES, defaultState, reducer } from "./State/State";

function App() {
  return (
    <div className="game">
      <Provider>
        <div className="players">
          <Player playerId="player1" />
          <Player playerId="player2" />
        </div>
      </Provider>
    </div>
  );
}

export default App;
