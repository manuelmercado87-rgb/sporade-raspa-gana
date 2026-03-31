import express from 'express';
import dotenv from 'dotenv';
import { webhookRouter } from './webhook';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(express.json());

app.use('/webhook', webhookRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sporade-bot' });
});

const PORT = process.env.PORT || process.env.BOT_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot webhook corriendo en puerto ${PORT}`);
});
