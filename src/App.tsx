import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { Actor, Position, Potato } from './types'
import { CombatText } from './components/CombatText'

import FuckYourselfSfx from './assets/sfx/Fuck Yourself.wav'
import AhDuSheisseSfx from './assets/sfx/Ah Du Scheiße Man.wav'
import AreYouCrazySfx from './assets/sfx/Are You Crazy 01.wav'
import BruhSfx from './assets/sfx/BRUH.wav'
import MonstercockSfx from './assets/sfx/MONSTERCOCK.wav'
import OhGodSfx from './assets/sfx/Oh GODDH.wav'
import SheisseSfx from './assets/sfx/Scheiße 02.wav'
import ScreamSfx from './assets/sfx/Scream 03.wav'
import ThatWasFuckedUpSfx from './assets/sfx/That Was Fucked Up.wav'
import KrazySfx from './assets/sfx/KRAZY.wav'
import WTFSfx from './assets/sfx/WTF 03.wav'
import YahManSfx from './assets/sfx/Yah Man 03.wav'
import YouBitchesSfx from './assets/sfx/You Bitches.wav'
import HUHSfx from './assets/sfx/HUH.mp3'
import RantSfx from './assets/sfx/RANT.wav'
import AFKSfx from './assets/sfx/HE IS AFK.mp3'

import FarmBG from './assets/farm.webp'

import GlittySprite from './assets/glitty.gif'
import Potato1Sprite from './assets/potato1.gif'
import Potato2Sprite from './assets/potato2.gif'
import Potato3Sprite from './assets/mrpotatohead.gif'
import RatSprite from './assets/rat.gif'

const POTATO_TIMER = 2000
const GAME_TIME = 30

const ACTORS: Actor[] = [
  {
    name: 'glitty',
    sprite: GlittySprite,
    width: 250,
    height: 150,
    spawnRate: 0.4,
    score: 10,
    sfx: [
      FuckYourselfSfx,
      AreYouCrazySfx,
      AhDuSheisseSfx,
      BruhSfx,
      MonstercockSfx,
      OhGodSfx,
      SheisseSfx,
      ScreamSfx,
      ThatWasFuckedUpSfx,
      KrazySfx,
      WTFSfx,
      YahManSfx,
      YouBitchesSfx
    ]
  },
  {
    name: 'rat',
    sprite: RatSprite,
    width: 100,
    height: 150,
    spawnRate: 0.05,
    score: 50,
    sfx: [AFKSfx],
  },  
  {
    name: 'potato1',
    sprite: Potato1Sprite,
    width: 250,
    height: 150,
    spawnRate: 0.2,
    score: -20,
    sfx: [HUHSfx]
  },
  {
    name: 'potato2',
    sprite: Potato2Sprite,
    width: 250,
    height: 150,
    spawnRate: 0.2,
    score: -20,
    sfx: [HUHSfx]
  },
  {
    name: 'potatohead',
    sprite: Potato3Sprite,
    width: 250,
    height: 150,
    spawnRate: 0.15,
    score: -20,
    sfx: [HUHSfx]
  },  
]

function getRandomActor(): Actor {
  const random = Math.random()

  let cumulative = 0

  for (const actor of ACTORS) {
    cumulative += actor.spawnRate
    if (random < cumulative) return actor
  }

  /// Fallback (should never happen if spawnRate sums to 1)
  return ACTORS[ACTORS.length - 1]
}

function pointOverlap(position: Position, potato: Potato) {
  /// Adding an extra 50 to dimensions for padding
  return (
    position.x < potato.position.x + potato.actorData.width + 50 &&  /// Right edge is past the left edge of the potato
    position.x + potato.actorData.width + 50 > potato.position.x &&  /// Left edge is before the right edge of the potato
    position.y < potato.position.y + potato.actorData.height + 50 && /// Top edge is below the bottom edge of the potato
    position.y + potato.actorData.height + 50 > potato.position.y    /// Bottom edge is above the top edge of the potato
  )
}

