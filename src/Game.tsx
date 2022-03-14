import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

import style from "./Game.module.scss";
import {
  actions,
  applyAction,
  formatNumber,
  initialGameState,
  tick,
} from "./GameLogic";

const Game = () => {
  const position = [0, 0];
  const [gameState, setGameState] = useState(initialGameState);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setGameState(tick);
    }, 100); // 10tps

    return () => {
      console.log(`Clear interval: ${intervalId}`);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      {/* <MapContainer
        className={style.map}
        placeholder
        center={position}
        zoom={1}
        scrollWheelZoom={false}
      >
        {/* attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' * /}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer> */}
      <div>
        {Object.entries(gameState).map(([name, value]) => (
          <p key={name}>
            {name}: {value}
          </p>
        ))}
      </div>
      <div>
        {actions
          .filter(({ visible }) => visible(gameState))
          .map((action) => (
            <div key={action.name}>
              <button
                disabled={gameState.currentViruses < action.cost(gameState)}
                onClick={() =>
                  setGameState(
                    applyAction(action.cost(gameState), action.levelUp)
                  )
                }
              >
                {action.name} ({action.cost(gameState)})
              </button>
              { action.description }
            </div>
          ))}
      </div>
    </>
  );
};

export default Game;
