import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { analyzeInput, analyzeOpportunities } from '../services/claudeService';

const router = Router();

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6',
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// POST /api/inputs/process
// Main entry point: paste any text and Claude extracts people + opportunities
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { text, source_type = 'manual' } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

    const db = getDb();

    // Store raw input
    const inputId = uuidv4();
    db.prepare('INSERT INTO inputs (id, raw_text, source_type) VALUES (?, ?, ?)')
      .run(inputId, text, source_type);

    // Get existing contact names for context
    const existingContacts = (db.prepare('SELECT name FROM contacts').all() as any[]).map(c => c.name);

    // Ask Claude to analyze
    const analysis = await analyzeInput(text, existingContacts);

    const createdContacts: any[] = [];
    const contactNameToId: Record<string, string> = {};

    // Seed existing contacts into the lookup
    (db.prepare('SELECT id, name FROM contacts').all() as any[]).forEach((c: any) => {
      contactNameToId[c.name.toLowerCase()] = c.id;
    });

    // Upsert extracted contacts
    for (const ec of analysis.contacts) {
      const key = ec.name.toLowerCase();
      let contactId = contactNameToId[key];

      if (!contactId) {
        // Create new contact
        contactId = uuidv4();
        const initials = getInitials(ec.name);
        const color = randomColor();
        const spreadX = 200 + Math.random() * 600;
        const spreadY = 100 + Math.random() * 500;

        db.prepare(`
          INSERT INTO contacts (id, name, email, company, title, category, notes,
            avatar_initials, avatar_color, tags, x_pos, y_pos)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          contactId, ec.name, ec.email || null, ec.company || null,
          ec.title || null, ec.category || 'personal', ec.notes || null,
          initials, color,
          JSON.stringify(ec.tags || []),
          spreadX, spreadY
        );

        contactNameToId[key] = contactId;
        const created = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
        createdContacts.push({
          ...created,
          tags: JSON.parse(created.tags || '[]'),
          metadata: JSON.parse(created.metadata || '{}'),
          isNew: true,
        });
      } else {
        // Update existing with any new info
        const updates: string[] = [];
        const vals: any[] = [];
        if (ec.email) { updates.push('email = ?'); vals.push(ec.email); }
        if (ec.company) { updates.push('company = ?'); vals.push(ec.company); }
        if (ec.title) { updates.push('title = ?'); vals.push(ec.title); }
        if (ec.notes) { updates.push('notes = ?'); vals.push(ec.notes); }
        if (updates.length > 0) {
          vals.push(contactId);
          db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
        }
        const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) as any;
        createdContacts.push({
          ...existing,
          tags: JSON.parse(existing.tags || '[]'),
          metadata: JSON.parse(existing.metadata || '{}'),
          isNew: false,
        });
      }
    }

    // Upsert relationships
    const createdRelationships: any[] = [];
    for (const er of analysis.relationships) {
      const aId = contactNameToId[er.person_a.toLowerCase()];
      const bId = contactNameToId[er.person_b.toLowerCase()];
      if (!aId || !bId || aId === bId) continue;

      const exists = db.prepare(
        'SELECT id FROM relationships WHERE (source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?)'
      ).get(aId, bId, bId, aId);

      if (!exists) {
        const relId = uuidv4();
        db.prepare(`
          INSERT INTO relationships (id, source_id, target_id, type, strength, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(relId, aId, bId, er.relationship_type || 'knows', er.strength || 50, er.notes || null);

        createdRelationships.push({
          id: relId,
          source_id: aId,
          target_id: bId,
          type: er.relationship_type,
          strength: er.strength || 50,
        });
      }
    }

    // Create notifications for opportunities
    for (const opp of analysis.opportunities) {
      const contactIds = opp.contact_names
        .map(n => contactNameToId[n.toLowerCase()])
        .filter(Boolean);

      const notifId = uuidv4();
      db.prepare(`
        INSERT INTO notifications (id, type, title, message, contact_ids, priority, action_label)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        notifId,
        'opportunity',
        opp.title,
        opp.description,
        JSON.stringify(contactIds),
        opp.priority || 'medium',
        opp.action_label || 'Review'
      );
    }

    // Mark input as processed
    db.prepare('UPDATE inputs SET processed = 1, analysis = ? WHERE id = ?')
      .run(JSON.stringify(analysis), inputId);

    res.json({
      success: true,
      summary: analysis.summary,
      contacts: createdContacts,
      relationships: createdRelationships,
      opportunities: analysis.opportunities,
      notifications_created: analysis.opportunities.length,
    });
  } catch (err) {
    console.error('Input processing error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/inputs/scan-opportunities
// Re-scan all contacts for hidden opportunities
router.post('/scan-opportunities', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { business_context = 'Agency builder focused on high-margin, low-volume consulting and creative work' } = req.body;

    const contacts = (db.prepare('SELECT * FROM contacts').all() as any[]).map((c: any) => ({
      ...c,
      tags: JSON.parse(c.tags || '[]'),
    }));

    if (contacts.length === 0) {
      return res.json({ opportunities: [], message: 'No contacts to analyze' });
    }

    const opportunities = await analyzeOpportunities(contacts, business_context);

    const contactNameToId: Record<string, string> = {};
    contacts.forEach(c => { contactNameToId[c.name.toLowerCase()] = c.id; });

    for (const opp of opportunities) {
      const contactIds = (opp.contact_names || [])
        .map((n: string) => contactNameToId[n.toLowerCase()])
        .filter(Boolean);

      const notifId = uuidv4();
      db.prepare(`
        INSERT INTO notifications (id, type, title, message, contact_ids, priority, action_label)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        notifId, 'opportunity', opp.title, opp.description,
        JSON.stringify(contactIds), opp.priority || 'medium', opp.action_label || 'Review'
      );
    }

    res.json({ opportunities, notifications_created: opportunities.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/inputs
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const inputs = db.prepare('SELECT * FROM inputs ORDER BY created_at DESC LIMIT 50').all();
    res.json(inputs);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
