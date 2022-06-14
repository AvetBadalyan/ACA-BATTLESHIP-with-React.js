import React from "react";
import { Link } from "react-router-dom";
import "./Welcome.css";
import "./../../App.css"

export default function Welcome() {
  return (
    <div className="welcome-page">
      <header>
        <h1>Battleship</h1>

        <p className="subtitle"> A strategy game at sea</p>
      </header>
      ;
      <main>
        <h2 className="title">Rules</h2>
        <p className="player-tip">
          You and your opponent are competing navy commanders. Your fleets are
          positioned at secret coordinates, and you take turns firing torpedoes
          at each other. The first to sink the other person’s whole fleet wins!
        </p>
        <Link to={"/players"}>
          <button className="play-button"> PLAY THE GAME </button>
        </Link>
      </main>
    </div>
  );
}
