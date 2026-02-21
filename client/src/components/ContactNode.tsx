import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { Contact } from '../types';

interface ContactNodeData extends Contact {
  selected?: boolean;
  onSelect: (id: string) => void;
}

function ContactNode({ data, selected }: NodeProps<ContactNodeData>) {
  return (
    <div
      onClick={() => data.onSelect(data.id)}
      className={`
        relative flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer
        transition-all duration-150 select-none min-w-[80px]
        ${selected
          ? 'ring-2 ring-indigo-500 bg-[#1e2130] shadow-lg shadow-indigo-500/20'
          : 'bg-[#1e2130] hover:ring-1 hover:ring-indigo-400/40'
        }
        border border-[#2a2d3e]
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-2 !h-2 !border-0" />

      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
        style={{ backgroundColor: data.avatar_color }}
      >
        {data.avatar_initials}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-xs font-medium text-slate-200 leading-tight max-w-[90px] truncate">
          {data.name}
        </p>
        {data.company && (
          <p className="text-[10px] text-slate-400 truncate max-w-[90px]">
            {data.company}
          </p>
        )}
      </div>

      {/* Category badge */}
      <div className={`
        px-1.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide
        ${data.category === 'business'
          ? 'bg-indigo-500/20 text-indigo-300'
          : data.category === 'personal'
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'bg-purple-500/20 text-purple-300'
        }
      `}>
        {data.category}
      </div>

      {/* Strength indicator */}
      <div className="w-full bg-[#2a2d3e] rounded-full h-0.5 mt-0.5">
        <div
          className="h-0.5 rounded-full transition-all"
          style={{
            width: `${data.strength}%`,
            backgroundColor: data.strength > 70 ? '#22c55e' : data.strength > 40 ? '#f59e0b' : '#6366f1',
          }}
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-2 !h-2 !border-0" />
    </div>
  );
}

export default memo(ContactNode);
