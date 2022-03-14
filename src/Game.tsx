import classNames from "classnames";
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
      <div className={style.container}>
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
        <div className={style.features}>
          {Object.entries(gameState)
            .filter(([name]) => name !== "infected")
            .map(([name, value]) => (
              <p key={name}>
                {name}: {formatNumber(value as number)}
              </p>
            ))}
        </div>
        <div className={style.chart}>
          <ul>
            {gameState.infected.map((n, i) => (
              <li
                key={i}
                className={classNames({
                  [style.dying]: gameState.lethality > i,
                  [style.contagious]: gameState.contagionTime > i,
                })}
              >
                {formatNumber(n)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <div className={style.actions}>
          {actions
            .filter(({ visible }) => visible(gameState))
            .map((action) => (
              <div key={action.name}>
                <button
                  disabled={!action.enabled(gameState) || (gameState.currentViruses < action.cost(gameState))}
                  onClick={() =>
                    setGameState(
                      applyAction(action.cost(gameState), action.levelUp)
                    )
                  }
                >
                  {action.name} ({action.cost(gameState)})
                </button>
                {" "}
                {action.description}
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default Game;
