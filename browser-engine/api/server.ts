import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { lowdb } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ScenarioDoc {
  id: string;
  name: string;
  data: unknown;
  createdAt: string;
  updatedAt: string;
}

interface DbSchema {
  scenarios: ScenarioDoc[];
}

const adapter = new JSONFile<DbSchema>(join(__dirname, 'data.json'));
const db = await lowdb(adapter, { defaultData: { scenarios: [] } });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/scenarios', async (_req, res) => {
  await db.read();
  const scenarios = db.data.scenarios.map(({ data, ...rest }) => rest);
  res.json(scenarios);
});

app.get('/api/scenarios/:id', async (req, res) => {
  await db.read();
  const scenario = db.data.scenarios.find(s => s.id === req.params.id);
  if (!scenario) return res.status(404).json({ error: 'Not found' });
  res.json(scenario);
});

app.post('/api/scenarios', async (req, res) => {
  await db.read();
  const now = new Date().toISOString();
  const scenario: ScenarioDoc = {
    id: req.body.id || `scenario_${Date.now()}`,
    name: req.body.name || 'Untitled Scenario',
    data: req.body.data,
    createdAt: now,
    updatedAt: now,
  };
  db.data.scenarios.push(scenario);
  await db.write();
  res.status(201).json(scenario);
});

app.put('/api/scenarios/:id', async (req, res) => {
  await db.read();
  const idx = db.data.scenarios.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data.scenarios[idx] = {
    ...db.data.scenarios[idx],
    name: req.body.name ?? db.data.scenarios[idx].name,
    data: req.body.data ?? db.data.scenarios[idx].data,
    updatedAt: new Date().toISOString(),
  };
  await db.write();
  res.json(db.data.scenarios[idx]);
});

app.delete('/api/scenarios/:id', async (req, res) => {
  await db.read();
  const idx = db.data.scenarios.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.data.scenarios.splice(idx, 1);
  await db.write();
  res.status(204).send();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Scenario API running on http://localhost:${PORT}`);
});