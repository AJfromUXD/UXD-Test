import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Plus, Sparkles, Bell, GitBranch, Users, TrendingUp,
  Search, RefreshCw, Link2,
} from 'lucide-react';

import { api } from './api';
import type { Contact, Relationship, Notification } from './types';
import { useIsMobile } from './hooks/useIsMobile';
import ContactNode from './components/ContactNode';
import ContactPanel from './components/ContactPanel';
import AddContactModal from './components/AddContactModal';
import AddRelationshipModal from './components/AddRelationshipModal';
import InputProcessor from './components/InputProcessor';
import NotificationsPanel from './components/NotificationsPanel';
import BottomSheet from './components/BottomSheet';
import BottomNav, { type MobileTab } from './components/BottomNav';
import MobileContactList from './components/MobileContactList';
import MobileFAB from './components/MobileFAB';

const nodeTypes = { contact: ContactNode };

function contactToNode(contact: Contact, selectedId: string | null, onSelect: (id: string) => void): Node {
  return {
    id: contact.id,
    type: 'contact',
    position: { x: contact.x_pos || 0, y: contact.y_pos || 0 },
    data: { ...contact, selected: contact.id === selectedId, onSelect },
    selected: contact.id === selectedId,
  };
}

function relToEdge(rel: Relationship): Edge {
  const opacity = Math.max(0.2, rel.strength / 100);
  return {
    id: rel.id,
    source: rel.source_id,
    target: rel.target_id,
    label: rel.type,
    labelStyle: { fill: '#94a3b8', fontSize: 9, fontFamily: 'system-ui' },
    labelBgStyle: { fill: '#1a1d27', fillOpacity: 0.8 },
    style: { stroke: `rgba(99,102,241,${opacity})`, strokeWidth: Math.max(1, rel.strength / 25) },
    markerEnd: { type: MarkerType.Arrow, color: `rgba(99,102,241,${opacity})` },
  };
}

type RightPanel = 'contact' | 'notifications' | null;

