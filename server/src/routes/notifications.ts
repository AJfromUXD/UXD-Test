import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema';

const router = Router();

// GET /api/notifications
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const notifications = db.prepare(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100'
    ).all() as any[];

    const parsed = notifications.map(n => ({
      ...n,
      contact_ids: JSON.parse(n.contact_ids || '[]'),
      read: Boolean(n.read),
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET read = 1').run();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
