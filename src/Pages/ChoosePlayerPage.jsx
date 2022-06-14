import React from "react";
import "./../App.css";
import { Link } from 'react-router-dom';

export default function ChoosePlayerPage() {
  return (
    <div className="choose-player-page">
      <h1>CHOOSE THE PLAYER</h1>
      <div className="choose-player-buttons">
        <Link to={"/players/player1"}>
          <button className="player-button">Player 1</button>
        </Link>

        <Link to={"/players/player2"}>
          <button className="player-button">Player 2</button>
        </Link>
      </div>
    </div>
  );
}
