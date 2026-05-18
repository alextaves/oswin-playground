import { useState, useEffect } from 'react'
import Cubes from './Cubes'
import SpinApp from './SpinApp'
import SchoenbergPlayground from './SchoenbergPlayground'
import PlaygroundHamburger from './PlaygroundHamburger'

export default function App() {
  const [experiment, setExperiment] = useState('cubes')

  useEffect(() => {
    document.body.style.overflow = experiment === 'schoenberg' ? 'auto' : 'hidden'
    return () => { document.body.style.overflow = 'hidden' }
  }, [experiment])

  return (
    <>
      <PlaygroundHamburger active={experiment} onSelect={setExperiment} />
      {experiment === 'cubes'       && <Cubes />}
      {experiment === 'spin'        && <SpinApp />}
      {experiment === 'schoenberg'  && <SchoenbergPlayground />}
    </>
  )
}
