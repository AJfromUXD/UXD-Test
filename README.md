# RelationshipOS

An AI-powered relationship mapping tool that automatically builds and maintains a living graph of your personal and business connections — surfacing opportunities, patterns, and action items you'd otherwise miss.

## What It Does

- **Visual Relationship Map** — An interactive node graph where contacts are nodes and connections are edges. Drag, zoom, and pan freely.
- **AI Input Processor** — Paste any text (email, LinkedIn post, meeting notes, a conversation you had) and Claude automatically:
  - Extracts the people mentioned
  - Creates or updates contact profiles
  - Maps the relationships between them
  - Flags opportunities (warm intros, adjacent companies, timing windows)
- **Opportunity Detection** — Run a full scan of all contacts; Claude identifies hidden opportunities across your entire network.
- **Smart Notifications** — Every opportunity, insight, and action item surfaces as a notification with priority and suggested next action.
- **Contact Profiles** — Full profiles with email, phone, company, title, LinkedIn, notes, tags, relationship strength, and connection history.
- **Live Connection Drawing** — Drag from one contact node to another in the map to create a connection.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Graph Viz | React Flow |
| Backend | Node.js, Express, TypeScript |
| AI | Anthropic Claude (claude-opus-4-5) |
| Database | SQLite via better-sqlite3 |

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
# Edit server/.env and add your ANTHROPIC_API_KEY
```

### 3. Run in development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
.
├── client/                  # React frontend
│   └── src/
│       ├── App.tsx          # Main app: map, panels, state
│       ├── api/             # API client layer
│       ├── components/
│       │   ├── ContactNode.tsx          # React Flow node
│       │   ├── ContactPanel.tsx         # Detail sidebar
│       │   ├── AddContactModal.tsx      # Manual add form
│       │   ├── AddRelationshipModal.tsx # Link two contacts
│       │   ├── InputProcessor.tsx       # AI text intake
│       │   └── NotificationsPanel.tsx   # Opportunity feed
│       └── types/           # Shared TypeScript types
│
└── server/                  # Express backend
    └── src/
        ├── index.ts         # App entry point
        ├── db/schema.ts     # SQLite schema + init
        ├── services/
        │   └── claudeService.ts  # All Claude AI calls
        └── routes/
            ├── contacts.ts       # CRUD for contacts
            ├── relationships.ts  # CRUD for connections
            ├── inputs.ts         # AI processing pipeline
            └── notifications.ts  # Notification CRUD
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/contacts` | List all contacts |
| POST | `/api/contacts` | Create contact |
| PATCH | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |
| GET | `/api/relationships` | List all connections |
| POST | `/api/relationships` | Create connection |
| POST | `/api/inputs/process` | **AI: Process text input** |
| POST | `/api/inputs/scan-opportunities` | **AI: Scan full network** |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |

## Usage Tips

- **AI Input is the core feature.** Don't add contacts manually if you have text to process. Paste LinkedIn posts, forwarded emails, meeting notes — Claude handles the extraction.
- **Drag connections** directly in the map by hovering a node until you see handles, then dragging to another node.
- **Relationship strength** (0–100) is visualized as edge thickness and node progress bars. Higher = stronger relationship.
- **Categories:** Personal, Business, or Both — contacts can overlap, and the map handles them as one unified graph.
- **Scan Opportunities** in the notifications panel re-analyzes your entire contact list to find hidden synergies you haven't explicitly flagged.
