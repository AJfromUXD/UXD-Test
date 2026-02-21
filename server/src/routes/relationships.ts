import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/relationships
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const relationships = db.prepare(`
      SELECT r.*,
        ca.name as source_name, ca.company as source_company,
        cb.name as target_name, cb.company as target_company
      FROM relationships r
      JOIN contacts ca ON r.source_id = ca.id
      JOIN contacts cb ON r.target_id = cb.id
    `).all();
    res.json(relationships);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/relationships
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { source_id, target_id, type = 'knows', strength = 50, notes } = req.body;

    if (!source_id || !target_id) {
      return res.status(400).json({ error: 'source_id and target_id are required' });
    }
    if (source_id === target_id) {
      return res.status(400).json({ error: 'Cannot create relationship with self' });
    }

    const existing = db.prepare(
      'SELECT id FROM relationships WHERE (source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?)'
    ).get(source_id, target_id, target_id, source_id);

    if (existing) {
      return res.status(409).json({ error: 'Relationship already exists' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO relationships (id, source_id, target_id, type, strength, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, source_id, target_id, type, strength, notes || null);

    const rel = db.prepare(`
      SELECT r.*,
        ca.name as source_name,
        cb.name as target_name
      FROM relationships r
      JOIN contacts ca ON r.source_id = ca.id
      JOIN contacts cb ON r.target_id = cb.id
      WHERE r.id = ?
    `).get(id);

    res.status(201).json(rel);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/relationships/:id
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { type, strength, notes } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (strength !== undefined) { updates.push('strength = ?'); values.push(strength); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);
      db.prepare(`UPDATE relationships SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const rel = db.prepare('SELECT * FROM relationships WHERE id = ?').get(req.params.id);
    res.json(rel);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/relationships/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM relationships WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
