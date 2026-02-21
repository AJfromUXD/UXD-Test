import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contactsRouter from './routes/contacts';
import relationshipsRouter from './routes/relationships';
import inputsRouter from './routes/inputs';
import notificationsRouter from './routes/notifications';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/contacts', contactsRouter);
app.use('/api/relationships', relationshipsRouter);
app.use('/api/inputs', inputsRouter);
app.use('/api/notifications', notificationsRouter);

app.listen(PORT, () => {
  console.log(`Relationship Map API running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY not set. AI features will not work.');
  }
});
