import express from 'express';
import cors from 'cors';
import { initDatabase } from './models/database';
import { setupRoutes } from './routes/requirements';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

initDatabase();
setupRoutes(app);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;