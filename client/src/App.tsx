import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Destination from './pages/Destination'
import ProtectedRoute from './components/ProtectedRoute'
import FogOverlay from './components/FogOverlay'

function AppRoutes() {
  const location = useLocation()
  return (
    <>
      {location.pathname === '/' && <FogOverlay />}
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
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
