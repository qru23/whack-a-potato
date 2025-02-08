export type Position = {
  x: number,
  y: number,
}

export interface Potato {
  id: number,
  sprite: string,
  position: Position,
  isGlitty: boolean,
}