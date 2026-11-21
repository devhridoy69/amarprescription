import React from 'react';
import { User, Activity, Pill, CheckSquare, Sparkles } from 'lucide-react';

export const MobileSectionTabs = ({ activeTab, onSelectTab, counts }) => {
  const tabs = [
    { id: 'patient', label: 'Patient', icon: User, count: null },
    { id: 'clinical', label: 'Symptoms & Dx', icon: Activity, count: counts.complaints },
    { id: 'medicines', label: 'Medicines (Rx)', icon: Pill, count: counts.medicines, highlight: true },
    { id: 'advice', label: 'Advice', icon: CheckSquare, count: counts.advice },
  ];

  return (
    <div className="flex md:hidden items-center justify-around bg-white border border-slate-200/90 rounded-2xl p-1 mb-4 shadow-xs sticky top-20 z-30 no-print">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all relative cursor-pointer ${
              isActive
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="relative">
              <Icon className="w-4 h-4 mb-0.5" />
              {tab.count !== null && tab.count > 0 && (
                <span className={`absolute -top-1 -right-2 text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-mono ${
                  isActive ? 'bg-amber-400 text-slate-950 font-black' : 'bg-teal-100 text-teal-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileSectionTabs;
