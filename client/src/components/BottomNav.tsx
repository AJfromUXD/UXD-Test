import { GitBranch, Users, Bell } from 'lucide-react';

export type MobileTab = 'map' | 'contacts' | 'notifications';

interface Props {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  unreadCount: number;
}

const TABS: { id: MobileTab; icon: React.ReactNode; label: string }[] = [
  { id: 'map', icon: <GitBranch size={20} />, label: 'Map' },
  { id: 'contacts', icon: <Users size={20} />, label: 'Contacts' },
  { id: 'notifications', icon: <Bell size={20} />, label: 'Activity' },
];

export default function BottomNav({ activeTab, onTabChange, unreadCount }: Props) {
  return (
    <nav className="flex-shrink-0 flex items-center bg-[#1a1d27] border-t border-[#2a2d3e] safe-area-pb">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 relative
            transition-colors duration-150
            ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
        >
          <span className="relative">
            {tab.icon}
            {tab.id === 'notifications' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[9px]
                rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">{tab.label}</span>
          {activeTab === tab.id && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      ))}
    </nav>
  );
}
