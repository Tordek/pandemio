type Feature =
  | "currentViruses"
  | "totalViruses"
  | "sanitation"
  | "healthyHumans"
  | "deadHumans"
  | "manualInfections"
  | "rateOfInfection"
  | "contagionTime"
  | "rateOfReplicaton"
  | "incubationTime"
  | "lethality"
  | "day"
  | "time";

type GameState = Record<Feature, number> & { infected: number[] };

type Action = {
  name: string;
  visible: (gameState: GameState) => boolean;
  cost: (gameState: GameState) => number;
  levelUp: (g: GameState) => Partial<GameState>;
  maxLevel: number | null;
  description: string;
};

// Helpers
const exponentialCost =
  (
    baseCost: number,
    costFactor: number,
    feature: Feature
  ): ((gameState: GameState) => number) =>
  (gameState: GameState) =>
    Math.floor(baseCost * Math.pow(costFactor, gameState[feature]));

const applyAction = (
  cost: number,
  action: (gameState: GameState) => Partial<GameState>
): ((gameState: GameState) => GameState) => {
  return (gameState) => ({
    ...gameState,
    currentViruses: gameState.currentViruses - cost,
    ...action(gameState),
  });
};

const formatNumber = (number_: number): string => {
  const number = Math.floor(number_);

  if (number < 10000) {
    return `${number}`;
  }

  if (number < 10000000) {
    return `${Math.floor(number / 1000)}k`;
  }

  if (number < 10000000000) {
    return `${Math.floor(number / 1000000)}M`;
  }

  if (number < 10000000000000) {
    return `${Math.floor(number / 1000000000)}G`;
  }

  return number.toExponential();
};

const purchaseAction =
  (feature: Feature): ((gameState: GameState) => Partial<GameState>) =>
  (gameState: GameState): Partial<GameState> => ({
    [feature]: gameState[feature] + 1,
  });

// Actions
const breedVirus = (gameState: GameState): Partial<GameState> => ({
  currentViruses: gameState.currentViruses + 1,
  totalViruses: gameState.totalViruses + 1,
});

const infectHuman = (gameState: GameState): Partial<GameState> => {
  const newlyInfected = gameState.infected[gameState.infected.length - 1] + 1;
  const infected = gameState.infected.slice(0, gameState.infected.length - 1);
  infected.push(newlyInfected);
  return {
    infected,
    healthyHumans: gameState.healthyHumans - 1,
    manualInfections: gameState.manualInfections + 1,
  };
};

// Initial state
const actions: Action[] = [
  {
    name: "Replicate",
    description: "Create a new copy of the virus. Upgrades consume viruses.",
    cost: () => 0,
    levelUp: breedVirus,
    maxLevel: null,
    visible: () => true,
  },
  {
    name: "Infect Human",
    cost: (gameState: GameState) =>
      Math.floor(
        100 - gameState.sanitation * Math.pow(1.5, gameState.manualInfections)
      ),
    description:
      "Jump to a human host. Humans incubate the disease and make more viruses. They might infect other humans.",
    levelUp: infectHuman,
    maxLevel: null,
    visible: ({ totalViruses }) => totalViruses > 50,
  },
  {
    name: "Lower sanitation",
    cost: exponentialCost(100, 1.02, "sanitation"),
    description: "Easier to jump to human hosts.",
    levelUp: infectHuman,
    maxLevel: null,
    visible: ({ totalViruses }) => totalViruses > 50,
  },
  {
    name: "Adapt to human physiology",
    cost: exponentialCost(200, 1.04, "rateOfReplicaton"),
    description: "Humans create more viruses.",
    levelUp: purchaseAction("rateOfReplicaton"),
    maxLevel: 50,
    visible: ({ totalViruses }) => totalViruses > 100,
  },
  {
    name: "Adapt to human immune system",
    cost: exponentialCost(200, 1.04, "rateOfInfection"),
    description: "Humans infect each other faster.",
    levelUp: purchaseAction("rateOfInfection"),
    maxLevel: 50,
    visible: ({ totalViruses }) => totalViruses > 100,
  },
  {
    name: "Weaken defenses",
    cost: exponentialCost(200, 1.04, "contagionTime"),
    description: "Humans infect each other more often.",
    levelUp: purchaseAction("contagionTime"),
    maxLevel: 50,
    visible: ({ totalViruses }) => totalViruses > 100,
  },
  {
    name: "Lower incubation time",
    cost: exponentialCost(200, 1.04, "incubationTime"),
    description:
      "Improved replication DNA. Time from infection to activation is lowered.",
    levelUp: purchaseAction("incubationTime"),
    maxLevel: 50,
    visible: ({ totalViruses }) => totalViruses > 100,
  },
  {
    name: "Invade systems",
    cost: exponentialCost(200, 1.04, "lethality"),
    description: "Kill them all.",
    levelUp: purchaseAction("lethality"),
    maxLevel: 50,
    visible: ({ totalViruses }) => totalViruses > 10000,
  },
];

const initialGameState = (): GameState => ({
  currentViruses: 0,
  totalViruses: 0,
  healthyHumans: 7000000000,
  deadHumans: 0,
  sanitation: 0,
  manualInfections: 0,
  rateOfInfection: 0,
  lethality: 0,
  contagionTime: 0,
  incubationTime: 0,
  rateOfReplicaton: 0,
  infected: Array(30).fill(0),
  day: 1,
  time: 0,
});

const tick = (immutableGameState: GameState): GameState => {
  const gameState = {
    ...immutableGameState,
    infected: [...immutableGameState.infected],
  };

  gameState.time -= 1;

  if (gameState.time <= 0) {
    gameState.time = 10; // ticks per second

    gameState.day += 1;

    // Replication (Infected human => virus)
    const totalInfected = gameState.infected.reduce((a, b) => a + b, 0);
    const transmittedViruses = totalInfected * gameState.rateOfReplicaton * 0.1;
    gameState.currentViruses += transmittedViruses;
    gameState.totalViruses += transmittedViruses;

    // Contagion (Infected human => human)
    const sick = gameState.infected.shift() as number;

    const contagious = gameState.infected.slice(0, gameState.contagionTime).reduce((a, b) => a + b, 0);
    const newInfectedHumans = contagious * gameState.rateOfInfection * 0.01;    
    gameState.infected.push(newInfectedHumans);

    // Kill (Infected human => dead human)
    const dead = sick * gameState.lethality;

    gameState.infected[0] += sick - dead;
    gameState.deadHumans += dead;
  }

  return gameState;
};

export { initialGameState, actions, tick, applyAction, formatNumber };
