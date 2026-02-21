import { X, Bell, CheckCheck, Trash2, Zap, TrendingUp, Users } from 'lucide-react';
import type { Notification } from '../types';
import { api } from '../api';

interface Props {
  notifications: Notification[];
  onUpdate: (notifications: Notification[]) => void;
  onClose: () => void;
  onScanOpportunities: () => void;
  scanning: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  opportunity: <TrendingUp size={12} className="text-amber-400" />,
  reminder: <Bell size={12} className="text-blue-400" />,
  insight: <Zap size={12} className="text-purple-400" />,
  alert: <Users size={12} className="text-red-400" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'border-l-amber-500 bg-amber-500/5',
  medium: 'border-l-indigo-500 bg-indigo-500/5',
  low: 'border-l-slate-500 bg-slate-500/5',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPanel({ notifications, onUpdate, onClose, onScanOpportunities, scanning }: Props) {
  const unread = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await api.markRead(id);
    onUpdate(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await api.markAllRead();
    onUpdate(notifications.map(n => ({ ...n, read: true })));
  };

  const remove = async (id: string) => {
    await api.deleteNotification(id);
    onUpdate(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1d27] border-l border-[#2a2d3e]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2d3e] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Notifications {unread > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">
                {unread}
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="p-1.5 hover:bg-[#2a2d3e] rounded text-slate-400 hover:text-slate-200"
              title="Mark all read"
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-[#2a2d3e] rounded text-slate-400">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Scan button */}
      <div className="p-3 border-b border-[#2a2d3e] flex-shrink-0">
        <button
          onClick={onScanOpportunities}
          disabled={scanning}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600/20
            hover:bg-indigo-600/30 border border-indigo-600/30 text-indigo-300 rounded-lg text-xs
            font-medium transition-colors disabled:opacity-50"
        >
          <Zap size={12} />
          {scanning ? 'Scanning for opportunities...' : 'Scan all contacts for opportunities'}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Bell size={32} className="text-slate-700 mb-3" />
            <p className="text-sm text-slate-500">No notifications yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Process inputs or scan contacts to surface opportunities
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2d3e]">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markRead(notif.id)}
                className={`p-4 border-l-2 cursor-pointer transition-colors
                  ${PRIORITY_COLORS[notif.priority] || PRIORITY_COLORS.medium}
                  ${notif.read ? 'opacity-60' : 'hover:bg-white/5'}
                `}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">{TYPE_ICONS[notif.type] || TYPE_ICONS.insight}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-slate-200 leading-tight">{notif.title}</p>
                      <button
                        onClick={e => { e.stopPropagation(); remove(notif.id); }}
                        className="p-0.5 hover:text-red-400 text-slate-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {notif.action_label && (
                        <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-300 rounded-full text-[10px] font-medium">
                          {notif.action_label}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600">{timeAgo(notif.created_at)}</span>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
