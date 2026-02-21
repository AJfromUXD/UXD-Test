import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// GET /api/contacts
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY name ASC').all();
    const parsed = contacts.map((c: any) => ({
      ...c,
      tags: JSON.parse(c.tags || '[]'),
      metadata: JSON.parse(c.metadata || '{}'),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/contacts/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id) as any;
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({
      ...contact,
      tags: JSON.parse(contact.tags || '[]'),
      metadata: JSON.parse(contact.metadata || '{}'),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/contacts
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const {
      name, email, phone, company, title, category = 'personal',
      notes, linkedin_url, strength = 50, tags = [], metadata = {},
      x_pos = Math.random() * 800, y_pos = Math.random() * 600,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const id = uuidv4();
    const avatar_initials = getInitials(name);
    const avatar_color = randomColor();

    db.prepare(`
      INSERT INTO contacts (id, name, email, phone, company, title, category, notes, linkedin_url,
        avatar_initials, avatar_color, strength, tags, metadata, x_pos, y_pos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email || null, phone || null, company || null, title || null,
      category, notes || null, linkedin_url || null, avatar_initials, avatar_color,
      strength, JSON.stringify(tags), JSON.stringify(metadata), x_pos, y_pos);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as any;
    res.status(201).json({
      ...contact,
      tags: JSON.parse(contact.tags || '[]'),
      metadata: JSON.parse(contact.metadata || '{}'),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/contacts/:id
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Contact not found' });

    const fields = ['name', 'email', 'phone', 'company', 'title', 'category', 'notes',
      'linkedin_url', 'strength', 'x_pos', 'y_pos', 'last_contact'];
    const updates: string[] = [];
    const values: any[] = [];

    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });

    if (req.body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(req.body.tags));
    }
    if (req.body.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(req.body.metadata));
    }

    if (updates.length === 0) return res.json({ ...existing, tags: JSON.parse(existing.tags || '[]'), metadata: JSON.parse(existing.metadata || '{}') });

    updates.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id) as any;
    res.json({
      ...contact,
      tags: JSON.parse(contact.tags || '[]'),
      metadata: JSON.parse(contact.metadata || '{}'),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
