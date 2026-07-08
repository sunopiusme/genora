export type ActivityPeriodId = "all" | "30d" | "7d";

export type ActivityStat = {
  label: string;
  value: string;
};

export type ActivityPeriod = {
  id: ActivityPeriodId;
  label: string;
  stats: ActivityStat[];
  cells: number[];
};

export const ACTIVITY_ROWS = 7;
export const ACTIVITY_COLUMNS = 26;

const CELL_COUNT = ACTIVITY_ROWS * ACTIVITY_COLUMNS;

function buildCells(seed: number, density: number): number[] {
  const cells: number[] = [];
  let state = seed;
  for (let index = 0; index < CELL_COUNT; index += 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const roll = state / 4294967296;
    const recency = index / CELL_COUNT;
    const chance = density * (0.35 + recency * 0.65);
    if (roll < chance * 0.35) {
      cells.push(3);
    } else if (roll < chance * 0.65) {
      cells.push(2);
    } else if (roll < chance) {
      cells.push(1);
    } else {
      cells.push(0);
    }
  }
  return cells;
}

export const DEFAULT_ACTIVITY_PERIOD: ActivityPeriod = {
  id: "all",
  label: "Всё",
  stats: [
    { label: "Сессии", value: "147" },
    { label: "Сообщения", value: "18 062" },
    { label: "Токены", value: "25,4 млн" },
    { label: "Дней подряд", value: "11" },
  ],
  cells: buildCells(20260709, 0.62),
};

export const ACTIVITY_PERIODS: ActivityPeriod[] = [
  DEFAULT_ACTIVITY_PERIOD,
  {
    id: "30d",
    label: "30д",
    stats: [
      { label: "Сессии", value: "42" },
      { label: "Сообщения", value: "5 118" },
      { label: "Токены", value: "7,1 млн" },
      { label: "Дней подряд", value: "11" },
    ],
    cells: buildCells(20260630, 0.48),
  },
  {
    id: "7d",
    label: "7д",
    stats: [
      { label: "Сессии", value: "12" },
      { label: "Сообщения", value: "1 304" },
      { label: "Токены", value: "1,8 млн" },
      { label: "Дней подряд", value: "7" },
    ],
    cells: buildCells(20260702, 0.3),
  },
];
