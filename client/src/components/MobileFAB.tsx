import { useState } from 'react';
import { Sparkles, Plus, Link2, X } from 'lucide-react';

interface Props {
  onAIInput: () => void;
  onAddContact: () => void;
  onAddRelationship: () => void;
}

export default function MobileFAB({ onAIInput, onAddContact, onAddRelationship }: Props) {
  const [open, setOpen] = useState(false);

  const action = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <>
      {/* Backdrop when open */}
      {open && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
        {/* Sub-actions */}
        {open && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => action(onAddRelationship)}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 bg-[#1e2130] border border-[#2a2d3e]
                text-slate-300 rounded-2xl text-sm shadow-lg shadow-black/40 active:bg-[#2a2d3e]"
            >
              <Link2 size={15} className="text-indigo-400" />
              <span>Link contacts</span>
            </button>
            <button
              onClick={() => action(onAddContact)}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 bg-[#1e2130] border border-[#2a2d3e]
                text-slate-300 rounded-2xl text-sm shadow-lg shadow-black/40 active:bg-[#2a2d3e]"
            >
              <Plus size={15} className="text-emerald-400" />
              <span>Add contact</span>
            </button>
            <button
              onClick={() => action(onAIInput)}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 bg-indigo-600
                text-white rounded-2xl text-sm shadow-lg shadow-indigo-900/50 active:bg-indigo-500"
            >
              <Sparkles size={15} />
              <span>AI Input</span>
            </button>
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg
            transition-all duration-200 active:scale-95
            ${open
              ? 'bg-[#2a2d3e] text-slate-300 shadow-black/40'
              : 'bg-indigo-600 text-white shadow-indigo-900/50'
            }`}
        >
          {open ? <X size={22} /> : <Sparkles size={22} />}
        </button>
      </div>
    </>
  );
}
