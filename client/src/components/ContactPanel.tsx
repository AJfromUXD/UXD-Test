import { useState } from 'react';
import { X, Mail, Phone, Building2, Briefcase, Link2, Tag, Clock, Trash2, Edit3, Check } from 'lucide-react';
import type { Contact, Relationship } from '../types';
import { api } from '../api';

interface ContactPanelProps {
  contact: Contact;
  relationships: Relationship[];
  contacts: Contact[];
  onClose: () => void;
  onUpdate: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onSelectContact: (id: string) => void;
}

export default function ContactPanel({
  contact, relationships, contacts, onClose, onUpdate, onDelete, onSelectContact
}: ContactPanelProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...contact });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const connectedRels = relationships.filter(
    r => r.source_id === contact.id || r.target_id === contact.id
  );

  const getOtherContact = (rel: Relationship) => {
    const otherId = rel.source_id === contact.id ? rel.target_id : rel.source_id;
    return contacts.find(c => c.id === otherId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateContact(contact.id, form);
      onUpdate(updated);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${contact.name}? This will also remove all their connections.`)) return;
    setDeleting(true);
    try {
      await api.deleteContact(contact.id);
      onDelete(contact.id);
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  const field = (label: string, icon: React.ReactNode, value: string | undefined, editKey?: keyof typeof form) => {
    if (!editing && !value) return null;
    return (
      <div className="flex items-start gap-2 py-2 border-b border-[#2a2d3e] last:border-0">
        <span className="text-slate-500 mt-0.5 flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
          {editing && editKey ? (
            <input
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              value={(form[editKey] as string) || ''}
              onChange={e => setForm(f => ({ ...f, [editKey]: e.target.value }))}
            />
          ) : (
            <p className="text-sm text-slate-200 truncate">{value || '—'}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1d27] border-l border-[#2a2d3e]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2d3e] flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">Contact Details</h2>
        <div className="flex items-center gap-1">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 hover:bg-[#2a2d3e] rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Edit3 size={14} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 hover:bg-[#2a2d3e] rounded text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 hover:bg-[#2a2d3e] rounded text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#2a2d3e] rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + Name */}
        <div className="p-5 flex flex-col items-center gap-3 border-b border-[#2a2d3e]">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: contact.avatar_color }}
          >
            {contact.avatar_initials}
          </div>
          {editing ? (
            <input
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded px-2 py-1 text-center text-base font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          ) : (
            <h3 className="text-base font-semibold text-slate-100 text-center">{contact.name}</h3>
          )}
          {/* Category selector */}
          {editing ? (
            <select
              className="bg-[#0f1117] border border-[#2a2d3e] rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as Contact['category'] }))}
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="both">Both</option>
            </select>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase
              ${contact.category === 'business' ? 'bg-indigo-500/20 text-indigo-300' :
                contact.category === 'personal' ? 'bg-emerald-500/20 text-emerald-300' :
                'bg-purple-500/20 text-purple-300'}`}>
              {contact.category}
            </span>
          )}
        </div>

        {/* Relationship Strength */}
        <div className="px-4 py-3 border-b border-[#2a2d3e]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Relationship Strength</span>
            <span className="text-xs text-slate-300">{editing ? form.strength : contact.strength}%</span>
          </div>
          {editing ? (
            <input
              type="range" min={0} max={100}
              value={form.strength}
              onChange={e => setForm(f => ({ ...f, strength: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
          ) : (
            <div className="w-full bg-[#2a2d3e] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${contact.strength}%`,
                  backgroundColor: contact.strength > 70 ? '#22c55e' : contact.strength > 40 ? '#f59e0b' : '#6366f1',
                }}
              />
            </div>
          )}
        </div>

        {/* Info Fields */}
        <div className="px-4">
          {field('Email', <Mail size={13} />, contact.email, 'email')}
          {field('Phone', <Phone size={13} />, contact.phone, 'phone')}
          {field('Company', <Building2 size={13} />, contact.company, 'company')}
          {field('Title', <Briefcase size={13} />, contact.title, 'title')}
          {field('LinkedIn', <Link2 size={13} />, contact.linkedin_url, 'linkedin_url')}
        </div>

        {/* Notes */}
        <div className="px-4 py-3 border-t border-[#2a2d3e]">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Notes</p>
          {editing ? (
            <textarea
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              rows={4}
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes about this contact..."
            />
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed">{contact.notes || 'No notes yet.'}</p>
          )}
        </div>

        {/* Tags */}
        {contact.tags?.length > 0 && (
          <div className="px-4 py-3 border-t border-[#2a2d3e]">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Tag size={10} /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {contact.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-[#2a2d3e] rounded-full text-[10px] text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        {connectedRels.length > 0 && (
          <div className="px-4 py-3 border-t border-[#2a2d3e]">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
              Connections ({connectedRels.length})
            </p>
            <div className="space-y-1.5">
              {connectedRels.map(rel => {
                const other = getOtherContact(rel);
                if (!other) return null;
                return (
                  <button
                    key={rel.id}
                    onClick={() => onSelectContact(other.id)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-[#2a2d3e] rounded-lg transition-colors text-left"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ backgroundColor: other.avatar_color }}
                    >
                      {other.avatar_initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 truncate">{other.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{rel.type}</p>
                    </div>
                    <div className="text-[10px] text-slate-500">{rel.strength}%</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="px-4 py-3 border-t border-[#2a2d3e]">
          <p className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock size={10} /> Added {new Date(contact.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
