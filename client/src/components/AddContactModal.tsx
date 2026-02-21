import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';
import type { Contact } from '../types';

interface Props {
  onClose: () => void;
  onCreated: (contact: Contact) => void;
}

export default function AddContactModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    category: 'personal' as Contact['category'],
    notes: '',
    linkedin_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const contact = await api.createContact(form);
      onCreated(contact);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const input = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-slate-200
          placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#2a2d3e]">
          <h2 className="text-base font-semibold text-slate-100">Add Contact</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2a2d3e] rounded-lg text-slate-400 hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {input('Name *', 'name', 'text', 'Full name')}
          <div className="grid grid-cols-2 gap-3">
            {input('Email', 'email', 'email', 'email@example.com')}
            {input('Phone', 'phone', 'tel', '+1 (555) 000-0000')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {input('Company', 'company', 'text', 'Company name')}
            {input('Title', 'title', 'text', 'Job title')}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as Contact['category'] }))}
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-slate-200
                focus:outline-none focus:border-indigo-500"
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="both">Both</option>
            </select>
          </div>

          {input('LinkedIn URL', 'linkedin_url', 'url', 'https://linkedin.com/in/...')}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              placeholder="How you know them, relevant context..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-slate-200
                placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#2a2d3e] hover:bg-[#3a3d4e] text-slate-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                text-white rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
