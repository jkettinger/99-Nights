import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import destinationRoutes from './routes/destinations.js';
import migrateRoutes from './routes/migrate.js';
import roadWaypointRoutes from './routes/roadWaypoints.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

dotenv.config({ path: isProduction ? path.resolve(__dirname, '../../.env') : '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

if (isProduction) {
  app.use(express.json());
} else {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/road-waypoints', roadWaypointRoutes);
app.use('/api', migrateRoutes);

// In production, serve the built React app
if (isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
