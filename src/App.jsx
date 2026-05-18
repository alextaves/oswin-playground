import { useState, useEffect } from 'react'
import Cubes from './Cubes'
import SpinApp from './SpinApp'
import SchoenbergPlayground from './SchoenbergPlayground'
import SiphonGallery from './SiphonGallery'
import HumMixer from './HumMixer'
import Grafting from './Grafting'
import PlaygroundHamburger from './PlaygroundHamburger'

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function App() {
  const [experiment, setExperiment] = useState('cubes')
  const [intro, setIntro] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const scrollable = experiment === 'schoenberg' || experiment === 'hum'
    document.body.style.overflow = scrollable ? 'auto' : 'hidden'
    return () => { document.body.style.overflow = 'hidden' }
  }, [experiment])

  const dismissIntro = () => {
    setFading(true)
    setTimeout(() => setIntro(false), 700)
  }

  return (
    <>
      {intro && (
        <div
          onClick={dismissIntro}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: '#ffffff',
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
            cursor: 'default',
          }}
        >
          <div style={{ position: 'absolute', top: 32, left: 28 }}>
            <p style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.25)', lineHeight: 1.8 }}>
              Welcome to Oswin's Playground.
            </p>
            <p style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.25)', lineHeight: 1.8 }}>
              Home to unfinished ideas.
            </p>
          </div>
        </div>
      )}
      <PlaygroundHamburger active={experiment} onSelect={setExperiment} />
      {experiment === 'cubes'       && <Cubes />}
      {experiment === 'spin'        && <SpinApp />}
      {experiment === 'schoenberg'  && <SchoenbergPlayground />}
      {experiment === 'siphon'      && <div style={{ position: 'fixed', inset: 0 }}><SiphonGallery active={true} /></div>}
      {experiment === 'hum'         && <div style={{ position: 'fixed', inset: 0, overflowY: 'auto' }}><HumMixer /></div>}
      {experiment === 'grafting'    && <div style={{ position: 'fixed', inset: 0 }}><Grafting /></div>}
    </>
  )
}
