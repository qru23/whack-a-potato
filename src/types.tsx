export type Position = {
  x: number,
  y: number,
}

export type Actor = {
  name: string,
  sprite: string,
  width: number,
  height: number,
  spawnRate: number,
  score: number,
  sfx: string[],
}

export interface Potato {
  id: number,
  actorData: Actor,
  position: Position,
  isGlitty: boolean,
  created: number,
}