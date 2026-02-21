import { useState } from 'react';
import { Sparkles, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { api } from '../api';
import type { Contact, Relationship, ProcessResult } from '../types';

interface Props {
  onProcessed: (contacts: Contact[], relationships: Partial<Relationship>[]) => void;
  onClose: () => void;
}

const EXAMPLES = [
  {
    label: 'LinkedIn update',
    text: `Ashley Torres just posted on LinkedIn that she started a new position as VP of Product at Axiom Labs. Axiom Labs works with B2B SaaS companies on growth strategy consulting. I know Ashley from my time at Catalyst Group — she was always sharp and well-connected. Her old boss Marcus Chen is someone I've been meaning to reconnect with too.`,
  },
  {
    label: 'Email thread',
    text: `Subject: Intro - Jamie Walsh & UXD Agency

Hey, wanted to connect you two. Jamie Walsh (jamie@buildstudio.co) is the founder of Build Studio, a boutique product design firm that works with Series A/B startups. They're looking for a strategic partner for overflow work on brand + positioning projects. This feels right in your wheelhouse. Jamie mentioned they have 3 clients right now that need exactly that.`,
  },
  {
    label: 'Meeting notes',
    text: `Coffee with David Park today. He's a partner at Meridian Ventures, early stage fund. They just closed a $40M fund and are actively deploying. He mentioned a few portfolio companies that need serious brand work: Forma AI, Reify Health, and Cascade (logistics tech). He and I have been friends for about 5 years, met through our mutual friend Sarah Kim who runs marketing at Shopify.`,
  },
];

export default function InputProcessor({ onProcessed, onClose }: Props) {
  const [text, setText] = useState('');
  const [sourceType, setSourceType] = useState('manual');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handleProcess = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    setError('');
    setResult(null);
    try {
      const res = await api.processInput(text, sourceType);
      setResult(res);
      onProcessed(res.contacts as Contact[], res.relationships);
    } catch (err) {
      setError(String(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2d3e] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">AI Input Processor</h2>
              <p className="text-[11px] text-slate-500">Paste any text — Claude will extract contacts, map relationships, and surface opportunities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#2a2d3e] rounded-lg text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Source type */}
          <div className="flex gap-2">
            {['manual', 'email', 'linkedin', 'notes', 'meeting'].map(type => (
              <button
                key={type}
                onClick={() => setSourceType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize
                  ${sourceType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#2a2d3e] text-slate-400 hover:text-slate-200'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Examples */}
          <div>
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showExamples ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showExamples ? 'Hide' : 'Show'} examples
            </button>
            {showExamples && (
              <div className="mt-2 grid gap-2">
                {EXAMPLES.map(ex => (
                  <button
                    key={ex.label}
                    onClick={() => { setText(ex.text); setShowExamples(false); }}
                    className="text-left p-3 bg-[#0f1117] border border-[#2a2d3e] rounded-lg hover:border-indigo-500/50 transition-colors"
                  >
                    <p className="text-xs font-medium text-indigo-400 mb-1">{ex.label}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{ex.text}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text input */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Paste an email, LinkedIn post, meeting notes, or just describe a conversation...\n\n"Had coffee with Sarah at Meridian Ventures today. She mentioned that her colleague James just left to start a new design agency..."`}
            rows={8}
            className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-sm text-slate-200
              placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
          />

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={12} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-300">AI Analysis</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Contacts', count: result.contacts.length, color: 'text-indigo-400' },
                  { label: 'Connections', count: result.relationships.length, color: 'text-emerald-400' },
                  { label: 'Opportunities', count: result.opportunities.length, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-[#0f1117] rounded-xl p-3 text-center border border-[#2a2d3e]">
                    <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Contacts extracted */}
              {result.contacts.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Contacts {result.contacts.some(c => 'isNew' in c && c.isNew) ? '(new highlighted)' : ''}</p>
                  <div className="flex flex-wrap gap-2">
                    {result.contacts.map((c, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 rounded-full text-xs flex items-center gap-1
                          ${'isNew' in c && c.isNew
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-[#2a2d3e] text-slate-400'
                          }`}
                      >
                        {c.name}
                        {'isNew' in c && c.isNew && <span className="text-[9px] text-indigo-400">new</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {result.opportunities.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Opportunities detected</p>
                  <div className="space-y-2">
                    {result.opportunities.map((opp, i) => (
                      <div key={i} className={`p-3 rounded-xl border
                        ${opp.priority === 'high'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-[#0f1117] border-[#2a2d3e]'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded-full
                            ${opp.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                              opp.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-slate-500/20 text-slate-400'}`}>
                            {opp.priority}
                          </span>
                          <p className="text-xs font-medium text-slate-200">{opp.title}</p>
                        </div>
                        <p className="text-xs text-slate-400">{opp.description}</p>
                        {opp.contact_names?.length > 0 && (
                          <p className="text-[10px] text-slate-500 mt-1">
                            Involves: {opp.contact_names.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-[#2a2d3e] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2a2d3e] hover:bg-[#3a3d4e] text-slate-300 rounded-lg text-sm transition-colors"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleProcess}
              disabled={processing || !text.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600
                hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles size={14} />
              {processing ? 'Claude is analyzing...' : 'Process with Claude AI'}
            </button>
          )}
          {result && (
            <button
              onClick={() => { setResult(null); setText(''); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600
                hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Process another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