export default function App() {
  const isMobile = useIsMobile();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Mobile state
  const [activeTab, setActiveTab] = useState<MobileTab>('map');
  const [sheetOpen, setSheetOpen] = useState(false);

  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddRel, setShowAddRel] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodePositionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([api.getContacts(), api.getRelationships(), api.getNotifications()])
      .then(([c, r, n]) => {
        setContacts(c);
        setRelationships(r);
        setNotifications(n);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setNodes(contacts.map(c => contactToNode(c, selectedId, handleSelectContact)));
  }, [contacts, selectedId]); // eslint-disable-line

  useEffect(() => {
    setEdges(relationships.map(relToEdge));
  }, [relationships]); // eslint-disable-line

  const handleSelectContact = useCallback((id: string) => {
    setSelectedId(prev => {
      const next = prev === id ? null : id;
      if (next) {
        setRightPanel('contact');
        setSheetOpen(true);
      } else {
        setRightPanel(null);
        setSheetOpen(false);
      }
      return next;
    });
  }, []);

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedId(null);
    setRightPanel(null);
  };

  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return;
    try {
      const rel = await api.createRelationship({
        source_id: params.source,
        target_id: params.target,
        type: 'knows',
        strength: 50,
      });
      setRelationships(prev => [...prev, rel]);
      setEdges(eds => addEdge(relToEdge(rel), eds));
    } catch { /* already exists */ }
  }, [setEdges]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    if (nodePositionTimerRef.current) clearTimeout(nodePositionTimerRef.current);
    nodePositionTimerRef.current = setTimeout(() => {
      api.updateContact(node.id, { x_pos: node.position.x, y_pos: node.position.y }).catch(() => {});
    }, 500);
  }, []);

  const handleAddContact = (contact: Contact) => {
    setContacts(prev => [...prev, contact]);
    setShowAddContact(false);
    handleSelectContact(contact.id);
  };

  const handleUpdateContact = (updated: Contact) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setRelationships(prev => prev.filter(r => r.source_id !== id && r.target_id !== id));
    setSelectedId(null);
    setRightPanel(null);
    setSheetOpen(false);
  };

  const handleAddRelationship = (rel: Relationship) => {
    setRelationships(prev => [...prev, rel]);
    setShowAddRel(false);
  };

  const handleProcessed = (newContacts: Contact[], newRels: Partial<Relationship>[]) => {
    setContacts(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const toAdd = newContacts.filter(c => !existingIds.has(c.id));
      const updated = prev.map(c => {
        const nc = newContacts.find(nc => nc.id === c.id);
        return nc ? { ...c, ...nc } : c;
      });
      return [...updated, ...toAdd];
    });
    setRelationships(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const toAdd = (newRels as Relationship[]).filter(r => r.id && !existingIds.has(r.id));
      return [...prev, ...toAdd];
    });
    api.getNotifications().then(setNotifications);
  };

  const handleScanOpportunities = async () => {
    setScanning(true);
    try {
      await api.scanOpportunities();
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } finally {
      setScanning(false);
    }
  };

  const selectedContact = contacts.find(c => c.id === selectedId);
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredContacts = search
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase()) ||
        c.title?.toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  const stats = {
    contacts: contacts.length,
    relationships: relationships.length,
    opportunities: notifications.filter(n => n.type === 'opportunity' && !n.read).length,
  };

  // ─── Shared: the ReactFlow map ──────────────────────────────────────────────
  const theMap = loading ? (
    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
      <RefreshCw size={20} className="animate-spin text-indigo-500" />
      <p className="text-sm">Loading your relationship map...</p>
    </div>
  ) : contacts.length === 0 ? (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
        <GitBranch size={28} className="text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">Your relationship map is empty</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        Use <strong className="text-indigo-400">AI Input</strong> to paste an email, LinkedIn post,
        or meeting notes — Claude will map everything automatically.
      </p>
      <button
        onClick={() => setShowInput(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500
          text-white rounded-xl text-sm font-medium transition-colors"
      >
        <Sparkles size={14} /> Use AI Input
      </button>
    </div>
  ) : (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStop={onNodeDragStop}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      deleteKeyCode={null}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2d3e" />
      <Controls />
      {!isMobile && (
        <MiniMap
          nodeColor={n => contacts.find(c => c.id === n.id)?.avatar_color || '#6366f1'}
          maskColor="rgba(15,17,23,0.8)"
        />
      )}
    </ReactFlow>
  );

  // ─── Shared: contact detail ─────────────────────────────────────────────────
  const contactDetail = selectedContact ? (
    <ContactPanel
      contact={selectedContact}
      relationships={relationships}
      contacts={contacts}
      onClose={isMobile ? handleCloseSheet : () => { setRightPanel(null); setSelectedId(null); }}
      onUpdate={handleUpdateContact}
      onDelete={handleDeleteContact}
      onSelectContact={id => { handleSelectContact(id); }}
    />
  ) : null;

  // ─── Shared: modals ─────────────────────────────────────────────────────────
  const modals = (
    <>
      {showAddContact && (
        <AddContactModal onClose={() => setShowAddContact(false)} onCreated={handleAddContact} />
      )}
      {showAddRel && (
        <AddRelationshipModal
          contacts={contacts}
          preselectedId={selectedId || undefined}
          onClose={() => setShowAddRel(false)}
          onCreated={handleAddRelationship}
        />
      )}
      {showInput && (
        <InputProcessor onProcessed={handleProcessed} onClose={() => setShowInput(false)} />
      )}
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0f1117]">
        {/* Mobile header */}
        <header className="flex items-center justify-between px-4 h-12 border-b border-[#2a2d3e] bg-[#1a1d27] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
              <GitBranch size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-100">RelationshipOS</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stats */}
            <span className="text-xs text-slate-600">{stats.contacts} contacts</span>
            {stats.opportunities > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <TrendingUp size={11} /> {stats.opportunities}
              </span>
            )}
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'map' && (
            <div className="w-full h-full">
              {theMap}
            </div>
          )}

          {activeTab === 'contacts' && (
            <MobileContactList
              contacts={contacts}
              relationships={relationships}
              onSelectContact={id => {
                handleSelectContact(id);
              }}
              onAddContact={() => setShowAddContact(true)}
              onAddRelationship={() => setShowAddRel(true)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPanel
              notifications={notifications}
              onUpdate={setNotifications}
              onClose={() => setActiveTab('map')}
              onScanOpportunities={handleScanOpportunities}
              scanning={scanning}
            />
          )}
        </div>

        {/* Bottom nav */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={tab => {
            setActiveTab(tab);
            // Close sheet when switching tabs
            if (tab !== 'map') {
              setSheetOpen(false);
              setSelectedId(null);
            }
          }}
          unreadCount={unreadCount}
        />

        {/* FAB (only on map + contacts tabs) */}
        {activeTab !== 'notifications' && (
          <MobileFAB
            onAIInput={() => setShowInput(true)}
            onAddContact={() => setShowAddContact(true)}
            onAddRelationship={() => setShowAddRel(true)}
          />
        )}

        {/* Contact detail bottom sheet */}
        <BottomSheet open={sheetOpen} onClose={handleCloseSheet}>
          {contactDetail}
        </BottomSheet>

        {modals}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0f1117]">
      {/* Desktop top bar */}
      <header className="flex items-center gap-3 px-4 h-12 border-b border-[#2a2d3e] bg-[#1a1d27] flex-shrink-0 z-10">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
            <GitBranch size={12} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-100">RelationshipOS</span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Users size={11} /> {stats.contacts} contacts</span>
          <span className="flex items-center gap-1"><Link2 size={11} /> {stats.relationships} connections</span>
          {stats.opportunities > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <TrendingUp size={11} /> {stats.opportunities} opportunities
            </span>
          )}
        </div>

        <div className="flex-1 max-w-xs ml-auto mr-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg pl-8 pr-3 py-1.5 text-xs
                text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500
              text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Sparkles size={12} /> AI Input
          </button>
          <button
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e2130] hover:bg-[#2a2d3e]
              text-slate-300 rounded-lg text-xs border border-[#2a2d3e] transition-colors"
          >
            <Plus size={12} /> Contact
          </button>
          <button
            onClick={() => setShowAddRel(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e2130] hover:bg-[#2a2d3e]
              text-slate-300 rounded-lg text-xs border border-[#2a2d3e] transition-colors"
          >
            <Link2 size={12} /> Link
          </button>
          <button
            onClick={() => { setRightPanel(p => p === 'notifications' ? null : 'notifications'); setSelectedId(null); }}
            className={`relative p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors
              ${rightPanel === 'notifications' ? 'bg-[#2a2d3e] text-slate-200' : 'hover:bg-[#2a2d3e]'}`}
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white text-[9px]
                rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Search results sidebar */}
        {search && (
          <div className="w-64 border-r border-[#2a2d3e] bg-[#1a1d27] overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
                {filteredContacts.length} result{filteredContacts.length !== 1 ? 's' : ''}
              </p>
              {filteredContacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => { handleSelectContact(c.id); setSearch(''); }}
                  className="w-full flex items-center gap-2.5 p-2 hover:bg-[#1e2130] rounded-lg text-left transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: c.avatar_color }}
                  >
                    {c.avatar_initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{c.company || c.category}</p>
                  </div>
                </button>
              ))}
              {filteredContacts.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No contacts found</p>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">{theMap}</div>

        {/* Right panels */}
        {rightPanel === 'contact' && selectedContact && (
          <div className="w-72 flex-shrink-0">
            {contactDetail}
          </div>
        )}

        {rightPanel === 'notifications' && (
          <div className="w-80 flex-shrink-0">
            <NotificationsPanel
              notifications={notifications}
              onUpdate={setNotifications}
              onClose={() => setRightPanel(null)}
              onScanOpportunities={handleScanOpportunities}
              scanning={scanning}
            />
          </div>
        )}
      </div>

      {modals}
    </div>
  );
}
