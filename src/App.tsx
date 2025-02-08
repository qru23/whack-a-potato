import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import GlittyGif from './assets/glitty.gif'
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
import FarmBG from './assets/farm.webp'
import Potato1 from './assets/potato1.gif'
import Potato2 from './assets/potato2.gif'
import Potato3 from './assets/mrpotatohead.gif'
import { Position, Potato } from './types'
import { CombatText } from './components/CombatText'

const GLITTY_POINTS = 10
const POTATO_PENALTY = 20
const POTATO_TIMER = 2000
const POTATO_WIDTH = 250
const POTATO_HEIGHT = 150
const GAME_TIME = 60

const RANDOM_POTATOES = [
  Potato1, Potato2, Potato3
]

const HitSFX = [
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

function pointOverlap(position: Position, potato: Potato) {
  /// Adding an extra 50 to dimensions for padding
  return (
    position.x < potato.position.x + POTATO_WIDTH + 50 &&  /// Right edge is past the left edge of the potato
    position.x + POTATO_WIDTH + 50 > potato.position.x &&  /// Left edge is before the right edge of the potato
    position.y < potato.position.y + POTATO_HEIGHT + 50 && /// Top edge is below the bottom edge of the potato
    position.y + POTATO_HEIGHT + 50 > potato.position.y    /// Bottom edge is above the top edge of the potato
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

    let audio: HTMLAudioElement | null = null
    let pointChange = 0

    if (potato.isGlitty) {
      const bonusPoints = Math.floor((1 - ((Date.now() - potato.created) / POTATO_TIMER)) * GLITTY_POINTS)
      audio = new Audio(HitSFX[Math.floor(Math.random() * HitSFX.length)])
      pointChange = GLITTY_POINTS + bonusPoints
    }
    else {
      audio = new Audio(HUHSfx)
      pointChange = -POTATO_PENALTY
    }

    setPoints((points) => points + pointChange)

    const numberPosition = potato.position
    numberPosition.x += POTATO_WIDTH / 2 - 16
    numberPosition.y += POTATO_HEIGHT / 2 - 16

    setNumbers(prev => [...prev, { id: Date.now(), position: numberPosition, value: pointChange }])

    if (audio) {
      audio.play()
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
        const randomSpawn = Math.random()

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

        const newPotato: Potato = { 
          id: Date.now(), 
          sprite: '', 
          position: position,
          isGlitty: false,
          created: Date.now()
        }

        if (randomSpawn < 0.5) {
          newPotato.isGlitty = true
          newPotato.sprite = `${GlittyGif}?t=${Date.now()}`
        }
        else {
          const sprite = RANDOM_POTATOES[Math.floor(Math.random() * RANDOM_POTATOES.length)]
          newPotato.sprite = `${sprite}?t=${Date.now()}`
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
            <h1>Whack-A-Potato</h1>
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
              src={`${potato.sprite}`} 
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
