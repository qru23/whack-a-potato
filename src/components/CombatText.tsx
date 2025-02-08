import { Position } from '../types'

export function CombatText(
  { value, position }: { value: number, position: Position }
) {
  return (
    <span
      style={{
        position: 'absolute',
        left: position.x,
        bottom: position.y,
        fontSize: '32px',
        fontWeight: 'bold',
        color: value < 0 ? 'red' : 'green',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        animation: 'floatText 0.8s ease-out forwards',
        zIndex: 10,
      }}
    >
      {value}
    </span>
  )
}