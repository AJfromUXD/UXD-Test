import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';
import type { Contact, Relationship } from '../types';

interface Props {
  contacts: Contact[];
  preselectedId?: string;
  onClose: () => void;
  onCreated: (rel: Relationship) => void;
}

const REL_TYPES = [
  'colleague', 'friend', 'client', 'partner', 'vendor',
  'investor', 'advisor', 'family', 'mentor', 'referral', 'other'
];

export default function AddRelationshipModal({ contacts, preselectedId, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    source_id: preselectedId || '',
    target_id: '',
    type: 'knows',
    strength: 50,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.source_id || !form.target_id) { setError('Both contacts are required'); return; }
    if (form.source_id === form.target_id) { setError('Cannot connect a contact to themselves'); return; }
    setSaving(true);
    setError('');
    try {
      const rel = await api.createRelationship(form);
      onCreated(rel);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const contactOptions = contacts.map(c => (
    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
  ));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#2a2d3e]">
          <h2 className="text-base font-semibold text-slate-100">Add Connection</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2a2d3e] rounded-lg text-slate-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">From Contact</label>
            <select
              value={form.source_id}
              onChange={e => setForm(f => ({ ...f, source_id: e.target.value }))}
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-slate-200
                focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select contact...</option>
              {contactOptions}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">To Contact</label>
            <select
              value={form.target_id}
              onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))}
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-slate-200
                focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select contact...</option>
              {contactOptions}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Relationship Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-slate-200
                focus:outline-none focus:border-indigo-500 capitalize"
            >
              {REL_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-400">Strength</label>
              <span className="text-xs text-slate-300">{form.strength}%</span>
            </div>
            <input
              type="range" min={0} max={100}
              value={form.strength}
              onChange={e => setForm(f => ({ ...f, strength: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="How do they know each other?"
              rows={2}
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-slate-200
                placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#2a2d3e] hover:bg-[#3a3d4e] text-slate-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                text-white rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Adding...' : 'Add Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