function App() {
  const [isInGame, setIsInGame] = useState(false)
  const [points, setPoints] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [potatoes, setPotatoes] = useState<Potato[]>([])
  const [numbers, setNumbers] = useState<{ id: number; position: Position; value: number }[]>([])

  const gameEndRantSfxRef = useRef(new Audio(RantSfx))
  const potatoesRef = useRef(potatoes)
  const frameRef = useRef<number | null>(null)
  const nextSpawnRef = useRef<number>(0)

  const startGame = useCallback(() => {
    setStartTime(Date.now())
    setPoints(0)
    setIsInGame(true)
    gameEndRantSfxRef.current.pause()
  }, [])

  const checkGameEnd = useCallback(() => {
    if ((Date.now() - startTime) / 1000 >= GAME_TIME) {
      setIsInGame(false)
      gameEndRantSfxRef.current.play()
    }
  }, [startTime])

  const hitPotato = useCallback((id: number) => {
    const potato = potatoes.find(potato => potato.id === id)
    if (!potato) return

    setPotatoes((potatoes) => {
      return potatoes.filter(potato => potato.id !== id)
    })

    let pointChange = potato.actorData.score

    /// If its a positive score actor, we add a potential double bonus based on click speed
    if (potato.actorData.score > 0) {
      pointChange += Math.floor(
        (1 - ((Date.now() - potato.created) / POTATO_TIMER)) * potato.actorData.score
      )
    }

    setPoints((points) => points + pointChange)

    const numberPosition = potato.position
    numberPosition.x += potato.actorData.width / 2 - 16
    numberPosition.y += potato.actorData.height / 2 - 16

    setNumbers(prev => [...prev, { id: Date.now(), position: numberPosition, value: pointChange }])

    if (potato.actorData.sfx.length > 0) {
      new Audio(
        potato.actorData.sfx[Math.floor(Math.random() * potato.actorData.sfx.length)]
      ).play()
    }
  }, [potatoes])

  const despawnPotato = useCallback((id: number) => {
    setTimeout(() => {
      setPotatoes((potatoes) => {
        return potatoes.filter(potato => potato.id !== id)
      })
    }, POTATO_TIMER);
  }, [])

  /// Sync ref with state
  useEffect(() => {
    potatoesRef.current = potatoes 
  }, [potatoes])

  /// Event loop
  useEffect(() => {
    if (!isInGame) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      return
    }

    const update = () => {
      checkGameEnd()

      if ((frameRef.current || 0) >= nextSpawnRef.current) {
        const position: Position | null = (() => {
          let attempts = 0

          while (attempts < 20) {
            attempts++

            const validPos: Position | null = (() => {
              const pos = {
                x: Math.floor(Math.random() * (window.innerWidth - 300)) + 100,
                y: Math.floor(Math.random() * (window.innerHeight / 2) - 50) + 50
              }

              for (const potato of potatoesRef.current) {
                if (pointOverlap(pos, potato)) {
                  return null
                }
              }

              return pos
            })()
            
            if (validPos) {
              return validPos
            }
          }

          return null
        })()

        if (position === null) {
          frameRef.current = requestAnimationFrame(update)
          return
        }

        const actor = { ...getRandomActor() }
        actor.sprite += `?t=${Date.now()}`

        const newPotato: Potato = { 
          id: Date.now(), 
          actorData: actor,
          position: position,
          isGlitty: actor.name === 'glitty',
          created: Date.now()
        }

        setPotatoes((potatoes) => {
          return [...potatoes, newPotato]
        })

        despawnPotato(newPotato.id)
        nextSpawnRef.current = (frameRef.current || 0) + (Math.floor(Math.random() * 60) + 30)
      }

      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [isInGame])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        top: 0,
        left: 0,
      }}
    >
      {
        !isInGame &&
        <div
          className='overlay-wrapper'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            className='overlay'
            style={{
              width: 350,
              height: 400,
              border: '2px solid black',
              background: '#1D110D',
              borderRadius: 15,
              display: 'flex',
              flexDirection: 'column',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  fontWeight: 'bold',
                }}
              >ZNN Productions</span>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    borderTop: '1px solid white',
                    top: 12,
                    left: 0,
                    width: '100%',
                    zIndex: 0,
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    background: '#1D110D',
                    zIndex: 5,
                    padding: '0rem 0.5rem'
                  }}
                >PRESENTS</span>
              </div>

              <h1
                style={{
                  marginTop: 0
                }}
              >Whack-A-Potato</h1>
            </div>

            <div
              className='overlay-content'
              style={{
                flexGrow: 1,
              }}
            >
              {
                points > 0 &&
                <span
                  style={{
                    fontSize: 24,
                  }}
                >
                  Score: {points}
                </span>
              }
            </div>
            <button
              style={{
                height: 32,
              }}
              onClick={startGame}
            >Start</button>
          </div>
        </div>
      }

      {
        isInGame &&
        <>
          <div
            style={{
              border: '2px solid black',
              position: 'absolute',
              top: 50,
              width: 300,
              height: 50,
              left: (window.innerWidth / 2) - 150,
              background: 'gray',
              zIndex: 5,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                background: 'green',
                width: `${(GAME_TIME - (Date.now() - startTime) / 1000) / GAME_TIME * 100}%`,
                transition: '0.1s',
              }}
            />
            <div
              className='timer-wrapper'
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            > 
              <span
                style={{
                  color: 'white',
                  fontSize: 32
                }}
              >{GAME_TIME - Math.floor((Date.now() - startTime) / 1000)}</span>
            </div>
          </div>
          
          <div
            className='points-display'
            style={{
              position: 'absolute',
              top: 105,
              width: 300,
              height: 30,
              left: (window.innerWidth / 2) - 150,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 'bold',
                fontSize: 24,
              }}
            >Points: {points}</span>
          </div>
        </>
      }

      {
        potatoes.map(potato => {
          return (
            <img
              key={potato.id}
              style={{
                position: 'absolute',
                bottom: potato.position.y,
                left: potato.position.x,
                zIndex: 2,
                cursor: 'pointer',
              }}
              src={`${potato.actorData.sprite}`} 
              onClick={() => {
                hitPotato(potato.id)
              }} 
            />
          )
        })
      }
      
      {
        numbers.map(num => {
          return (
            <CombatText key={num.id} value={num.value} position={num.position} />
          )
        })
      }

      <div
        className='details'
        style={{
          position: 'absolute',
          zIndex: 5,
          bottom: 5,
          left: 5,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span>@Qru</span>
        <span>
          <a
            style={{
              color: 'white',
              textDecoration: 'none',
            }}
            href="https://twitch.tv/sunglitters"
            target='_blank'
          >
            ♥ Glitty
          </a>
        </span>
        <span>
          <a
            style={{
              color: 'white',
              textDecoration: 'none',
            }}
            href="https://twitch.tv/ziqoftw"
            target='_blank'
          >
              ZNN Productions
          </a>
        </span>
      </div>

      <img
        style={{
          width: '100vw',
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
        src={FarmBG} 
      />
    </div>
  )
}

export default App
