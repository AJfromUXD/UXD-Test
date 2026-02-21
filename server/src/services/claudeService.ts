import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedContact {
  name: string;
  email?: string;
  company?: string;
  title?: string;
  category?: 'business' | 'personal' | 'both';
  notes?: string;
  tags?: string[];
}

export interface ExtractedRelationship {
  person_a: string;
  person_b: string;
  relationship_type: string;
  strength?: number;
  notes?: string;
}

export interface ExtractedOpportunity {
  title: string;
  description: string;
  contact_names: string[];
  priority: 'high' | 'medium' | 'low';
  action_label?: string;
}

export interface InputAnalysis {
  contacts: ExtractedContact[];
  relationships: ExtractedRelationship[];
  opportunities: ExtractedOpportunity[];
  summary: string;
}

export async function analyzeInput(text: string, existingContacts: string[]): Promise<InputAnalysis> {
  const existingContext = existingContacts.length > 0
    ? `\n\nExisting contacts in the system: ${existingContacts.join(', ')}`
    : '';

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are an intelligent relationship mapping assistant. Analyze the following input and extract structured information about people, their relationships, and any business opportunities.

Input text:
"""
${text}
"""
${existingContext}

Extract and return a JSON object with this exact structure:
{
  "contacts": [
    {
      "name": "Full Name",
      "email": "email if mentioned",
      "company": "company name if mentioned",
      "title": "job title if mentioned",
      "category": "business|personal|both",
      "notes": "relevant notes about this person",
      "tags": ["tag1", "tag2"]
    }
  ],
  "relationships": [
    {
      "person_a": "Name of person A",
      "person_b": "Name of person B",
      "relationship_type": "colleague|friend|client|partner|vendor|investor|advisor|family|other",
      "strength": 50,
      "notes": "nature of the relationship"
    }
  ],
  "opportunities": [
    {
      "title": "Short opportunity title",
      "description": "What the opportunity is and why it matters",
      "contact_names": ["Name1", "Name2"],
      "priority": "high|medium|low",
      "action_label": "e.g. Reach out, Schedule call, Send intro"
    }
  ],
  "summary": "A 1-2 sentence summary of what was extracted and any key insights"
}

Rules:
- Only extract people explicitly mentioned
- Infer relationship strength 1-100 based on context clues (frequent mentions = higher)
- Flag as high priority opportunity if: the person works at or joined a company adjacent to agency/consulting work, there's a warm intro opportunity, or timing is particularly good
- For existing contacts listed above, reference them by exact name if they appear in the text
- Return ONLY valid JSON, no markdown, no explanation`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    return JSON.parse(content.text) as InputAnalysis;
  } catch {
    throw new Error(`Failed to parse Claude response: ${content.text.substring(0, 200)}`);
  }
}

export async function analyzeOpportunities(
  contacts: Array<{ name: string; company?: string; title?: string; tags?: string[]; notes?: string }>,
  businessContext: string
): Promise<ExtractedOpportunity[]> {
  if (contacts.length === 0) return [];

  const contactSummary = contacts.map(c =>
    `${c.name}${c.title ? ` (${c.title}` : ''}${c.company ? ` at ${c.company}` : ''}${c.title ? ')' : ''}`
  ).join('\n');

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `You are a relationship intelligence assistant for an agency builder. Analyze these contacts and identify hidden opportunities, warm introductions, or relationship nurturing moments.

Business context: ${businessContext}

Current contacts:
${contactSummary}

Look for:
1. People who might benefit from knowing each other
2. Companies that align with high-margin, low-volume agency work
3. Contacts who haven't been reached out to in a while (relationship nurturing)
4. Cross-referencing opportunities between personal and business contacts

Return a JSON array of opportunities:
[
  {
    "title": "Short title",
    "description": "Why this opportunity exists and what action to take",
    "contact_names": ["Name1", "Name2"],
    "priority": "high|medium|low",
    "action_label": "action text"
  }
]

Return ONLY valid JSON array, no markdown.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') return [];

  try {
    return JSON.parse(content.text) as ExtractedOpportunity[];
  } catch {
    return [];
  }
}

export async function suggestRelationshipInsight(
  contactA: { name: string; company?: string; title?: string; tags?: string[] },
  contactB: { name: string; company?: string; title?: string; tags?: string[] }
): Promise<{ insight: string; synergy_score: number }> {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Analyze the potential synergy between these two contacts for an agency builder:

Person A: ${contactA.name}${contactA.title ? `, ${contactA.title}` : ''}${contactA.company ? ` at ${contactA.company}` : ''}
Person B: ${contactB.name}${contactB.title ? `, ${contactB.title}` : ''}${contactB.company ? ` at ${contactB.company}` : ''}

Return JSON: {"insight": "one sentence about their potential synergy or introduction value", "synergy_score": 75}
Only return valid JSON.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') return { insight: '', synergy_score: 0 };

  try {
    return JSON.parse(content.text);
  } catch {
    return { insight: '', synergy_score: 0 };
  }
}
