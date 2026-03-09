import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import AdminWaypoints from './pages/AdminWaypoints'
import AdminCharacters from './pages/AdminCharacters'
import Destination from './pages/Destination'
import ProtectedRoute from './components/ProtectedRoute'
import FogOverlay from './components/FogOverlay'
import { AudioProvider } from './contexts/AudioContext'

function AppRoutes() {
  const location = useLocation()
  return (
    <>
      {location.pathname === '/' && sessionStorage.getItem('intro-played') !== 'true' && <FogOverlay />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/destination/:slug" element={<Destination />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/characters"
          element={
            <ProtectedRoute>
              <AdminCharacters />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/waypoints"
          element={
            <ProtectedRoute>
              <AdminWaypoints />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <AppRoutes />
      </AudioProvider>
    </BrowserRouter>
  )
}
