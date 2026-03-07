import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AudioControls } from './components/AudioControls'
import { audioManager } from './audio/AudioManager'
import OverworldMap from './components/OverworldMap'
import ComingSoon from './components/ComingSoon'
import { PageTransition, RuneSpinner } from './components/PageTransition'
import { CompassNav } from './components/CompassNav'
import { OpeningCinematic, useOpeningCinematic } from './components/OpeningCinematic'
import { useKonamiEasterEgg } from './hooks/useEasterEggs'
import './styles/global.css'

const ElderWilds = lazy(() => import('./regions/ElderWilds'))
const Library = lazy(() => import('./regions/Library'))
const Citadel = lazy(() => import('./regions/Citadel'))
const Tavern = lazy(() => import('./regions/Tavern'))
const Shore = lazy(() => import('./regions/Shore'))
const GreatHall = lazy(() => import('./regions/GreatHall'))
const Arena = lazy(() => import('./regions/Arena'))

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <PageTransition transitionKey={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<OverworldMap />} />
          <Route path="/wilds" element={<Suspense fallback={<RuneSpinner text="Entering the wilds..." />}><ElderWilds /></Suspense>} />
          <Route path="/library" element={<Suspense fallback={<RuneSpinner text="Opening the archives..." />}><Library /></Suspense>} />
          <Route path="/citadel" element={<Suspense fallback={<RuneSpinner text="Approaching the citadel..." />}><Citadel /></Suspense>} />
          <Route path="/tavern" element={<Suspense fallback={<RuneSpinner text="Pushing open the door..." />}><Tavern /></Suspense>} />
          <Route path="/shore" element={<Suspense fallback={<RuneSpinner text="Walking to the shore..." />}><Shore /></Suspense>} />
          <Route path="/great-hall" element={<Suspense fallback={<RuneSpinner text="Entering the hall..." />}><GreatHall /></Suspense>} />
          <Route path="/arena" element={<Suspense fallback={<RuneSpinner text="Stepping into the arena..." />}><Arena /></Suspense>} />
          <Route path="*" element={<ComingSoon />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  )
}

function AudioAutoInit() {
  useEffect(() => {
    const handler = () => {
      if (!audioManager.isInitialized()) {
        audioManager.init()
        audioManager.playIntroSwell()
      }
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', handler)
    }
    document.addEventListener('click', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [])
  return null
}

function App() {
  const { showCinematic, completeCinematic } = useOpeningCinematic()

  return (
    <>
      <AudioAutoInit />
      {showCinematic ? (
        <AnimatePresence>
          <OpeningCinematic onComplete={completeCinematic} />
        </AnimatePresence>
      ) : (
        <BrowserRouter>
          <AudioControls />
          <KonamiWrapper />
          <AnimatedRoutes />
          <CompassNav />
        </BrowserRouter>
      )}
    </>
  )
}

function KonamiWrapper() {
  useKonamiEasterEgg()
  return null
}

export default App
