import { useState } from 'react';
import { Search, Plus, Link2, TrendingUp } from 'lucide-react';
import type { Contact, Relationship } from '../types';

interface Props {
  contacts: Contact[];
  relationships: Relationship[];
  onSelectContact: (id: string) => void;
  onAddContact: () => void;
  onAddRelationship: () => void;
}

export default function MobileContactList({
  contacts, relationships, onSelectContact, onAddContact, onAddRelationship,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase()) ||
        c.title?.toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  const getConnectionCount = (id: string) =>
    relationships.filter(r => r.source_id === id || r.target_id === id).length;

  return (
    <div className="flex flex-col h-full">
      {/* Search + actions */}
      <div className="p-4 space-y-3 border-b border-[#2a2d3e] flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl pl-9 pr-4 py-2.5
              text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAddContact}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2a2d3e]
              hover:bg-[#3a3d4e] text-slate-300 rounded-xl text-sm transition-colors"
          >
            <Plus size={14} /> Add Contact
          </button>
          <button
            onClick={onAddRelationship}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2a2d3e]
              hover:bg-[#3a3d4e] text-slate-300 rounded-xl text-sm transition-colors"
          >
            <Link2 size={14} /> Link
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2 flex-shrink-0">
        <p className="text-[11px] text-slate-600">
          {filtered.length} {filtered.length === 1 ? 'contact' : 'contacts'}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-500 text-sm">No contacts found</p>
          </div>
        )}

        {filtered.map(contact => {
          const connCount = getConnectionCount(contact.id);
          return (
            <button
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className="w-full flex items-center gap-3 p-3.5 bg-[#1e2130] border border-[#2a2d3e]
                rounded-xl text-left hover:border-indigo-500/40 active:bg-[#2a2d3e] transition-colors"
            >
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                style={{ backgroundColor: contact.avatar_color }}
              >
                {contact.avatar_initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{contact.name}</p>
                {(contact.title || contact.company) && (
                  <p className="text-xs text-slate-500 truncate">
                    {[contact.title, contact.company].filter(Boolean).join(' · ')}
                  </p>
                )}

                {/* Strength bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 bg-[#2a2d3e] rounded-full h-1">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${contact.strength}%`,
                        backgroundColor: contact.strength > 70 ? '#22c55e'
                          : contact.strength > 40 ? '#f59e0b' : '#6366f1',
                      }}
                    />
                  </div>
                  {connCount > 0 && (
                    <span className="text-[10px] text-slate-600 flex-shrink-0">
                      {connCount} {connCount === 1 ? 'link' : 'links'}
                    </span>
                  )}
                </div>
              </div>

              {/* Category + opportunity badge */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium uppercase
                  ${contact.category === 'business' ? 'bg-indigo-500/20 text-indigo-300'
                    : contact.category === 'personal' ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-purple-500/20 text-purple-300'}`}>
                  {contact.category}
                </span>
                {contact.strength > 70 && (
                  <TrendingUp size={11} className="text-emerald-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
